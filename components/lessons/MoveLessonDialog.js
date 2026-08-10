import { useEffect, useRef, useState } from "react";
import { formatBlockTime } from "../../lib/periodStructures";
import { formatDayHeading } from "../../lib/timetableDates";
import { getDateFromKey } from "../../lib/lessonOccurrences";
import styles from "./lessons.module.css";

export default function MoveLessonDialog({ classDetails, date, originalBlock, currentBlock, options, onCancel, onSave }) {
  const cancelRef = useRef(null);
  const [destinationPeriodId, setDestinationPeriodId] = useState("");
  const [error, setError] = useState("");
  useEffect(() => cancelRef.current?.focus(), []);
  function submit(event) {
    event.preventDefault();
    const result = onSave(destinationPeriodId);
    if (!result.ok) setError(result.message);
  }
  return <div className={styles.confirmOverlay}>
    <form className={`${styles.confirmDialog} ${styles.moveDialog}`} role="dialog" aria-modal="true" aria-labelledby="move-lesson-title" onSubmit={submit}>
      <h3 id="move-lesson-title">Move {classDetails.shortCode}</h3>
      <p>{formatDayHeading(getDateFromKey(date))}</p>
      <div className={styles.moveContext}>
        <span>Original timetable block</span><strong>{originalBlock.name} · {formatBlockTime(originalBlock.startTime)}–{formatBlockTime(originalBlock.endTime)}</strong>
        {currentBlock.id !== originalBlock.id && <><span>Current moved block</span><strong>{currentBlock.name} · {formatBlockTime(currentBlock.startTime)}–{formatBlockTime(currentBlock.endTime)}</strong></>}
      </div>
      <fieldset className={styles.destinationList}><legend>Move to</legend>
        {options.map((option) => <label key={option.id} className={styles.destinationOption}>
          <input type="radio" name="destination" value={option.id} checked={destinationPeriodId === option.id} disabled={option.state !== "available"} onChange={() => { setDestinationPeriodId(option.id); setError(""); }} />
          <span><strong>{option.name} · {formatBlockTime(option.startTime)}–{formatBlockTime(option.endTime)}</strong><small>{option.state === "current" ? "Current" : option.state === "occupied" ? "Occupied" : "Available"}</small></span>
        </label>)}
      </fieldset>
      {error && <p className={styles.feedbackError} role="alert">{error}</p>}
      <div className={styles.confirmActions}><button ref={cancelRef} type="button" className={styles.secondaryButton} onClick={onCancel}>Cancel</button><button className={styles.primaryButton} disabled={!destinationPeriodId}>Move Lesson</button></div>
    </form>
  </div>;
}
