import Link from "next/link";
import { useMemo, useState } from "react";
import { getClassColourOption } from "../../data/sampleClasses";
import { getDateKey } from "../../lib/lessonOccurrences";
import { formatBlockTime } from "../../lib/periodStructures";
import { addDays } from "../../lib/timetableDates";
import { deriveUpcomingPlanning } from "../../lib/upcomingPlanning";
import styles from "./today.module.css";

const INITIAL_LIMIT = 10;

function formatPlanningDate(item, today) {
  const actual = new Intl.DateTimeFormat("en-NZ", { weekday: "long", day: "numeric", month: "long" }).format(item.dateObject);
  return item.date === getDateKey(addDays(today, 1)) ? `Tomorrow · ${actual}` : actual;
}

function stateLabel(state) {
  return state === "no-content" ? "No planning content" : "Plan not added";
}

export default function UpcomingPlanning({ data, today, onOpenLesson }) {
  const planning = useMemo(() => deriveUpcomingPlanning(data, today), [data, today]);
  const [classId, setClassId] = useState("all");
  const [state, setState] = useState("needs-planning");
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const classOptions = useMemo(() => {
    const found = new Map();
    planning.items.forEach((item) => found.set(item.classDetails.id, item.classDetails));
    return [...found.values()].sort((a, b) => a.shortCode.localeCompare(b.shortCode, undefined, { numeric: true }));
  }, [planning.items]);
  const filtered = planning.items.filter((item) => (classId === "all" || item.classId === classId) && (state === "needs-planning" || item.planningState === state));
  const visible = filtered.slice(0, limit);
  const groups = visible.reduce((result, item) => {
    const group = result.find((entry) => entry.date === item.date);
    if (group) group.items.push(item);
    else result.push({ date: item.date, heading: formatPlanningDate(item, today), items: [item] });
    return result;
  }, []);
  const noContent = planning.items.filter((item) => item.planningState === "no-content").length;
  const partial = planning.items.length - noContent;

  return <section className={styles.planning} aria-labelledby="planning-title">
    <div className={styles.planningHeading}><div><span className={styles.eyebrow}>Prepare ahead</span><h2 id="planning-title">Upcoming Planning</h2><p>{planning.items.length} {planning.items.length === 1 ? "lesson needs" : "lessons need"} planning · {noContent} without content · {partial} without full plans</p></div>{classOptions.length > 0 && <div className={styles.planningFilters}><label>Class<select value={classId} onChange={(event) => { setClassId(event.target.value); setLimit(INITIAL_LIMIT); }}><option value="all">All classes</option>{classOptions.map((item) => <option key={item.id} value={item.id}>{item.shortCode}</option>)}</select></label><label>Planning state<select value={state} onChange={(event) => { setState(event.target.value); setLimit(INITIAL_LIMIT); }}><option value="needs-planning">Needs planning</option><option value="no-content">No planning content</option><option value="plan-not-added">Plan not added</option></select></label></div>}</div>

    {planning.missingTemplate && <div className={styles.configurationNotice}><span>Some upcoming teaching days do not have a Day Timetable assigned.</span><Link href="/setup">Open Setup</Link></div>}
    {planning.teachingDaysFound === 0 ? <div className={styles.emptyState}><h3>No upcoming teaching days are configured.</h3><p>The bounded 60-day search found no explicit teaching weeks.</p><Link href="/calendar">Open Calendar</Link></div> : planning.items.length === 0 ? <div className={styles.emptyState}><h3>You&apos;re prepared for the next 10 teaching days.</h3><p>No upcoming lessons need planning.</p></div> : filtered.length === 0 ? <div className={styles.emptyState}><h3>No lessons match these filters.</h3><p>Choose another class or planning state.</p></div> : <div className={styles.planningGroups}>{groups.map((group) => <section key={group.date} className={styles.planningGroup} aria-labelledby={`planning-${group.date}`}><h3 id={`planning-${group.date}`}>{group.heading}</h3><div className={styles.planningList}>{group.items.map((item) => { const colour = getClassColourOption(item.classDetails.colour); return <button key={item.id} type="button" className={styles.planningItem} style={{ "--planning-bg": colour.background, "--planning-border": colour.border, "--planning-text": colour.text }} onClick={(event) => onOpenLesson(item, event.currentTarget)} aria-label={`Open ${item.classDetails.shortCode}, ${item.period.name}, ${group.heading}. ${stateLabel(item.planningState)}.`}><div className={styles.planningIdentity}><strong>{item.classDetails.shortCode}</strong><span>{item.classDetails.name}</span>{item.classDetails.room && <small>Room {item.classDetails.room}</small>}</div><div className={styles.planningLesson}>{item.occurrence?.title && <strong>{item.occurrence.title}</strong>}{item.occurrence?.summary && <span>{item.occurrence.summary}</span>}<small className={styles.planningState}>{stateLabel(item.planningState)}</small></div><div className={styles.planningPeriod}><strong>{item.period.name}</strong><span>{formatBlockTime(item.period.startTime)}–{formatBlockTime(item.period.endTime)}</span>{item.originalPeriod && <small>Moved from {item.originalPeriod.name}</small>}</div></button>; })}</div></section>)}</div>}
    {filtered.length > visible.length && <button type="button" className={styles.showMore} onClick={() => setLimit(filtered.length)}>Show more ({filtered.length - visible.length})</button>}
  </section>;
}
