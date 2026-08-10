import styles from "./timetable.module.css";

const views = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "fortnight", label: "Fortnight" },
];

export default function TimetableToolbar({
  view,
  dateLabel,
  cycleLabel,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  dateValue,
  onDateChange,
}) {
  const periodName = view === "fortnight" ? "fortnight" : view;

  return (
    <header className={styles.pageHeader}>
      <div className={styles.headingRow}>
        <div>
          <h1 id="timetable-title">Timetable</h1>
          <div className={styles.dateDetails} aria-live="polite">
            <p className={styles.dateLabel}>{dateLabel}</p>
            <span className={styles.cycleBadge}>{cycleLabel}</span>
          </div>
        </div>

        <div className={styles.viewSelector} aria-label="Timetable view">
          {views.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.segmentButton}
              aria-pressed={view === option.id}
              onClick={() => onViewChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.dateNavigation}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={`Previous ${periodName}`}
          onClick={onPrevious}
        >
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" className={styles.todayButton} onClick={onToday}>
          Today
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={`Next ${periodName}`}
          onClick={onNext}
        >
          <span aria-hidden="true">→</span>
        </button>
        <label className={styles.datePicker}>
          <span>Go to date</span>
          <input type="date" value={dateValue} onChange={(event) => onDateChange(event.target.value)} />
        </label>
      </div>
    </header>
  );
}
