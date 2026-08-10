import { formatCalendarDate } from "../../lib/academicCalendar";
import { getLessonStatusLabel } from "../../lib/lessonOccurrences";
import { formatBlockTime } from "../../lib/periodStructures";
import styles from "./class-history.module.css";

export default function ClassHistoryCard({ entry, onOpen }) {
  const lesson = entry.occurrence;
  return <button type="button" className={styles.historyCard} onClick={(event) => onOpen(entry, event.currentTarget)} aria-label={`Open ${formatCalendarDate(entry.date, { weekday: "long", year: "numeric" })}, ${entry.effectivePeriod.name}. Status: ${getLessonStatusLabel(entry.status)}.`}>
    <div className={styles.cardTopline}>
      <div><strong>{formatCalendarDate(entry.date, { weekday: "long", year: "numeric" })}</strong><span>{entry.effectivePeriod.name} · {formatBlockTime(entry.effectivePeriod.startTime)}–{formatBlockTime(entry.effectivePeriod.endTime)}</span></div>
      <span className={`${styles.statusBadge} ${styles[`status-${entry.status}`]}`}>{getLessonStatusLabel(entry.status)}</span>
    </div>
    {entry.movement && <span className={styles.movedLabel}>Moved from {entry.originalPeriod.name}</span>}
    <div className={styles.lessonPreview}>
      <strong>{lesson?.title || "No lesson title"}</strong>
      {lesson?.summary ? <p>{lesson.summary}</p> : <p>No lesson plan</p>}
      {lesson?.plan?.trim() && <small>Lesson plan added</small>}
    </div>
    {entry.cancellation.isCancelled && <div className={styles.cancellation}><strong>{entry.cancellation.reasonLabel}</strong>{entry.cancellation.note && <span>{entry.cancellation.note}</span>}</div>}
  </button>;
}
