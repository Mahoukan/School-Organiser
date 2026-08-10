"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getClassColourOption } from "../../data/sampleClasses";
import { formatBlockTime } from "../../lib/periodStructures";
import { getExceptionTypeLabel } from "../../lib/scheduleOverlays";
import { formatDayHeading, isSameDate, toDateOnly } from "../../lib/timetableDates";
import { deriveTodaySchedule } from "../../lib/todaySchedule";
import { getCurrentBlockState } from "../../lib/currentBlock";
import { getLessonStatusLabel, hasLessonPlanContent } from "../../lib/lessonOccurrences";
import { getRecurringEventColour, getRecurringEventTypeLabel } from "../../lib/recurringEvents";
import LessonPanel from "../lessons/LessonPanel";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./today.module.css";

function BlockSummary({ item }) {
  if (!item) return null;
  if (item.entry.type === "class") return <strong>{item.classDetails?.shortCode ?? "Free"}</strong>;
  if (item.entry.type === "event") return <strong>{item.entry.event.title}</strong>;
  if (item.entry.type === "free") return <strong>Free</strong>;
  return <strong>{item.period.name}</strong>;
}

function ScheduleItem({ item, timeState, date, onOpenLesson }) {
  const { period, entry } = item;
  const classColour = item.classDetails ? getClassColourOption(item.classDetails.colour) : null;
  const eventColour = entry.type === "event" ? getRecurringEventColour(entry.event.colour) : null;
  const hasPlan = item.occurrence ? hasLessonPlanContent(item.occurrence) : false;
  const content = <>
    <div className={styles.periodMeta}><strong>{period.name}</strong><span>{formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}</span>{timeState === "current" && <span className={styles.nowMarker}>Now</span>}</div>
    <div className={styles.occupant}>
      {entry.type === "free" && <span className={styles.free}>Free</span>}
      {entry.type === "break" && <span className={styles.breakName}>{period.name}</span>}
      {entry.type === "event" && <><strong>{entry.event.title}</strong><span>{getRecurringEventTypeLabel(entry.event.type)} · Other commitment</span>{entry.event.detail && <small>{entry.event.detail}</small>}</>}
      {entry.type === "class" && !item.classDetails && <span className={styles.free}>Free</span>}
      {entry.type === "class" && item.classDetails && <><div className={styles.classHeading}><strong>{item.classDetails.shortCode}</strong><span>{getLessonStatusLabel(item.status)}</span></div><span>{item.classDetails.name}</span>{item.classDetails.room && <small>Room {item.classDetails.room}</small>}{item.occurrence?.title && <strong className={styles.lessonTitle}>{item.occurrence.title}</strong>}{item.occurrence?.summary && <small>{item.occurrence.summary}</small>}{hasPlan ? <small>Lesson plan added</small> : timeState !== "past" && <small>No lesson plan yet</small>}{item.cancellation?.isCancelled && <small className={styles.cancelReason}>{item.cancellation.reasonLabel}{item.cancellation.note ? ` — ${item.cancellation.note}` : ""}</small>}{entry.movedFromPeriodId && <small>Moved from {item.movedFromName ?? "original block"}</small>}</>}
    </div>
  </>;
  const className = `${styles.scheduleItem} ${styles[timeState]} ${entry.type === "break" ? styles.nonTeaching : ""}`;
  const style = classColour ? { "--item-bg": classColour.background, "--item-border": classColour.border, "--item-text": classColour.text } : eventColour ? { "--item-bg": eventColour.background, "--item-border": eventColour.border, "--item-text": eventColour.text } : undefined;
  if (entry.type !== "class" || !item.classDetails) return <article className={className} style={style}>{content}</article>;
  return <button type="button" className={className} style={style} onClick={(event) => onOpenLesson(item, event.currentTarget)} aria-label={`Open ${item.classDetails.shortCode}, ${period.name}. Status: ${getLessonStatusLabel(item.status)}.`}>{content}</button>;
}

