import { and, eq } from "drizzle-orm";
import { normalizeBlockName, validateDayTemplateName, validateTemplateBlock } from "../dayTimetableTemplates.js";
import * as schema from "../db/schema.js";

function createId(prefix) { return `${prefix}-${crypto.randomUUID()}`; }
function owned(items, id, label) { const item = items.find((candidate) => candidate.id === id); if (!item) throw new Error(`${label} not found.`); return item; }
function firstError(errors) { return Object.values(errors)[0]; }

function slotUsage(state, slot) {
  const classItem = [...state.recurringAssignments, ...state.historicalRecurringAssignments].find((item) => item.periodId === slot.id);
  if (classItem) return { kind: "class", label: state.classes.find((item) => item.id === classItem.classId)?.shortCode ?? "a class" };
  const event = state.recurringEvents.find((item) => item.periodId === slot.id);
  if (event) return { kind: "event", label: event.title };
  if (state.lessonMovements.some((item) => item.destinationPeriodId === slot.id)) return { kind: "movement", label: "a dated lesson movement" };
  if (state.lessonOccurrences.some((item) => item.periodId === slot.id)) return { kind: "lesson", label: "saved lesson history" };
  return null;
}

function slotRow(userId, yearId, cycleWeek, weekday, templateBlock) {
  return { id: createId("slot"), userId, academicYearId: yearId, templateBlockId: templateBlock.id, cycleWeek, weekday, name: templateBlock.name, startTime: templateBlock.startTime, endTime: templateBlock.endTime, displayOrder: templateBlock.displayOrder, isTeaching: templateBlock.isTeaching };
}

async function applyTemplateToDay({ tx, state, userId, yearId, template, cycleWeek, weekday }) {
  const targetBlocks = state.dayTimetableTemplateBlocks.filter((block) => block.templateId === template.id);
  const currentSlots = state.timetableBlocks.filter((slot) => slot.cycleWeek === cycleWeek && slot.weekday === weekday);
  const targetsByName = new Map(targetBlocks.map((block) => [normalizeBlockName(block.name), block]));
  const matchedTargetIds = new Set();

  for (const slot of currentSlots) {
    const target = targetsByName.get(normalizeBlockName(slot.name));
    const usage = slotUsage(state, slot);
    if (!target) {
      if (usage) throw new Error(`Week ${cycleWeek} ${weekday}: current block "${slot.name}" is used by ${usage.label} and has no match in ${template.name}.`);
      await tx.delete(schema.periodBlocks).where(and(eq(schema.periodBlocks.id, slot.id), eq(schema.periodBlocks.userId, userId)));
      continue;
    }
    if (usage?.kind === "class" && !target.isTeaching) throw new Error(`Week ${cycleWeek} ${weekday}: "${slot.name}" contains ${usage.label}, but the matching block in ${template.name} is non-teaching.`);
    if (usage?.kind === "movement" && !target.isTeaching) throw new Error(`Week ${cycleWeek} ${weekday}: a dated movement uses "${slot.name}", but the matching block is non-teaching.`);
    matchedTargetIds.add(target.id);
    await tx.update(schema.periodBlocks).set({ templateBlockId: target.id, name: target.name, startTime: target.startTime, endTime: target.endTime, displayOrder: target.displayOrder, isTeaching: target.isTeaching, updatedAt: new Date() }).where(and(eq(schema.periodBlocks.id, slot.id), eq(schema.periodBlocks.userId, userId)));
  }
  const missing = targetBlocks.filter((block) => !matchedTargetIds.has(block.id));
  if (missing.length) await tx.insert(schema.periodBlocks).values(missing.map((block) => slotRow(userId, yearId, cycleWeek, weekday, block)));
  await tx.insert(schema.dayTimetableAssignments).values({ id: createId("day-template"), userId, academicYearId: yearId, cycleWeek, weekday, templateId: template.id }).onConflictDoUpdate({ target: [schema.dayTimetableAssignments.userId, schema.dayTimetableAssignments.academicYearId, schema.dayTimetableAssignments.cycleWeek, schema.dayTimetableAssignments.weekday], set: { templateId: template.id, updatedAt: new Date() } });
}

