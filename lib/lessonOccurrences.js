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

export function getEffectiveLessonStatus(occurrence) {
  return validStatuses.has(occurrence?.status) ? occurrence.status : "planned";
}

export function getLessonStatusLabel(status) {
  return (
    LESSON_STATUSES.find((option) => option.value === status)?.label ?? "Planned"
  );
}

export function getCancellationReasonLabel(reason) {
  return CANCELLATION_REASONS.find((option) => option.value === reason)?.label;
}

export function normalizeLessonContent({
  title,
  summary,
  plan,
  status,
  cancellationReason,
  cancellationNote,
}) {
  const normalizedStatus = validStatuses.has(status) ? status : "planned";
  const isCancelled = normalizedStatus === "cancelled";

  return {
    title: (title ?? "").trim(),
    summary: (summary ?? "").trim(),
    plan: (plan ?? "").replace(/\r\n?/g, "\n"),
    status: normalizedStatus,
    cancellationReason:
      isCancelled && validCancellationReasons.has(cancellationReason)
        ? cancellationReason
        : "",
    cancellationNote: isCancelled ? (cancellationNote ?? "").trim() : "",
  };
}

export function hasLessonPlanContent({ title, summary, plan }) {
  return Boolean(title || summary || plan.trim());
}

export function hasLessonContent(content) {
  return (
    hasLessonPlanContent(content) ||
    getEffectiveLessonStatus(content) !== "planned" ||
    Boolean(content.cancellationReason || content.cancellationNote)
  );
}
export const LESSON_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Completed" },
  { value: "partially-completed", label: "Partially Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const CANCELLATION_REASONS = [
  { value: "teacher-away", label: "Teacher away" },
  { value: "students-away", label: "Students away" },
  { value: "school-event", label: "School event" },
  { value: "exam", label: "Exam" },
  { value: "public-holiday", label: "Public holiday" },
  { value: "class-cancelled", label: "Class cancelled" },
  { value: "other", label: "Other" },
];

const validStatuses = new Set(LESSON_STATUSES.map(({ value }) => value));
const validCancellationReasons = new Set(
  CANCELLATION_REASONS.map(({ value }) => value),
);
