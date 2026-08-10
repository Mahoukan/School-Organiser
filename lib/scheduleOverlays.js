import {
  getCancellationReasonLabel,
  getEffectiveLessonStatus,
} from "./lessonOccurrences.js";

export const CALENDAR_EXCEPTION_TYPES = [
  { value: "public-holiday", label: "Public holiday", reason: "public-holiday" },
  { value: "school-closed", label: "School closed", reason: "class-cancelled" },
  { value: "teacher-only-day", label: "Teacher-only day", reason: "school-event" },
  { value: "exam-day", label: "Exam day", reason: "exam" },
  { value: "school-event", label: "School event", reason: "school-event" },
  { value: "other", label: "Other", reason: "other" },
];

export function isDateInRange(dateKey, record) {
  return dateKey >= record.startDate && dateKey <= record.endDate;
}

export function getExceptionTypeLabel(type) {
  return CALENDAR_EXCEPTION_TYPES.find((option) => option.value === type)?.label;
}

export function getEffectiveCancellation({
  dateKey,
  classId,
  occurrence,
  teacherAbsences,
  classAbsences,
  calendarExceptions,
}) {
  if (getEffectiveLessonStatus(occurrence) === "cancelled") {
    return {
      isCancelled: true,
      isOverlay: false,
      source: "manual",
      reason: occurrence.cancellationReason,
      reasonLabel: getCancellationReasonLabel(occurrence.cancellationReason),
      note: occurrence.cancellationNote ?? "",
    };
  }

  const exception = calendarExceptions.find((record) => isDateInRange(dateKey, record));
  if (exception) {
    const option = CALENDAR_EXCEPTION_TYPES.find((item) => item.value === exception.type);
    return { isCancelled: true, isOverlay: true, source: "calendar-exception", sourceId: exception.id, reason: option.reason, reasonLabel: getCancellationReasonLabel(option.reason), note: exception.note, sourceLabel: option.label };
  }

  const teacherAbsence = teacherAbsences.find((record) => isDateInRange(dateKey, record));
  if (teacherAbsence) return { isCancelled: true, isOverlay: true, source: "teacher-absence", sourceId: teacherAbsence.id, reason: "teacher-away", reasonLabel: "Teacher away", note: teacherAbsence.note, sourceLabel: "Teacher absence" };

  const classAbsence = classAbsences.find((record) => record.classIds.includes(classId) && isDateInRange(dateKey, record));
  if (classAbsence) return { isCancelled: true, isOverlay: true, source: "class-absence", sourceId: classAbsence.id, reason: "students-away", reasonLabel: "Students away", note: classAbsence.reason, sourceLabel: "Class absence" };

  return { isCancelled: false, isOverlay: false };
}

export function validateDateRange(values, academicYear) {
  const errors = {};
  if (!values.startDate) errors.startDate = "Choose a start date.";
  if (!values.endDate) errors.endDate = "Choose an end date.";
  if (values.startDate && values.endDate && values.startDate > values.endDate) errors.endDate = "End date must be on or after the start date.";
  if (values.startDate && !values.startDate.startsWith(String(academicYear.year))) errors.startDate = `Choose a date in ${academicYear.year}.`;
  if (values.endDate && !values.endDate.startsWith(String(academicYear.year))) errors.endDate = `Choose a date in ${academicYear.year}.`;
  return errors;
}

export function validateTeacherAbsence(values, academicYear) {
  const errors = validateDateRange(values, academicYear);
  if ((values.note ?? "").length > 200) errors.note = "Note must be 200 characters or fewer.";
  return errors;
}

export function validateClassAbsence(values, academicYear) {
  const errors = validateDateRange(values, academicYear);
  if (!values.classIds?.length) errors.classIds = "Select at least one class.";
  if (!values.reason?.trim()) errors.reason = "Enter a reason.";
  else if (values.reason.length > 200) errors.reason = "Reason must be 200 characters or fewer.";
  return errors;
}

export function validateCalendarException(values, academicYear) {
  const errors = validateDateRange(values, academicYear);
  if (!CALENDAR_EXCEPTION_TYPES.some((item) => item.value === values.type)) errors.type = "Choose an exception type.";
  if (values.type === "other" && !values.note?.trim()) errors.note = "Enter a note for Other.";
  else if ((values.note ?? "").length > 200) errors.note = "Note must be 200 characters or fewer.";
  return errors;
}
