import { weekdays } from "../../data/sampleTimetable";
import { formatBlockTime, getBlocksForDay } from "../../lib/periodStructures";
import { useSchoolData } from "../providers/SchoolDataProvider";
import SetupSlot from "./SetupSlot";
import styles from "./setup.module.css";

export default function MobileSetupDay({
  cycleWeek,
  selectedWeekday,
  onSelectWeekday,
  onChooseSlot,
}) {
  const weekday = weekdays[selectedWeekday];
  const { timetableBlocks } = useSchoolData();
  const periods = getBlocksForDay(timetableBlocks, cycleWeek, weekday.key);

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
        {periods.length ? periods.map((period) => (
          <div
            key={period.id}
            className={`${styles.mobilePeriodRow} ${!period.isTeaching ? styles.mobileBreakRow : ""}`}
          >
            <div className={styles.mobilePeriodMeta}>
              <strong>{period.name}</strong>
              <span>
                {formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}
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
        )) : <p>No timetable blocks configured for this day.</p>}
      </div>
    </div>
  );
}
