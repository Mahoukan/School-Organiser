import { addDays } from "../../lib/timetableDates";
import MobileWeek from "./MobileWeek";
import WeekGrid from "./WeekGrid";
import styles from "./timetable.module.css";

export default function FortnightTimetable({
  startDate,
  selectedWeekday,
  onSelectWeekday,
}) {
  const secondMonday = addDays(startDate, 7);

  return (
    <>
      <div className={styles.desktopFortnightView}>
        <WeekGrid monday={startDate} compact />
        <WeekGrid monday={secondMonday} compact />
      </div>
      <div className={styles.mobileFortnightView}>
        <MobileWeek
          monday={startDate}
          selectedWeekday={selectedWeekday}
          onSelectWeekday={onSelectWeekday}
          compact
        />
        <MobileWeek
          monday={secondMonday}
          selectedWeekday={selectedWeekday}
          onSelectWeekday={onSelectWeekday}
          compact
        />
      </div>
    </>
  );
}
