import { getDateKey } from "./lessonOccurrences.js";
import { addDays, getMonday, isWeekend } from "./timetableDates.js";

export function parseDateOnly(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function enumerateCompleteMondays(startDate, endDate) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const first = addDays(start, (8 - start.getDay()) % 7);
  const mondays = [];
  for (let date = first; addDays(date, 4) <= end; date = addDays(date, 7)) {
    mondays.push(getDateKey(date));
  }
  return mondays;
}

export function getTeachingWeekForDate(date, teachingWeeks) {
  if (isWeekend(date)) return null;
  const mondayKey = getDateKey(getMonday(date));
  return teachingWeeks.find((week) => week.weekStartDate === mondayKey) ?? null;
}

export function formatCalendarDate(value, options = {}) {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    ...options,
  }).format(parseDateOnly(value));
}

export function validateTerm(values, terms, teachingWeeks, academicYear, editingId) {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Enter a term name.";
  else if (name.length > 50) errors.name = "Term name must be 50 characters or fewer.";
  if (!values.startDate) errors.startDate = "Choose a start date.";
  if (!values.endDate) errors.endDate = "Choose an end date.";
  if (values.startDate && values.endDate && values.startDate > values.endDate) {
    errors.endDate = "End date must be on or after the start date.";
  }
  if (values.startDate?.slice(0, 4) !== String(academicYear.year) || values.endDate?.slice(0, 4) !== String(academicYear.year)) {
    errors.dateRange = `Term dates must be inside ${academicYear.year}.`;
  }
  const overlaps = terms.some((term) => term.id !== editingId && values.startDate <= term.endDate && values.endDate >= term.startDate);
  if (values.startDate && values.endDate && overlaps) errors.dateRange = "Term dates must not overlap another term.";
  const excluded = teachingWeeks.some((week) => week.termId === editingId && (week.weekStartDate < values.startDate || getDateKey(addDays(parseDateOnly(week.weekStartDate), 4)) > values.endDate));
  if (excluded) errors.dateRange = "This term contains teaching weeks outside the new date range. Adjust or remove those weeks first.";
  return errors;
}

export function validateTeachingWeek(values, term, teachingWeeks, editingId) {
  const errors = {};
  if (!values.weekStartDate) return { weekStartDate: "Choose a week start date." };
  const date = parseDateOnly(values.weekStartDate);
  if (date.getDay() !== 1) errors.weekStartDate = "Teaching weeks must begin on a Monday.";
  if (values.weekStartDate < term.startDate || getDateKey(addDays(date, 4)) > term.endDate) errors.weekStartDate = "The complete Monday–Friday week must fit inside this term.";
  if (teachingWeeks.some((week) => week.id !== editingId && week.weekStartDate === values.weekStartDate)) errors.weekStartDate = "A teaching week already exists for this Monday.";
  if (!["A", "B"].includes(values.cycleWeek)) errors.cycleWeek = "Choose Week A or Week B.";
  return errors;
}

export function generateMissingWeeks(term, teachingWeeks, firstCycleWeek) {
  const mondays = enumerateCompleteMondays(term.startDate, term.endDate);
  const existing = new Set(teachingWeeks.map((week) => week.weekStartDate));
  return mondays.flatMap((weekStartDate, index) =>
    existing.has(weekStartDate) ? [] : [{
      id: weekStartDate,
      termId: term.id,
      weekStartDate,
      cycleWeek: index % 2 === 0 ? firstCycleWeek : firstCycleWeek === "A" ? "B" : "A",
    }],
  );
}
