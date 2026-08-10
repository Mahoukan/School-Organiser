import { useEffect, useRef } from "react";

import styles from "./lessons.module.css";

export default function UnsavedChangesDialog({ onKeepEditing, onDiscard }) {
  const keepEditingRef = useRef(null);

  useEffect(() => {
    keepEditingRef.current?.focus();
  }, []);

  return (
    <div className={styles.confirmOverlay}>
      <div
        className={styles.confirmDialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="discard-title"
        aria-describedby="discard-description"
      >
        <h3 id="discard-title">Discard unsaved changes?</h3>
        <p id="discard-description">
          Your changes to this lesson have not been saved.
        </p>
        <div className={styles.confirmActions}>
          <button
            ref={keepEditingRef}
            type="button"
            className={styles.secondaryButton}
            onClick={onKeepEditing}
          >
            Keep Editing
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={onDiscard}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}
