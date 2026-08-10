import { weekdays } from "../data/sampleTimetable.js";
import { getTeachingWeekForDate } from "./academicCalendar.js";
import { findLessonOccurrence, getDateKey, getEffectiveLessonStatus } from "./lessonOccurrences.js";
import { getBlocksForDay } from "./periodStructures.js";
import { getDatedTimetableEntry } from "./recurringTimetable.js";
import { getEffectiveCancellation, isDateInRange } from "./scheduleOverlays.js";
import { isWeekend } from "./timetableDates.js";

export function deriveTodaySchedule(data, date) {
  const dateKey = getDateKey(date);
  const weekend = isWeekend(date);
  const teachingWeek = getTeachingWeekForDate(date, data.teachingWeeks);
  const term = teachingWeek ? data.terms.find((item) => item.id === teachingWeek.termId) ?? null : null;
  const weekday = weekend ? null : weekdays[date.getDay() - 1] ?? null;
  const assignment = teachingWeek && weekday
    ? data.dayTimetableAssignments.find((item) => item.cycleWeek === teachingWeek.cycleWeek && item.weekday === weekday.key)
    : null;
  const dayTemplate = assignment
    ? data.dayTimetableTemplates.find((item) => item.id === assignment.templateId) ?? null
    : null;
  const periods = teachingWeek && weekday
    ? getBlocksForDay(data.timetableBlocks, teachingWeek.cycleWeek, weekday.key)
    : [];

  const blocks = periods.map((period) => {
    const entry = getDatedTimetableEntry({
      recurringAssignments: data.recurringAssignments,
      recurringEvents: data.recurringEvents,
      lessonMovements: data.lessonMovements,
      date: dateKey,
      cycleWeek: teachingWeek.cycleWeek,
      weekday: weekday.key,
      period,
    });
    if (entry.type !== "class") return { period, entry };
    const classDetails = data.classes.find((item) => item.id === entry.classId) ?? null;
    const occurrence = findLessonOccurrence(data.lessonOccurrences, dateKey, entry.recurringAssignmentId);
    const cancellation = getEffectiveCancellation({
      dateKey,
      classId: entry.classId,
      occurrence,
      teacherAbsences: data.teacherAbsences,
      classAbsences: data.classAbsences,
      calendarExceptions: data.calendarExceptions,
    });
    return {
      period,
      entry,
      classDetails,
      occurrence,
      cancellation,
      status: cancellation.isCancelled ? "cancelled" : getEffectiveLessonStatus(occurrence),
    };
  });

  const classBlocks = blocks.filter((item) => item.entry.type === "class" && item.classDetails && !item.classDetails.archived);
  return {
    dateKey,
    weekend,
    teachingWeek,
    term,
    weekday,
    dayTemplate,
    blocks,
    teacherAbsence: data.teacherAbsences.find((item) => isDateInRange(dateKey, item)) ?? null,
    calendarException: data.calendarExceptions.find((item) => isDateInRange(dateKey, item)) ?? null,
    overview: {
      classes: classBlocks.length,
      completed: classBlocks.filter((item) => item.status === "completed").length,
      remaining: classBlocks.filter((item) => item.status === "planned" || item.status === "partially-completed").length,
      cancelled: classBlocks.filter((item) => item.status === "cancelled").length,
      commitments: blocks.filter((item) => item.entry.type === "event").length,
    },
  };
}
