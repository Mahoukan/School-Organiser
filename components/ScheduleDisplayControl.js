import { SCHEDULE_DISPLAY_MODES } from "../lib/userPreferences";
import styles from "./schedule-display-control.module.css";

export default function ScheduleDisplayControl({
  value,
  onChange,
  disabled = false,
  error = "",
  className = "",
}) {
  function select(nextValue) {
    if (nextValue !== value) onChange(nextValue);
  }

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <fieldset className={styles.control} disabled={disabled} aria-busy={disabled || undefined}>
        <legend>Show</legend>
        <div className={styles.segments}>
          {SCHEDULE_DISPLAY_MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => select(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <select
          className={styles.select}
          aria-label="Show schedule items"
          value={value}
          onChange={(event) => select(event.target.value)}
        >
          {SCHEDULE_DISPLAY_MODES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
