import { weekdays } from "./sampleTimetable.js";

const defaultRows = [
  ["p1", "P1", "08:45", "09:40", true],
  ["p2", "P2", "09:40", "10:35", true],
  ["interval", "Interval", "10:35", "11:00", false],
  ["p3", "P3", "11:00", "11:55", true],
  ["p4", "P4", "11:55", "12:50", true],
  ["lunch", "Lunch", "12:50", "13:35", false],
  ["p5", "P5", "13:35", "14:30", true],
  ["p6", "P6", "14:30", "15:25", true],
];

const tuesdayRows = [
  ["p1", "P1", "08:45", "09:35", true],
  ["p2", "P2", "09:35", "10:25", true],
  ["interval", "Interval", "10:25", "10:50", false],
  ["p3", "P3", "10:50", "11:45", true],
  ["p4", "P4", "11:45", "12:40", true],
  ["lunch", "Lunch", "12:40", "13:25", false],
  ["p5", "P5", "13:25", "14:20", true],
  ["p6", "P6", "14:20", "15:15", true],
];

export const sampleTimetableBlocks = ["A", "B"].flatMap((cycleWeek) =>
  weekdays.flatMap((weekday) =>
    (weekday.key === "tuesday" ? tuesdayRows : defaultRows).map(
      ([key, name, startTime, endTime, isTeaching], index) => ({
        id: `${cycleWeek.toLowerCase()}-${weekday.key}-${key}`,
        cycleWeek,
        weekday: weekday.key,
        name,
        startTime,
        endTime,
        displayOrder: index + 1,
        isTeaching,
      }),
    ),
  ),
);
