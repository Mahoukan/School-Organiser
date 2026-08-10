import { periods, weekdays } from "../../data/sampleTimetable";
import SetupSlot from "./SetupSlot";
import styles from "./setup.module.css";

export default function SetupWeekGrid({ cycleWeek, onChooseSlot }) {
  return (
    <div
      className={styles.setupGrid}
      role="table"
      aria-label={`Edit recurring Week ${cycleWeek} timetable`}
    >
      <div className={styles.setupGridRow} role="row">
        <div className={styles.cornerCell} role="columnheader">
          Week {cycleWeek}
        </div>
        {weekdays.map((weekday) => (
          <div key={weekday.key} className={styles.dayHeader} role="columnheader">
            {weekday.shortLabel}
          </div>
        ))}
      </div>

      {periods.map((period) => (
        <div
          key={period.id}
          className={`${styles.setupGridRow} ${period.type === "break" ? styles.breakGridRow : ""}`}
          role="row"
        >
          <div className={styles.periodCell} role="rowheader">
            <strong>{period.label}</strong>
            <span>
              {period.start}–{period.end}
            </span>
          </div>
          {weekdays.map((weekday) => (
            <div key={weekday.key} className={styles.slotCell} role="cell">
              <SetupSlot
                cycleWeek={cycleWeek}
                weekday={weekday.key}
                weekdayLabel={weekday.label}
                period={period}
                onChoose={(selectedPeriod, trigger) =>
                  onChooseSlot(weekday.key, selectedPeriod, trigger)
                }
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
