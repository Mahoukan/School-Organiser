const visibleEntryTypes = {
  all: new Set(["class", "event", "free", "break"]),
  free: new Set(["free"]),
  "classes-events": new Set(["class", "event"]),
  classes: new Set(["class"]),
};

function getEntry(item) {
  return item?.entry ?? item;
}

export function isScheduleItemVisible(item, scheduleDisplayMode = "all") {
  if (scheduleDisplayMode === "all" || !visibleEntryTypes[scheduleDisplayMode]) return true;
  const allowedTypes = visibleEntryTypes[scheduleDisplayMode];
  return allowedTypes.has(getEntry(item)?.type);
}

export function filterScheduleItems(items, scheduleDisplayMode = "all") {
  return items.filter((item) => isScheduleItemVisible(item, scheduleDisplayMode));
}

export function shouldShowDatedEvents(scheduleDisplayMode = "all") {
  return scheduleDisplayMode === "all" || scheduleDisplayMode === "classes-events";
}

export function getScheduleFilterEmptyMessage(scheduleDisplayMode, today = false) {
  const suffix = today ? "today" : "on this day";
  if (scheduleDisplayMode === "free") return `No free teaching periods ${suffix}.`;
  if (scheduleDisplayMode === "classes") return `No classes ${suffix}.`;
  if (scheduleDisplayMode === "classes-events") return `No classes or events ${suffix}.`;
  return `No schedule items ${suffix}.`;
}
