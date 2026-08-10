export function normalizeBlockName(value) {
  return value.trim().toLowerCase();
}

export function validateDayTemplateName(values, templates, editingId) {
  const errors = {};
  const name = values.name?.trim() ?? "";
  if (!name) errors.name = "Enter a template name.";
  else if (name.length > 80) errors.name = "Template name must be 80 characters or fewer.";
  else if (templates.some((template) => template.id !== editingId && normalizeBlockName(template.name) === normalizeBlockName(name))) errors.name = "Template names must be unique.";
  return errors;
}

export function validateTemplateBlock(values, blocks, templateId, editingId) {
  const errors = {};
  const name = values.name?.trim() ?? "";
  if (!name) errors.name = "Enter a block name.";
  else if (name.length > 40) errors.name = "Block name must be 40 characters or fewer.";
  if (!values.startTime) errors.startTime = "Choose a start time.";
  if (!values.endTime) errors.endTime = "Choose an end time.";
  if (values.startTime && values.endTime && values.startTime >= values.endTime) errors.endTime = "End time must be later than start time.";
  const peers = blocks.filter((block) => block.templateId === templateId && block.id !== editingId);
  if (peers.some((block) => normalizeBlockName(block.name) === normalizeBlockName(name))) errors.name = "Block names must be unique within this template.";
  if (values.startTime && values.endTime && peers.some((block) => values.startTime < block.endTime && values.endTime > block.startTime)) errors.timeRange = "This time overlaps another block in the template.";
  if (typeof values.isTeaching !== "boolean") errors.isTeaching = "Choose a block type.";
  return errors;
}

export function previewDayTemplateAssignment(currentSlots, targetBlocks) {
  const targets = new Map(targetBlocks.map((block) => [normalizeBlockName(block.name), block]));
  const preserved = currentSlots.filter((slot) => targets.has(normalizeBlockName(slot.name))).map((slot) => slot.name);
  const existingNames = new Set(currentSlots.map((slot) => normalizeBlockName(slot.name)));
  const added = targetBlocks.filter((block) => !existingNames.has(normalizeBlockName(block.name))).map((block) => block.name);
  const removed = currentSlots.filter((slot) => !targets.has(normalizeBlockName(slot.name))).map((slot) => slot.name);
  return { preserved, added, removed };
}
