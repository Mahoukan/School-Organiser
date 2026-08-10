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

export const DEFAULT_USER_PREFERENCES = Object.freeze({
  theme: "system",
  accentColour: "blue",
  density: "comfortable",
});

const allowedValues = {
  theme: new Set(THEMES.map((option) => option.value)),
  accentColour: new Set(ACCENT_COLOURS.map((option) => option.value)),
  density: new Set(DENSITIES.map((option) => option.value)),
};

export function normalizeUserPreferences(value = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_USER_PREFERENCES).map(([key, fallback]) => [
    key,
    allowedValues[key].has(value?.[key]) ? value[key] : fallback,
  ]));
}

export function validatePreferencePatch(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { form: "Appearance preferences must be an object." };
  const keys = Object.keys(value);
  if (!keys.length) return { form: "Choose an appearance preference to update." };
  const unknownKey = keys.find((key) => !allowedValues[key]);
  if (unknownKey) return { form: "Only theme, accent colour, and density can be updated." };
  const invalidKey = keys.find((key) => !allowedValues[key].has(value[key]));
  return invalidKey ? { [invalidKey]: `Unsupported ${invalidKey === "accentColour" ? "accent colour" : invalidKey}.` } : {};
}
