import { getClassColourOption } from "../../data/sampleClasses";
import { getTemporaryEvent } from "../../data/sampleTimetable";
import { findAssignmentForSlot } from "../../lib/recurringTimetable";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./setup.module.css";

export default function SetupSlot({
  cycleWeek,
  weekday,
  weekdayLabel,
  period,
  onChoose,
  onMessage,
}) {
  const { classes, recurringAssignments, removeAssignment } = useSchoolData();
  const event = getTemporaryEvent(cycleWeek, weekday, period.id);

  if (event) {
    return (
      <div className={`${styles.setupSlot} ${styles.eventSlot}`}>
        <strong>{event.label}</strong>
        <span>{event.title}</span>
        <small>Read-only event</small>
      </div>
    );
  }

  if (!period.isTeaching) {
    return (
      <div className={`${styles.setupSlot} ${styles.breakSlot}`}>
        <strong>{period.name}</strong>
        <small>Non-teaching block</small>
      </div>
    );
  }

  const assignment = findAssignmentForSlot(
    recurringAssignments,
    cycleWeek,
    weekday,
    period.id,
  );
  const classItem = assignment
    ? classes.find((candidate) => candidate.id === assignment.classId)
    : null;

  if (!assignment || !classItem || classItem.archived) {
    return (
      <button
        type="button"
        className={`${styles.setupSlot} ${styles.emptySlot}`}
        aria-label={`Add class to Week ${cycleWeek}, ${weekdayLabel}, ${period.name}`}
        onClick={(eventObject) => onChoose(period, eventObject.currentTarget)}
      >
        <span aria-hidden="true">+</span>
        <strong>Add class</strong>
      </button>
    );
  }

  const colour = getClassColourOption(classItem.colour);

  return (
    <div
      className={`${styles.setupSlot} ${styles.assignedSlot}`}
      style={{
        "--slot-accent": classItem.colour,
        "--slot-background": colour.background,
        "--slot-border": colour.border,
        "--slot-text": colour.text,
      }}
    >
      <div className={styles.assignedDetails}>
        <strong>{classItem.shortCode}</strong>
        <span>{classItem.name}</span>
        {classItem.room && <small>Room {classItem.room}</small>}
      </div>
      <div className={styles.slotActions}>
        <button
          type="button"
          aria-label={`Change class for Week ${cycleWeek}, ${weekdayLabel}, ${period.name}`}
          onClick={(eventObject) => onChoose(period, eventObject.currentTarget)}
        >
          Change
        </button>
        <button
          type="button"
          aria-label={`Remove ${classItem.shortCode} from Week ${cycleWeek}, ${weekdayLabel}, ${period.name}`}
          onClick={() => {
            const result = removeAssignment(cycleWeek, weekday, period.id);
            if (!result.ok) onMessage?.(result.message);
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
