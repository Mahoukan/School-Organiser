import { and, eq, inArray } from "drizzle-orm";
import { generateMissingWeeks, validateTeachingWeek, validateTerm } from "../academicCalendar.js";
import { hasLessonContent, normalizeLessonContent } from "../lessonOccurrences.js";
import { getBlockOccupant, validateLessonMovement } from "../lessonMovements.js";
import { validateRecurringEvent } from "../recurringEvents.js";
import { validateDatedEvent } from "../datedEvents.js";
import { validateCalendarException, validateClassAbsence, validateTeacherAbsence } from "../scheduleOverlays.js";
import { mutateDayTemplates } from "./dayTemplates.js";
import { getDatabase } from "../db/index.js";
import * as schema from "../db/schema.js";

function nzDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = new Date(Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day) + offsetDays));
  return date.toISOString().slice(0, 10);
}

function publicClass(item, academicYear) { return { id: item.id, name: item.name, shortCode: item.shortCode, subject: item.subject, yearLevel: item.yearLevel, room: item.room, colour: item.colour, archived: item.archived, academicYear: academicYear.year }; }
function publicBlock(item, templateBlocksById) { const template = templateBlocksById.get(item.templateBlockId); return { id: item.id, templateBlockId: item.templateBlockId, cycleWeek: item.cycleWeek, weekday: item.weekday, name: template?.name ?? item.name, startTime: template?.startTime ?? item.startTime, endTime: template?.endTime ?? item.endTime, displayOrder: template?.displayOrder ?? item.displayOrder, isTeaching: template?.isTeaching ?? item.isTeaching }; }
function publicAssignment(item) { return { id: item.id, classId: item.classId, cycleWeek: item.cycleWeek, weekday: item.weekday, periodId: item.periodId, effectiveFromDate: item.effectiveFromDate, effectiveToDate: item.effectiveToDate }; }
function publicEvent(item) { return { id: item.id, type: item.eventType, title: item.title, detail: item.detail ?? "", colour: item.colour, cycleWeek: item.cycleWeek, weekday: item.weekday, periodId: item.periodId }; }
function publicDatedEvent({ userId, academicYearId, createdAt, updatedAt, ...item }) { return item; }

