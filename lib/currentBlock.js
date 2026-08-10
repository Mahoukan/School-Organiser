export function getCurrentBlockState(blocks, now) {
  if (!blocks.length) return { state: "empty", block: null };
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const current = blocks.find((item) => time >= item.period.startTime && time < item.period.endTime);
  if (current) return { state: "current", block: current };
  const next = blocks.find((item) => time < item.period.startTime);
  return next ? { state: "next", block: next } : { state: "finished", block: null };
}
