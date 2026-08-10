import { getTemporaryEvent } from "../data/sampleTimetable";
import { getEffectiveAssignmentForBlock } from "./lessonMovements";

export function findAssignmentForSlot(
  assignments,
  cycleWeek,
  weekday,
  periodId,
) {
  return assignments.find(
    (assignment) =>
      assignment.cycleWeek === cycleWeek &&
      assignment.weekday === weekday &&
      assignment.periodId === periodId,
  );
}

export function getTimetableEntry(
  assignments,
  cycleWeek,
  weekday,
  period,
) {
  const event = getTemporaryEvent(cycleWeek, weekday, period.id);
  if (event) return event;

  if (!period.isTeaching) {
    return { type: "break", label: period.name };
  }

  const assignment = findAssignmentForSlot(
    assignments,
    cycleWeek,
    weekday,
    period.id,
  );

  return assignment
    ? {
        type: "class",
        classId: assignment.classId,
        recurringAssignmentId: assignment.id,
      }
    : { type: "free" };
}

export function getDatedTimetableEntry({ recurringAssignments, lessonMovements, date, cycleWeek, weekday, period }) {
  const event = getTemporaryEvent(cycleWeek, weekday, period.id);
  if (event) return event;
  if (!period.isTeaching) return { type: "break", label: period.name };
  const assignment = getEffectiveAssignmentForBlock({ date, cycleWeek, weekday, periodId: period.id, recurringAssignments, lessonMovements });
  if (!assignment) return { type: "free" };
  return {
    type: "class",
    classId: assignment.classId,
    recurringAssignmentId: assignment.id,
    movedFromPeriodId: assignment.periodId === period.id ? null : assignment.periodId,
  };
}
