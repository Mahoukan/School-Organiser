import { enumerateCompleteMondays } from "../lib/academicCalendar.js";

export const sampleAcademicYear = { id: "2026", year: 2026, name: "2026" };

export const sampleTerms = [
  { id: "term-1-2026", academicYear: 2026, name: "Term 1", startDate: "2026-02-02", endDate: "2026-04-02", displayOrder: 1 },
  { id: "term-2-2026", academicYear: 2026, name: "Term 2", startDate: "2026-04-20", endDate: "2026-07-03", displayOrder: 2 },
  { id: "term-3-2026", academicYear: 2026, name: "Term 3", startDate: "2026-07-20", endDate: "2026-09-25", displayOrder: 3 },
  { id: "term-4-2026", academicYear: 2026, name: "Term 4", startDate: "2026-10-12", endDate: "2026-12-11", displayOrder: 4 },
];

export const sampleTeachingWeeks = sampleTerms.flatMap((term) =>
  enumerateCompleteMondays(term.startDate, term.endDate).map((weekStartDate, index) => ({
    id: weekStartDate,
    termId: term.id,
    weekStartDate,
    cycleWeek: index % 2 === 0 ? "A" : "B",
  })),
);
