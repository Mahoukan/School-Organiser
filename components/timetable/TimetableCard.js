import { sampleClasses } from "../../data/sampleTimetable";
import styles from "./timetable.module.css";

export default function TimetableCard({ entry, detail = "week" }) {
  const compact = detail === "fortnight";

  if (entry.type === "free") {
    return (
      <div className={`${styles.entryCard} ${styles.freeCard}`}>
        <span className={styles.freeLabel}>Free</span>
      </div>
    );
  }

  if (entry.type === "event") {
    return (
      <div className={`${styles.entryCard} ${styles.eventCard}`}>
        <span className={styles.entryCode}>{entry.label}</span>
        {!compact && <span className={styles.entryName}>{entry.title}</span>}
        {entry.location && (
          <span className={styles.entryRoom}>{entry.location}</span>
        )}
      </div>
    );
  }

  if (entry.type === "break") {
    return (
      <div className={`${styles.entryCard} ${styles.breakCard}`}>
        <span>{entry.label}</span>
      </div>
    );
  }

  const classDetails = sampleClasses[entry.classId];

  return (
    <div
      className={`${styles.entryCard} ${styles.classCard}`}
      style={{
        "--class-background": classDetails.colour,
        "--class-border": classDetails.borderColour,
        "--class-text": classDetails.textColour,
      }}
    >
      <span className={styles.entryCode}>{classDetails.shortCode}</span>
      {detail === "day" && (
        <span className={styles.entryName}>{classDetails.name}</span>
      )}
      <span className={styles.entryRoom}>Room {classDetails.room}</span>
    </div>
  );
}
