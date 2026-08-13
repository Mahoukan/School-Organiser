import assert from "node:assert/strict";
import test from "node:test";

import * as schema from "../db/schema.js";
import { cloneStructuralSetup, ensureInitialSetupForUser } from "./ensureInitialSetup.js";

function recordingTransaction() {
  const inserted = new Map();
  return {
    inserted,
    insert(table) {
      return {
        async values(value) {
          inserted.set(table, Array.isArray(value) ? value : [value]);
        },
      };
    },
  };
}

test("cloneStructuralSetup creates independent structural records only", async () => {
  const tx = recordingTransaction();
  const source = {
    academicYears: [{ id: "source-year", userId: "owner", year: 2026, name: "2026", active: true }],
    terms: [{ id: "source-term", academicYearId: "source-year", name: "Term 1", startDate: "2026-02-02", endDate: "2026-04-02", displayOrder: 1 }],
    teachingWeeks: [{ id: "source-week", termId: "source-term", weekStartDate: "2026-02-02", cycleWeek: "A" }],
    templates: [{ id: "source-template", userId: "owner", academicYearId: "source-year", name: "Standard Day" }],
    templateBlocks: [{ id: "source-template-block", templateId: "source-template", name: "Period 1", startTime: "09:00", endTime: "10:00", displayOrder: 1, isTeaching: true }],
    dayAssignments: [{ id: "source-day", userId: "owner", academicYearId: "source-year", cycleWeek: "A", weekday: "monday", templateId: "source-template" }],
    periodBlocks: [{ id: "source-period", userId: "owner", academicYearId: "source-year", templateBlockId: "source-template-block", cycleWeek: "A", weekday: "monday", name: "Period 1", startTime: "09:00", endTime: "10:00", displayOrder: 1, isTeaching: true }],
  };

  await cloneStructuralSetup(tx, "teacher", source);

  const year = tx.inserted.get(schema.academicYears)[0];
  const term = tx.inserted.get(schema.terms)[0];
  const week = tx.inserted.get(schema.teachingWeeks)[0];
  const template = tx.inserted.get(schema.dayTimetableTemplates)[0];
  const templateBlock = tx.inserted.get(schema.dayTimetableTemplateBlocks)[0];
  const dayAssignment = tx.inserted.get(schema.dayTimetableAssignments)[0];
  const period = tx.inserted.get(schema.periodBlocks)[0];

  assert.notEqual(year.id, "source-year");
  assert.notEqual(term.id, "source-term");
  assert.notEqual(week.id, "source-week");
  assert.notEqual(template.id, "source-template");
  assert.notEqual(templateBlock.id, "source-template-block");
  assert.notEqual(dayAssignment.id, "source-day");
  assert.notEqual(period.id, "source-period");
  assert.equal(year.userId, "teacher");
  assert.equal(template.userId, "teacher");
  assert.equal(dayAssignment.userId, "teacher");
  assert.equal(period.userId, "teacher");
  assert.equal(term.academicYearId, year.id);
  assert.equal(week.termId, term.id);
  assert.equal(template.academicYearId, year.id);
  assert.equal(templateBlock.templateId, template.id);
  assert.equal(dayAssignment.templateId, template.id);
  assert.equal(period.templateBlockId, templateBlock.id);
  assert.equal(tx.inserted.has(schema.classes), false);
  assert.equal(tx.inserted.has(schema.recurringTimetableItems), false);
  assert.equal(tx.inserted.has(schema.lessonOccurrences), false);
  assert.equal(tx.inserted.has(schema.calendarExceptions), false);
  assert.equal(tx.inserted.has(schema.userPreferences), false);
});

test("cloneStructuralSetup rejects broken source relationships", async () => {
  const tx = recordingTransaction();
  const source = {
    academicYears: [{ id: "source-year", year: 2026, name: "2026", active: true }],
    terms: [],
    teachingWeeks: [],
    templates: [],
    templateBlocks: [],
    dayAssignments: [],
    periodBlocks: [{ id: "source-period", academicYearId: "source-year", templateBlockId: "missing", cycleWeek: "A", weekday: "monday", name: "Period 1", startTime: "09:00", endTime: "10:00", displayOrder: 1, isTeaching: true }],
  };

  await assert.rejects(cloneStructuralSetup(tx, "teacher", source), /Source template block relationship is invalid/);
});

test("the configured source owner never clones into itself", async () => {
  const previousOwnerEmail = process.env.INITIAL_OWNER_EMAIL;
  process.env.INITIAL_OWNER_EMAIL = "owner@example.com";
  try {
    assert.equal(await ensureInitialSetupForUser({ id: "owner", email: " Owner@Example.com " }), false);
  } finally {
    if (previousOwnerEmail === undefined) delete process.env.INITIAL_OWNER_EMAIL;
    else process.env.INITIAL_OWNER_EMAIL = previousOwnerEmail;
  }
});

test("an initialized user is a cheap no-op before source resolution", async () => {
  const previousOwnerEmail = process.env.INITIAL_OWNER_EMAIL;
  delete process.env.INITIAL_OWNER_EMAIL;
  const database = {
    select() {
      return { from: () => ({ where: () => ({ limit: async () => [{ id: "existing-year" }] }) }) };
    },
    transaction() {
      throw new Error("An initialized user must not start a cloning transaction.");
    },
  };
  try {
    assert.equal(await ensureInitialSetupForUser({ id: "teacher", email: "teacher@example.com" }, { database }), false);
  } finally {
    if (previousOwnerEmail === undefined) delete process.env.INITIAL_OWNER_EMAIL;
    else process.env.INITIAL_OWNER_EMAIL = previousOwnerEmail;
  }
});
