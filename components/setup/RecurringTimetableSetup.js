"use client";

import { useRef, useState } from "react";

import { weekdays } from "../../data/sampleTimetable";
import { findAssignmentForSlot } from "../../lib/recurringTimetable";
import { useSchoolData } from "../providers/SchoolDataProvider";
import AssignmentDialog from "./AssignmentDialog";
import MobileSetupDay from "./MobileSetupDay";
import SetupWeekGrid from "./SetupWeekGrid";
import styles from "./setup.module.css";

export default function RecurringTimetableSetup() {
  const {
    classes,
    recurringAssignments,
    assignClassToSlot,
  } = useSchoolData();
  const [cycleWeek, setCycleWeek] = useState("A");
  const [selectedWeekday, setSelectedWeekday] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [message, setMessage] = useState("");
  const triggerRef = useRef(null);

  function openSlot(weekday, period, trigger) {
    triggerRef.current = trigger;
    setSelectedSlot({
      cycleWeek,
      weekday,
      weekdayLabel: weekdays.find((item) => item.key === weekday).label,
      period,
    });
  }

  function closeSelector() {
    const trigger = triggerRef.current;
    setSelectedSlot(null);
    requestAnimationFrame(() => trigger?.focus());
  }

  function chooseClass(classId) {
    assignClassToSlot({
      classId,
      cycleWeek: selectedSlot.cycleWeek,
      weekday: selectedSlot.weekday,
      periodId: selectedSlot.period.id,
    });
    closeSelector();
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
        <AssignmentDialog
          slot={selectedSlot}
          classes={classes}
          assignedClassId={selectedAssignment?.classId}
          onSelect={chooseClass}
          onClose={closeSelector}
        />
      )}
    </section>
  );
}
