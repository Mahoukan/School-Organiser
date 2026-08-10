"use client";

import { useRef, useState } from "react";

import {
  addDays,
  formatDateRange,
  formatDayHeading,
  getFortnightStart,
  getMonday,
  getWeekdayIndex,
  toDateOnly,
} from "../../lib/timetableDates";
import { getTeachingWeekForDate } from "../../lib/academicCalendar";
import { getDateKey } from "../../lib/lessonOccurrences";
import { useSchoolData } from "../providers/SchoolDataProvider";
import LessonPanel from "../lessons/LessonPanel";
import DayTimetable from "./DayTimetable";
import FortnightTimetable from "./FortnightTimetable";
import TimetableToolbar from "./TimetableToolbar";
import WeekTimetable from "./WeekTimetable";
import styles from "./timetable.module.css";
import DatedEventDialog from "../events/DatedEventDialog";

const navigationSteps = {
  day: 1,
  week: 7,
  fortnight: 14,
};

function getToolbarDetails(view, displayedDate, teachingWeeks) {
  const labelFor = (date) => {
    const week = getTeachingWeekForDate(date, teachingWeeks);
    return week ? `Week ${week.cycleWeek}` : "No teaching week";
  };
  if (view === "day") {
    return {
      dateLabel: formatDayHeading(displayedDate),
      cycleLabel: labelFor(displayedDate),
    };
  }

  if (view === "fortnight") {
    const start = getFortnightStart(displayedDate);
    return {
      dateLabel: formatDateRange(start, addDays(start, 11)),
      cycleLabel: `${labelFor(start)} · ${labelFor(addDays(start, 7))}`,
    };
  }

  const monday = getMonday(displayedDate);
  return {
    dateLabel: formatDateRange(monday, addDays(monday, 4)),
    cycleLabel: labelFor(monday),
  };
}

export default function TimetablePrototype() {
  const { teachingWeeks } = useSchoolData();
  const [view, setView] = useState("week");
  const [displayedDate, setDisplayedDate] = useState(() =>
    toDateOnly(new Date()),
  );
  const [selectedWeekday, setSelectedWeekday] = useState(() =>
    getWeekdayIndex(new Date()),
  );
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const lessonTriggerRef = useRef(null);
  const eventTriggerRef = useRef(null);
  const toolbarDetails = getToolbarDetails(view, displayedDate, teachingWeeks);

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

  function openLesson(selection, trigger) {
    lessonTriggerRef.current = trigger;
    setSelectedLesson(selection);
  }

  function closeLesson() {
    const trigger = lessonTriggerRef.current;
    setSelectedLesson(null);
    requestAnimationFrame(() => trigger?.focus());
  }
  function openEvent(item, trigger, date = displayedDate) { eventTriggerRef.current = trigger; setSelectedEvent(item ?? { new: true, date }); }
  function closeEvent() { setSelectedEvent(null); requestAnimationFrame(() => eventTriggerRef.current?.focus()); }

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
        {view === "day" && (
          <DayTimetable date={displayedDate} onOpenLesson={openLesson} onOpenEvent={openEvent} />
        )}
        {view === "week" && (
          <WeekTimetable
            monday={getMonday(displayedDate)}
            selectedWeekday={selectedWeekday}
            onSelectWeekday={setSelectedWeekday}
            onOpenLesson={openLesson}
            onOpenEvent={openEvent}
          />
        )}
        {view === "fortnight" && (
          <FortnightTimetable
            startDate={getFortnightStart(displayedDate)}
            selectedWeekday={selectedWeekday}
            onSelectWeekday={setSelectedWeekday}
            onOpenLesson={openLesson}
            onOpenEvent={openEvent}
          />
        )}
      </div>

      {selectedLesson && (
        <LessonPanel
          key={`${selectedLesson.date}-${selectedLesson.recurringAssignmentId}`}
          selection={selectedLesson}
          onClose={closeLesson}
        />
      )}
      {selectedEvent && <DatedEventDialog event={selectedEvent.new ? null : selectedEvent} defaultDate={getDateKey(selectedEvent.date ?? displayedDate)} onClose={closeEvent} />}
    </section>
  );
}
