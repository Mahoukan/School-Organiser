import { periods, weekdays } from "../data/sampleTimetable.js";
import { getTeachingWeekForDate } from "./academicCalendar.js";
import {
  findLessonOccurrence,
  getDateFromKey,
  getDateKey,
  getEffectiveLessonStatus,
} from "./lessonOccurrences.js";
import { addDays } from "./timetableDates.js";

const SEARCH_HORIZON_DAYS = 60;

function getPeriodOrder(periodId) {
  return periods.findIndex((period) => period.id === periodId);
}

export function findNextClassOccurrence({
  classId,
  currentDate,
  currentPeriodId,
  recurringAssignments,
  lessonOccurrences,
  teachingWeeks,
}) {
  const startDate = getDateFromKey(currentDate);
  const currentPeriodOrder = getPeriodOrder(currentPeriodId);

  for (let dayOffset = 0; dayOffset <= SEARCH_HORIZON_DAYS; dayOffset += 1) {
    const date = addDays(startDate, dayOffset);
    const weekday = weekdays[date.getDay() - 1];
    if (!weekday) continue;
    const teachingWeek = getTeachingWeekForDate(date, teachingWeeks);
    if (!teachingWeek) continue;

    const assignments = recurringAssignments
      .filter(
        (assignment) =>
          assignment.classId === classId &&
          assignment.cycleWeek === teachingWeek.cycleWeek &&
          assignment.weekday === weekday.key,
      )
      .sort(
        (first, second) =>
          getPeriodOrder(first.periodId) - getPeriodOrder(second.periodId),
      );

    for (const assignment of assignments) {
      const periodOrder = getPeriodOrder(assignment.periodId);
      if (dayOffset === 0 && periodOrder <= currentPeriodOrder) continue;

      const dateKey = getDateKey(date);
      const occurrence = findLessonOccurrence(
        lessonOccurrences,
        dateKey,
        assignment.id,
      );
      if (getEffectiveLessonStatus(occurrence) === "cancelled") continue;

      return {
        date: dateKey,
        recurringAssignmentId: assignment.id,
        classId: assignment.classId,
        periodId: assignment.periodId,
        occurrence,
      };
    }
  }

  return null;
}

export function getCarryForwardAvailability(destination) {
  const status = getEffectiveLessonStatus(destination?.occurrence);

  if (["completed", "partially-completed"].includes(status)) {
    return { canCarry: false, reason: "protected-status" };
  }

  return {
    canCarry: true,
    replacesPlan: Boolean(
      destination?.occurrence?.title ||
        destination?.occurrence?.summary ||
        destination?.occurrence?.plan?.trim(),
    ),
  };
}
