import { parseDateOnly } from "./academicCalendar.js";
import { RECURRING_EVENT_COLOURS, RECURRING_EVENT_TYPES, getRecurringEventTypeLabel } from "./recurringEvents.js";
import { deriveTodaySchedule } from "./todaySchedule.js";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateDatedEvent(values, academicYear) {
  const errors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date ?? "")) errors.date = "Choose a valid date.";
  else {
    const parsed = parseDateOnly(values.date);
    if (Number.isNaN(parsed.getTime()) || `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}` !== values.date) errors.date = "Choose a valid date.";
    else if (academicYear && parsed.getFullYear() !== academicYear.year) errors.date = `Choose a date in ${academicYear.year}.`;
  }
  if (!RECURRING_EVENT_TYPES.some((item) => item.value === values.type)) errors.type = "Choose an event type.";
  if (!values.title?.trim()) errors.title = "Title is required.";
  else if (values.title.trim().length > 100) errors.title = "Title must be 100 characters or fewer.";
  if ((values.detail ?? "").trim().length > 500) errors.detail = "Detail must be 500 characters or fewer.";
  if ((values.location ?? "").trim().length > 100) errors.location = "Location must be 100 characters or fewer.";
  if (!RECURRING_EVENT_COLOURS.some((item) => item.value === values.colour)) errors.colour = "Choose a colour.";
  if (!timePattern.test(values.startTime ?? "")) errors.startTime = "Start time is required.";
  if (!timePattern.test(values.endTime ?? "")) errors.endTime = "End time is required.";
  if (timePattern.test(values.startTime ?? "") && timePattern.test(values.endTime ?? "") && values.startTime >= values.endTime) errors.endTime = "End time must be after start time.";
  return errors;
}

export function rangesOverlap(start, end, otherStart, otherEnd) {
  return start < otherEnd && end > otherStart;
}

export function getDatedEventConflicts(values, data) {
  if (!values.date || !values.startTime || !values.endTime) return [];
  const schedule = deriveTodaySchedule(data, parseDateOnly(values.date));
  const timetable = schedule.blocks.flatMap((block) => {
    if (!rangesOverlap(values.startTime, values.endTime, block.period.startTime, block.period.endTime)) return [];
    if (block.entry.type === "class" && block.classDetails && !block.cancellation?.isCancelled) return [{ id: `class-${block.entry.recurringAssignmentId}`, label: block.classDetails.shortCode, detail: block.period.name, startTime: block.period.startTime, endTime: block.period.endTime }];
    if (block.entry.type === "event") return [{ id: `recurring-${block.entry.event.id}`, label: block.entry.event.title, detail: getRecurringEventTypeLabel(block.entry.event.type), startTime: block.period.startTime, endTime: block.period.endTime }];
    return [];
  });
  const dated = (data.datedEvents ?? []).filter((item) => item.id !== values.id && item.date === values.date && rangesOverlap(values.startTime, values.endTime, item.startTime, item.endTime)).map((item) => ({ id: `dated-${item.id}`, label: item.title, detail: getRecurringEventTypeLabel(item.type), startTime: item.startTime, endTime: item.endTime }));
  return [...timetable, ...dated].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function sortDatedEvents(events, direction = "asc") {
  return [...events].sort((a, b) => direction === "asc" ? a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) : b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
}
