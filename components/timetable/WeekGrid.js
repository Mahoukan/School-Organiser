import {
  periods,
  weekdays,
} from "../../data/sampleTimetable";
import { addDays, getWeekType } from "../../lib/timetableDates";
import { getTimetableEntry } from "../../lib/recurringTimetable";
import { useSchoolData } from "../providers/SchoolDataProvider";
import TimetableCard from "./TimetableCard";
import styles from "./timetable.module.css";

export default function WeekGrid({ monday, compact = false, onOpenLesson }) {
  const { recurringAssignments } = useSchoolData();
  const weekType = getWeekType(monday);

  return (
    <div className={styles.weekGrid} role="table" aria-label={`Week ${weekType} timetable`}>
      <div className={styles.weekGridRow} role="row">
        <div className={styles.cornerCell} role="columnheader">
          Week {weekType}
        </div>
        {weekdays.map((weekday, index) => {
          const date = addDays(monday, index);
          return (
            <div key={weekday.key} className={styles.dayColumnHeader} role="columnheader">
              <span>{weekday.shortLabel}</span>
              <span>{date.getDate()}</span>
            </div>
          );
        })}
      </div>

      {periods.map((period) => (
        <div
          key={period.id}
          className={`${styles.weekGridRow} ${period.type === "break" ? styles.weekBreakRow : ""}`}
          role="row"
        >
          <div className={styles.gridPeriodCell} role="rowheader">
            <strong>{period.label}</strong>
            {!compact && (
              <span>
                {period.start}–{period.end}
              </span>
            )}
          </div>
          {weekdays.map((weekday, index) => {
            const date = addDays(monday, index);
            return (
              <div key={weekday.key} className={styles.gridEntryCell} role="cell">
                <TimetableCard
                  entry={getTimetableEntry(
                    recurringAssignments,
                    weekType,
                    weekday.key,
                    period,
                  )}
                  detail={compact ? "fortnight" : "week"}
                  date={date}
                  period={period}
                  onOpenLesson={onOpenLesson}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
