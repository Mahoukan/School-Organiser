import { useEffect, useMemo, useRef, useState } from "react";

import { getClassColourOption } from "../../data/sampleClasses";
import {
  CANCELLATION_REASONS,
  LESSON_STATUSES,
  getCancellationReasonLabel,
  getDateFromKey,
  getEffectiveLessonStatus,
  getLessonStatusLabel,
  hasLessonPlanContent,
} from "../../lib/lessonOccurrences";
import {
  findNextClassOccurrence,
  getCarryForwardAvailability,
} from "../../lib/carryForward";
import { getTeachingWeekForDate } from "../../lib/academicCalendar";
import { formatBlockTime, resolveTimetableBlock } from "../../lib/periodStructures";
import { formatDayHeading } from "../../lib/timetableDates";
import { useSchoolData } from "../providers/SchoolDataProvider";
import CarryForwardDialog from "./CarryForwardDialog";
import MarkdownContent from "./MarkdownContent";
import styles from "./lessons.module.css";
import UnsavedChangesDialog from "./UnsavedChangesDialog";

const emptyContent = {
  title: "",
  summary: "",
  plan: "",
  status: "planned",
  cancellationReason: "",
  cancellationNote: "",
};

function getDraft(occurrence) {
  return occurrence
    ? {
        title: occurrence.title,
        summary: occurrence.summary,
        plan: occurrence.plan,
        status: getEffectiveLessonStatus(occurrence),
        cancellationReason: occurrence.cancellationReason ?? "",
        cancellationNote: occurrence.cancellationNote ?? "",
      }
    : { ...emptyContent };
}