export async function getSchoolData(userId) {
  const db = getDatabase();
  const years = await db.select().from(schema.academicYears).where(and(eq(schema.academicYears.userId, userId), eq(schema.academicYears.active, true))).limit(1);
  const academicYear = years[0];
  if (!academicYear) return { academicYear: null, terms: [], teachingWeeks: [], classes: [], dayTimetableTemplates: [], dayTimetableTemplateBlocks: [], dayTimetableAssignments: [], timetableBlocks: [], recurringAssignments: [], historicalRecurringAssignments: [], recurringEvents: [], datedEvents: [], lessonOccurrences: [], teacherAbsences: [], classAbsences: [], calendarExceptions: [], lessonMovements: [] };
  const [termRows, classRows, templateRows, templateBlockRows, dayAssignmentRows, blockRows, recurringRows, datedEventRows, lessonRows, teacherRows, absenceRows, exceptionRows, movementRows] = await Promise.all([
    db.select().from(schema.terms).where(eq(schema.terms.academicYearId, academicYear.id)),
    db.select().from(schema.classes).where(and(eq(schema.classes.userId, userId), eq(schema.classes.academicYearId, academicYear.id))),
    db.select().from(schema.dayTimetableTemplates).where(and(eq(schema.dayTimetableTemplates.userId, userId), eq(schema.dayTimetableTemplates.academicYearId, academicYear.id))),
    db.select().from(schema.dayTimetableTemplateBlocks).where(inArray(schema.dayTimetableTemplateBlocks.templateId, db.select({ id: schema.dayTimetableTemplates.id }).from(schema.dayTimetableTemplates).where(and(eq(schema.dayTimetableTemplates.userId, userId), eq(schema.dayTimetableTemplates.academicYearId, academicYear.id))))),
    db.select().from(schema.dayTimetableAssignments).where(and(eq(schema.dayTimetableAssignments.userId, userId), eq(schema.dayTimetableAssignments.academicYearId, academicYear.id))),
    db.select().from(schema.periodBlocks).where(and(eq(schema.periodBlocks.userId, userId), eq(schema.periodBlocks.academicYearId, academicYear.id))),
    db.select().from(schema.recurringTimetableItems).where(and(eq(schema.recurringTimetableItems.userId, userId), eq(schema.recurringTimetableItems.academicYearId, academicYear.id))),
    db.select().from(schema.datedEvents).where(and(eq(schema.datedEvents.userId, userId), eq(schema.datedEvents.academicYearId, academicYear.id))),
    db.select().from(schema.lessonOccurrences).where(eq(schema.lessonOccurrences.userId, userId)),
    db.select().from(schema.teacherAbsences).where(eq(schema.teacherAbsences.userId, userId)),
    db.select().from(schema.classAbsences).where(eq(schema.classAbsences.userId, userId)),
    db.select().from(schema.calendarExceptions).where(eq(schema.calendarExceptions.userId, userId)),
    db.select().from(schema.lessonMovements).where(eq(schema.lessonMovements.userId, userId)),
  ]);
  const termIds = termRows.map((term) => term.id);
  const absenceIds = absenceRows.map((absence) => absence.id);
  const weekRows = termIds.length ? await db.select().from(schema.teachingWeeks).where(inArray(schema.teachingWeeks.termId, termIds)) : [];
  const absenceLinks = absenceIds.length ? await db.select().from(schema.classAbsenceClasses).where(inArray(schema.classAbsenceClasses.classAbsenceId, absenceIds)) : [];
  const templateBlocksById = new Map(templateBlockRows.map((block) => [block.id, block]));
  const active = recurringRows.filter((item) => !item.effectiveToDate);
  return {
    academicYear: { id: academicYear.id, year: academicYear.year, name: academicYear.name },
    terms: termRows.map(({ createdAt, updatedAt, academicYearId, ...term }) => ({ ...term, academicYear: academicYear.year })),
    teachingWeeks: weekRows.map(({ createdAt, updatedAt, ...week }) => week),
    classes: classRows.map((item) => publicClass(item, academicYear)),
    dayTimetableTemplates: templateRows.map(({ userId: ownerId, academicYearId, createdAt, updatedAt, ...template }) => template),
    dayTimetableTemplateBlocks: templateBlockRows.map(({ createdAt, updatedAt, ...block }) => block),
    dayTimetableAssignments: dayAssignmentRows.map(({ userId: ownerId, academicYearId, createdAt, updatedAt, ...assignment }) => assignment),
    timetableBlocks: blockRows.map((item) => publicBlock(item, templateBlocksById)),
    recurringAssignments: active.filter((item) => item.kind === "class").map(publicAssignment),
    historicalRecurringAssignments: recurringRows.filter((item) => item.kind === "class" && item.effectiveToDate).map(publicAssignment),
    recurringEvents: active.filter((item) => item.kind === "event").map(publicEvent),
    datedEvents: datedEventRows.map(publicDatedEvent),
    lessonOccurrences: lessonRows.map(({ userId, createdAt, updatedAt, ...item }) => item),
    teacherAbsences: teacherRows.map(({ userId, createdAt, updatedAt, ...item }) => item),
    classAbsences: absenceRows.map(({ userId, createdAt, updatedAt, ...item }) => ({ ...item, classIds: absenceLinks.filter((link) => link.classAbsenceId === item.id).map((link) => link.classId) })),
    calendarExceptions: exceptionRows.map(({ userId, createdAt, updatedAt, ...item }) => item),
    lessonMovements: movementRows.map(({ userId, createdAt, updatedAt, ...item }) => item),
  };
}

function assertOwned(items, id, label) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`${label} not found.`);
  return item;
}
function id(prefix) { return `${prefix}-${crypto.randomUUID()}`; }
async function retireRecurringItem(tx, item, state, userId) {
  const today = nzDate();
  if (item.effectiveFromDate >= today) {
    const referenced = state.lessonOccurrences.some((lesson) => lesson.recurringAssignmentId === item.id) || state.lessonMovements.some((movement) => movement.recurringAssignmentId === item.id);
    if (referenced) throw new Error("This new recurring item already has dated lesson data and cannot be replaced today.");
    await tx.delete(schema.recurringTimetableItems).where(and(eq(schema.recurringTimetableItems.id, item.id), eq(schema.recurringTimetableItems.userId, userId)));
  } else {
    await tx.update(schema.recurringTimetableItems).set({ effectiveToDate: nzDate(-1), updatedAt: new Date() }).where(and(eq(schema.recurringTimetableItems.id, item.id), eq(schema.recurringTimetableItems.userId, userId)));
  }
}

