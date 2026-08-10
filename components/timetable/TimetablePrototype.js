"use client";

import { useState } from "react";

import {
  addDays,
  formatDateRange,
  formatDayHeading,
  getFortnightStart,
  getMonday,
  getWeekType,
  getWeekdayIndex,
  toDateOnly,
} from "../../lib/timetableDates";
import DayTimetable from "./DayTimetable";
import FortnightTimetable from "./FortnightTimetable";
import TimetableToolbar from "./TimetableToolbar";
import WeekTimetable from "./WeekTimetable";
import styles from "./timetable.module.css";

const navigationSteps = {
  day: 1,
  week: 7,
  fortnight: 14,
};

function getToolbarDetails(view, displayedDate) {
  if (view === "day") {
    return {
      dateLabel: formatDayHeading(displayedDate),
      cycleLabel: `Week ${getWeekType(displayedDate)}`,
    };
  }

  if (view === "fortnight") {
    const start = getFortnightStart(displayedDate);
    return {
      dateLabel: formatDateRange(start, addDays(start, 11)),
      cycleLabel: "Week A + Week B",
    };
  }

  const monday = getMonday(displayedDate);
  return {
    dateLabel: formatDateRange(monday, addDays(monday, 4)),
    cycleLabel: `Week ${getWeekType(monday)}`,
  };
}

export default function TimetablePrototype() {
  const [view, setView] = useState("week");
  const [displayedDate, setDisplayedDate] = useState(() =>
    toDateOnly(new Date()),
  );
  const [selectedWeekday, setSelectedWeekday] = useState(() =>
    getWeekdayIndex(new Date()),
  );
  const toolbarDetails = getToolbarDetails(view, displayedDate);

  function changeView(nextView) {
    setView(nextView);
    setSelectedWeekday(getWeekdayIndex(displayedDate));
  }

  function moveDate(direction) {
    setDisplayedDate((currentDate) =>
      addDays(currentDate, navigationSteps[view] * direction),
    );
  }

  function returnToToday() {
    const today = toDateOnly(new Date());
    setDisplayedDate(today);
    setSelectedWeekday(getWeekdayIndex(today));
  }

  return (
    <section className={styles.timetablePage} aria-labelledby="timetable-title">
      <TimetableToolbar
        view={view}
        dateLabel={toolbarDetails.dateLabel}
        cycleLabel={toolbarDetails.cycleLabel}
        onViewChange={changeView}
        onPrevious={() => moveDate(-1)}
        onNext={() => moveDate(1)}
        onToday={returnToToday}
      />

      <div className={styles.timetableContent}>
        {view === "day" && <DayTimetable date={displayedDate} />}
        {view === "week" && (
          <WeekTimetable
            monday={getMonday(displayedDate)}
            selectedWeekday={selectedWeekday}
            onSelectWeekday={setSelectedWeekday}
          />
        )}
        {view === "fortnight" && (
          <FortnightTimetable
            startDate={getFortnightStart(displayedDate)}
            selectedWeekday={selectedWeekday}
            onSelectWeekday={setSelectedWeekday}
          />
        )}
      </div>
    </section>
  );
}
