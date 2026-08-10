import { eq, inArray } from "drizzle-orm";

import { getDatabase } from "../db/index.js";
import * as schema from "../db/schema.js";
import { getUserPreferences } from "./userPreferences.js";

function portableRows(rows) {
  return rows.map(({ userId, createdAt, updatedAt, ...row }) => row);
}

export async function getOrganiserExport(userId) {
  const db = getDatabase();
  const [academicYears, preferences] = await Promise.all([
    db.select().from(schema.academicYears).where(eq(schema.academicYears.userId, userId)),
    getUserPreferences(userId),
  ]);
  const academicYearIds = academicYears.map((item) => item.id);

  const [classes, templates, dayAssignments, periodBlocks, recurringItems, lessonOccurrences, movements, teacherAbsences, classAbsences, calendarExceptions, datedEvents] = await Promise.all([
    db.select().from(schema.classes).where(eq(schema.classes.userId, userId)),
    db.select().from(schema.dayTimetableTemplates).where(eq(schema.dayTimetableTemplates.userId, userId)),
    db.select().from(schema.dayTimetableAssignments).where(eq(schema.dayTimetableAssignments.userId, userId)),
    db.select().from(schema.periodBlocks).where(eq(schema.periodBlocks.userId, userId)),
    db.select().from(schema.recurringTimetableItems).where(eq(schema.recurringTimetableItems.userId, userId)),
    db.select().from(schema.lessonOccurrences).where(eq(schema.lessonOccurrences.userId, userId)),
    db.select().from(schema.lessonMovements).where(eq(schema.lessonMovements.userId, userId)),
    db.select().from(schema.teacherAbsences).where(eq(schema.teacherAbsences.userId, userId)),
    db.select().from(schema.classAbsences).where(eq(schema.classAbsences.userId, userId)),
    db.select().from(schema.calendarExceptions).where(eq(schema.calendarExceptions.userId, userId)),
    db.select().from(schema.datedEvents).where(eq(schema.datedEvents.userId, userId)),
  ]);

  const terms = academicYearIds.length
    ? await db.select().from(schema.terms).where(inArray(schema.terms.academicYearId, academicYearIds))
    : [];
  const termIds = terms.map((item) => item.id);
  const teachingWeeks = termIds.length
    ? await db.select().from(schema.teachingWeeks).where(inArray(schema.teachingWeeks.termId, termIds))
    : [];
  const templateIds = templates.map((item) => item.id);
  const templateBlocks = templateIds.length
    ? await db.select().from(schema.dayTimetableTemplateBlocks).where(inArray(schema.dayTimetableTemplateBlocks.templateId, templateIds))
    : [];
  const absenceIds = classAbsences.map((item) => item.id);
  const ownedClassIds = new Set(classes.map((item) => item.id));
  const classAbsenceLinks = absenceIds.length
    ? (await db.select().from(schema.classAbsenceClasses).where(inArray(schema.classAbsenceClasses.classAbsenceId, absenceIds)))
      .filter((item) => ownedClassIds.has(item.classId))
    : [];

  return {
    preferences,
    academicYears: portableRows(academicYears),
    terms: portableRows(terms),
    teachingWeeks: portableRows(teachingWeeks),
    classes: portableRows(classes),
    dayTimetableTemplates: portableRows(templates),
    dayTimetableTemplateBlocks: portableRows(templateBlocks),
    dayTimetableAssignments: portableRows(dayAssignments),
    periodBlocks: portableRows(periodBlocks),
    recurringItems: portableRows(recurringItems),
    lessonOccurrences: portableRows(lessonOccurrences),
    movements: portableRows(movements),
    teacherAbsences: portableRows(teacherAbsences),
    classAbsences: portableRows(classAbsences),
    classAbsenceLinks,
    calendarExceptions: portableRows(calendarExceptions),
    datedEvents: portableRows(datedEvents),
  };
}
