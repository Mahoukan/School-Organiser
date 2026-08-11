export const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export const ACCENT_COLOURS = [
  { value: "blue", label: "Blue" },
  { value: "sky", label: "Sky" },
  { value: "cyan", label: "Cyan" },
  { value: "teal", label: "Teal" },
  { value: "emerald", label: "Emerald" },
  { value: "green", label: "Green" },
  { value: "lime", label: "Lime" },
  { value: "amber", label: "Amber" },
  { value: "orange", label: "Orange" },
  { value: "rose", label: "Rose" },
  { value: "pink", label: "Pink" },
  { value: "fuchsia", label: "Fuchsia" },
  { value: "purple", label: "Purple" },
  { value: "violet", label: "Violet" },
  { value: "indigo", label: "Indigo" },
];

export const HIGHLIGHT_COLOURS = [
  { value: "same", label: "Same as primary" },
  ...ACCENT_COLOURS,
];

export const NEUTRAL_TONES = [
  { value: "cool", label: "Cool" },
  { value: "neutral", label: "Neutral" },
  { value: "warm", label: "Warm" },
];

export const INTERFACE_FONTS = [
  { value: "system", label: "System" },
  { value: "inter", label: "Inter" },
  { value: "source-sans-3", label: "Source Sans 3" },
  { value: "open-sans", label: "Open Sans" },
  { value: "nunito-sans", label: "Nunito Sans" },
  { value: "roboto", label: "Roboto" },
  { value: "lato", label: "Lato" },
];

export const HEADING_FONTS = [
  { value: "same", label: "Same as interface" },
  { value: "inter", label: "Inter" },
  { value: "source-sans-3", label: "Source Sans 3" },
  { value: "nunito-sans", label: "Nunito Sans" },
  { value: "lora", label: "Lora" },
  { value: "merriweather", label: "Merriweather" },
  { value: "roboto-slab", label: "Roboto Slab" },
];

export const CONTENT_FONTS = [
  { value: "same", label: "Same as interface" },
  { value: "inter", label: "Inter" },
  { value: "source-sans-3", label: "Source Sans 3" },
  { value: "open-sans", label: "Open Sans" },
  { value: "lora", label: "Lora" },
  { value: "merriweather", label: "Merriweather" },
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
  highlightColour: "same",
  neutralTone: "cool",
  interfaceFont: "system",
  headingFont: "same",
  contentFont: "same",
  density: "comfortable",
  scheduleDisplayMode: "all",
});

const allowedValues = {
  theme: new Set(THEMES.map((option) => option.value)),
  accentColour: new Set(ACCENT_COLOURS.map((option) => option.value)),
  highlightColour: new Set(HIGHLIGHT_COLOURS.map((option) => option.value)),
  neutralTone: new Set(NEUTRAL_TONES.map((option) => option.value)),
  interfaceFont: new Set(INTERFACE_FONTS.map((option) => option.value)),
  headingFont: new Set(HEADING_FONTS.map((option) => option.value)),
  contentFont: new Set(CONTENT_FONTS.map((option) => option.value)),
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
  if (unknownKey) return { form: "Only supported appearance and schedule display preferences can be updated." };
  const invalidKey = keys.find((key) => !allowedValues[key].has(value[key]));
  const labels = { accentColour: "primary colour", highlightColour: "highlight colour", neutralTone: "neutral tone", interfaceFont: "interface font", headingFont: "heading font", contentFont: "lesson font", scheduleDisplayMode: "schedule display mode" };
  return invalidKey ? { [invalidKey]: `Unsupported ${labels[invalidKey] ?? invalidKey}.` } : {};
}
