import { weekdays } from "../../data/sampleTimetable";
import { getTeachingWeekForDate } from "../../lib/academicCalendar";
import { getDateKey } from "../../lib/lessonOccurrences";
import { formatBlockTime, getBlocksForDay } from "../../lib/periodStructures";
import { getDatedTimetableEntry } from "../../lib/recurringTimetable";
import { addDays } from "../../lib/timetableDates";
import { useSchoolData } from "../providers/SchoolDataProvider";
import TimetableCard from "./TimetableCard";
import styles from "./timetable.module.css";

export default function WeekGrid({ monday, compact = false, onOpenLesson }) {
  const { recurringAssignments, teachingWeeks, timetableBlocks, lessonMovements } = useSchoolData();
  const teachingWeek = getTeachingWeekForDate(monday, teachingWeeks);
  if (!teachingWeek) return <div className={styles.nonTeachingWeek}><strong>No teaching week configured.</strong><span>This Monday–Friday range has no configured teaching timetable.</span></div>;

  return <div className={`${styles.weekDayColumns} ${compact ? styles.compactWeekColumns : ""}`} aria-label={`Week ${teachingWeek.cycleWeek} timetable`}>
    {weekdays.map((weekday, index) => {
      const date = addDays(monday, index);
      const dateKey = getDateKey(date);
      const blocks = getBlocksForDay(timetableBlocks, teachingWeek.cycleWeek, weekday.key);
      return <section className={styles.weekDayColumn} key={weekday.key}>
        <header><strong>{weekday.shortLabel}</strong><span>{date.getDate()}</span></header>
        {blocks.length ? blocks.map((period) => <div className={`${styles.weekColumnBlock} ${!period.isTeaching ? styles.weekColumnBreak : ""}`} key={period.id}>
          <div className={styles.weekBlockMeta}><strong>{period.name}</strong>{!compact && <span>{formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}</span>}</div>
          <TimetableCard entry={getDatedTimetableEntry({ recurringAssignments, lessonMovements, date: dateKey, cycleWeek: teachingWeek.cycleWeek, weekday: weekday.key, period })} detail={compact ? "fortnight" : "week"} date={date} period={period} onOpenLesson={onOpenLesson} />
        </div>) : <p className={styles.noDayBlocks}>No blocks configured.</p>}
      </section>;
    })}
  </div>;
}
