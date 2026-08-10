import { useEffect, useRef } from "react";

import { getDateFromKey } from "../../lib/lessonOccurrences";
import { formatDayHeading } from "../../lib/timetableDates";
import { formatBlockTime } from "../../lib/periodStructures";
import styles from "./lessons.module.css";

export default function CarryForwardDialog({
  classDetails,
  destination,
  period,
  replacesPlan,
  onCancel,
  onConfirm,
}) {
  const cancelButtonRef = useRef(null);
  const date = getDateFromKey(destination.date);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  return (
    <div className={styles.confirmOverlay}>
      <div
        className={styles.confirmDialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="carry-forward-title"
        aria-describedby="carry-forward-description carry-forward-destination"
      >
        <h3 id="carry-forward-title">
          {replacesPlan ? "Replace the next lesson plan?" : "Carry this lesson forward?"}
        </h3>
        <p id="carry-forward-description">
          {replacesPlan
            ? `The next ${classDetails.shortCode} lesson already has planning content. Its title, summary and full plan will be replaced.`
            : "The title, summary and Markdown plan will be copied. The original lesson will remain unchanged."}
        </p>
        <div id="carry-forward-destination" className={styles.carryDestination}>
          <strong>Next {classDetails.shortCode} lesson</strong>
          <span>{formatDayHeading(date)}</span>
          <span>
            {period.name} · {formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}
          </span>
        </div>
        <div className={styles.confirmActions}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onConfirm}
          >
            {replacesPlan ? "Replace Plan" : "Carry Forward"}
          </button>
        </div>
      </div>
    </div>
  );
}
