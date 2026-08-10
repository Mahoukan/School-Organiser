import { periods, weekdays } from "../../data/sampleTimetable";
import SetupSlot from "./SetupSlot";
import styles from "./setup.module.css";

export default function MobileSetupDay({
  cycleWeek,
  selectedWeekday,
  onSelectWeekday,
  onChooseSlot,
}) {
  const weekday = weekdays[selectedWeekday];

  return (
    <div className={styles.mobileEditor}>
      <div className={styles.weekdaySelector} aria-label={`Week ${cycleWeek} day`}>
        {weekdays.map((option, index) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={selectedWeekday === index}
            onClick={() => onSelectWeekday(index)}
          >
            {option.shortLabel}
          </button>
        ))}
      </div>

      <h3>{weekday.label}</h3>
      <div className={styles.mobilePeriods}>
        {periods.map((period) => (
          <div
            key={period.id}
            className={`${styles.mobilePeriodRow} ${period.type === "break" ? styles.mobileBreakRow : ""}`}
          >
            <div className={styles.mobilePeriodMeta}>
              <strong>{period.label}</strong>
              <span>
                {period.start}–{period.end}
              </span>
            </div>
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
    </div>
  );
}
