export function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateFromKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function getLessonOccurrenceId(dateKey, recurringAssignmentId) {
  return `lesson-${dateKey}-${recurringAssignmentId}`;
}

export function findLessonOccurrence(
  lessonOccurrences,
  dateKey,
  recurringAssignmentId,
) {
  const occurrenceId = getLessonOccurrenceId(dateKey, recurringAssignmentId);
  return lessonOccurrences.find((occurrence) => occurrence.id === occurrenceId);
}

export function normalizeLessonContent({ title, summary, plan }) {
  return {
    title: title.trim(),
    summary: summary.trim(),
    plan: plan.replace(/\r\n?/g, "\n"),
  };
}

export function hasLessonContent({ title, summary, plan }) {
  return Boolean(title || summary || plan.trim());
}
