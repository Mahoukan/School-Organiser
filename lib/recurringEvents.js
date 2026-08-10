export const RECURRING_EVENT_TYPES = [
  { value: "duty", label: "Duty", colour: "#a85d20" },
  { value: "meeting", label: "Meeting", colour: "#6b4bb6" },
  { value: "assembly", label: "Assembly", colour: "#3157c8" },
  { value: "tutor-form", label: "Tutor/Form", colour: "#147a86" },
  { value: "club", label: "Club", colour: "#2e7d58" },
  { value: "appointment", label: "Appointment", colour: "#a34363" },
  { value: "other", label: "Other", colour: "#647084" },
];

export const RECURRING_EVENT_COLOURS = [
  { value: "#a85d20", label: "Amber", background: "#f7e6d6", border: "#dda978", text: "#704018" },
  { value: "#6b4bb6", label: "Purple", background: "#e5def8", border: "#b7a4e2", text: "#493279" },
  { value: "#3157c8", label: "Blue", background: "#dce8ff", border: "#99b8f4", text: "#173a72" },
  { value: "#147a86", label: "Teal", background: "#d8eef0", border: "#8fc6cb", text: "#18545a" },
  { value: "#2e7d58", label: "Green", background: "#d9efe4", border: "#91c9ab", text: "#1f5b3f" },
  { value: "#a34363", label: "Rose", background: "#f5dfe7", border: "#d9a0b4", text: "#6f2d45" },
  { value: "#647084", label: "Slate", background: "#e8ebf0", border: "#bcc4cf", text: "#3f4959" },
];

export function getRecurringEventForBlock(events = [], cycleWeek, weekday, periodId) {
  return events.find((event) => event.cycleWeek === cycleWeek && event.weekday === weekday && event.periodId === periodId);
}

export function getRecurringOccupantForBlock({ recurringAssignments, recurringEvents, cycleWeek, weekday, periodId }) {
  const assignment = recurringAssignments.find((item) => item.cycleWeek === cycleWeek && item.weekday === weekday && item.periodId === periodId);
  if (assignment) return { type: "class", assignment };
  const event = getRecurringEventForBlock(recurringEvents, cycleWeek, weekday, periodId);
  return event ? { type: "event", event } : null;
}

export function validateRecurringEvent(values, timetableBlocks, recurringAssignments, recurringEvents) {
  const errors = {};
  if (!RECURRING_EVENT_TYPES.some((item) => item.value === values.type)) errors.type = "Choose an item type.";
  if (!values.title?.trim()) errors.title = "Enter a title.";
  else if (values.title.length > 100) errors.title = "Title must be 100 characters or fewer.";
  if ((values.detail ?? "").length > 160) errors.detail = "Detail must be 160 characters or fewer.";
  if (!RECURRING_EVENT_COLOURS.some((item) => item.value === values.colour)) errors.colour = "Choose a colour.";
  const block = timetableBlocks.find((item) => item.id === values.periodId);
  if (!block || block.cycleWeek !== values.cycleWeek || block.weekday !== values.weekday) errors.periodId = "The selected timetable block is invalid.";
  const occupiedByClass = recurringAssignments.some((item) => item.cycleWeek === values.cycleWeek && item.weekday === values.weekday && item.periodId === values.periodId);
  const occupiedByEvent = recurringEvents.some((item) => item.id !== values.id && item.cycleWeek === values.cycleWeek && item.weekday === values.weekday && item.periodId === values.periodId);
  if (occupiedByClass || occupiedByEvent) errors.periodId = "That timetable block is already occupied.";
  return errors;
}

export function getRecurringEventColour(colour) {
  return RECURRING_EVENT_COLOURS.find((item) => item.value === colour) ?? RECURRING_EVENT_COLOURS.at(-1);
}

export function getRecurringEventTypeLabel(type) {
  return RECURRING_EVENT_TYPES.find((item) => item.value === type)?.label ?? "Other";
}
