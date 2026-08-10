import {
  getSampleEntry,
  periods,
  weekdays,
} from "../../data/sampleTimetable";
import {
  formatDayHeading,
  getWeekType,
  isWeekend,
} from "../../lib/timetableDates";
import TimetableCard from "./TimetableCard";
import styles from "./timetable.module.css";

export default function DayTimetable({ date, compact = false, showHeading = true }) {
  const weekType = getWeekType(date);

  if (isWeekend(date)) {
    return (
      <section className={styles.dayPanel}>
        {showHeading && (
          <div className={styles.dayHeading}>
            <h2>{formatDayHeading(date)}</h2>
            <span className={styles.cycleBadge}>Week {weekType}</span>
          </div>
        )}
        <div className={styles.emptyDay}>
          <p>No school timetable for this day.</p>
        </div>
      </section>
    );
  }

  const weekday = weekdays[date.getDay() - 1];

  return (
    <section className={styles.dayPanel}>
      {showHeading && (
        <div className={styles.dayHeading}>
          <h2>{formatDayHeading(date)}</h2>
          <span className={styles.cycleBadge}>Week {weekType}</span>
        </div>
      )}

      <div className={styles.daySchedule}>
        {periods.map((period) => {
          const entry = getSampleEntry(weekType, weekday.key, period);
          const isBreak = period.type === "break";

          return (
            <div
              key={period.id}
              className={`${styles.dayRow} ${isBreak ? styles.dayBreakRow : ""}`}
            >
              <div className={styles.periodMeta}>
                <span className={styles.periodLabel}>{period.label}</span>
                <span className={styles.periodTime}>
                  {period.start}–{period.end}
                </span>
              </div>
              <TimetableCard
                entry={entry}
                detail={compact ? "fortnight" : "day"}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
