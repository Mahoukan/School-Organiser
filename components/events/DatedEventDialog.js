"use client";

import { useMemo, useState } from "react";
import { getDateKey } from "../../lib/lessonOccurrences";
import { formatBlockTime } from "../../lib/periodStructures";
import { RECURRING_EVENT_COLOURS, RECURRING_EVENT_TYPES } from "../../lib/recurringEvents";
import { deriveTodaySchedule } from "../../lib/todaySchedule";
import { parseDateOnly } from "../../lib/academicCalendar";
import { getDatedEventConflicts, validateDatedEvent } from "../../lib/datedEvents";
import ModalDialog from "../classes/ModalDialog";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./events.module.css";

const blank = (date) => ({ date, type: "meeting", title: "", startTime: "", endTime: "", location: "", detail: "", colour: "#6b4bb6" });

export default function DatedEventDialog({ event, defaultDate, onClose }) {
  const data = useSchoolData();
  const [values, setValues] = useState(() => event ? { ...event } : blank(defaultDate ?? getDateKey(new Date())));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState(null);
  const schedule = useMemo(() => values.date ? deriveTodaySchedule(data, parseDateOnly(values.date)) : null, [data, values.date]);
  const usableBlocks = schedule?.blocks?.filter((item) => item.period.startTime && item.period.endTime) ?? [];

  function change(field, value) { setValues((current) => ({ ...current, [field]: value })); setConflicts(null); }
  function applyBlock(blockId) { const block = usableBlocks.find((item) => item.period.id === blockId); if (block) { setValues((current) => ({ ...current, startTime: block.period.startTime, endTime: block.period.endTime })); setConflicts(null); } }
  async function save(force = false) {
    if (saving) return;
    const nextErrors = validateDatedEvent(values, data.academicYear);
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    const nextConflicts = getDatedEventConflicts(values, data);
    if (!force && nextConflicts.length) { setConflicts(nextConflicts); return; }
    setSaving(true); setErrors({});
    const result = await data.saveDatedEvent(values);
    setSaving(false);
    if (result.ok) onClose(); else setErrors(result.errors ?? { form: result.message });
  }
  function submit(e) { e.preventDefault(); save(false); }

  return <ModalDialog className={styles.dialog} labelledBy="dated-event-title" onClose={() => !saving && onClose()}>
    <form className={styles.form} onSubmit={submit} noValidate>
      <header><div><span>One-Off Event</span><h2 id="dated-event-title">{event ? "Edit event" : "Add event"}</h2></div><button type="button" className={styles.iconButton} onClick={onClose} disabled={saving} aria-label="Close event editor">×</button></header>
      <div className={styles.grid}>
        <label>Date *<input type="date" value={values.date} onChange={(e) => change("date", e.target.value)} aria-invalid={Boolean(errors.date)} />{errors.date && <small>{errors.date}</small>}</label>
        <label>Type *<select value={values.type} onChange={(e) => change("type", e.target.value)}>{RECURRING_EVENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{errors.type && <small>{errors.type}</small>}</label>
        <label className={styles.full}>Title *<input maxLength="100" value={values.title} onChange={(e) => change("title", e.target.value)} />{errors.title && <small>{errors.title}</small>}</label>
        {usableBlocks.length > 0 && <label className={styles.full}>Use timetable block<select value="" onChange={(e) => applyBlock(e.target.value)}><option value="">Choose a block to copy its times</option>{usableBlocks.map(({ period }) => <option key={period.id} value={period.id}>{period.name} · {formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}</option>)}</select></label>}
        <label>Start time *<input type="time" value={values.startTime} onChange={(e) => change("startTime", e.target.value)} aria-invalid={Boolean(errors.startTime)} />{errors.startTime && <small>{errors.startTime}</small>}</label>
        <label>End time *<input type="time" value={values.endTime} onChange={(e) => change("endTime", e.target.value)} aria-invalid={Boolean(errors.endTime)} />{errors.endTime && <small>{errors.endTime}</small>}</label>
        <label>Location<input maxLength="100" value={values.location} onChange={(e) => change("location", e.target.value)} />{errors.location && <small>{errors.location}</small>}</label>
        <label>Colour *<select value={values.colour} onChange={(e) => change("colour", e.target.value)}>{RECURRING_EVENT_COLOURS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{errors.colour && <small>{errors.colour}</small>}</label>
        <label className={styles.full}>Detail<textarea maxLength="500" rows="4" value={values.detail} onChange={(e) => change("detail", e.target.value)} />{errors.detail && <small>{errors.detail}</small>}</label>
      </div>
      {errors.form && <p className={styles.error} role="alert">{errors.form}</p>}
      {conflicts && <section className={styles.conflicts} role="alert"><h3>This event overlaps {conflicts.length} {conflicts.length === 1 ? "commitment" : "commitments"}:</h3>{conflicts.map((item) => <div key={item.id}><strong>{item.label}</strong><span>{formatBlockTime(item.startTime)}–{formatBlockTime(item.endTime)}{item.detail ? ` · ${item.detail}` : ""}</span></div>)}<p>Saving will not cancel or change these commitments.</p><button type="button" className={styles.warningButton} onClick={() => save(true)} disabled={saving}>{saving ? "Saving…" : "Save anyway"}</button></section>}
      <footer><button type="button" className={styles.secondary} onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className={styles.primary} disabled={saving}>{saving ? "Saving…" : event ? "Save Changes" : "Save Event"}</button></footer>
    </form>
  </ModalDialog>;
}
