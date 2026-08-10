import { weekdays } from "../../data/sampleTimetable";
import {
  addDays,
  formatDayHeading,
  isSameDate,
  toDateOnly,
} from "../../lib/timetableDates";
import { getTeachingWeekForDate } from "../../lib/academicCalendar";
import { useSchoolData } from "../providers/SchoolDataProvider";
import DayTimetable from "./DayTimetable";
import styles from "./timetable.module.css";

export default function MobileWeek({
  monday,
  selectedWeekday,
  onSelectWeekday,
  compact = false,
  onOpenLesson,
  onOpenEvent,
}) {
  const selectedDate = addDays(monday, selectedWeekday);
  const { teachingWeeks } = useSchoolData();
  const weekType = getTeachingWeekForDate(monday, teachingWeeks)?.cycleWeek;

  return (
    <section className={styles.mobileWeek} aria-label={weekType ? `Week ${weekType}` : "No teaching week"}>
      <div className={styles.mobileWeekHeading}>
        <h2>{weekType ? `Week ${weekType}` : "No teaching week"}</h2>
        <span>{formatDayHeading(selectedDate)}</span>
      </div>
      <div className={styles.weekdaySelector} aria-label="Choose day">
        {weekdays.map((weekday, index) => (
          <button
            key={weekday.key}
            type="button"
            aria-pressed={selectedWeekday === index}
            onClick={() => onSelectWeekday(index, addDays(monday, index))}
          >
            <span>{weekday.shortLabel}</span>
            <span>{addDays(monday, index).getDate()}</span>
            {isSameDate(addDays(monday, index), toDateOnly(new Date())) && <span className={styles.todayMarker}>Today</span>}
          </button>
        ))}
      </div>
      <DayTimetable
        date={selectedDate}
        compact={compact}
        showHeading={false}
        onOpenLesson={onOpenLesson}
        onOpenEvent={onOpenEvent}
      />
    </section>
  );
}
