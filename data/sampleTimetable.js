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

export const sampleClasses = {
  "10dgt": {
    id: "10dgt",
    name: "Year 10 Digital Technology",
    shortCode: "10DGT",
    room: "DT1",
    colour: "#dce8ff",
    borderColour: "#99b8f4",
    textColour: "#173a72",
  },
  "12cs": {
    id: "12cs",
    name: "Year 12 Computer Science",
    shortCode: "12CS",
    room: "DT2",
    colour: "#e5def8",
    borderColour: "#b7a4e2",
    textColour: "#493279",
  },
  "9mat": {
    id: "9mat",
    name: "Year 9 Mathematics",
    shortCode: "9MAT",
    room: "M3",
    colour: "#d9efe4",
    borderColour: "#91c9ab",
    textColour: "#1f5b3f",
  },
  "11dgt": {
    id: "11dgt",
    name: "Year 11 Digital Technology",
    shortCode: "11DGT",
    room: "DT1",
    colour: "#f7e3d4",
    borderColour: "#dfa982",
    textColour: "#75401f",
  },
};

const classEntry = (classId) => ({ type: "class", classId });
const freeEntry = { type: "free" };

export const sampleTimetable = {
  A: {
    monday: {
      p1: classEntry("10dgt"),
      p2: classEntry("9mat"),
      p3: classEntry("12cs"),
      p4: freeEntry,
      p5: classEntry("11dgt"),
      p6: classEntry("10dgt"),
    },
    tuesday: {
      p1: freeEntry,
      p2: classEntry("10dgt"),
      p3: classEntry("9mat"),
      p4: classEntry("11dgt"),
      p5: classEntry("12cs"),
      p6: freeEntry,
    },
    wednesday: {
      p1: classEntry("12cs"),
      p2: freeEntry,
      p3: classEntry("10dgt"),
      p4: classEntry("9mat"),
      lunch: {
        type: "event",
        title: "Courtyard duty",
        label: "Duty",
        location: "Courtyard",
      },
      p5: freeEntry,
      p6: classEntry("11dgt"),
    },
    thursday: {
      p1: classEntry("9mat"),
      p2: classEntry("12cs"),
      p3: freeEntry,
      p4: classEntry("10dgt"),
      p5: classEntry("11dgt"),
      p6: classEntry("9mat"),
    },
    friday: {
      p1: classEntry("10dgt"),
      p2: classEntry("9mat"),
      p3: classEntry("11dgt"),
      p4: freeEntry,
      p5: classEntry("12cs"),
      p6: freeEntry,
    },
  },
  B: {
    monday: {
      p1: classEntry("9mat"),
      p2: freeEntry,
      p3: classEntry("10dgt"),
      p4: classEntry("12cs"),
      p5: classEntry("11dgt"),
      p6: freeEntry,
    },
    tuesday: {
      p1: classEntry("11dgt"),
      p2: classEntry("10dgt"),
      p3: freeEntry,
      p4: classEntry("9mat"),
      p5: classEntry("12cs"),
      p6: {
        type: "event",
        title: "Department meeting",
        label: "Meeting",
        location: "DT2",
      },
    },
    wednesday: {
      p1: classEntry("12cs"),
      p2: classEntry("9mat"),
      p3: classEntry("11dgt"),
      p4: freeEntry,
      p5: classEntry("10dgt"),
      p6: freeEntry,
    },
    thursday: {
      p1: freeEntry,
      p2: classEntry("12cs"),
      p3: classEntry("9mat"),
      p4: classEntry("10dgt"),
      p5: freeEntry,
      p6: classEntry("11dgt"),
    },
    friday: {
      p1: classEntry("10dgt"),
      p2: classEntry("9mat"),
      p3: freeEntry,
      p4: classEntry("12cs"),
      lunch: {
        type: "event",
        title: "Library duty",
        label: "Duty",
        location: "Library",
      },
      p5: classEntry("11dgt"),
      p6: classEntry("10dgt"),
    },
  },
};

export function getSampleEntry(weekType, weekdayKey, period) {
  const scheduledEntry = sampleTimetable[weekType]?.[weekdayKey]?.[period.id];

  if (scheduledEntry) return scheduledEntry;
  if (period.type === "break") {
    return { type: "break", label: period.label };
  }

  return freeEntry;
}
