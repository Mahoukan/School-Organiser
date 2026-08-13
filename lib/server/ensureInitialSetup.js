import { and, eq, inArray, sql } from "drizzle-orm";

import { getDatabase } from "../db/index.js";
import * as schema from "../db/schema.js";
import { isInitialOwnerEmail, normalizeEmail } from "./claimLegacyData.js";

const SAFE_ONBOARDING_MESSAGE = "The organiser's default school setup is not available yet. Please contact the organiser administrator.";

export class InitialSetupUnavailableError extends Error {
  constructor(options) {
    super(SAFE_ONBOARDING_MESSAGE, options);
    this.name = "InitialSetupUnavailableError";
  }
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function mappedId(map, sourceId, label) {
  const value = map.get(sourceId);
  if (!value) throw new Error(`Source ${label} relationship is invalid.`);
  return value;
}

async function loadSourceSetup(tx, sourceUserId) {
  const academicYears = await tx.select().from(schema.academicYears).where(eq(schema.academicYears.userId, sourceUserId));
  if (!academicYears.some((item) => item.active)) throw new InitialSetupUnavailableError();

  const academicYearIds = academicYears.map((item) => item.id);
  const [terms, templates, dayAssignments, periodBlocks] = await Promise.all([
    tx.select().from(schema.terms).where(inArray(schema.terms.academicYearId, academicYearIds)),
    tx.select().from(schema.dayTimetableTemplates).where(andOwnerYear(sourceUserId, academicYearIds, schema.dayTimetableTemplates)),
    tx.select().from(schema.dayTimetableAssignments).where(andOwnerYear(sourceUserId, academicYearIds, schema.dayTimetableAssignments)),
    tx.select().from(schema.periodBlocks).where(andOwnerYear(sourceUserId, academicYearIds, schema.periodBlocks)),
  ]);
  const termIds = terms.map((item) => item.id);
  const templateIds = templates.map((item) => item.id);
  const [teachingWeeks, templateBlocks] = await Promise.all([
    termIds.length ? tx.select().from(schema.teachingWeeks).where(inArray(schema.teachingWeeks.termId, termIds)) : [],
    templateIds.length ? tx.select().from(schema.dayTimetableTemplateBlocks).where(inArray(schema.dayTimetableTemplateBlocks.templateId, templateIds)) : [],
  ]);

  return { academicYears, terms, teachingWeeks, templates, templateBlocks, dayAssignments, periodBlocks };
}

function andOwnerYear(userId, academicYearIds, table) {
  return and(eq(table.userId, userId), inArray(table.academicYearId, academicYearIds));
}

export async function cloneStructuralSetup(tx, targetUserId, source) {
  const academicYearIds = new Map(source.academicYears.map((item) => [item.id, createId("academic-year")]));
  const termIds = new Map(source.terms.map((item) => [item.id, createId("term")]));
  const templateIds = new Map(source.templates.map((item) => [item.id, createId("template")]));
  const templateBlockIds = new Map(source.templateBlocks.map((item) => [item.id, createId("template-block")]));

  await tx.insert(schema.academicYears).values(source.academicYears.map((item) => ({
    id: academicYearIds.get(item.id),
    userId: targetUserId,
    year: item.year,
    name: item.name,
    active: item.active,
  })));

  if (source.terms.length) await tx.insert(schema.terms).values(source.terms.map((item) => ({
    id: termIds.get(item.id),
    academicYearId: mappedId(academicYearIds, item.academicYearId, "academic year"),
    name: item.name,
    startDate: item.startDate,
    endDate: item.endDate,
    displayOrder: item.displayOrder,
  })));

  if (source.teachingWeeks.length) await tx.insert(schema.teachingWeeks).values(source.teachingWeeks.map((item) => ({
    id: createId("teaching-week"),
    termId: mappedId(termIds, item.termId, "term"),
    weekStartDate: item.weekStartDate,
    cycleWeek: item.cycleWeek,
  })));

  if (source.templates.length) await tx.insert(schema.dayTimetableTemplates).values(source.templates.map((item) => ({
    id: templateIds.get(item.id),
    userId: targetUserId,
    academicYearId: mappedId(academicYearIds, item.academicYearId, "academic year"),
    name: item.name,
  })));

  if (source.templateBlocks.length) await tx.insert(schema.dayTimetableTemplateBlocks).values(source.templateBlocks.map((item) => ({
    id: templateBlockIds.get(item.id),
    templateId: mappedId(templateIds, item.templateId, "day template"),
    name: item.name,
    startTime: item.startTime,
    endTime: item.endTime,
    displayOrder: item.displayOrder,
    isTeaching: item.isTeaching,
  })));

  if (source.dayAssignments.length) await tx.insert(schema.dayTimetableAssignments).values(source.dayAssignments.map((item) => ({
    id: createId("day-template"),
    userId: targetUserId,
    academicYearId: mappedId(academicYearIds, item.academicYearId, "academic year"),
    cycleWeek: item.cycleWeek,
    weekday: item.weekday,
    templateId: mappedId(templateIds, item.templateId, "day template"),
  })));

  if (source.periodBlocks.length) await tx.insert(schema.periodBlocks).values(source.periodBlocks.map((item) => ({
    id: createId("slot"),
    userId: targetUserId,
    academicYearId: mappedId(academicYearIds, item.academicYearId, "academic year"),
    templateBlockId: mappedId(templateBlockIds, item.templateBlockId, "template block"),
    cycleWeek: item.cycleWeek,
    weekday: item.weekday,
    name: item.name,
    startTime: item.startTime,
    endTime: item.endTime,
    displayOrder: item.displayOrder,
    isTeaching: item.isTeaching,
  })));
}

export async function ensureInitialSetupForUser(user, { database } = {}) {
  if (!user?.id) throw new InitialSetupUnavailableError();
  if (isInitialOwnerEmail(user.email)) return false;

  try {
    const db = database ?? getDatabase();
    const existingYears = await db.select({ id: schema.academicYears.id }).from(schema.academicYears).where(eq(schema.academicYears.userId, user.id)).limit(1);
    if (existingYears.length) return false;

    const ownerEmail = normalizeEmail(process.env.INITIAL_OWNER_EMAIL);
    if (!ownerEmail) throw new InitialSetupUnavailableError();

    const cloned = await db.transaction(async (tx) => {
      const targetRows = await tx.execute(sql`select id from users where id = ${user.id} for update`);
      if (!targetRows.rows.length) throw new Error("Target user does not exist.");

      const lockedExistingYears = await tx.select({ id: schema.academicYears.id }).from(schema.academicYears).where(eq(schema.academicYears.userId, user.id)).limit(1);
      if (lockedExistingYears.length) return false;

      const sourceUsers = await tx.select({ id: schema.users.id }).from(schema.users)
        .where(sql`lower(trim(${schema.users.email})) = ${ownerEmail}`).limit(1);
      const sourceUser = sourceUsers[0];
      if (!sourceUser) throw new InitialSetupUnavailableError();
      if (sourceUser.id === user.id) return false;

      console.info("Initial setup clone started.", { userId: user.id });
      const source = await loadSourceSetup(tx, sourceUser.id);
      await cloneStructuralSetup(tx, user.id, source);
      return true;
    });

    if (cloned) console.info("Initial setup clone completed.", { userId: user.id });
    return cloned;
  } catch (error) {
    console.error("Initial setup clone failed.", { userId: user.id, name: error?.name, code: error?.code });
    if (error instanceof InitialSetupUnavailableError) throw error;
    throw new InitialSetupUnavailableError({ cause: error });
  }
}
