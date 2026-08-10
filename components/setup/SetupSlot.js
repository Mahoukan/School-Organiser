import { getClassColourOption } from "../../data/sampleClasses";
import { findAssignmentForSlot } from "../../lib/recurringTimetable";
import { getRecurringEventColour, getRecurringEventForBlock, getRecurringEventTypeLabel } from "../../lib/recurringEvents";
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
  const { classes, recurringAssignments, recurringEvents, removeAssignment } = useSchoolData();
  const event = getRecurringEventForBlock(recurringEvents, cycleWeek, weekday, period.id);

  if (event) {
    const colour = getRecurringEventColour(event.colour);
    return (
      <div className={`${styles.setupSlot} ${styles.eventSlot}`} style={{ "--event-accent": event.colour, "--event-background": colour.background, "--event-border": colour.border, "--event-text": colour.text }}>
        <strong>{event.title}</strong>
        {event.detail && <span>{event.detail}</span>}
        <small>{getRecurringEventTypeLabel(event.type)} · Non-class item</small>
        <div className={styles.slotActions}><button type="button" aria-label={`Edit ${event.title}`} onClick={(eventObject) => onChoose(period, eventObject.currentTarget)}>Edit</button></div>
      </div>
    );
  }

  if (!period.isTeaching) {
    return (
      <button type="button" className={`${styles.setupSlot} ${styles.emptySlot}`} aria-label={`Add non-class item to Week ${cycleWeek}, ${weekdayLabel}, ${period.name}`} onClick={(eventObject) => onChoose(period, eventObject.currentTarget)}><span aria-hidden="true">+</span><strong>Add Non-Class Item</strong></button>
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
        aria-label={`Add class or non-class item to Week ${cycleWeek}, ${weekdayLabel}, ${period.name}`}
        onClick={(eventObject) => onChoose(period, eventObject.currentTarget)}
      >
        <span aria-hidden="true">+</span>
        <strong>Add occupant</strong>
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
          onClick={async () => {
            const result = await removeAssignment(cycleWeek, weekday, period.id);
            if (!result.ok) onMessage?.(result.message);
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
