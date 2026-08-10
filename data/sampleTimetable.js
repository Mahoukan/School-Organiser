export const weekdays = [
  { key: "monday", label: "Monday", shortLabel: "Mon" },
  { key: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { key: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { key: "thursday", label: "Thursday", shortLabel: "Thu" },
  { key: "friday", label: "Friday", shortLabel: "Fri" },
];

export const periods = [
  { id: "p1", label: "P1", start: "8:45", end: "9:40", type: "teaching" },
  { id: "p2", label: "P2", start: "9:40", end: "10:35", type: "teaching" },
  {
    id: "interval",
    label: "Interval",
    start: "10:35",
    end: "11:00",
    type: "break",
  },
  { id: "p3", label: "P3", start: "11:00", end: "11:55", type: "teaching" },
  { id: "p4", label: "P4", start: "11:55", end: "12:50", type: "teaching" },
  { id: "lunch", label: "Lunch", start: "12:50", end: "1:35", type: "break" },
  { id: "p5", label: "P5", start: "1:35", end: "2:30", type: "teaching" },
  { id: "p6", label: "P6", start: "2:30", end: "3:25", type: "teaching" },
];

export const temporaryEvents = [
  {
    id: "event-a-wednesday-lunch",
    cycleWeek: "A",
    weekday: "wednesday",
    periodId: "lunch",
    type: "event",
    title: "Courtyard duty",
    label: "Duty",
    location: "Courtyard",
  },
  {
    id: "event-b-tuesday-p6",
    cycleWeek: "B",
    weekday: "tuesday",
    periodId: "p6",
    type: "event",
    title: "Department meeting",
    label: "Meeting",
    location: "DT2",
  },
  {
    id: "event-b-friday-lunch",
    cycleWeek: "B",
    weekday: "friday",
    periodId: "lunch",
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
