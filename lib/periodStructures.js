export function getBlocksForDay(blocks, cycleWeek, weekday) {
  return blocks
    .filter((block) => block.cycleWeek === cycleWeek && block.weekday === weekday)
    .sort((first, second) => first.displayOrder - second.displayOrder);
}

export function getTeachingBlocksForDay(blocks, cycleWeek, weekday) {
  return getBlocksForDay(blocks, cycleWeek, weekday).filter((block) => block.isTeaching);
}

export function resolveTimetableBlock(blocks, blockId) {
  return blocks.find((block) => block.id === blockId);
}

export function formatBlockTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")}${suffix}`;
}

export function validateTimetableBlock(values, blocks, editingId) {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Enter a block name.";
  else if (name.length > 40) errors.name = "Block name must be 40 characters or fewer.";
  if (!values.startTime) errors.startTime = "Choose a start time.";
  if (!values.endTime) errors.endTime = "Choose an end time.";
  if (values.startTime && values.endTime && values.startTime >= values.endTime) errors.endTime = "End time must be later than start time.";
  const peers = blocks.filter((block) => block.cycleWeek === values.cycleWeek && block.weekday === values.weekday && block.id !== editingId);
  if (peers.some((block) => block.name.toLowerCase() === name.toLowerCase())) errors.name = "Block names must be unique within this day.";
  if (values.startTime && values.endTime && peers.some((block) => values.startTime < block.endTime && values.endTime > block.startTime)) errors.timeRange = "This time overlaps another block in the same day.";
  return errors;
}

export function normalizeDisplayOrders(blocks, cycleWeek, weekday) {
  const orderedIds = getBlocksForDay(blocks, cycleWeek, weekday).map((block) => block.id);
  return blocks.map((block) => {
    const index = orderedIds.indexOf(block.id);
    return index < 0 ? block : { ...block, displayOrder: index + 1 };
  });
}

export function moveTimetableBlock(blocks, blockId, direction) {
  const block = resolveTimetableBlock(blocks, blockId);
  if (!block) return blocks;
  const dayBlocks = getBlocksForDay(blocks, block.cycleWeek, block.weekday);
  const index = dayBlocks.findIndex((item) => item.id === blockId);
  const target = index + direction;
  if (target < 0 || target >= dayBlocks.length) return blocks;
  const other = dayBlocks[target];
  return blocks.map((item) => item.id === block.id ? { ...item, displayOrder: other.displayOrder } : item.id === other.id ? { ...item, displayOrder: block.displayOrder } : item);
}