export async function mutateSchoolData(userId, resource, action, payload) {
  const db = getDatabase();
  const state = await getSchoolData(userId);
  if (!state.academicYear) throw new Error("No academic year is configured for this account.");
  const yearId = state.academicYear.id;
  await db.transaction(async (tx) => {
    if (resource === "classes") {
      if (action === "save") {
        const value = payload.values;
        if (!value.name?.trim() || !value.shortCode?.trim() || !value.colour) throw new Error("Class name, short code and colour are required.");
        const duplicate = state.classes.some((item) => item.id !== payload.id && item.shortCode.toLowerCase() === value.shortCode.trim().toLowerCase() && item.academicYear === state.academicYear.year);
        if (duplicate) throw new Error("A class already uses that short code for this academic year.");
        const row = { name: value.name.trim(), shortCode: value.shortCode.trim(), subject: value.subject?.trim() ?? "", yearLevel: value.yearLevel?.trim() ?? "", room: value.room?.trim() ?? "", colour: value.colour, archived: value.archived ?? false, updatedAt: new Date() };
        if (payload.id) { assertOwned(state.classes, payload.id, "Class"); await tx.update(schema.classes).set(row).where(and(eq(schema.classes.id, payload.id), eq(schema.classes.userId, userId))); }
        else await tx.insert(schema.classes).values({ id: id("class"), userId, academicYearId: yearId, ...row });
      } else if (action === "archive" || action === "restore") {
        assertOwned(state.classes, payload.id, "Class");
        if (action === "archive" && state.recurringAssignments.some((item) => item.classId === payload.id)) throw new Error("Remove this class from the recurring timetable before archiving it.");
        await tx.update(schema.classes).set({ archived: action === "archive", updatedAt: new Date() }).where(and(eq(schema.classes.id, payload.id), eq(schema.classes.userId, userId)));
      }
    } else if (resource === "recurring-items") {
      if (action === "save-class") {
        const classItem = assertOwned(state.classes, payload.classId, "Class");
        const block = assertOwned(state.timetableBlocks, payload.periodId, "Period block");
        if (classItem.archived || !block.isTeaching || block.cycleWeek !== payload.cycleWeek || block.weekday !== payload.weekday) throw new Error("Choose an active class and teaching block from this slot.");
        if (state.recurringEvents.some((item) => item.periodId === payload.periodId)) throw new Error("That timetable block is already occupied.");
        const existing = state.recurringAssignments.find((item) => item.periodId === payload.periodId && item.cycleWeek === payload.cycleWeek && item.weekday === payload.weekday);
        if (existing?.classId === payload.classId) return;
        if (existing && state.lessonMovements.some((movement) => movement.recurringAssignmentId === existing.id)) throw new Error("Restore dated lesson movements before replacing this assignment.");
        const today = nzDate();
        if (existing) await retireRecurringItem(tx, existing, state, userId);
        await tx.insert(schema.recurringTimetableItems).values({ id: id("assignment"), userId, academicYearId: yearId, kind: "class", classId: payload.classId, cycleWeek: payload.cycleWeek, weekday: payload.weekday, periodId: payload.periodId, effectiveFromDate: today });
      } else if (action === "remove-class") {
        const existing = state.recurringAssignments.find((item) => item.periodId === payload.periodId && item.cycleWeek === payload.cycleWeek && item.weekday === payload.weekday);
        if (!existing) return;
        if (state.lessonMovements.some((movement) => movement.recurringAssignmentId === existing.id)) throw new Error("This assignment has dated lesson changes. Restore those lessons first.");
        await retireRecurringItem(tx, existing, state, userId);
      } else if (action === "save-event") {
        const values = payload.values;
        const errors = validateRecurringEvent(values, state.timetableBlocks, state.recurringAssignments, state.recurringEvents);
        if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
        const row = { eventType: values.type, title: values.title.trim(), detail: (values.detail ?? "").trim(), colour: values.colour, updatedAt: new Date() };
        if (values.id) { assertOwned(state.recurringEvents, values.id, "Recurring item"); await tx.update(schema.recurringTimetableItems).set(row).where(and(eq(schema.recurringTimetableItems.id, values.id), eq(schema.recurringTimetableItems.userId, userId))); }
        else await tx.insert(schema.recurringTimetableItems).values({ id: id("event"), userId, academicYearId: yearId, kind: "event", cycleWeek: values.cycleWeek, weekday: values.weekday, periodId: values.periodId, effectiveFromDate: nzDate(), ...row });
      } else if (action === "remove-event") {
        assertOwned(state.recurringEvents, payload.id, "Recurring item");
        await tx.delete(schema.recurringTimetableItems).where(and(eq(schema.recurringTimetableItems.id, payload.id), eq(schema.recurringTimetableItems.userId, userId), eq(schema.recurringTimetableItems.kind, "event")));
      }
    } else if (resource === "lesson-occurrences") {
      const details = payload.values;
      const assignment = [...state.recurringAssignments, ...state.historicalRecurringAssignments].find((item) => item.id === details.recurringAssignmentId);
      if (!assignment || assignment.classId !== details.classId) throw new Error("Lesson assignment not found.");
      const content = normalizeLessonContent(details);
      const occurrenceId = `${details.date}--${details.recurringAssignmentId}`;
      if (!hasLessonContent(content)) await tx.delete(schema.lessonOccurrences).where(and(eq(schema.lessonOccurrences.userId, userId), eq(schema.lessonOccurrences.date, details.date), eq(schema.lessonOccurrences.recurringAssignmentId, details.recurringAssignmentId)));
      else await tx.insert(schema.lessonOccurrences).values({ id: occurrenceId, userId, date: details.date, recurringAssignmentId: details.recurringAssignmentId, classId: details.classId, periodId: details.periodId, ...content }).onConflictDoUpdate({ target: [schema.lessonOccurrences.userId, schema.lessonOccurrences.date, schema.lessonOccurrences.recurringAssignmentId], set: { periodId: details.periodId, ...content, updatedAt: new Date() } });
    } else if (resource === "dated-events") {
      if (action === "remove") {
        assertOwned(state.datedEvents, payload.id, "One-off event");
        await tx.delete(schema.datedEvents).where(and(eq(schema.datedEvents.id, payload.id), eq(schema.datedEvents.userId, userId)));
      } else if (action === "save") {
        const values = payload.values ?? {};
        const errors = validateDatedEvent(values, state.academicYear);
        if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
        if (values.id) assertOwned(state.datedEvents, values.id, "One-off event");
        const row = { date: values.date, type: values.type, title: values.title.trim(), detail: (values.detail ?? "").trim(), location: (values.location ?? "").trim(), colour: values.colour, startTime: values.startTime, endTime: values.endTime, updatedAt: new Date() };
        if (values.id) await tx.update(schema.datedEvents).set(row).where(and(eq(schema.datedEvents.id, values.id), eq(schema.datedEvents.userId, userId)));
        else await tx.insert(schema.datedEvents).values({ id: id("dated-event"), userId, academicYearId: yearId, ...row });
      } else throw new Error("Unsupported one-off event operation.");
    } else if (resource === "overlays") {
      const table = payload.kind === "teacher" ? schema.teacherAbsences : payload.kind === "class" ? schema.classAbsences : schema.calendarExceptions;
      const list = payload.kind === "teacher" ? state.teacherAbsences : payload.kind === "class" ? state.classAbsences : state.calendarExceptions;
      if (action === "remove") { assertOwned(list, payload.id, "Overlay"); await tx.delete(table).where(and(eq(table.id, payload.id), eq(table.userId, userId))); }
      else {
        const values = payload.values;
        const errors = payload.kind === "teacher" ? validateTeacherAbsence(values, state.academicYear) : payload.kind === "class" ? validateClassAbsence(values, state.academicYear) : validateCalendarException(values, state.academicYear);
        if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
        if (values.id) assertOwned(list, values.id, "Overlay");
        const recordId = values.id ?? id(`${payload.kind}-overlay`);
        const row = payload.kind === "teacher" ? { startDate: values.startDate, endDate: values.endDate, note: values.note.trim() } : payload.kind === "class" ? { startDate: values.startDate, endDate: values.endDate, reason: values.reason.trim() } : { type: values.type, startDate: values.startDate, endDate: values.endDate, note: values.note.trim() };
        await tx.insert(table).values({ id: recordId, userId, ...row }).onConflictDoUpdate({ target: table.id, set: { ...row, updatedAt: new Date() } });
        if (payload.kind === "class") { for (const classId of values.classIds) assertOwned(state.classes, classId, "Class"); await tx.delete(schema.classAbsenceClasses).where(eq(schema.classAbsenceClasses.classAbsenceId, recordId)); await tx.insert(schema.classAbsenceClasses).values(values.classIds.map((classId) => ({ classAbsenceId: recordId, classId }))); }
      }
    } else if (resource === "calendar") {
      if (payload.kind === "term") {
        if (action === "remove") { if (state.teachingWeeks.some((week) => week.termId === payload.id)) throw new Error("Remove this term's teaching weeks first."); await tx.delete(schema.terms).where(and(eq(schema.terms.id, payload.id), eq(schema.terms.academicYearId, yearId))); }
        else { const values = payload.values; if (values.id) assertOwned(state.terms, values.id, "Term"); const errors = validateTerm(values, state.terms, state.teachingWeeks, state.academicYear, values.id); if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]); const row = { academicYearId: yearId, name: values.name.trim(), startDate: values.startDate, endDate: values.endDate, displayOrder: values.displayOrder ?? Math.max(0, ...state.terms.map((item) => item.displayOrder)) + 1 }; await tx.insert(schema.terms).values({ id: values.id ?? id("term"), ...row }).onConflictDoUpdate({ target: schema.terms.id, set: { ...row, updatedAt: new Date() } }); }
      } else if (payload.kind === "week") {
        if (action === "remove") { assertOwned(state.teachingWeeks, payload.id, "Teaching week"); await tx.delete(schema.teachingWeeks).where(eq(schema.teachingWeeks.id, payload.id)); }
        else if (action === "generate") { const term = assertOwned(state.terms, payload.termId, "Term"); const generated = generateMissingWeeks(term, state.teachingWeeks, payload.firstCycleWeek); if (generated.length) await tx.insert(schema.teachingWeeks).values(generated); }
        else { const values = payload.values; if (values.id) assertOwned(state.teachingWeeks, values.id, "Teaching week"); const term = assertOwned(state.terms, values.termId, "Term"); const errors = validateTeachingWeek(values, term, state.teachingWeeks, values.id); if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]); const row = { termId: values.termId, weekStartDate: values.weekStartDate, cycleWeek: values.cycleWeek }; if (values.id && values.id !== values.weekStartDate) await tx.delete(schema.teachingWeeks).where(eq(schema.teachingWeeks.id, values.id)); await tx.insert(schema.teachingWeeks).values({ id: values.weekStartDate, ...row }).onConflictDoUpdate({ target: schema.teachingWeeks.id, set: { ...row, updatedAt: new Date() } }); }
      }
    } else if (resource === "day-templates") {
      await mutateDayTemplates({ tx, state, userId, yearId, action, payload });
    } else if (resource === "movements") {
      if (action === "remove") {
        const assignment = assertOwned(state.recurringAssignments, payload.recurringAssignmentId, "Timetable assignment");
        const movement = state.lessonMovements.find((item) => item.date === payload.date && item.recurringAssignmentId === payload.recurringAssignmentId);
        if (!movement) return;
        const occupant = getBlockOccupant({ date: payload.date, cycleWeek: assignment.cycleWeek, weekday: assignment.weekday, periodId: assignment.periodId, recurringAssignments: state.recurringAssignments, lessonMovements: state.lessonMovements.filter((item) => item !== movement), recurringEvents: state.recurringEvents, ignoreAssignmentId: assignment.id });
        if (occupant) throw new Error("The original block is occupied, so this lesson cannot be restored yet.");
        await tx.delete(schema.lessonMovements).where(and(eq(schema.lessonMovements.userId, userId), eq(schema.lessonMovements.date, payload.date), eq(schema.lessonMovements.recurringAssignmentId, payload.recurringAssignmentId)));
      }
      else { const validation = validateLessonMovement({ ...payload.values, recurringAssignments: state.recurringAssignments, timetableBlocks: state.timetableBlocks, lessonMovements: state.lessonMovements, recurringEvents: state.recurringEvents, teachingWeeks: state.teachingWeeks }); if (!validation.ok) throw new Error(validation.message); const values = payload.values; await tx.insert(schema.lessonMovements).values({ id: id("movement"), userId, date: values.date, recurringAssignmentId: values.recurringAssignmentId, destinationPeriodId: values.destinationPeriodId }).onConflictDoUpdate({ target: [schema.lessonMovements.userId, schema.lessonMovements.date, schema.lessonMovements.recurringAssignmentId], set: { destinationPeriodId: values.destinationPeriodId, updatedAt: new Date() } }); }
    } else throw new Error("Unsupported data operation.");
  });
  return getSchoolData(userId);
}
