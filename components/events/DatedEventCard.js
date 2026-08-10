import { formatBlockTime } from "../../lib/periodStructures";
import { getRecurringEventColour, getRecurringEventTypeLabel } from "../../lib/recurringEvents";
import styles from "./events.module.css";

export default function DatedEventCard({ event, onSelect, compact = false }) {
  const colour = getRecurringEventColour(event.colour);
  const content = <><span className={styles.eventTime}>{formatBlockTime(event.startTime)}–{formatBlockTime(event.endTime)}</span><strong>{event.title}</strong><span>{getRecurringEventTypeLabel(event.type)}{event.location ? ` · ${event.location}` : ""}</span>{!compact && event.detail && <small>{event.detail}</small>}</>;
  const style = { "--event-bg": colour.background, "--event-border": colour.border, "--event-text": colour.text };
  return onSelect ? <button type="button" className={`${styles.card} ${compact ? styles.compact : ""}`} style={style} onClick={(e) => onSelect(event, e.currentTarget)} aria-label={`Edit ${event.title}, ${formatBlockTime(event.startTime)} to ${formatBlockTime(event.endTime)}`}>{content}</button> : <article className={`${styles.card} ${compact ? styles.compact : ""}`} style={style}>{content}</article>;
}
