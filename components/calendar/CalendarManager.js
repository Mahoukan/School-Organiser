"use client";

import { useState } from "react";

import { formatCalendarDate } from "../../lib/academicCalendar";
import ModalDialog from "../classes/ModalDialog";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./calendar.module.css";

const emptyTerm = { name: "", startDate: "", endDate: "" };

function TermForm({ initial, onSave, onCancel }) {
  const [values, setValues] = useState(initial ?? emptyTerm);
  const [errors, setErrors] = useState({});
  function submit(event) {
    event.preventDefault();
    const result = onSave(values);
    if (!result.ok) setErrors(result.errors);
  }
  return (
    <form className={styles.editor} onSubmit={submit} noValidate>
      <h2>{initial?.id ? "Edit term" : "Add term"}</h2>
      <div className={styles.formGrid}>
        <label>Name<input maxLength={50} value={values.name} aria-invalid={Boolean(errors.name)} onChange={(e) => setValues({ ...values, name: e.target.value })} />{errors.name && <span>{errors.name}</span>}</label>
        <label>Start Date<input type="date" value={values.startDate} aria-invalid={Boolean(errors.startDate || errors.dateRange)} onChange={(e) => setValues({ ...values, startDate: e.target.value })} />{errors.startDate && <span>{errors.startDate}</span>}</label>
        <label>End Date<input type="date" value={values.endDate} aria-invalid={Boolean(errors.endDate || errors.dateRange)} onChange={(e) => setValues({ ...values, endDate: e.target.value })} />{errors.endDate && <span>{errors.endDate}</span>}</label>
      </div>
      {errors.dateRange && <p className={styles.formError}>{errors.dateRange}</p>}
      <div className={styles.formActions}><button type="button" className={styles.secondary} onClick={onCancel}>Cancel</button><button className={styles.primary}>Save Term</button></div>
    </form>
  );
}

function WeekForm({ term, initial, onSave, onCancel }) {
  const [values, setValues] = useState(initial ?? { termId: term.id, weekStartDate: "", cycleWeek: "A" });
  const [errors, setErrors] = useState({});
  function submit(event) {
    event.preventDefault();
    const result = onSave(values);
    if (!result.ok) setErrors(result.errors);
  }
  return (
    <form className={styles.weekEditor} onSubmit={submit} noValidate>
      <strong>{initial?.id ? "Edit teaching week" : "Add teaching week"}</strong>
      <label>Monday / Start Date<input type="date" value={values.weekStartDate} aria-invalid={Boolean(errors.weekStartDate)} onChange={(e) => setValues({ ...values, weekStartDate: e.target.value })} />{errors.weekStartDate && <span>{errors.weekStartDate}</span>}</label>
      <fieldset><legend>Cycle week</legend><div className={styles.cycleSelector}>{["A", "B"].map((cycle) => <button key={cycle} type="button" aria-pressed={values.cycleWeek === cycle} onClick={() => setValues({ ...values, cycleWeek: cycle })}>Week {cycle}</button>)}</div></fieldset>
      <div className={styles.formActions}><button type="button" className={styles.secondary} onClick={onCancel}>Cancel</button><button className={styles.primary}>Save Week</button></div>
    </form>
  );
}

function TermCard({ term, weeks, onEditTerm, onRemoveTerm, onEditWeek, onAddWeek, onRemoveWeek, onGenerate }) {
  const [firstCycle, setFirstCycle] = useState("A");
  return (
    <article className={styles.termCard}>
      <header><div><h2>{term.name}</h2><p>{formatCalendarDate(term.startDate)} – {formatCalendarDate(term.endDate, { year: "numeric" })}</p><span>{weeks.length} teaching {weeks.length === 1 ? "week" : "weeks"}</span></div><div className={styles.cardActions}><button className={styles.secondary} onClick={() => onEditTerm(term)}>Edit</button><button className={styles.dangerText} onClick={() => onRemoveTerm(term, weeks.length)}>Remove</button></div></header>
      <div className={styles.weekList}>
        {weeks.length ? weeks.map((week) => <div className={styles.weekRow} key={week.id}><span>Week beginning <strong>{formatCalendarDate(week.weekStartDate)}</strong></span><span className={styles.weekBadge}>Week {week.cycleWeek}</span><div><button className={styles.textButton} onClick={() => onEditWeek(week)}>Edit</button><button className={styles.textButton} onClick={() => onRemoveWeek(week)}>Remove</button></div></div>) : <p className={styles.emptyWeeks}>No teaching weeks configured.</p>}
      </div>
      <footer><button className={styles.secondary} onClick={() => onAddWeek(term)}>+ Add Week</button><div className={styles.generate}><span>First generated week</span><div className={styles.cycleSelector}>{["A", "B"].map((cycle) => <button key={cycle} type="button" aria-pressed={firstCycle === cycle} onClick={() => setFirstCycle(cycle)}>Week {cycle}</button>)}</div><button className={styles.primary} onClick={() => onGenerate(term.id, firstCycle)}>Generate Teaching Weeks</button></div></footer>
    </article>
  );
}