export async function mutateDayTemplates({ tx, state, userId, yearId, action, payload }) {
  if (action === "create" || action === "duplicate") {
    const errors = validateDayTemplateName(payload, state.dayTimetableTemplates);
    if (Object.keys(errors).length) throw new Error(firstError(errors));
    const source = payload.sourceTemplateId ? owned(state.dayTimetableTemplates, payload.sourceTemplateId, "Source template") : null;
    const templateId = createId("template");
    await tx.insert(schema.dayTimetableTemplates).values({ id: templateId, userId, academicYearId: yearId, name: payload.name.trim() });
    if (source) {
      const sourceBlocks = state.dayTimetableTemplateBlocks.filter((block) => block.templateId === source.id);
      if (sourceBlocks.length) await tx.insert(schema.dayTimetableTemplateBlocks).values(sourceBlocks.map((block) => ({ id: createId("template-block"), templateId, name: block.name, startTime: block.startTime, endTime: block.endTime, displayOrder: block.displayOrder, isTeaching: block.isTeaching })));
    }
  } else if (action === "rename") {
    owned(state.dayTimetableTemplates, payload.id, "Template");
    const errors = validateDayTemplateName(payload, state.dayTimetableTemplates, payload.id);
    if (Object.keys(errors).length) throw new Error(firstError(errors));
    await tx.update(schema.dayTimetableTemplates).set({ name: payload.name.trim(), updatedAt: new Date() }).where(and(eq(schema.dayTimetableTemplates.id, payload.id), eq(schema.dayTimetableTemplates.userId, userId)));
  } else if (action === "delete") {
    const template = owned(state.dayTimetableTemplates, payload.id, "Template");
    const uses = state.dayTimetableAssignments.filter((item) => item.templateId === template.id);
    if (uses.length) throw new Error(`Reassign ${uses.map((item) => `Week ${item.cycleWeek} ${item.weekday}`).join(", ")} before deleting this template.`);
    await tx.delete(schema.dayTimetableTemplateBlocks).where(eq(schema.dayTimetableTemplateBlocks.templateId, template.id));
    await tx.delete(schema.dayTimetableTemplates).where(and(eq(schema.dayTimetableTemplates.id, template.id), eq(schema.dayTimetableTemplates.userId, userId)));
  } else if (action === "save-block") {
    const template = owned(state.dayTimetableTemplates, payload.templateId, "Template");
    const existing = payload.id ? owned(state.dayTimetableTemplateBlocks.filter((block) => block.templateId === template.id), payload.id, "Template block") : null;
    const errors = validateTemplateBlock(payload, state.dayTimetableTemplateBlocks, template.id, payload.id);
    if (Object.keys(errors).length) throw new Error(firstError(errors));
    const linkedSlots = existing ? state.timetableBlocks.filter((slot) => slot.templateBlockId === existing.id) : [];
    if (existing?.isTeaching && !payload.isTeaching) {
      for (const slot of linkedSlots) { const usage = slotUsage(state, slot); if (usage?.kind === "class" || usage?.kind === "movement") throw new Error(`Cannot make "${existing.name}" non-teaching because Week ${slot.cycleWeek} ${slot.weekday} is used by ${usage.label}.`); }
    }
    const row = { name: payload.name.trim(), startTime: payload.startTime, endTime: payload.endTime, isTeaching: payload.isTeaching, displayOrder: existing?.displayOrder ?? Math.max(0, ...state.dayTimetableTemplateBlocks.filter((block) => block.templateId === template.id).map((block) => block.displayOrder)) + 1, updatedAt: new Date() };
    if (existing) {
      await tx.update(schema.dayTimetableTemplateBlocks).set(row).where(eq(schema.dayTimetableTemplateBlocks.id, existing.id));
      await tx.update(schema.periodBlocks).set({ name: row.name, startTime: row.startTime, endTime: row.endTime, isTeaching: row.isTeaching, displayOrder: row.displayOrder, updatedAt: new Date() }).where(eq(schema.periodBlocks.templateBlockId, existing.id));
    } else {
      const blockId = createId("template-block");
      await tx.insert(schema.dayTimetableTemplateBlocks).values({ id: blockId, templateId: template.id, ...row });
      const assignments = state.dayTimetableAssignments.filter((item) => item.templateId === template.id);
      if (assignments.length) await tx.insert(schema.periodBlocks).values(assignments.map((assignment) => slotRow(userId, yearId, assignment.cycleWeek, assignment.weekday, { id: blockId, ...row })));
    }
  } else if (action === "remove-block") {
    const block = owned(state.dayTimetableTemplateBlocks, payload.id, "Template block");
    owned(state.dayTimetableTemplates, block.templateId, "Template");
    const slots = state.timetableBlocks.filter((slot) => slot.templateBlockId === block.id);
    for (const slot of slots) { const usage = slotUsage(state, slot); if (usage) throw new Error(`Cannot remove "${block.name}" because Week ${slot.cycleWeek} ${slot.weekday} is used by ${usage.label}.`); }
    for (const slot of slots) await tx.delete(schema.periodBlocks).where(and(eq(schema.periodBlocks.id, slot.id), eq(schema.periodBlocks.userId, userId)));
    await tx.delete(schema.dayTimetableTemplateBlocks).where(eq(schema.dayTimetableTemplateBlocks.id, block.id));
  } else if (action === "move-block") {
    const block = owned(state.dayTimetableTemplateBlocks, payload.id, "Template block");
    owned(state.dayTimetableTemplates, block.templateId, "Template");
    const siblings = state.dayTimetableTemplateBlocks.filter((item) => item.templateId === block.templateId).sort((a, b) => a.displayOrder - b.displayOrder);
    const other = siblings[siblings.findIndex((item) => item.id === block.id) + payload.direction];
    if (other) {
      await tx.update(schema.dayTimetableTemplateBlocks).set({ displayOrder: other.displayOrder }).where(eq(schema.dayTimetableTemplateBlocks.id, block.id));
      await tx.update(schema.dayTimetableTemplateBlocks).set({ displayOrder: block.displayOrder }).where(eq(schema.dayTimetableTemplateBlocks.id, other.id));
      await tx.update(schema.periodBlocks).set({ displayOrder: other.displayOrder }).where(eq(schema.periodBlocks.templateBlockId, block.id));
      await tx.update(schema.periodBlocks).set({ displayOrder: block.displayOrder }).where(eq(schema.periodBlocks.templateBlockId, other.id));
    }
  } else if (action === "assign" || action === "bulk-assign") {
    const template = owned(state.dayTimetableTemplates, payload.templateId, "Template");
    const days = action === "bulk-assign" ? payload.days : [{ cycleWeek: payload.cycleWeek, weekday: payload.weekday }];
    if (!days?.length) throw new Error("Choose at least one day.");
    for (const day of days) {
      if (!["A", "B"].includes(day.cycleWeek) || !["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day.weekday)) throw new Error("Choose a valid Week A/B weekday.");
      await applyTemplateToDay({ tx, state, userId, yearId, template, ...day });
    }
  } else throw new Error("Unsupported day-template operation.");
}
