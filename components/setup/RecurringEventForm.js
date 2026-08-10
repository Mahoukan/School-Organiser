import { useState } from "react";
import { RECURRING_EVENT_COLOURS, RECURRING_EVENT_TYPES } from "../../lib/recurringEvents";
import ModalDialog from "../classes/ModalDialog";
import styles from "./setup.module.css";

export default function RecurringEventForm({ slot, event, onSave, onRemove, onClose }) {
  const initialType = event?.type ?? "duty";
  const [values, setValues] = useState(event ?? { type: initialType, title: "Duty", detail: "", colour: RECURRING_EVENT_TYPES.find((item) => item.value === initialType).colour });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  function changeType(type) {
    const option = RECURRING_EVENT_TYPES.find((item) => item.value === type);
    setValues((current) => ({ ...current, type, title: current.title === RECURRING_EVENT_TYPES.find((item) => item.value === current.type)?.label ? option.label : current.title, colour: event ? current.colour : option.colour }));
  }
  async function submit(formEvent) {
    formEvent.preventDefault();
    if (saving) return;
    setSaving(true);
    const result = await onSave({ ...values, id: event?.id, cycleWeek: slot.cycleWeek, weekday: slot.weekday, periodId: slot.period.id });
    setSaving(false);
    if (!result.ok) setErrors(result.errors);
  }
  return <ModalDialog className={styles.eventDialog} labelledBy="event-form-title" describedBy="event-form-context" onClose={onClose}>
    <form className={styles.eventForm} onSubmit={submit} noValidate>
      <header className={styles.dialogHeader}><div><p>{event ? "Edit recurring item" : "Add non-class item"}</p><h2 id="event-form-title">{slot.period.name}</h2></div><button type="button" aria-label="Close non-class item form" onClick={onClose}>×</button></header>
      <p id="event-form-context" className={styles.dialogDescription}>Week {slot.cycleWeek} · {slot.weekdayLabel} · {slot.period.name}</p>
      <div className={styles.eventFormBody}>
        <label>Type<select value={values.type} aria-invalid={Boolean(errors.type)} onChange={(e) => changeType(e.target.value)}>{RECURRING_EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select>{errors.type && <span>{errors.type}</span>}</label>
        <label>Title<input maxLength={100} value={values.title} aria-invalid={Boolean(errors.title)} onChange={(e) => setValues({ ...values, title: e.target.value })} />{errors.title && <span>{errors.title}</span>}</label>
        <label>Detail or location (optional)<textarea rows={3} maxLength={160} value={values.detail} aria-invalid={Boolean(errors.detail)} onChange={(e) => setValues({ ...values, detail: e.target.value })} />{errors.detail && <span>{errors.detail}</span>}</label>
        <fieldset><legend>Colour</legend><div className={styles.eventColours}>{RECURRING_EVENT_COLOURS.map((colour) => <label key={colour.value} style={{ "--event-colour": colour.value }}><input type="radio" name="event-colour" value={colour.value} checked={values.colour === colour.value} onChange={() => setValues({ ...values, colour: colour.value })} /><span>{colour.label}</span></label>)}</div>{errors.colour && <span>{errors.colour}</span>}</fieldset>
        {errors.periodId && <p className={styles.setupError}>{errors.periodId}</p>}
      </div>
      <div className={styles.formActions}>{event && <button type="button" className={styles.dangerSetupButton} onClick={() => onRemove(event)} disabled={saving}>Remove</button>}<button type="button" className={styles.secondarySetupButton} onClick={onClose} disabled={saving}>Cancel</button><button className={styles.primarySetupButton} disabled={saving}>{saving ? "Saving…" : "Save Item"}</button></div>
    </form>
  </ModalDialog>;
}
