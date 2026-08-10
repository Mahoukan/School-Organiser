"use client";

import { useState } from "react";
import { getClassColourOption } from "../../data/sampleClasses";
import { formatCalendarDate } from "../../lib/academicCalendar";
import { getDateKey } from "../../lib/lessonOccurrences";
import { CALENDAR_EXCEPTION_TYPES, getExceptionTypeLabel } from "../../lib/scheduleOverlays";
import ModalDialog from "../classes/ModalDialog";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./calendar.module.css";

function RangeFields({ values, setValues, errors }) {
  return <div className={styles.formGrid}><label>Start Date<input type="date" value={values.startDate} aria-invalid={Boolean(errors.startDate)} onChange={(e) => setValues({ ...values, startDate: e.target.value, endDate: values.endDate || e.target.value })} />{errors.startDate && <span>{errors.startDate}</span>}</label><label>End Date<input type="date" value={values.endDate} aria-invalid={Boolean(errors.endDate)} onChange={(e) => setValues({ ...values, endDate: e.target.value })} />{errors.endDate && <span>{errors.endDate}</span>}</label></div>;
}

function OverlayForm({ kind, initial, classes, onSave, onCancel }) {
  const today = getDateKey(new Date());
  const defaults = kind === "teacher" ? { startDate: today, endDate: today, note: "" } : kind === "class" ? { classIds: [], startDate: today, endDate: today, reason: "" } : { type: "public-holiday", startDate: today, endDate: today, note: "" };
  const [values, setValues] = useState(initial ?? defaults);
  const [errors, setErrors] = useState({});
  function submit(event) { event.preventDefault(); const result = onSave(values); if (!result.ok) setErrors(result.errors); }
  const title = kind === "teacher" ? "Teacher Absence" : kind === "class" ? "Class Absence" : "Calendar Exception";
  return <form className={styles.overlayForm} onSubmit={submit} noValidate><h2>{initial?.id ? `Edit ${title}` : `Add ${title}`}</h2>
    {kind === "exception" && <label>Type<select value={values.type} aria-invalid={Boolean(errors.type)} onChange={(e) => setValues({ ...values, type: e.target.value })}>{CALENDAR_EXCEPTION_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{errors.type && <span>{errors.type}</span>}</label>}
    {kind === "class" && <fieldset><legend>Classes</legend><div className={styles.classChecks}>{classes.filter((item) => !item.archived).map((classItem) => { const colour = getClassColourOption(classItem.colour); return <label key={classItem.id} style={{ "--check-colour": colour.border }}><input type="checkbox" checked={values.classIds.includes(classItem.id)} onChange={(e) => setValues({ ...values, classIds: e.target.checked ? [...values.classIds, classItem.id] : values.classIds.filter((id) => id !== classItem.id) })} /><span><strong>{classItem.shortCode}</strong>{classItem.name}</span></label>; })}</div>{errors.classIds && <span>{errors.classIds}</span>}</fieldset>}
    <RangeFields values={values} setValues={setValues} errors={errors} />
    {kind === "class" ? <label>Reason<textarea maxLength={200} rows={3} value={values.reason} aria-invalid={Boolean(errors.reason)} onChange={(e) => setValues({ ...values, reason: e.target.value })} />{errors.reason && <span>{errors.reason}</span>}</label> : <label>{kind === "exception" && values.type === "other" ? "Note (required)" : "Note (optional)"}<textarea maxLength={200} rows={3} value={values.note} aria-invalid={Boolean(errors.note)} onChange={(e) => setValues({ ...values, note: e.target.value })} />{errors.note && <span>{errors.note}</span>}</label>}
    <div className={styles.formActions}><button type="button" className={styles.secondary} onClick={onCancel}>Cancel</button><button className={styles.primary}>Save</button></div>
  </form>;
}

function formatRange(record) { return record.startDate === record.endDate ? formatCalendarDate(record.startDate, { year: "numeric" }) : `${formatCalendarDate(record.startDate)} – ${formatCalendarDate(record.endDate, { year: "numeric" })}`; }

export default function OverlayManager({ mode }) {
  const data = useSchoolData();
  const [form, setForm] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const kind = form?.kind;
  function save(values) { const fn = kind === "teacher" ? data.saveTeacherAbsence : kind === "class" ? data.saveClassAbsence : data.saveCalendarException; const result = fn({ ...form.record, ...values }); if (result.ok) setForm(null); return result; }
  function remove() { const fn = removeTarget.kind === "teacher" ? data.removeTeacherAbsence : removeTarget.kind === "class" ? data.removeClassAbsence : data.removeCalendarException; fn(removeTarget.record.id); setRemoveTarget(null); }
  const teacherRecords = [...data.teacherAbsences].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const classRecords = [...data.classAbsences].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const exceptionRecords = [...data.calendarExceptions].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const card = (record, recordKind, heading, detail) => <article className={styles.overlayCard} key={record.id}><div><strong>{heading}</strong><span>{formatRange(record)}</span>{detail && <p>{detail}</p>}</div><div><button className={styles.textButton} onClick={() => setForm({ kind: recordKind, record })}>Edit</button><button className={styles.dangerText} onClick={() => setRemoveTarget({ kind: recordKind, record })}>Remove</button></div></article>;
  return <section className={styles.overlaySection}>
    {mode === "absences" ? <><div className={styles.heading}><div><h2>Teacher Absence</h2><p>Cancel dated class lessons while leaving plans and statuses untouched.</p></div><button className={styles.primary} onClick={() => setForm({ kind: "teacher", record: null })}>I&apos;m Away</button></div><div className={styles.overlayList}>{teacherRecords.length ? teacherRecords.map((record) => card(record, "teacher", "Teacher away", record.note)) : <p className={styles.emptyOverlay}>No teacher absences.</p>}</div><div className={styles.heading}><div><h2>Class Absence</h2><p>Record one or more classes as unavailable.</p></div><button className={styles.primary} onClick={() => setForm({ kind: "class", record: null })}>Add Class Absence</button></div><div className={styles.overlayList}>{classRecords.length ? classRecords.map((record) => card(record, "class", record.classIds.map((id) => data.classes.find((item) => item.id === id)?.shortCode ?? id).join(", "), record.reason)) : <p className={styles.emptyOverlay}>No class absences.</p>}</div></> : <><div className={styles.heading}><div><h2>Calendar Exceptions</h2><p>Cancel class lessons on date-specific school closures and events.</p></div><button className={styles.primary} onClick={() => setForm({ kind: "exception", record: null })}>Add Exception</button></div><div className={styles.overlayList}>{exceptionRecords.length ? exceptionRecords.map((record) => card(record, "exception", getExceptionTypeLabel(record.type), record.note)) : <p className={styles.emptyOverlay}>No calendar exceptions.</p>}</div></>}
    {form && <OverlayForm key={`${kind}-${form.record?.id ?? "new"}`} kind={kind} initial={form.record} classes={data.classes} onSave={save} onCancel={() => setForm(null)} />}
    {removeTarget && <ModalDialog className={styles.confirmDialog} labelledBy="overlay-remove-title" describedBy="overlay-remove-description" onClose={() => setRemoveTarget(null)}><h2 id="overlay-remove-title">Remove this record?</h2><p id="overlay-remove-description">Removing the overlay restores every affected lesson&apos;s underlying status and plan.</p><div className={styles.formActions}><button className={styles.secondary} onClick={() => setRemoveTarget(null)}>Cancel</button><button className={styles.danger} onClick={remove}>Remove</button></div></ModalDialog>}
  </section>;
}
