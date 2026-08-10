import { getTemporaryEvent } from "../data/sampleTimetable";

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

  if (period.type === "break") {
    return { type: "break", label: period.label };
  }

  const assignment = findAssignmentForSlot(
    assignments,
    cycleWeek,
    weekday,
    period.id,
  );

  return assignment
    ? { type: "class", classId: assignment.classId }
    : { type: "free" };
}
