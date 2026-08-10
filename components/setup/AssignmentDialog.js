import Link from "next/link";

import { getClassColourOption } from "../../data/sampleClasses";
import ModalDialog from "../classes/ModalDialog";
import styles from "./setup.module.css";

function sortClasses(classes) {
  return [...classes].sort((first, second) =>
    first.shortCode.localeCompare(second.shortCode, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

export default function AssignmentDialog({
  slot,
  classes,
  assignedClassId,
  onSelect,
  onClose,
}) {
  const activeClasses = sortClasses(
    classes.filter((classItem) => !classItem.archived),
  );

  return (
    <ModalDialog
      className={styles.assignmentDialog}
      labelledBy="assignment-dialog-title"
      describedBy="assignment-dialog-description"
      onClose={onClose}
    >
      <header className={styles.dialogHeader}>
        <div>
          <p>Week {slot.cycleWeek}</p>
          <h2 id="assignment-dialog-title">
            {slot.weekdayLabel} · {slot.period.name}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close class selector"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <p id="assignment-dialog-description" className={styles.dialogDescription}>
        Choose an active class for this recurring timetable slot.
      </p>

      {activeClasses.length === 0 ? (
        <div className={styles.noClasses}>
          <p>No active classes available.</p>
          <Link href="/classes" onClick={onClose}>
            Go to Classes
          </Link>
        </div>
      ) : (
        <div className={styles.classChoices}>
          {activeClasses.map((classItem) => {
            const colour = getClassColourOption(classItem.colour);
            const selected = assignedClassId === classItem.id;
            return (
              <button
                key={classItem.id}
                type="button"
                className={styles.classChoice}
                aria-pressed={selected}
                style={{
                  "--choice-accent": classItem.colour,
                  "--choice-background": colour.background,
                  "--choice-border": colour.border,
                }}
                onClick={() => onSelect(classItem.id)}
              >
                <span className={styles.choiceSwatch} aria-hidden="true" />
                <span>
                  <strong>{classItem.shortCode}</strong>
                  <small>{classItem.name}</small>
                </span>
                {selected && <em>Current</em>}
              </button>
            );
          })}
        </div>
      )}
    </ModalDialog>
  );
}
