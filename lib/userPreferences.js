export const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export const ACCENT_COLOURS = [
  { value: "blue", label: "Blue" },
  { value: "indigo", label: "Indigo" },
  { value: "purple", label: "Purple" },
  { value: "teal", label: "Teal" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "rose", label: "Rose" },
];

export const DENSITIES = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

export const SCHEDULE_DISPLAY_MODES = [
  { value: "all", label: "All" },
  { value: "free", label: "Free only" },
  { value: "classes-events", label: "Classes & events" },
  { value: "classes", label: "Classes only" },
];

export const DEFAULT_USER_PREFERENCES = Object.freeze({
  theme: "system",
  accentColour: "blue",
  density: "comfortable",
  scheduleDisplayMode: "all",
});

const allowedValues = {
  theme: new Set(THEMES.map((option) => option.value)),
  accentColour: new Set(ACCENT_COLOURS.map((option) => option.value)),
  density: new Set(DENSITIES.map((option) => option.value)),
  scheduleDisplayMode: new Set(SCHEDULE_DISPLAY_MODES.map((option) => option.value)),
};

export function normalizeUserPreferences(value = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_USER_PREFERENCES).map(([key, fallback]) => [
    key,
    allowedValues[key].has(value?.[key]) ? value[key] : fallback,
  ]));
}

export function validatePreferencePatch(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { form: "User preferences must be an object." };
  const keys = Object.keys(value);
  if (!keys.length) return { form: "Choose a preference to update." };
  const unknownKey = keys.find((key) => !allowedValues[key]);
  if (unknownKey) return { form: "Only theme, accent colour, density, and schedule display mode can be updated." };
  const invalidKey = keys.find((key) => !allowedValues[key].has(value[key]));
  const labels = { accentColour: "accent colour", scheduleDisplayMode: "schedule display mode" };
  return invalidKey ? { [invalidKey]: `Unsupported ${labels[invalidKey] ?? invalidKey}.` } : {};
}
