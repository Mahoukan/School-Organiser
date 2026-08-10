import { getEffectiveAssignmentForBlock } from "./lessonMovements";
import { getRecurringEventForBlock } from "./recurringEvents";

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

export function getDatedTimetableEntry({ recurringAssignments, recurringEvents, lessonMovements, date, cycleWeek, weekday, period }) {
  const assignment = getEffectiveAssignmentForBlock({ date, cycleWeek, weekday, periodId: period.id, recurringAssignments, lessonMovements });
  if (assignment) return { type: "class", classId: assignment.classId, recurringAssignmentId: assignment.id, movedFromPeriodId: assignment.periodId === period.id ? null : assignment.periodId };
  const event = getRecurringEventForBlock(recurringEvents, cycleWeek, weekday, period.id);
  if (event) return { type: "event", event };
  return period.isTeaching ? { type: "free" } : { type: "break", label: period.name };
}
