import { useEffect, useMemo, useRef, useState } from "react";

import { getClassColourOption } from "../../data/sampleClasses";
import { periods } from "../../data/sampleTimetable";
import { getDateFromKey } from "../../lib/lessonOccurrences";
import { formatDayHeading, getWeekType } from "../../lib/timetableDates";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./lessons.module.css";
import UnsavedChangesDialog from "./UnsavedChangesDialog";

const emptyContent = { title: "", summary: "", plan: "" };

function getPeriodName(period) {
  const periodNumber = period.label.match(/^P(\d+)$/)?.[1];
  return periodNumber ? `Period ${periodNumber}` : period.label;
}

function getDraft(occurrence) {
  return occurrence
    ? {
        title: occurrence.title,
        summary: occurrence.summary,
        plan: occurrence.plan,
      }
    : { ...emptyContent };
}

export default function LessonPanel({ selection, onClose }) {
  const {
    classes,
    getLessonOccurrence,
    saveLessonOccurrence,
  } = useSchoolData();
  const dialogRef = useRef(null);
  const titleInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [draft, setDraft] = useState(emptyContent);
  const [errors, setErrors] = useState({});

  const occurrence = getLessonOccurrence(
    selection.date,
    selection.recurringAssignmentId,
  );
  const savedContent = useMemo(() => getDraft(occurrence), [occurrence]);
  const classDetails = classes.find(
    (classItem) => classItem.id === selection.classId,
  );
  const period = periods.find((item) => item.id === selection.periodId);
  const date = getDateFromKey(selection.date);
  const isDirty =
    draft.title !== savedContent.title ||
    draft.summary !== savedContent.summary ||
    draft.plan !== savedContent.plan;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
  }, []);

  if (!classDetails || !period) return null;

  const colour = getClassColourOption(classDetails.colour);

  function beginEditing() {
    setDraft(savedContent);
    setErrors({});
    setIsEditing(true);
    requestAnimationFrame(() => titleInputRef.current?.focus());
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function cancelEditing() {
    setDraft(savedContent);
    setErrors({});
    setIsEditing(false);
  }

  function saveLesson(event) {
    event.preventDefault();
    const nextErrors = {};
    if (draft.title.length > 100) {
      nextErrors.title = "Lesson title must be 100 characters or fewer.";
    }
    if (draft.summary.length > 160) {
      nextErrors.summary = "Short summary must be 160 characters or fewer.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    saveLessonOccurrence({
      ...selection,
      ...draft,
    });
    setIsEditing(false);
  }

  function requestClose() {
    if (isEditing && isDirty) {
      setShowDiscardConfirmation(true);
      return;
    }
    onClose();
  }

  function keepEditing() {
    setShowDiscardConfirmation(false);
    requestAnimationFrame(() => titleInputRef.current?.focus());
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.lessonDialog}
      aria-labelledby="lesson-panel-title"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      style={{
        "--lesson-accent": classDetails.colour,
        "--lesson-tint": colour.background,
        "--lesson-border": colour.border,
      }}
    >
      <div
        className={styles.lessonPanel}
        inert={showDiscardConfirmation ? true : undefined}
      >
        <header className={styles.panelHeader}>
          <div className={styles.classHeading}>
            <span className={styles.classSwatch} aria-hidden="true" />
            <div>
              <p>Lesson details</p>
              <h2 id="lesson-panel-title">{classDetails.shortCode}</h2>
              <span>{classDetails.name}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close lesson details"
            onClick={requestClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className={styles.lessonContext}>
          <strong>{formatDayHeading(date)}</strong>
          <span>
            Week {getWeekType(date)} · {getPeriodName(period)} · {period.start}–{period.end}
          </span>
          <span>{classDetails.room ? `Room ${classDetails.room}` : "No room set"}</span>
        </div>

        {isEditing ? (
          <form className={styles.lessonForm} onSubmit={saveLesson} noValidate>
            <div className={styles.formBody}>
              <div className={styles.formField}>
                <label htmlFor="lesson-title">Lesson Title</label>
                <input
                  ref={titleInputRef}
                  id="lesson-title"
                  type="text"
                  maxLength={100}
                  value={draft.title}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? "lesson-title-error" : undefined}
                  onChange={(event) => updateDraft("title", event.target.value)}
                />
                {errors.title && (
                  <p id="lesson-title-error" className={styles.fieldError}>
                    {errors.title}
                  </p>
                )}
              </div>

              <div className={styles.formField}>
                <div className={styles.fieldLabelRow}>
                  <label htmlFor="lesson-summary">Short Summary</label>
                  <span id="summary-count" aria-live="polite">
                    {draft.summary.length} / 160
                  </span>
                </div>
                <textarea
                  id="lesson-summary"
                  rows={3}
                  maxLength={160}
                  value={draft.summary}
                  aria-invalid={Boolean(errors.summary)}
                  aria-describedby={`summary-count${errors.summary ? " lesson-summary-error" : ""}`}
                  onChange={(event) => updateDraft("summary", event.target.value)}
                />
                {errors.summary && (
                  <p id="lesson-summary-error" className={styles.fieldError}>
                    {errors.summary}
                  </p>
                )}
              </div>

              <div className={styles.formField}>
                <label htmlFor="lesson-plan">Full Lesson Plan</label>
                <textarea
                  id="lesson-plan"
                  className={styles.planTextarea}
                  value={draft.plan}
                  onChange={(event) => updateDraft("plan", event.target.value)}
                />
              </div>
            </div>
            <footer className={styles.panelFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={cancelEditing}
              >
                Cancel
              </button>
              <button type="submit" className={styles.primaryButton}>
                Save Lesson
              </button>
            </footer>
          </form>
        ) : (
          <>
            <div className={styles.lessonBody}>
              {occurrence ? (
                <div className={styles.savedLesson}>
                  {occurrence.title && <h3>{occurrence.title}</h3>}
                  {occurrence.summary && (
                    <section>
                      <h4>Short Summary</h4>
                      <p>{occurrence.summary}</p>
                    </section>
                  )}
                  {occurrence.plan.trim() && (
                    <section>
                      <h4>Full Lesson Plan</h4>
                      <p className={styles.plainPlan}>{occurrence.plan}</p>
                    </section>
                  )}
                </div>
              ) : (
                <div className={styles.emptyLesson}>
                  <h3>No lesson plan yet.</h3>
                  <p>
                    Add a title, short summary and full plan for this lesson.
                  </p>
                </div>
              )}
            </div>
            <footer className={styles.panelFooter}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={beginEditing}
              >
                {occurrence ? "Edit Lesson" : "Add Lesson Plan"}
              </button>
            </footer>
          </>
        )}
      </div>

      {showDiscardConfirmation && (
        <UnsavedChangesDialog
          onKeepEditing={keepEditing}
          onDiscard={onClose}
        />
      )}
    </dialog>
  );
}
