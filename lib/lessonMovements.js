import { weekdays } from "../data/sampleTimetable.js";
import { getTeachingWeekForDate } from "./academicCalendar.js";
import { getDateFromKey } from "./lessonOccurrences.js";
import { resolveTimetableBlock } from "./periodStructures.js";
import { getRecurringEventForBlock } from "./recurringEvents.js";

export function getMovementForOccurrence(movements, date, recurringAssignmentId) {
  return movements.find(
    (movement) =>
      movement.date === date &&
      movement.recurringAssignmentId === recurringAssignmentId,
  );
}

export function getEffectivePeriodId(assignment, date, movements) {
  return (
    getMovementForOccurrence(movements, date, assignment.id)
      ?.destinationPeriodId ?? assignment.periodId
  );
}

export function getEffectiveAssignmentForBlock({
  date,
  cycleWeek,
  weekday,
  periodId,
  recurringAssignments,
  lessonMovements,
}) {
  return recurringAssignments.find(
    (assignment) =>
      assignment.cycleWeek === cycleWeek &&
      assignment.weekday === weekday &&
      (!assignment.effectiveFromDate || date >= assignment.effectiveFromDate) &&
      (!assignment.effectiveToDate || date <= assignment.effectiveToDate) &&
      getEffectivePeriodId(assignment, date, lessonMovements) === periodId,
  );
}

export function getBlockOccupant({
  date,
  cycleWeek,
  weekday,
  periodId,
  recurringAssignments,
  lessonMovements,
  recurringEvents,
  ignoreAssignmentId,
}) {
  const event = getRecurringEventForBlock(recurringEvents, cycleWeek, weekday, periodId);
  if (event) return { type: "event", event };

  const assignment = getEffectiveAssignmentForBlock({
    date,
    cycleWeek,
    weekday,
    periodId,
    recurringAssignments: recurringAssignments.filter(
      (item) => item.id !== ignoreAssignmentId,
    ),
    lessonMovements,
  });
  return assignment ? { type: "class", assignment } : null;
}

export function validateLessonMovement({
  date,
  recurringAssignmentId,
  destinationPeriodId,
  recurringAssignments,
  timetableBlocks,
  lessonMovements,
  recurringEvents,
  teachingWeeks,
}) {
  const assignment = recurringAssignments.find(
    (item) => item.id === recurringAssignmentId,
  );
  if (!assignment) return { ok: false, message: "Timetable assignment not found." };
  const actualDate = getDateFromKey(date);
  const actualWeekday = weekdays[actualDate.getDay() - 1]?.key;
  const teachingWeek = getTeachingWeekForDate(actualDate, teachingWeeks);
  if (
    actualWeekday !== assignment.weekday ||
    teachingWeek?.cycleWeek !== assignment.cycleWeek
  ) {
    return { ok: false, message: "This lesson is not scheduled on the selected date." };
  }

  const destination = resolveTimetableBlock(timetableBlocks, destinationPeriodId);
  if (
    !destination ||
    !destination.isTeaching ||
    destination.cycleWeek !== assignment.cycleWeek ||
    destination.weekday !== assignment.weekday
  ) {
    return { ok: false, message: "Choose a teaching block from the same day." };
  }

  if (destinationPeriodId === assignment.periodId) {
    return { ok: false, message: "Use Restore Original Time to return to the original block." };
  }

  const occupant = getBlockOccupant({
    date,
    cycleWeek: assignment.cycleWeek,
    weekday: assignment.weekday,
    periodId: destinationPeriodId,
    recurringAssignments,
    lessonMovements,
    recurringEvents,
    ignoreAssignmentId: recurringAssignmentId,
  });
  if (occupant) return { ok: false, message: "That block is already occupied.", occupant };
  return { ok: true, assignment, destination };
}

export function getMovementDestinationOptions({
  date,
  assignment,
  recurringAssignments,
  timetableBlocks,
  lessonMovements,
  recurringEvents,
}) {
  const currentPeriodId = getEffectivePeriodId(assignment, date, lessonMovements);
  return timetableBlocks
    .filter(
      (block) =>
        block.cycleWeek === assignment.cycleWeek &&
        block.weekday === assignment.weekday &&
        block.isTeaching,
    )
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((block) => {
      const occupant = getBlockOccupant({
        date,
        cycleWeek: assignment.cycleWeek,
        weekday: assignment.weekday,
        periodId: block.id,
        recurringAssignments,
        lessonMovements,
        recurringEvents,
        ignoreAssignmentId: assignment.id,
      });
      return {
        ...block,
        state:
          block.id === currentPeriodId
            ? "current"
            : occupant
              ? "occupied"
              : "available",
        occupant,
      };
    });
}
