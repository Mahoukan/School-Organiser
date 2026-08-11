import { weekdays } from "../../data/sampleTimetable";
import { getTeachingWeekForDate } from "../../lib/academicCalendar";
import { getDateKey } from "../../lib/lessonOccurrences";
import { formatBlockTime, getBlocksForDay } from "../../lib/periodStructures";
import { getDatedTimetableEntry } from "../../lib/recurringTimetable";
import { filterScheduleItems, shouldShowDatedEvents } from "../../lib/scheduleDisplay";
import { addDays, isSameDate, toDateOnly } from "../../lib/timetableDates";
import { useSchoolData } from "../providers/SchoolDataProvider";
import TimetableCard from "./TimetableCard";
import styles from "./timetable.module.css";
import DatedEventsStrip from "../events/DatedEventsStrip";

export default function WeekGrid({ monday, compact = false, onOpenLesson, onOpenEvent }) {
  const { recurringAssignments, recurringEvents, datedEvents, teachingWeeks, timetableBlocks, lessonMovements, preferences } = useSchoolData();
  const teachingWeek = getTeachingWeekForDate(monday, teachingWeeks);
  const scheduleDisplayMode = preferences.scheduleDisplayMode;
  const showDatedEvents = shouldShowDatedEvents(scheduleDisplayMode);
  const visibleDateKeys = weekdays.map((_, index) => getDateKey(addDays(monday, index)));
  if (!teachingWeek && !(showDatedEvents && datedEvents.some((event) => visibleDateKeys.includes(event.date)))) return <div className={styles.nonTeachingWeek}><strong>No teaching week configured.</strong><span>This Monday–Friday range has no configured teaching timetable.</span></div>;

  return <div className={`${styles.weekDayColumns} ${compact ? styles.compactWeekColumns : ""}`} aria-label={teachingWeek ? `Week ${teachingWeek.cycleWeek} timetable` : "One-off events in a non-teaching week"}>
    {weekdays.map((weekday, index) => {
      const date = addDays(monday, index);
      const isToday = isSameDate(date, toDateOnly(new Date()));
      const dateKey = getDateKey(date);
      const blocks = teachingWeek ? getBlocksForDay(timetableBlocks, teachingWeek.cycleWeek, weekday.key) : [];
      const visibleItems = teachingWeek ? filterScheduleItems(blocks.map((period) => ({
        period,
        entry: getDatedTimetableEntry({ recurringAssignments, recurringEvents, lessonMovements, date: dateKey, cycleWeek: teachingWeek.cycleWeek, weekday: weekday.key, period }),
      })), scheduleDisplayMode) : [];
      const hasVisibleDatedEvents = showDatedEvents && datedEvents.some((event) => event.date === dateKey);
      return <section className={`${styles.weekDayColumn} ${isToday ? styles.todayColumn : ""}`} key={weekday.key}>
        <header><strong>{weekday.shortLabel}</strong>{isToday && <span className={styles.todayMarker}>Today</span>}<span>{date.getDate()}</span></header>
        {showDatedEvents && <DatedEventsStrip events={datedEvents} date={date} onSelect={onOpenEvent} compact />}
        {blocks.length ? visibleItems.map(({ period, entry }) => <div className={`${styles.weekColumnBlock} ${!period.isTeaching ? styles.weekColumnBreak : ""}`} key={period.id}>
          <div className={styles.weekBlockMeta}><strong>{period.name}</strong>{!compact && <span>{formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}</span>}</div>
          <TimetableCard entry={entry} detail={compact ? "fortnight" : "week"} date={date} period={period} onOpenLesson={onOpenLesson} />
        </div>) : <p className={styles.noDayBlocks}>{teachingWeek ? "No blocks configured." : "No teaching timetable."}</p>}
        {blocks.length > 0 && !visibleItems.length && !hasVisibleDatedEvents && <p className={styles.noMatchingItems}>No matching items</p>}
      </section>;
    })}
  </div>;
}
