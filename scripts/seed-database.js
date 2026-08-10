import "dotenv/config";
import { eq } from "drizzle-orm";
import { sampleAcademicYear, sampleTeachingWeeks, sampleTerms } from "../data/sampleAcademicCalendar.js";
import { sampleRecurringAssignments } from "../data/sampleAssignments.js";
import { sampleClasses } from "../data/sampleClasses.js";
import { sampleTimetableBlocks } from "../data/samplePeriodStructures.js";
import { sampleRecurringEvents } from "../data/sampleRecurringEvents.js";
import { getDatabase, getPool } from "../lib/db/index.js";
import { academicYears, classes, periodBlocks, recurringTimetableItems, teachingWeeks, terms, users } from "../lib/db/schema.js";

const USER_ID = "development-user";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed the database.");
const db = getDatabase();
await db.transaction(async (tx) => {
  await tx.insert(users).values({ id: USER_ID, name: "Teacher" }).onConflictDoNothing();
  const existingClasses = await tx.select({ id: classes.id }).from(classes).where(eq(classes.userId, USER_ID)).limit(1);
  if (existingClasses.length) return;
  await tx.insert(academicYears).values({ ...sampleAcademicYear, userId: USER_ID, active: true }).onConflictDoNothing();
  await tx.insert(terms).values(sampleTerms.map((term) => ({ ...term, academicYearId: sampleAcademicYear.id }))).onConflictDoNothing();
  await tx.insert(teachingWeeks).values(sampleTeachingWeeks).onConflictDoNothing();
  await tx.insert(classes).values(sampleClasses.map((item) => ({ ...item, userId: USER_ID, academicYearId: sampleAcademicYear.id }))).onConflictDoNothing();
  await tx.insert(periodBlocks).values(sampleTimetableBlocks.map((item) => ({ ...item, userId: USER_ID, academicYearId: sampleAcademicYear.id }))).onConflictDoNothing();
  const effectiveFromDate = sampleTerms[0].startDate;
  await tx.insert(recurringTimetableItems).values(sampleRecurringAssignments.map((item) => ({ id: item.id, userId: USER_ID, academicYearId: sampleAcademicYear.id, kind: "class", classId: item.classId, cycleWeek: item.cycleWeek, weekday: item.weekday, periodId: item.periodId, effectiveFromDate }))).onConflictDoNothing();
  await tx.insert(recurringTimetableItems).values(sampleRecurringEvents.map((item) => ({ id: item.id, userId: USER_ID, academicYearId: sampleAcademicYear.id, kind: "event", eventType: item.type, title: item.title, detail: item.detail, colour: item.colour, cycleWeek: item.cycleWeek, weekday: item.weekday, periodId: item.periodId, effectiveFromDate }))).onConflictDoNothing();
});
await getPool().end();
console.log("Database seed complete (existing records were preserved).");
