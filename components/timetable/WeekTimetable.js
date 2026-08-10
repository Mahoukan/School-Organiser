import MobileWeek from "./MobileWeek";
import WeekGrid from "./WeekGrid";
import styles from "./timetable.module.css";

export default function WeekTimetable({
  monday,
  selectedWeekday,
  onSelectWeekday,
}) {
  return (
    <>
      <div className={styles.desktopWeekView}>
        <WeekGrid monday={monday} />
      </div>
      <div className={styles.mobileWeekView}>
        <MobileWeek
          monday={monday}
          selectedWeekday={selectedWeekday}
          onSelectWeekday={onSelectWeekday}
        />
      </div>
    </>
  );
}
