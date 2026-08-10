import { addDays } from "../../lib/timetableDates";
import MobileWeek from "./MobileWeek";
import WeekGrid from "./WeekGrid";
import styles from "./timetable.module.css";

export default function FortnightTimetable({
  startDate,
  selectedWeekday,
  onSelectWeekday,
  onOpenLesson,
  onOpenEvent,
}) {
  const secondMonday = addDays(startDate, 7);

  return (
    <>
      <div className={styles.desktopFortnightView}>
        <WeekGrid monday={startDate} compact onOpenLesson={onOpenLesson} onOpenEvent={onOpenEvent} />
        <WeekGrid monday={secondMonday} compact onOpenLesson={onOpenLesson} onOpenEvent={onOpenEvent} />
      </div>
      <div className={styles.mobileFortnightView}>
        <MobileWeek
          monday={startDate}
          selectedWeekday={selectedWeekday}
          onSelectWeekday={onSelectWeekday}
          compact
          onOpenLesson={onOpenLesson}
          onOpenEvent={onOpenEvent}
        />
        <MobileWeek
          monday={secondMonday}
          selectedWeekday={selectedWeekday}
          onSelectWeekday={onSelectWeekday}
          compact
          onOpenLesson={onOpenLesson}
          onOpenEvent={onOpenEvent}
        />
      </div>
    </>
  );
}
