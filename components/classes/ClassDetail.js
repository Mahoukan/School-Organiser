"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { getClassColourOption } from "../../data/sampleClasses";
import { getClassScheduledOccurrences, splitClassHistory } from "../../lib/classHistory";
import LessonPanel from "../lessons/LessonPanel";
import { useSchoolData } from "../providers/SchoolDataProvider";
import ClassHistoryCard from "./ClassHistoryCard";
import styles from "./class-history.module.css";

export default function ClassDetail({ classId }) {
  const data = useSchoolData();
  const [mode, setMode] = useState("past");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const triggerRef = useRef(null);
  const classItem = data.classes.find((item) => item.id === classId);
  const entries = useMemo(() => classItem ? getClassScheduledOccurrences({ classId, ...data }) : [], [classId, classItem, data]);
  const history = useMemo(() => splitClassHistory(entries), [entries]);

  if (!classItem) return <section className={styles.detailPage}><div className={styles.notFound}><h1>Class not found.</h1><p>This class may have been removed when temporary data reset.</p><Link href="/classes">Back to Classes</Link></div></section>;

  const colour = getClassColourOption(classItem.colour);
  const details = [classItem.subject, classItem.yearLevel && `Year ${classItem.yearLevel}`, classItem.room && `Room ${classItem.room}`].filter(Boolean);
  const assignmentsExist = data.recurringAssignments.some((item) => item.classId === classId);
  const displayed = history[mode];

  function openLesson(entry, trigger) {
    triggerRef.current = trigger;
    setSelectedLesson({ date: entry.date, recurringAssignmentId: entry.recurringAssignmentId, classId, periodId: entry.effectivePeriod.id });
  }
  function closeLesson() {
    const trigger = triggerRef.current;
    setSelectedLesson(null);
    requestAnimationFrame(() => trigger?.focus());
  }

  return <section className={styles.detailPage} style={{ "--class-accent": classItem.colour, "--class-tint": colour.background, "--class-border": colour.border }}>
    <Link className={styles.backLink} href="/classes">← Back to Classes</Link>
    <header className={styles.classHeader}>
      <span className={styles.classMarker} aria-hidden="true" />
      <div><div className={styles.titleRow}><h1>{classItem.shortCode}</h1>{classItem.archived && <span className={styles.archivedBadge}>Archived</span>}</div><h2>{classItem.name}</h2>{details.length > 0 && <p>{details.join(" · ")}</p>}<span>{classItem.academicYear}</span></div>
    </header>
    <div className={styles.historySummary}><span>Past lessons <strong>{history.past.length}</strong></span><span>Upcoming lessons <strong>{history.upcoming.length}</strong></span></div>
    <div className={styles.historyToolbar}><div><h2>Lesson History</h2><p>Scheduled lessons are derived from the academic calendar and recurring timetable.</p></div><div className={styles.modeSelector} aria-label="Lesson history period"><button type="button" aria-pressed={mode === "past"} onClick={() => setMode("past")}>Past</button><button type="button" aria-pressed={mode === "upcoming"} onClick={() => setMode("upcoming")}>Upcoming</button></div></div>
    {!assignmentsExist ? <div className={styles.emptyState}><h3>No scheduled lessons</h3><p>This class is not currently assigned to the recurring timetable.</p></div> : displayed.length ? <div className={styles.historyList}>{displayed.map((entry) => <ClassHistoryCard key={entry.id} entry={entry} onOpen={openLesson} />)}</div> : <div className={styles.emptyState}><h3>{mode === "past" ? "No past lessons yet." : "No upcoming lessons scheduled."}</h3></div>}
    {selectedLesson && <LessonPanel key={`${selectedLesson.date}-${selectedLesson.recurringAssignmentId}`} selection={selectedLesson} onClose={closeLesson} />}
  </section>;
}
