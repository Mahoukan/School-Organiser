import { weekdays } from "../../data/sampleTimetable";
import {
  addDays,
  formatDayHeading,
  getWeekType,
} from "../../lib/timetableDates";
import DayTimetable from "./DayTimetable";
import styles from "./timetable.module.css";

export default function MobileWeek({
  monday,
  selectedWeekday,
  onSelectWeekday,
  compact = false,
  onOpenLesson,
}) {
  const selectedDate = addDays(monday, selectedWeekday);
  const weekType = getWeekType(monday);

  return (
    <section className={styles.mobileWeek} aria-label={`Week ${weekType}`}>
      <div className={styles.mobileWeekHeading}>
        <h2>Week {weekType}</h2>
        <span>{formatDayHeading(selectedDate)}</span>
      </div>
      <div className={styles.weekdaySelector} aria-label={`Week ${weekType} day`}>
        {weekdays.map((weekday, index) => (
          <button
            key={weekday.key}
            type="button"
            aria-pressed={selectedWeekday === index}
            onClick={() => onSelectWeekday(index)}
          >
            <span>{weekday.shortLabel}</span>
            <span>{addDays(monday, index).getDate()}</span>
          </button>
        ))}
      </div>
      <DayTimetable
        date={selectedDate}
        compact={compact}
        showHeading={false}
        onOpenLesson={onOpenLesson}
      />
    </section>
  );
}
