import { weekdays } from "../../data/sampleTimetable";
import { formatBlockTime, getBlocksForDay } from "../../lib/periodStructures";
import { useSchoolData } from "../providers/SchoolDataProvider";
import SetupSlot from "./SetupSlot";
import styles from "./setup.module.css";

export default function SetupWeekGrid({ cycleWeek, onChooseSlot, onMessage }) {
  const { timetableBlocks } = useSchoolData();
  return <div className={styles.setupDayColumns} aria-label={`Edit recurring Week ${cycleWeek} timetable`}>
    {weekdays.map((weekday) => { const blocks = getBlocksForDay(timetableBlocks, cycleWeek, weekday.key); return <section className={styles.setupDayColumn} key={weekday.key}>
      <h3>{weekday.label}</h3>
      {blocks.length ? blocks.map((period) => <div className={styles.dayBlock} key={period.id}>
        <div><strong>{period.name}</strong><span>{formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}</span></div>
        <SetupSlot cycleWeek={cycleWeek} weekday={weekday.key} weekdayLabel={weekday.label} period={period} onMessage={onMessage} onChoose={(selectedPeriod, trigger) => onChooseSlot(weekday.key, selectedPeriod, trigger)} />
      </div>) : <p className={styles.noSetupBlocks}>No blocks configured.</p>}
    </section>; })}
  </div>;
}