export default function LessonPanel({ selection, onClose }) {
  const {
    classes,
    recurringAssignments,
    lessonOccurrences,
    teachingWeeks,
    timetableBlocks,
    getLessonOccurrence,
    saveLessonOccurrence,
  } = useSchoolData();
  const dialogRef = useRef(null);
  const titleInputRef = useRef(null);
  const carryForwardButtonRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [draft, setDraft] = useState(emptyContent);
  const [errors, setErrors] = useState({});
  const [planMode, setPlanMode] = useState("write");
  const [carryTarget, setCarryTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const occurrence = getLessonOccurrence(
    selection.date,
    selection.recurringAssignmentId,
  );
  const savedContent = useMemo(() => getDraft(occurrence), [occurrence]);
  const classDetails = classes.find(
    (classItem) => classItem.id === selection.classId,
  );
  const period = resolveTimetableBlock(timetableBlocks, selection.periodId);
  const date = getDateFromKey(selection.date);
  const effectiveStatus = getEffectiveLessonStatus(occurrence);
  const teachingWeek = getTeachingWeekForDate(date, teachingWeeks);
  const isDirty = Object.keys(emptyContent).some(
    (field) => draft[field] !== savedContent[field],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
  }, []);

  if (!classDetails || !period) return null;

  const colour = getClassColourOption(classDetails.colour);

  function beginEditing() {
    setDraft(savedContent);
    setErrors({});
    setFeedback(null);
    setPlanMode("write");
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
    setPlanMode("write");
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
    if (draft.status === "cancelled" && !draft.cancellationReason) {
      nextErrors.cancellationReason = "Choose a cancellation reason.";
    }
    if (draft.cancellationNote.length > 200) {
      nextErrors.cancellationNote =
        "Cancellation note must be 200 characters or fewer.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    saveLessonOccurrence({
      ...selection,
      ...draft,
    });
    setIsEditing(false);
  }

  function requestCarryForward() {
    if (!occurrence || !hasLessonPlanContent(occurrence)) {
      setFeedback({
        type: "error",
        message: "There is no lesson-plan content to carry forward.",
      });
      return;
    }

    const destination = findNextClassOccurrence({
      classId: selection.classId,
      currentDate: selection.date,
      currentPeriodId: selection.periodId,
      recurringAssignments,
      lessonOccurrences,
      teachingWeeks,
      timetableBlocks,
    });

    if (!destination) {
      setFeedback({
        type: "error",
        message: `No upcoming occurrence of ${classDetails.shortCode} was found.`,
      });
      return;
    }

    const availability = getCarryForwardAvailability(destination);
    if (!availability.canCarry) {
      setFeedback({
        type: "error",
        message:
          "The next lesson already has a recorded teaching status and cannot be replaced automatically.",
      });
      return;
    }

    setFeedback(null);
    setCarryTarget({ ...destination, ...availability });
  }

  function closeCarryForward() {
    setCarryTarget(null);
    requestAnimationFrame(() => carryForwardButtonRef.current?.focus());
  }

  function confirmCarryForward() {
    const destinationPeriod = resolveTimetableBlock(
      timetableBlocks,
      carryTarget.periodId,
    );

    saveLessonOccurrence({
      date: carryTarget.date,
      recurringAssignmentId: carryTarget.recurringAssignmentId,
      classId: carryTarget.classId,
      periodId: carryTarget.periodId,
      title: occurrence.title,
      summary: occurrence.summary,
      plan: occurrence.plan,
      status: "planned",
      cancellationReason: "",
      cancellationNote: "",
    });
    setCarryTarget(null);
    setFeedback({
      type: "success",
      message: `Lesson carried forward to ${formatDayHeading(
        getDateFromKey(carryTarget.date),
      )}, ${destinationPeriod.name}.`,
    });
    requestAnimationFrame(() => carryForwardButtonRef.current?.focus());
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
        if (carryTarget) {
          closeCarryForward();
          return;
        }
        if (showDiscardConfirmation) {
          keepEditing();
          return;
        }
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
        inert={showDiscardConfirmation || carryTarget ? true : undefined}
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
            Week {teachingWeek?.cycleWeek ?? "unconfigured"} · {period.name} · {formatBlockTime(period.startTime)}–{formatBlockTime(period.endTime)}
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
                <label htmlFor="lesson-status">Status</label>
                <select
                  id="lesson-status"
                  value={draft.status}
                  onChange={(event) => updateDraft("status", event.target.value)}
                >
                  {LESSON_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {draft.status === "cancelled" && (
                <div className={styles.cancellationFields}>
                  <div className={styles.formField}>
                    <label htmlFor="cancellation-reason">
                      Cancellation Reason
                    </label>
                    <select
                      id="cancellation-reason"
                      value={draft.cancellationReason}
                      aria-invalid={Boolean(errors.cancellationReason)}
                      aria-describedby={
                        errors.cancellationReason
                          ? "cancellation-reason-error"
                          : undefined
                      }
                      onChange={(event) =>
                        updateDraft("cancellationReason", event.target.value)
                      }
                    >
                      <option value="">Choose a reason</option>
                      {CANCELLATION_REASONS.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                    {errors.cancellationReason && (
                      <p
                        id="cancellation-reason-error"
                        className={styles.fieldError}
                      >
                        {errors.cancellationReason}
                      </p>
                    )}
                  </div>

                  <div className={styles.formField}>
                    <div className={styles.fieldLabelRow}>
                      <label htmlFor="cancellation-note">Optional Note</label>
                      <span id="cancellation-note-count" aria-live="polite">
                        {draft.cancellationNote.length} / 200
                      </span>
                    </div>
                    <textarea
                      id="cancellation-note"
                      rows={3}
                      maxLength={200}
                      value={draft.cancellationNote}
                      aria-invalid={Boolean(errors.cancellationNote)}
                      aria-describedby={`cancellation-note-count${
                        errors.cancellationNote
                          ? " cancellation-note-error"
                          : ""
                      }`}
                      onChange={(event) =>
                        updateDraft("cancellationNote", event.target.value)
                      }
                    />
                    {errors.cancellationNote && (
                      <p
                        id="cancellation-note-error"
                        className={styles.fieldError}
                      >
                        {errors.cancellationNote}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.formField}>
                <div className={styles.planFieldHeader}>
                  <span id="lesson-plan-label" className={styles.planLabel}>
                    Full Lesson Plan
                  </span>
                  <div className={styles.modeSelector} aria-label="Lesson plan mode">
                    <button
                      type="button"
                      aria-pressed={planMode === "write"}
                      onClick={() => setPlanMode("write")}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      aria-pressed={planMode === "preview"}
                      onClick={() => setPlanMode("preview")}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                {planMode === "write" ? (
                  <textarea
                    id="lesson-plan"
                    className={styles.planTextarea}
                    value={draft.plan}
                    aria-labelledby="lesson-plan-label"
                    aria-describedby="markdown-guidance"
                    onChange={(event) => updateDraft("plan", event.target.value)}
                  />
                ) : (
                  <div
                    className={styles.markdownPreview}
                    aria-labelledby="lesson-plan-label"
                  >
                    <MarkdownContent emptyMessage="Nothing to preview yet.">
                      {draft.plan}
                    </MarkdownContent>
                  </div>
                )}
                <p id="markdown-guidance" className={styles.markdownGuidance}>
                  Markdown supported: **bold**, *italic*, headings, lists, links,
                  quotes and code. Images are omitted.
                </p>
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
              <div className={styles.statusSummary}>
                <span>Status</span>
                <strong
                  className={`${styles.statusBadge} ${styles[`status-${effectiveStatus}`]}`}
                >
                  {getLessonStatusLabel(effectiveStatus)}
                </strong>
              </div>
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
                      <MarkdownContent>{occurrence.plan}</MarkdownContent>
                    </section>
                  )}
                  {effectiveStatus === "cancelled" && (
                    <section className={styles.cancellationDetails}>
                      <h4>Cancellation</h4>
                      <strong>
                        {getCancellationReasonLabel(
                          occurrence.cancellationReason,
                        )}
                      </strong>
                      {occurrence.cancellationNote && (
                        <p>{occurrence.cancellationNote}</p>
                      )}
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
              {feedback && (
                <p
                  className={`${styles.actionFeedback} ${
                    feedback.type === "error"
                      ? styles.feedbackError
                      : styles.feedbackSuccess
                  }`}
                  role="status"
                >
                  {feedback.message}
                </p>
              )}
            </div>
            <footer className={styles.panelFooter}>
              <button
                ref={carryForwardButtonRef}
                type="button"
                className={styles.secondaryButton}
                onClick={requestCarryForward}
              >
                Carry Forward
              </button>
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
      {carryTarget && (
        <CarryForwardDialog
          classDetails={classDetails}
          destination={carryTarget}
          period={resolveTimetableBlock(timetableBlocks, carryTarget.periodId)}
          replacesPlan={carryTarget.replacesPlan}
          onCancel={closeCarryForward}
          onConfirm={confirmCarryForward}
        />
      )}
    </dialog>
  );
}