export default function TodayDashboard() {
  const data = useSchoolData();
  const [today] = useState(() => toDateOnly(new Date()));
  const [now, setNow] = useState(() => new Date());
  const [selectedLesson, setSelectedLesson] = useState(null);
  const lessonTrigger = useRef(null);
  const schedule = useMemo(() => deriveTodaySchedule(data, today), [data, today]);
  const clock = getCurrentBlockState(schedule.blocks, now);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = new Date();
      setNow(next);
      setToday((current) => isSameDate(current, next) ? current : toDateOnly(next));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function openLesson(item, trigger) {
    lessonTrigger.current = trigger;
    setSelectedLesson({ date: schedule.dateKey, recurringAssignmentId: item.entry.recurringAssignmentId, classId: item.entry.classId, periodId: item.period.id });
  }
  function closeLesson() {
    const trigger = lessonTrigger.current;
    setSelectedLesson(null);
    requestAnimationFrame(() => trigger?.focus());
  }

  const context = schedule.teachingWeek ? `${schedule.term?.name ?? "Teaching term"} · Week ${schedule.teachingWeek.cycleWeek}` : "No teaching week";
  return <section className={styles.todayPage} aria-labelledby="today-title">
    <header className={styles.header}><div><span className={styles.eyebrow}>Today</span><h1 id="today-title">{formatDayHeading(today)}</h1><p>{context}{schedule.dayTemplate ? ` · ${schedule.dayTemplate.name}` : ""}</p></div><Link className={styles.primaryLink} href="/timetable">Open Day Timetable</Link></header>

    {schedule.teacherAbsence && <aside className={styles.notice}><div><strong>You are marked away today.</strong>{schedule.teacherAbsence.note && <p>{schedule.teacherAbsence.note}</p>}</div><Link href="/calendar">Manage absence</Link></aside>}
    {schedule.calendarException && <aside className={styles.notice}><div><strong>{getExceptionTypeLabel(schedule.calendarException.type)}</strong>{schedule.calendarException.note && <p>{schedule.calendarException.note}</p>}</div><Link href="/calendar">View calendar</Link></aside>}

    {!schedule.weekend && schedule.teachingWeek && schedule.blocks.length > 0 && <div className={styles.summaryGrid}>
      <section className={styles.currentCard} aria-labelledby="current-block-title"><span id="current-block-title" className={styles.eyebrow}>{clock.state === "current" ? "Now" : clock.state === "next" ? "Next" : "Today"}</span>{clock.block ? <><h2>{clock.block.period.name} · {formatBlockTime(clock.block.period.startTime)}–{formatBlockTime(clock.block.period.endTime)}</h2><BlockSummary item={clock.block} /></> : <h2>{clock.state === "finished" ? "Today’s timetable is finished." : "No blocks configured."}</h2>}</section>
      <section className={styles.overview} aria-labelledby="overview-title"><h2 id="overview-title">Daily overview</h2><dl>{Object.entries({ Classes: schedule.overview.classes, Completed: schedule.overview.completed, Remaining: schedule.overview.remaining, Cancelled: schedule.overview.cancelled, "Other commitments": schedule.overview.commitments }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    </div>}

    {schedule.weekend ? <div className={styles.emptyState}><h2>No school timetable today.</h2><p>Your weekday timetable remains available in Timetable.</p></div> : !schedule.teachingWeek ? <div className={styles.emptyState}><h2>No teaching timetable today.</h2><p>This date is not part of a configured teaching week.</p></div> : !schedule.blocks.length ? <div className={styles.emptyState}><h2>No timetable blocks are configured.</h2><p>Configure and assign a Day Timetable Template in Setup.</p></div> : <section className={styles.schedule} aria-labelledby="schedule-title"><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Full day</span><h2 id="schedule-title">Today’s schedule</h2></div>{schedule.dayTemplate && <span>{schedule.dayTemplate.name}</span>}</div><div className={styles.scheduleList}>{schedule.blocks.map((item) => { const state = clock.block?.period.id === item.period.id && clock.state === "current" ? "current" : item.period.endTime <= `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` ? "past" : "future"; const movedFromName = item.entry.movedFromPeriodId ? data.timetableBlocks.find((block) => block.id === item.entry.movedFromPeriodId)?.name : null; return <ScheduleItem key={item.period.id} item={{ ...item, movedFromName }} timeState={state} date={today} onOpenLesson={openLesson} />; })}</div></section>}

    {selectedLesson && <LessonPanel key={`${selectedLesson.date}-${selectedLesson.recurringAssignmentId}`} selection={selectedLesson} onClose={closeLesson} />}
  </section>;
}
