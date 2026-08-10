import {
  getClassColourOption,
} from "../../data/sampleClasses";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./timetable.module.css";

export default function TimetableCard({ entry, detail = "week" }) {
  const { classes } = useSchoolData();
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

  const classDetails = classes.find((classItem) => classItem.id === entry.classId);
  if (!classDetails || classDetails.archived) {
    return (
      <div className={`${styles.entryCard} ${styles.freeCard}`}>
        <span className={styles.freeLabel}>Free</span>
      </div>
    );
  }
  const colourDetails = getClassColourOption(classDetails.colour);

  return (
    <div
      className={`${styles.entryCard} ${styles.classCard}`}
      style={{
        "--class-background": colourDetails.background,
        "--class-border": colourDetails.border,
        "--class-text": colourDetails.text,
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
