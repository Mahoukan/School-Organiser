import ModalDialog from "../classes/ModalDialog";
import styles from "./setup.module.css";

export default function OccupantTypeDialog({ slot, onClass, onEvent, onClose }) {
  return <ModalDialog className={styles.assignmentDialog} labelledBy="occupant-type-title" describedBy="occupant-type-description" onClose={onClose}>
    <header className={styles.dialogHeader}><div><p>Week {slot.cycleWeek}</p><h2 id="occupant-type-title">Add to {slot.period.name}</h2></div><button type="button" aria-label="Close occupant chooser" onClick={onClose}>×</button></header>
    <p id="occupant-type-description" className={styles.dialogDescription}>Choose what should repeat in this timetable block.</p>
    <div className={styles.occupantChoices}><button type="button" onClick={onClass}><strong>Class</strong><span>Add an active teaching class.</span></button><button type="button" onClick={onEvent}><strong>Non-Class Item</strong><span>Add a duty, meeting, assembly or other commitment.</span></button></div>
  </ModalDialog>;
}
