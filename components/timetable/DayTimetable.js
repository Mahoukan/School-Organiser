import { weekdays } from "../../data/sampleTimetable";
import { formatBlockTime, getBlocksForDay } from "../../lib/periodStructures";
import {
  formatDayHeading,
  isWeekend,
} from "../../lib/timetableDates";
import { getTeachingWeekForDate } from "../../lib/academicCalendar";
import { getDatedTimetableEntry } from "../../lib/recurringTimetable";
import { getDateKey } from "../../lib/lessonOccurrences";
import { getExceptionTypeLabel, isDateInRange } from "../../lib/scheduleOverlays";
import { useSchoolData } from "../providers/SchoolDataProvider";
import TimetableCard from "./TimetableCard";
import styles from "./timetable.module.css";
import DatedEventsStrip from "../events/DatedEventsStrip";

function DayContextNotices({ date, teacherAbsences, calendarExceptions }) {
  const dateKey = getDateKey(date);
  const teacherAbsence = teacherAbsences.find((item) => isDateInRange(dateKey, item));
  const exception = calendarExceptions.find((item) => isDateInRange(dateKey, item));
  if (!teacherAbsence && !exception) return null;
  return <div className={styles.dayNotices}>
    {teacherAbsence && <aside><strong>Teacher absence</strong><span>{teacherAbsence.note || "You are marked away on this date."}</span></aside>}
    {exception && <aside><strong>{getExceptionTypeLabel(exception.type)}</strong><span>{exception.note || "Calendar exception applies on this date."}</span></aside>}
  </div>;
}

export default function DayTimetable({
  date,
  compact = false,
  showHeading = true,
  onOpenLesson,
  onOpenEvent,
}) {
  const { recurringAssignments, recurringEvents, datedEvents, teachingWeeks, timetableBlocks, lessonMovements, teacherAbsences, calendarExceptions } = useSchoolData();
  const teachingWeek = getTeachingWeekForDate(date, teachingWeeks);

  if (isWeekend(date)) {
    return (
      <section className={styles.dayPanel}>
        {showHeading && (
          <div className={styles.dayHeading}><h2>{formatDayHeading(date)}</h2><button type="button" onClick={(e) => onOpenEvent(null, e.currentTarget, date)}>Add Event</button></div>
        )}
        <DayContextNotices date={date} teacherAbsences={teacherAbsences} calendarExceptions={calendarExceptions} />
        <DatedEventsStrip events={datedEvents} date={date} onSelect={onOpenEvent} compact={compact} />
        <div className={styles.emptyDay}>
          <p>No school timetable for this day.</p>
        </div>
      </section>
    );
  }

  if (!teachingWeek) {
    return (
      <section className={styles.dayPanel}>
        {showHeading && <div className={styles.dayHeading}><h2>{formatDayHeading(date)}</h2><div className={styles.dayHeadingActions}><button type="button" onClick={(e) => onOpenEvent(null, e.currentTarget, date)}>Add Event</button><span className={styles.cycleBadge}>No teaching week</span></div></div>}
        <DayContextNotices date={date} teacherAbsences={teacherAbsences} calendarExceptions={calendarExceptions} />
        <DatedEventsStrip events={datedEvents} date={date} onSelect={onOpenEvent} compact={compact} />
        <div className={styles.emptyDay}><p>No teaching week is configured for this date.</p></div>
      </section>
    );
  }

  const weekday = weekdays[date.getDay() - 1];
  const periods = getBlocksForDay(
    timetableBlocks,
    teachingWeek.cycleWeek,
    weekday.key,
  );

  if (!periods.length) {
    return (
      <section className={styles.dayPanel}>
        {showHeading && <div className={styles.dayHeading}><h2>{formatDayHeading(date)}</h2><div className={styles.dayHeadingActions}><button type="button" onClick={(e) => onOpenEvent(null, e.currentTarget, date)}>Add Event</button><span className={styles.cycleBadge}>Week {teachingWeek.cycleWeek}</span></div></div>}
        <DayContextNotices date={date} teacherAbsences={teacherAbsences} calendarExceptions={calendarExceptions} />
        <DatedEventsStrip events={datedEvents} date={date} onSelect={onOpenEvent} compact={compact} />
        <div className={styles.emptyDay}><p>No timetable blocks are configured for this day.</p></div>
      </section>
    );
  }

  return (
    <section className={styles.dayPanel}>
      {showHeading && (
        <div className={styles.dayHeading}>
          <h2>{formatDayHeading(date)}</h2>
          <div className={styles.dayHeadingActions}><button type="button" onClick={(e) => onOpenEvent(null, e.currentTarget, date)}>Add Event</button><span className={styles.cycleBadge}>Week {teachingWeek.cycleWeek}</span></div>
        </div>
      )}

      <DayContextNotices date={date} teacherAbsences={teacherAbsences} calendarExceptions={calendarExceptions} />
      <DatedEventsStrip events={datedEvents} date={date} onSelect={onOpenEvent} compact={compact} />
      <div className={styles.daySchedule}>
        {periods.map((period) => {
          const entry = getDatedTimetableEntry({ recurringAssignments, recurringEvents, lessonMovements, date: getDateKey(date), cycleWeek: teachingWeek.cycleWeek, weekday: weekday.key, period });
          const isBreak = !period.isTeaching;

          return (
            <div
              key={period.id}
              className={`${styles.dayRow} ${isBreak ? styles.dayBreakRow : ""}`}
            >
              <div className={styles.periodMeta}>
                <span className={styles.periodLabel}>{period.name}</span>
                <span className={styles.periodTime}>
                  {formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}
                </span>
              </div>
              <TimetableCard
                entry={entry}
                detail={compact ? "fortnight" : "day"}
                date={date}
                period={period}
                onOpenLesson={onOpenLesson}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
