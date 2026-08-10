"use client";

import { useRef, useState } from "react";

import { weekdays } from "../../data/sampleTimetable";
import { findAssignmentForSlot } from "../../lib/recurringTimetable";
import { useSchoolData } from "../providers/SchoolDataProvider";
import AssignmentDialog from "./AssignmentDialog";
import MobileSetupDay from "./MobileSetupDay";
import SetupWeekGrid from "./SetupWeekGrid";
import styles from "./setup.module.css";
import { getRecurringEventForBlock } from "../../lib/recurringEvents";
import OccupantTypeDialog from "./OccupantTypeDialog";
import RecurringEventForm from "./RecurringEventForm";
import ModalDialog from "../classes/ModalDialog";

export default function RecurringTimetableSetup() {
  const {
    classes,
    recurringAssignments,
    assignClassToSlot,
    recurringEvents,
    saveRecurringEvent,
    removeRecurringEvent,
  } = useSchoolData();
  const [cycleWeek, setCycleWeek] = useState("A");
  const [selectedWeekday, setSelectedWeekday] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const triggerRef = useRef(null);

  function openSlot(weekday, period, trigger) {
    triggerRef.current = trigger;
    const assignment = findAssignmentForSlot(recurringAssignments, cycleWeek, weekday, period.id);
    const event = getRecurringEventForBlock(recurringEvents, cycleWeek, weekday, period.id);
    setSelectedSlot({
      cycleWeek,
      weekday,
      weekdayLabel: weekdays.find((item) => item.key === weekday).label,
      period,
      mode: event ? "event" : assignment ? "class" : period.isTeaching ? "choose" : "event",
      event,
    });
  }

  function closeSelector() {
    const trigger = triggerRef.current;
    setSelectedSlot(null);
    requestAnimationFrame(() => trigger?.focus());
  }

  async function chooseClass(classId) {
    const result = await assignClassToSlot({
      classId,
      cycleWeek: selectedSlot.cycleWeek,
      weekday: selectedSlot.weekday,
      periodId: selectedSlot.period.id,
    });
    if (result.ok) closeSelector();
    else setMessage("That timetable block is already occupied.");
  }

  async function saveEvent(values) {
    const result = await saveRecurringEvent(values);
    if (result.ok) { setMessage(`${result.event.title} saved.`); closeSelector(); }
    return result;
  }

  function requestRemoveEvent(event) {
    setRemoveTarget(event);
    setSelectedSlot(null);
  }

  async function confirmRemoveEvent() {
    await removeRecurringEvent(removeTarget.id);
    setMessage(`${removeTarget.title} removed.`);
    setRemoveTarget(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  const selectedAssignment = selectedSlot
    ? findAssignmentForSlot(
        recurringAssignments,
        selectedSlot.cycleWeek,
        selectedSlot.weekday,
        selectedSlot.period.id,
      )
    : null;

  return (
      <section className={styles.editorSection} aria-labelledby="recurring-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="recurring-title">Recurring Timetable</h2>
            <p>
              Changes here update your repeating Week A / Week B timetable.
            </p>
          </div>
          <div className={styles.weekSelector} aria-label="Cycle week">
            {[
              { value: "A", label: "Week A" },
              { value: "B", label: "Week B" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={cycleWeek === option.value}
                onClick={() => setCycleWeek(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.desktopEditor}>
          <SetupWeekGrid cycleWeek={cycleWeek} onChooseSlot={openSlot} onMessage={setMessage} />
        </div>
        {message && <p className={styles.setupMessage} role="status">{message}</p>}
        <div className={styles.mobileEditorWrapper}>
          <MobileSetupDay
            cycleWeek={cycleWeek}
            selectedWeekday={selectedWeekday}
            onSelectWeekday={setSelectedWeekday}
            onChooseSlot={openSlot}
            onMessage={setMessage}
          />
        </div>
      {selectedSlot && (
        selectedSlot.mode === "choose" ? <OccupantTypeDialog slot={selectedSlot} onClass={() => setSelectedSlot({ ...selectedSlot, mode: "class" })} onEvent={() => setSelectedSlot({ ...selectedSlot, mode: "event" })} onClose={closeSelector} /> : selectedSlot.mode === "class" ? <AssignmentDialog
          slot={selectedSlot}
          classes={classes}
          assignedClassId={selectedAssignment?.classId}
          onSelect={chooseClass}
          onClose={closeSelector}
        /> : <RecurringEventForm key={selectedSlot.event?.id ?? `${selectedSlot.cycleWeek}-${selectedSlot.weekday}-${selectedSlot.period.id}`} slot={selectedSlot} event={selectedSlot.event} onSave={saveEvent} onRemove={requestRemoveEvent} onClose={closeSelector} />
      )}
      {removeTarget && <ModalDialog className={styles.assignmentDialog} labelledBy="remove-event-title" describedBy="remove-event-description" onClose={() => setRemoveTarget(null)}><h2 id="remove-event-title">Remove {removeTarget.title}?</h2><p id="remove-event-description">This will remove it from the repeating Week {removeTarget.cycleWeek} timetable.</p><div className={styles.formActions}><button className={styles.secondarySetupButton} onClick={() => setRemoveTarget(null)}>Cancel</button><button className={styles.dangerSetupButton} onClick={confirmRemoveEvent}>Remove</button></div></ModalDialog>}
    </section>
  );
}
