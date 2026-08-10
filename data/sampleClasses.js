export const CLASS_ACADEMIC_YEAR = 2026;

export const classColourOptions = [
  {
    value: "#3157c8",
    label: "Blue",
    background: "#dce8ff",
    border: "#99b8f4",
    text: "#173a72",
  },
  {
    value: "#6b4bb6",
    label: "Purple",
    background: "#e5def8",
    border: "#b7a4e2",
    text: "#493279",
  },
  {
    value: "#2e7d58",
    label: "Green",
    background: "#d9efe4",
    border: "#91c9ab",
    text: "#1f5b3f",
  },
  {
    value: "#b96028",
    label: "Orange",
    background: "#f7e3d4",
    border: "#dfa982",
    text: "#75401f",
  },
  {
    value: "#147a86",
    label: "Teal",
    background: "#d8eef0",
    border: "#8fc6cb",
    text: "#18545a",
  },
  {
    value: "#a34363",
    label: "Rose",
    background: "#f5dfe7",
    border: "#d9a0b4",
    text: "#6f2d45",
  },
];

export const sampleClasses = [
  {
    id: "10dgt",
    name: "Year 10 Digital Technology",
    shortCode: "10DGT",
    subject: "Digital Technology",
    yearLevel: "10",
    room: "DT1",
    colour: "#3157c8",
    academicYear: CLASS_ACADEMIC_YEAR,
    archived: false,
  },
  {
    id: "12cs",
    name: "Year 12 Computer Science",
    shortCode: "12CS",
    subject: "Computer Science",
    yearLevel: "12",
    room: "DT2",
    colour: "#6b4bb6",
    academicYear: CLASS_ACADEMIC_YEAR,
    archived: false,
  },
  {
    id: "9mat",
    name: "Year 9 Mathematics",
    shortCode: "9MAT",
    subject: "Mathematics",
    yearLevel: "9",
    room: "M3",
    colour: "#2e7d58",
    academicYear: CLASS_ACADEMIC_YEAR,
    archived: false,
  },
  {
    id: "11dgt",
    name: "Year 11 Digital Technology",
    shortCode: "11DGT",
    subject: "Digital Technology",
    yearLevel: "11",
    room: "DT1",
    colour: "#b96028",
    academicYear: CLASS_ACADEMIC_YEAR,
    archived: false,
  },
  {
    id: "13cs",
    name: "Year 13 Computer Science",
    shortCode: "13CS",
    subject: "Computer Science",
    yearLevel: "13",
    room: "DT2",
    colour: "#147a86",
    academicYear: CLASS_ACADEMIC_YEAR,
    archived: true,
  },
];

export function getClassColourOption(colour) {
  return (
    classColourOptions.find((option) => option.value === colour) ??
    classColourOptions[0]
  );
}
