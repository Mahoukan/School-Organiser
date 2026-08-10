"use client";

import { useState } from "react";
import { weekdays } from "../../data/sampleTimetable";
import { formatBlockTime, getBlocksForDay } from "../../lib/periodStructures";
import ModalDialog from "../classes/ModalDialog";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./setup.module.css";

function BlockForm({ initial, cycleWeek, weekday, onSave, onCancel }) {
  const [values, setValues] = useState(initial ?? { cycleWeek, weekday, name: "", startTime: "", endTime: "", isTeaching: true });
  const [errors, setErrors] = useState({});
  function submit(event) { event.preventDefault(); const result = onSave(values); if (!result.ok) setErrors(result.errors); }
  return <form className={styles.blockForm} onSubmit={submit} noValidate>
    <h3>{initial ? "Edit Block" : "Add Block"}</h3><p>Week {cycleWeek} · {weekdays.find((day) => day.key === weekday).label}</p>
    <label>Name<input maxLength={40} value={values.name} aria-invalid={Boolean(errors.name)} onChange={(e) => setValues({ ...values, name: e.target.value })} />{errors.name && <span>{errors.name}</span>}</label>
    <div className={styles.timeFields}><label>Start Time<input type="time" value={values.startTime} aria-invalid={Boolean(errors.startTime || errors.timeRange)} onChange={(e) => setValues({ ...values, startTime: e.target.value })} />{errors.startTime && <span>{errors.startTime}</span>}</label><label>End Time<input type="time" value={values.endTime} aria-invalid={Boolean(errors.endTime || errors.timeRange)} onChange={(e) => setValues({ ...values, endTime: e.target.value })} />{errors.endTime && <span>{errors.endTime}</span>}</label></div>
    {errors.timeRange && <p className={styles.setupError}>{errors.timeRange}</p>}
    <fieldset><legend>Block Type</legend><div className={styles.typeSelector}>{[[true, "Teaching period"], [false, "Non-teaching block"]].map(([value, label]) => <button key={label} type="button" aria-pressed={values.isTeaching === value} onClick={() => setValues({ ...values, isTeaching: value })}>{label}</button>)}</div>{errors.isTeaching && <span>{errors.isTeaching}</span>}</fieldset>
    <div className={styles.formActions}><button type="button" className={styles.secondarySetupButton} onClick={onCancel}>Cancel</button><button className={styles.primarySetupButton}>Save Block</button></div>
  </form>;
}

export default function PeriodStructureManager() {
  const { timetableBlocks, saveTimetableBlock, removeTimetableBlock, moveTimetableBlock } = useSchoolData();
  const [cycleWeek, setCycleWeek] = useState("A");
  const [weekdayIndex, setWeekdayIndex] = useState(0);
  const [form, setForm] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [message, setMessage] = useState("");
  const weekday = weekdays[weekdayIndex];
  const blocks = getBlocksForDay(timetableBlocks, cycleWeek, weekday.key);
  function save(values) { const result = saveTimetableBlock({ ...form, ...values }); if (result.ok) setForm(null); return result; }
  function confirmRemove() { const result = removeTimetableBlock(removeTarget.id); if (!result.ok) setMessage(result.message); setRemoveTarget(null); }
  return <section className={styles.editorSection} aria-labelledby="period-structures-title">
    <div className={styles.sectionHeading}><div><h2 id="period-structures-title">Period Structures</h2><p>Configure when teaching and non-teaching blocks occur.</p></div><div className={styles.weekSelector} aria-label="Cycle week">{["A", "B"].map((week) => <button key={week} type="button" aria-pressed={cycleWeek === week} onClick={() => { setCycleWeek(week); setForm(null); }}>Week {week}</button>)}</div></div>
    <div className={styles.weekdaySelector} aria-label="Weekday">{weekdays.map((day, index) => <button key={day.key} type="button" aria-pressed={weekdayIndex === index} onClick={() => { setWeekdayIndex(index); setForm(null); }}>{day.shortLabel}</button>)}</div>
    <div className={styles.structureHeading}><h3>Week {cycleWeek} · {weekday.label}</h3><button className={styles.primarySetupButton} onClick={() => setForm({ cycleWeek, weekday: weekday.key, name: "", startTime: "", endTime: "", isTeaching: true })}>Add Block</button></div>
    {message && <p className={styles.setupMessage} role="status">{message}</p>}
    {form && <BlockForm key={form.id ?? `new-${cycleWeek}-${weekday.key}`} initial={form.id ? form : null} cycleWeek={cycleWeek} weekday={weekday.key} onSave={save} onCancel={() => setForm(null)} />}
    {blocks.length ? <div className={styles.blockList}>{blocks.map((block, index) => <article className={styles.blockRow} key={block.id}><span className={styles.orderNumber}>{index + 1}</span><div><strong>{block.name}</strong><span>{formatBlockTime(block.startTime)}–{formatBlockTime(block.endTime)}</span><small>{block.isTeaching ? "Teaching period" : "Non-teaching block"}</small></div><div className={styles.blockActions}><button aria-label={`Move ${block.name} up`} disabled={index === 0} onClick={() => moveTimetableBlock(block.id, -1)}>↑</button><button aria-label={`Move ${block.name} down`} disabled={index === blocks.length - 1} onClick={() => moveTimetableBlock(block.id, 1)}>↓</button><button onClick={() => setForm(block)}>Edit</button><button onClick={() => setRemoveTarget(block)}>Remove</button></div></article>)}</div> : <div className={styles.emptyStructure}><p>No timetable blocks configured for this day.</p><button className={styles.primarySetupButton} onClick={() => setForm({ cycleWeek, weekday: weekday.key, name: "", startTime: "", endTime: "", isTeaching: true })}>Add Block</button></div>}
    {removeTarget && <ModalDialog className={styles.blockConfirmDialog} labelledBy="remove-block-title" describedBy="remove-block-description" onClose={() => setRemoveTarget(null)}><h2 id="remove-block-title">Remove {removeTarget.name}?</h2><p id="remove-block-description">This block can only be removed when no recurring class assignment uses it.</p><div className={styles.formActions}><button className={styles.secondarySetupButton} onClick={() => setRemoveTarget(null)}>Cancel</button><button className={styles.dangerSetupButton} onClick={confirmRemove}>Remove Block</button></div></ModalDialog>}
  </section>;
}
