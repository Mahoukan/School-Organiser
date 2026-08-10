import MobileWeek from "./MobileWeek";
import WeekGrid from "./WeekGrid";
import styles from "./timetable.module.css";

export default function WeekTimetable({
  monday,
  selectedWeekday,
  onSelectWeekday,
  onOpenLesson,
  onOpenEvent,
}) {
  return (
    <>
      <div className={styles.desktopWeekView}>
        <WeekGrid monday={monday} onOpenLesson={onOpenLesson} onOpenEvent={onOpenEvent} />
      </div>
      <div className={styles.mobileWeekView}>
        <MobileWeek
          monday={monday}
          selectedWeekday={selectedWeekday}
          onSelectWeekday={onSelectWeekday}
          onOpenLesson={onOpenLesson}
          onOpenEvent={onOpenEvent}
        />
      </div>
    </>
  );
}
