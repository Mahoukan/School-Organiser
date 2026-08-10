import { weekdays } from "../../data/sampleTimetable";
import { getTeachingWeekForDate } from "../../lib/academicCalendar";
import { getDateKey } from "../../lib/lessonOccurrences";
import { formatBlockTime, getBlocksForDay } from "../../lib/periodStructures";
import { getDatedTimetableEntry } from "../../lib/recurringTimetable";
import { addDays } from "../../lib/timetableDates";
import { useSchoolData } from "../providers/SchoolDataProvider";
import TimetableCard from "./TimetableCard";
import styles from "./timetable.module.css";
import DatedEventsStrip from "../events/DatedEventsStrip";

export default function WeekGrid({ monday, compact = false, onOpenLesson, onOpenEvent }) {
  const { recurringAssignments, recurringEvents, datedEvents, teachingWeeks, timetableBlocks, lessonMovements } = useSchoolData();
  const teachingWeek = getTeachingWeekForDate(monday, teachingWeeks);
  const visibleDateKeys = weekdays.map((_, index) => getDateKey(addDays(monday, index)));
  if (!teachingWeek && !datedEvents.some((event) => visibleDateKeys.includes(event.date))) return <div className={styles.nonTeachingWeek}><strong>No teaching week configured.</strong><span>This Monday–Friday range has no configured teaching timetable.</span></div>;

  return <div className={`${styles.weekDayColumns} ${compact ? styles.compactWeekColumns : ""}`} aria-label={teachingWeek ? `Week ${teachingWeek.cycleWeek} timetable` : "One-off events in a non-teaching week"}>
    {weekdays.map((weekday, index) => {
      const date = addDays(monday, index);
      const dateKey = getDateKey(date);
      const blocks = teachingWeek ? getBlocksForDay(timetableBlocks, teachingWeek.cycleWeek, weekday.key) : [];
      return <section className={styles.weekDayColumn} key={weekday.key}>
        <header><strong>{weekday.shortLabel}</strong><span>{date.getDate()}</span></header>
        <DatedEventsStrip events={datedEvents} date={date} onSelect={onOpenEvent} compact />
        {blocks.length ? blocks.map((period) => <div className={`${styles.weekColumnBlock} ${!period.isTeaching ? styles.weekColumnBreak : ""}`} key={period.id}>
          <div className={styles.weekBlockMeta}><strong>{period.name}</strong>{!compact && <span>{formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}</span>}</div>
          <TimetableCard entry={getDatedTimetableEntry({ recurringAssignments, recurringEvents, lessonMovements, date: dateKey, cycleWeek: teachingWeek.cycleWeek, weekday: weekday.key, period })} detail={compact ? "fortnight" : "week"} date={date} period={period} onOpenLesson={onOpenLesson} />
        </div>) : <p className={styles.noDayBlocks}>{teachingWeek ? "No blocks configured." : "No teaching timetable."}</p>}
      </section>;
    })}
  </div>;
}
