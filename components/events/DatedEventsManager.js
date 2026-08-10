"use client";

import { useMemo, useRef, useState } from "react";
import { formatCalendarDate } from "../../lib/academicCalendar";
import { getDateKey } from "../../lib/lessonOccurrences";
import { formatBlockTime } from "../../lib/periodStructures";
import { sortDatedEvents } from "../../lib/datedEvents";
import ModalDialog from "../classes/ModalDialog";
import { useSchoolData } from "../providers/SchoolDataProvider";
import DatedEventCard from "./DatedEventCard";
import DatedEventDialog from "./DatedEventDialog";
import styles from "./events.module.css";

export default function DatedEventsManager() {
  const data = useSchoolData();
  const today = getDateKey(new Date());
  const [editor, setEditor] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState("");
  const trigger = useRef(null);
  const deleteTrigger = useRef(null);
  const grouped = useMemo(() => ({ upcoming: sortDatedEvents(data.datedEvents.filter((item) => item.date >= today)), past: sortDatedEvents(data.datedEvents.filter((item) => item.date < today), "desc") }), [data.datedEvents, today]);
  function open(event, element) { trigger.current = element; setEditor(event ?? { new: true }); }
  function closeEditor() { setEditor(null); requestAnimationFrame(() => trigger.current?.focus()); }
  function closeRemove() { setRemoveTarget(null); requestAnimationFrame(() => deleteTrigger.current?.focus()); }
  async function remove() { if (removing) return; setRemoving(true); const result = await data.removeDatedEvent(removeTarget.id); setRemoving(false); if (!result.ok) { setMessage(result.message); return; } closeRemove(); }
  const list = (events) => <div className={styles.managerList}>{events.map((event) => <div className={styles.managerRow} key={event.id}><div><span>{formatCalendarDate(event.date, { weekday: "short", day: "numeric", month: "short" })}</span><DatedEventCard event={event} onSelect={open} /></div><button type="button" className={styles.deleteLink} onClick={(e) => { deleteTrigger.current = e.currentTarget; setMessage(""); setRemoveTarget(event); }}>Delete</button></div>)}</div>;
  return <section className={styles.manager} aria-labelledby="one-off-events-title">
    <div className={styles.managerHeading}><div><h2 id="one-off-events-title">One-Off Events</h2><p>Meetings, appointments and other commitments on an exact date and time.</p></div><button type="button" className={styles.primary} onClick={(e) => open(null, e.currentTarget)}>Add Event</button></div>
    {message && <p className={styles.error} role="alert">{message}</p>}
    {!data.datedEvents.length ? <div className={styles.empty}><strong>No one-off events yet.</strong><p>Add an event for a meeting, appointment, duty, or other one-time commitment.</p><button type="button" className={styles.primary} onClick={(e) => open(null, e.currentTarget)}>Add Event</button></div> : <>{grouped.upcoming.length > 0 && <section><h3>Upcoming</h3>{list(grouped.upcoming)}</section>}{grouped.past.length > 0 && <section><h3>Past</h3>{list(grouped.past)}</section>}</>}
    {editor && <DatedEventDialog event={editor.new ? null : editor} defaultDate={today} onClose={closeEditor} />}
    {removeTarget && <ModalDialog className={styles.confirmDialog} labelledBy="delete-event-title" describedBy="delete-event-detail" onClose={() => !removing && closeRemove()}><h2 id="delete-event-title">Delete “{removeTarget.title}”?</h2><p>{formatCalendarDate(removeTarget.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}<br />{formatBlockTime(removeTarget.startTime)}–{formatBlockTime(removeTarget.endTime)}</p><p id="delete-event-detail">This cannot be undone.</p>{message && <p className={styles.error} role="alert">{message}</p>}<div className={styles.confirmActions}><button type="button" className={styles.secondary} onClick={closeRemove} disabled={removing}>Cancel</button><button type="button" className={styles.danger} onClick={remove} disabled={removing}>{removing ? "Deleting…" : "Delete Event"}</button></div></ModalDialog>}
  </section>;
}
