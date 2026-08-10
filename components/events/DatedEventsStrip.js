import { getDateKey } from "../../lib/lessonOccurrences";
import DatedEventCard from "./DatedEventCard";
import styles from "./events.module.css";

export default function DatedEventsStrip({ events, date, onSelect, compact = false, title = "One-Off Events" }) {
  const dateKey = typeof date === "string" ? date : getDateKey(date);
  const matches = events.filter((item) => item.date === dateKey).sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (!matches.length) return null;
  return <section className={`${styles.strip} ${compact ? styles.stripCompact : ""}`} aria-label={`${title} for this date`}><strong>{title}</strong><div>{matches.map((event) => <DatedEventCard key={event.id} event={event} onSelect={onSelect} compact={compact} />)}</div></section>;
}
