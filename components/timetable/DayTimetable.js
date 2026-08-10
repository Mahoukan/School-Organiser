import {
  periods,
  weekdays,
} from "../../data/sampleTimetable";
import {
  formatDayHeading,
  isWeekend,
} from "../../lib/timetableDates";
import { getTeachingWeekForDate } from "../../lib/academicCalendar";
import { getTimetableEntry } from "../../lib/recurringTimetable";
import { useSchoolData } from "../providers/SchoolDataProvider";
import TimetableCard from "./TimetableCard";
import styles from "./timetable.module.css";

export default function DayTimetable({
  date,
  compact = false,
  showHeading = true,
  onOpenLesson,
}) {
  const { recurringAssignments, teachingWeeks } = useSchoolData();
  const teachingWeek = getTeachingWeekForDate(date, teachingWeeks);

  if (isWeekend(date)) {
    return (
      <section className={styles.dayPanel}>
        {showHeading && (
          <div className={styles.dayHeading}>
            <h2>{formatDayHeading(date)}</h2>
          </div>
        )}
        <div className={styles.emptyDay}>
          <p>No school timetable for this day.</p>
        </div>
      </section>
    );
  }

  if (!teachingWeek) {
    return (
      <section className={styles.dayPanel}>
        {showHeading && <div className={styles.dayHeading}><h2>{formatDayHeading(date)}</h2><span className={styles.cycleBadge}>No teaching week</span></div>}
        <div className={styles.emptyDay}><p>No teaching week is configured for this date.</p></div>
      </section>
    );
  }

  const weekday = weekdays[date.getDay() - 1];

  return (
    <section className={styles.dayPanel}>
      {showHeading && (
        <div className={styles.dayHeading}>
          <h2>{formatDayHeading(date)}</h2>
          <span className={styles.cycleBadge}>Week {teachingWeek.cycleWeek}</span>
        </div>
      )}

      <div className={styles.daySchedule}>
        {periods.map((period) => {
          const entry = getTimetableEntry(
            recurringAssignments,
            teachingWeek.cycleWeek,
            weekday.key,
            period,
          );
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
                date={date}
                period={period}
                onOpenLesson={onOpenLesson}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
