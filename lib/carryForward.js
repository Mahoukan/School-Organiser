import { weekdays } from "../data/sampleTimetable.js";
import { getTeachingWeekForDate } from "./academicCalendar.js";
import { getBlocksForDay, resolveTimetableBlock } from "./periodStructures.js";
import {
  findLessonOccurrence,
  getDateFromKey,
  getDateKey,
  getEffectiveLessonStatus,
} from "./lessonOccurrences.js";
import { addDays } from "./timetableDates.js";
import { getEffectiveCancellation } from "./scheduleOverlays.js";
import { getEffectivePeriodId } from "./lessonMovements.js";

const SEARCH_HORIZON_DAYS = 60;

export function findNextClassOccurrence({
  classId,
  currentDate,
  currentPeriodId,
  currentRecurringAssignmentId,
  recurringAssignments,
  lessonOccurrences,
  teachingWeeks,
  timetableBlocks,
  teacherAbsences = [],
  classAbsences = [],
  calendarExceptions = [],
  lessonMovements = [],
}) {
  const startDate = getDateFromKey(currentDate);
  const currentAssignment = recurringAssignments.find(
    (assignment) => assignment.id === currentRecurringAssignmentId,
  );
  const currentEffectivePeriodId = currentAssignment
    ? getEffectivePeriodId(currentAssignment, currentDate, lessonMovements)
    : currentPeriodId;
  const currentPeriodOrder = resolveTimetableBlock(
    timetableBlocks,
    currentEffectivePeriodId,
  )?.displayOrder;

  for (let dayOffset = 0; dayOffset <= SEARCH_HORIZON_DAYS; dayOffset += 1) {
    const date = addDays(startDate, dayOffset);
    const weekday = weekdays[date.getDay() - 1];
    if (!weekday) continue;
    const teachingWeek = getTeachingWeekForDate(date, teachingWeeks);
    if (!teachingWeek) continue;
    const dayBlocks = getBlocksForDay(
      timetableBlocks,
      teachingWeek.cycleWeek,
      weekday.key,
    );

    const assignments = recurringAssignments
      .filter(
        (assignment) =>
          assignment.classId === classId &&
          assignment.cycleWeek === teachingWeek.cycleWeek &&
          assignment.weekday === weekday.key,
      )
      .map((assignment) => ({ assignment, effectivePeriodId: getEffectivePeriodId(assignment, getDateKey(date), lessonMovements) }))
      .filter(({ effectivePeriodId }) => resolveTimetableBlock(dayBlocks, effectivePeriodId)?.isTeaching)
      .sort((first, second) => resolveTimetableBlock(dayBlocks, first.effectivePeriodId).displayOrder - resolveTimetableBlock(dayBlocks, second.effectivePeriodId).displayOrder);

    for (const candidate of assignments) {
      const { assignment, effectivePeriodId } = candidate;
      const periodOrder = resolveTimetableBlock(dayBlocks, effectivePeriodId).displayOrder;
      if (dayOffset === 0 && periodOrder <= currentPeriodOrder) continue;

      const dateKey = getDateKey(date);
      const occurrence = findLessonOccurrence(
        lessonOccurrences,
        dateKey,
        assignment.id,
      );
      const cancellation = getEffectiveCancellation({
        dateKey,
        classId,
        occurrence,
        teacherAbsences,
        classAbsences,
        calendarExceptions,
      });
      if (cancellation.isCancelled) continue;

      return {
        date: dateKey,
        recurringAssignmentId: assignment.id,
        classId: assignment.classId,
        periodId: effectivePeriodId,
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
