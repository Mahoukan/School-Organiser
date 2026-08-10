import { useEffect, useMemo, useRef, useState } from "react";

import { getClassColourOption } from "../../data/sampleClasses";
import {
  CANCELLATION_REASONS,
  LESSON_STATUSES,
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
import { getEffectiveCancellation } from "../../lib/scheduleOverlays";
import { getEffectivePeriodId, getMovementDestinationOptions } from "../../lib/lessonMovements";
import { useSchoolData } from "../providers/SchoolDataProvider";
import CarryForwardDialog from "./CarryForwardDialog";
import MarkdownContent from "./MarkdownContent";
import styles from "./lessons.module.css";
import UnsavedChangesDialog from "./UnsavedChangesDialog";
import MoveLessonDialog from "./MoveLessonDialog";

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
    teacherAbsences,
    classAbsences,
    calendarExceptions,
    lessonMovements,
    recurringEvents,
    saveLessonMovement,
    removeLessonMovement,
    getLessonOccurrence,
    saveLessonOccurrence,
  } = useSchoolData();
  const dialogRef = useRef(null);
  const titleInputRef = useRef(null);
  const carryForwardButtonRef = useRef(null);
  const moveLessonButtonRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [draft, setDraft] = useState(emptyContent);
  const [errors, setErrors] = useState({});
  const [planMode, setPlanMode] = useState("write");
  const [carryTarget, setCarryTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showRestoreConfirmation, setShowRestoreConfirmation] = useState(false);

  const occurrence = getLessonOccurrence(
    selection.date,
    selection.recurringAssignmentId,
  );
  const savedContent = useMemo(() => getDraft(occurrence), [occurrence]);
  const classDetails = classes.find(
    (classItem) => classItem.id === selection.classId,
  );
  const assignment = recurringAssignments.find((item) => item.id === selection.recurringAssignmentId);
  const movement = lessonMovements.find((item) => item.date === selection.date && item.recurringAssignmentId === selection.recurringAssignmentId);
  const originalPeriod = resolveTimetableBlock(timetableBlocks, assignment?.periodId);
  const effectivePeriodId = assignment ? getEffectivePeriodId(assignment, selection.date, lessonMovements) : selection.periodId;
  const period = resolveTimetableBlock(timetableBlocks, effectivePeriodId);
  const date = getDateFromKey(selection.date);
  const underlyingStatus = getEffectiveLessonStatus(occurrence);
  const effectiveCancellation = getEffectiveCancellation({
    dateKey: selection.date,
    classId: selection.classId,
    occurrence,
    teacherAbsences,
    classAbsences,
    calendarExceptions,
  });
  const effectiveStatus = effectiveCancellation.isCancelled
    ? "cancelled"
    : underlyingStatus;
  const teachingWeek = getTeachingWeekForDate(date, teachingWeeks);
  const isDirty = Object.keys(emptyContent).some(
    (field) => draft[field] !== savedContent[field],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
  }, []);

  if (!classDetails || !period || !assignment || !originalPeriod) return null;

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
      currentRecurringAssignmentId: selection.recurringAssignmentId,
      recurringAssignments,
      lessonOccurrences,
      teachingWeeks,
      timetableBlocks,
      teacherAbsences,
      classAbsences,
      calendarExceptions,
      lessonMovements,
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

  function closeMoveDialog() {
    setShowMoveDialog(false);
    requestAnimationFrame(() => moveLessonButtonRef.current?.focus());
  }

  function saveMovement(destinationPeriodId) {
    const result = saveLessonMovement({ date: selection.date, recurringAssignmentId: selection.recurringAssignmentId, destinationPeriodId });
    if (result.ok) {
      const destination = resolveTimetableBlock(timetableBlocks, destinationPeriodId);
      setShowMoveDialog(false);
      setFeedback({ type: "success", message: `${classDetails.shortCode} moved to ${destination.name} for ${formatDayHeading(date)}.` });
      requestAnimationFrame(() => moveLessonButtonRef.current?.focus());
    }
    return result;
  }

  function restoreMovement() {
    const result = removeLessonMovement(selection.date, selection.recurringAssignmentId);
    setShowRestoreConfirmation(false);
    setFeedback(result.ok
      ? { type: "success", message: `${classDetails.shortCode} restored to ${originalPeriod.name}.` }
      : { type: "error", message: result.message });
    requestAnimationFrame(() => moveLessonButtonRef.current?.focus());
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
        if (showMoveDialog) {
          closeMoveDialog();
          return;
        }
        if (showRestoreConfirmation) {
          setShowRestoreConfirmation(false);
          return;
        }
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
        inert={showDiscardConfirmation || carryTarget || showMoveDialog || showRestoreConfirmation ? true : undefined}
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
          {movement && (
            <span>
              Moved from {originalPeriod.name} · {formatBlockTime(originalPeriod.startTime)}–{formatBlockTime(originalPeriod.endTime)}
            </span>
          )}
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
                  disabled={effectiveCancellation.isOverlay}
                  onChange={(event) => updateDraft("status", event.target.value)}
                >
                  {LESSON_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {effectiveCancellation.isOverlay && (
                  <p className={styles.overlayNotice}>
                    Status is controlled by the active {effectiveCancellation.sourceLabel.toLowerCase()} record. You can still edit the lesson content.
                  </p>
                )}
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
                  {effectiveCancellation.isCancelled && (
                    <section className={styles.cancellationDetails}>
                      <h4>Cancellation</h4>
                      <strong>{effectiveCancellation.reasonLabel}</strong>
                      {effectiveCancellation.isOverlay && (
                        <p>Applied by: {effectiveCancellation.sourceLabel}</p>
                      )}
                      {effectiveCancellation.note && <p>{effectiveCancellation.note}</p>}
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
              {!occurrence && effectiveCancellation.isCancelled && (
                <section className={styles.cancellationDetails}>
                  <h4>Cancellation</h4>
                  <strong>{effectiveCancellation.reasonLabel}</strong>
                  <p>Applied by: {effectiveCancellation.sourceLabel}</p>
                  {effectiveCancellation.note && <p>{effectiveCancellation.note}</p>}
                </section>
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
              <button ref={moveLessonButtonRef} type="button" className={styles.secondaryButton} onClick={() => setShowMoveDialog(true)}>Move Lesson</button>
              {movement && <button type="button" className={styles.secondaryButton} onClick={() => setShowRestoreConfirmation(true)}>Restore Original Time</button>}
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
      {showMoveDialog && <MoveLessonDialog classDetails={classDetails} date={selection.date} originalBlock={originalPeriod} currentBlock={period} options={getMovementDestinationOptions({ date: selection.date, assignment, recurringAssignments, recurringEvents, timetableBlocks, lessonMovements })} onCancel={closeMoveDialog} onSave={saveMovement} />}
      {showRestoreConfirmation && <div className={styles.confirmOverlay}><div className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="restore-movement-title"><h3 id="restore-movement-title">Restore {classDetails.shortCode} to {originalPeriod.name}?</h3><p>This removes only the dated movement. Lesson planning and status data remain unchanged.</p><div className={styles.confirmActions}><button type="button" className={styles.secondaryButton} onClick={() => setShowRestoreConfirmation(false)}>Cancel</button><button type="button" className={styles.primaryButton} onClick={restoreMovement}>Restore</button></div></div></div>}
    </dialog>
  );
}