export default function CalendarManager() {
  const { academicYear, terms, teachingWeeks, saveTerm, removeTerm, saveTeachingWeek, removeTeachingWeek, generateTeachingWeeks } = useSchoolData();
  const [termForm, setTermForm] = useState(null);
  const [weekForm, setWeekForm] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [message, setMessage] = useState("");
  const sortedTerms = [...terms].sort((a, b) => a.displayOrder - b.displayOrder || a.startDate.localeCompare(b.startDate));
  function saveCurrentTerm(values) { const result = saveTerm({ ...termForm, ...values }); if (result.ok) setTermForm(null); return result; }
  function saveCurrentWeek(values) { const result = saveTeachingWeek({ ...weekForm, ...values }); if (result.ok) setWeekForm(null); return result; }
  function askRemoveTerm(term, count) { if (count) { setMessage("Remove this term's teaching weeks before removing the term."); return; } setConfirmation({ type: "term", item: term }); }
  function confirmRemove() { if (confirmation.type === "term") removeTerm(confirmation.item.id); else removeTeachingWeek(confirmation.item.id); setConfirmation(null); }
  function generate(termId, firstCycle) { const count = generateTeachingWeeks(termId, firstCycle); setMessage(count ? `${count} missing teaching weeks generated.` : "All complete Mondays are already configured; nothing was overwritten."); }
  return (
    <section className={styles.page}>
      <div className={styles.yearSummary}><span>Academic Year</span><strong>{academicYear.name}</strong></div>
      <div className={styles.heading}><div><h2>Terms</h2><p>Configure real teaching weeks and their Week A/B templates.</p></div><button className={styles.primary} onClick={() => { setTermForm({ ...emptyTerm }); setWeekForm(null); }}>Add Term</button></div>
      {message && <p className={styles.notice} role="status">{message}</p>}
      {termForm && <TermForm key={termForm.id ?? "new"} initial={termForm} onSave={saveCurrentTerm} onCancel={() => setTermForm(null)} />}
      {weekForm && <WeekForm key={weekForm.id ?? `new-${weekForm.termId}`} term={terms.find((term) => term.id === weekForm.termId)} initial={weekForm.id ? weekForm : null} onSave={saveCurrentWeek} onCancel={() => setWeekForm(null)} />}
      <div className={styles.termList}>{sortedTerms.map((term) => <TermCard key={term.id} term={term} weeks={teachingWeeks.filter((week) => week.termId === term.id).sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))} onEditTerm={(item) => { setTermForm(item); setWeekForm(null); }} onRemoveTerm={askRemoveTerm} onEditWeek={(week) => { setWeekForm(week); setTermForm(null); }} onAddWeek={(item) => { setWeekForm({ termId: item.id, weekStartDate: "", cycleWeek: "A" }); setTermForm(null); }} onRemoveWeek={(week) => setConfirmation({ type: "week", item: week })} onGenerate={generate} />)}</div>
      {confirmation && <ModalDialog className={styles.confirmDialog} labelledBy="calendar-confirm-title" describedBy="calendar-confirm-description" onClose={() => setConfirmation(null)}><h2 id="calendar-confirm-title">Remove {confirmation.type === "term" ? "term" : "teaching week"}?</h2><p id="calendar-confirm-description">This removes the calendar configuration only. Recurring assignments and lesson occurrences remain unchanged.</p><div className={styles.formActions}><button className={styles.secondary} onClick={() => setConfirmation(null)}>Cancel</button><button className={styles.danger} onClick={confirmRemove}>Remove</button></div></ModalDialog>}
    </section>
  );
}
