import { eq, sql } from "drizzle-orm";
import { getDatabase } from "../db/index.js";
import * as schema from "../db/schema.js";

const LEGACY_USER_ID = "development-user";
const ownedTables = [
  schema.academicYears,
  schema.classes,
  schema.periodBlocks,
  schema.recurringTimetableItems,
  schema.lessonOccurrences,
  schema.lessonMovements,
  schema.teacherAbsences,
  schema.classAbsences,
  schema.calendarExceptions,
];

export function normalizeEmail(value) {
  return value?.trim().toLowerCase() ?? "";
}

export function isInitialOwnerEmail(value) {
  const configuredOwner = normalizeEmail(process.env.INITIAL_OWNER_EMAIL);
  return Boolean(configuredOwner) && normalizeEmail(value) === configuredOwner;
}

export async function claimLegacyData(user) {
  if (!user?.id || !isInitialOwnerEmail(user.email)) {
    throw new Error("Legacy organiser data can only be claimed by the configured initial owner.");
  }

  const db = getDatabase();
  const claimed = await db.transaction(async (tx) => {
    const legacyRows = await tx.execute(sql`select id from users where id = ${LEGACY_USER_ID} for update`);
    if (!legacyRows.rows.length) return false;

    for (const table of ownedTables) {
      await tx.update(table).set({ userId: user.id }).where(eq(table.userId, LEGACY_USER_ID));
    }
    await tx.delete(schema.users).where(eq(schema.users.id, LEGACY_USER_ID));
    return true;
  });

  if (claimed) console.info("Initial organiser ownership claim completed.");
  return claimed;
}
