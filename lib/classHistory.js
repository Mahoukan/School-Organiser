import { weekdays } from "../data/sampleTimetable.js";
import { parseDateOnly } from "./academicCalendar.js";
import {
  findLessonOccurrence,
  getDateKey,
  getEffectiveLessonStatus,
} from "./lessonOccurrences.js";
import {
  getEffectivePeriodId,
  getMovementForOccurrence,
} from "./lessonMovements.js";
import { resolveTimetableBlock } from "./periodStructures.js";
import { getEffectiveCancellation } from "./scheduleOverlays.js";
import { addDays } from "./timetableDates.js";

export function getClassScheduledOccurrences({
  classId,
  terms,
  teachingWeeks,
  recurringAssignments,
  historicalRecurringAssignments = [],
  timetableBlocks,
  lessonOccurrences,
  lessonMovements,
  teacherAbsences,
  classAbsences,
  calendarExceptions,
}) {
  if (!terms.length) return [];
  const yearStart = [...terms].sort((a, b) => a.startDate.localeCompare(b.startDate))[0].startDate;
  const yearEnd = [...terms].sort((a, b) => b.endDate.localeCompare(a.endDate))[0].endDate;
  const classAssignments = [...recurringAssignments, ...historicalRecurringAssignments].filter(
    (assignment) => assignment.classId === classId,
  );

  const entries = teachingWeeks.flatMap((teachingWeek) => {
    if (teachingWeek.weekStartDate < yearStart || teachingWeek.weekStartDate > yearEnd) return [];
    const monday = parseDateOnly(teachingWeek.weekStartDate);
    return classAssignments
      .filter((assignment) => assignment.cycleWeek === teachingWeek.cycleWeek)
      .flatMap((assignment) => {
        const weekdayIndex = weekdays.findIndex((day) => day.key === assignment.weekday);
        if (weekdayIndex < 0) return [];
        const date = getDateKey(addDays(monday, weekdayIndex));
        if (date < yearStart || date > yearEnd) return [];
        if (assignment.effectiveFromDate && date < assignment.effectiveFromDate) return [];
        if (assignment.effectiveToDate && date > assignment.effectiveToDate) return [];
        const occurrence = findLessonOccurrence(lessonOccurrences, date, assignment.id);
        const movement = getMovementForOccurrence(lessonMovements, date, assignment.id);
        const effectivePeriod = resolveTimetableBlock(
          timetableBlocks,
          getEffectivePeriodId(assignment, date, lessonMovements),
        );
        const originalPeriod = resolveTimetableBlock(timetableBlocks, assignment.periodId);
        if (!effectivePeriod || !originalPeriod) return [];
        const cancellation = getEffectiveCancellation({
          dateKey: date,
          classId,
          occurrence,
          teacherAbsences,
          classAbsences,
          calendarExceptions,
        });
        return [{
          id: `${date}--${assignment.id}`,
          date,
          classId,
          recurringAssignmentId: assignment.id,
          occurrence,
          movement,
          effectivePeriod,
          originalPeriod,
          cancellation,
          status: cancellation.isCancelled ? "cancelled" : getEffectiveLessonStatus(occurrence),
        }];
      });
  });

  return entries.sort((first, second) =>
    first.date.localeCompare(second.date) ||
    first.effectivePeriod.displayOrder - second.effectivePeriod.displayOrder,
  );
}

export function splitClassHistory(entries, today = getDateKey(new Date())) {
  return {
    past: entries
      .filter((entry) => entry.date < today)
      .sort((first, second) =>
        second.date.localeCompare(first.date) ||
        first.effectivePeriod.displayOrder - second.effectivePeriod.displayOrder,
      ),
    upcoming: entries.filter((entry) => entry.date >= today),
  };
}
