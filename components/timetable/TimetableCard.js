import {
  getClassColourOption,
} from "../../data/sampleClasses";
import {
  findLessonOccurrence,
  getDateKey,
  getEffectiveLessonStatus,
  getLessonStatusLabel,
} from "../../lib/lessonOccurrences";
import { formatDayHeading } from "../../lib/timetableDates";
import { getEffectiveCancellation } from "../../lib/scheduleOverlays";
import { getRecurringEventColour, getRecurringEventTypeLabel } from "../../lib/recurringEvents";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./timetable.module.css";

export default function TimetableCard({
  entry,
  detail = "week",
  date,
  period,
  onOpenLesson,
}) {
  const {
    classes,
    lessonOccurrences,
    teacherAbsences,
    classAbsences,
    calendarExceptions,
    timetableBlocks,
  } = useSchoolData();
  const compact = detail === "fortnight";

  if (entry.type === "free") {
    return (
      <div className={`${styles.entryCard} ${styles.freeCard}`}>
        <span className={styles.freeLabel}>Free</span>
      </div>
    );
  }

  if (entry.type === "event") {
    const eventColour = getRecurringEventColour(entry.event.colour);
    return (
      <div className={`${styles.entryCard} ${styles.eventCard}`} style={{ "--event-background": eventColour.background, "--event-border": eventColour.border, "--event-text": eventColour.text }}>
        <span className={styles.entryCode}>{compact ? getRecurringEventTypeLabel(entry.event.type) : entry.event.title}</span>
        {!compact && <span className={styles.eventType}>{getRecurringEventTypeLabel(entry.event.type)} · Non-class item</span>}
        {!compact && entry.event.detail && <span className={styles.entryRoom}>{entry.event.detail}</span>}
      </div>
    );
  }

  if (entry.type === "break") {
    return (
      <div className={`${styles.entryCard} ${styles.breakCard}`}>
        <span>{entry.label}</span>
      </div>
    );
  }

  const classDetails = classes.find((classItem) => classItem.id === entry.classId);
  if (!classDetails || classDetails.archived) {
    return (
      <div className={`${styles.entryCard} ${styles.freeCard}`}>
        <span className={styles.freeLabel}>Free</span>
      </div>
    );
  }
  const colourDetails = getClassColourOption(classDetails.colour);
  const dateKey = getDateKey(date);
  const occurrence = findLessonOccurrence(
    lessonOccurrences,
    dateKey,
    entry.recurringAssignmentId,
  );
  const cancellation = getEffectiveCancellation({
    dateKey,
    classId: entry.classId,
    occurrence,
    teacherAbsences,
    classAbsences,
    calendarExceptions,
  });
  const status = cancellation.isCancelled
    ? "cancelled"
    : getEffectiveLessonStatus(occurrence);
  const statusLabel = getLessonStatusLabel(status);
  const weekPreview = occurrence?.title || occurrence?.summary;

  function openLesson(event) {
    onOpenLesson?.(
      {
        date: dateKey,
        recurringAssignmentId: entry.recurringAssignmentId,
        classId: entry.classId,
        periodId: period.id,
      },
      event.currentTarget,
    );
  }

  return (
    <button
      type="button"
      className={`${styles.entryCard} ${styles.classCard} ${styles[`classCard-${status}`]}`}
      aria-label={`${classDetails.shortCode} on ${formatDayHeading(date)}, ${period.name}. Status: ${statusLabel}. Open lesson details.`}
      onClick={openLesson}
      style={{
        "--class-background": colourDetails.background,
        "--class-border": colourDetails.border,
        "--class-text": colourDetails.text,
      }}
    >
      <span className={styles.entryCode}>{classDetails.shortCode}</span>
      {status !== "planned" && (!compact || status === "cancelled") && (
        <span className={styles.statusMarker}>{statusLabel}</span>
      )}
      {entry.movedFromPeriodId && detail !== "fortnight" && (
        <span className={styles.movedMarker}>
          {detail === "day"
            ? `Moved from ${timetableBlocks.find((block) => block.id === entry.movedFromPeriodId)?.name ?? "original block"}`
            : "Moved"}
        </span>
      )}
      {detail === "day" && status === "cancelled" && (
        <span className={styles.cancellationReason}>
          {cancellation.reasonLabel}
          {cancellation.note ? ` — ${cancellation.note}` : ""}
        </span>
      )}
      {detail === "day" && (
        <span className={styles.entryName}>{classDetails.name}</span>
      )}
      {detail === "day" && occurrence?.title && (
        <span className={styles.lessonTitle}>{occurrence.title}</span>
      )}
      {detail === "day" && occurrence?.summary && (
        <span className={styles.lessonSummary}>{occurrence.summary}</span>
      )}
      {detail === "week" && weekPreview && (
        <span className={styles.lessonPreview}>{weekPreview}</span>
      )}
      {classDetails.room && (
        <span className={styles.entryRoom}>Room {classDetails.room}</span>
      )}
    </button>
  );
}
