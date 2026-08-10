export const weekdays = [
  { key: "monday", label: "Monday", shortLabel: "Mon" },
  { key: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { key: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { key: "thursday", label: "Thursday", shortLabel: "Thu" },
  { key: "friday", label: "Friday", shortLabel: "Fri" },
];

export const temporaryEvents = [
  {
    id: "event-a-wednesday-lunch",
    cycleWeek: "A",
    weekday: "wednesday",
    periodId: "a-wednesday-lunch",
    type: "event",
    title: "Courtyard duty",
    label: "Duty",
    location: "Courtyard",
  },
  {
    id: "event-b-tuesday-p6",
    cycleWeek: "B",
    weekday: "tuesday",
    periodId: "b-tuesday-p6",
    type: "event",
    title: "Department meeting",
    label: "Meeting",
    location: "DT2",
  },
  {
    id: "event-b-friday-lunch",
    cycleWeek: "B",
    weekday: "friday",
    periodId: "b-friday-lunch",
    type: "event",
    title: "Library duty",
    label: "Duty",
    location: "Library",
  },
];

export function getTemporaryEvent(cycleWeek, weekday, periodId) {
  return temporaryEvents.find(
    (event) =>
      event.cycleWeek === cycleWeek &&
      event.weekday === weekday &&
      event.periodId === periodId,
  );
}
