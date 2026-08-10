import { getTeachingWeekForDate } from "./academicCalendar.js";
import { getDateKey } from "./lessonOccurrences.js";
import { deriveTodaySchedule } from "./todaySchedule.js";
import { addDays } from "./timetableDates.js";
import { getPlanningState } from "./planningState.js";

export const PLANNING_HORIZON_DAYS = 10;
export const PLANNING_SEARCH_LIMIT_DAYS = 60;

export function deriveUpcomingPlanning(data, startDate, options = {}) {
  const teachingDayLimit = options.teachingDayLimit ?? PLANNING_HORIZON_DAYS;
  const searchLimit = options.searchLimit ?? PLANNING_SEARCH_LIMIT_DAYS;
  const items = [];
  let teachingDaysFound = 0;
  let missingTemplate = false;

  for (let offset = 1; offset <= searchLimit && teachingDaysFound < teachingDayLimit; offset += 1) {
    const date = addDays(startDate, offset);
    if (!getTeachingWeekForDate(date, data.teachingWeeks)) continue;
    teachingDaysFound += 1;
    const schedule = deriveTodaySchedule(data, date);
    if (!schedule.dayTemplate) {
      missingTemplate = true;
      continue;
    }

    for (const block of schedule.blocks) {
      if (block.entry.type !== "class" || !block.classDetails || block.classDetails.archived) continue;
      if (block.cancellation?.isCancelled || block.status === "completed" || block.status === "cancelled") continue;
      const planningState = getPlanningState(block.occurrence);
      if (planningState === "planned") continue;
      const originalPeriod = block.entry.movedFromPeriodId
        ? data.timetableBlocks.find((period) => period.id === block.entry.movedFromPeriodId) ?? null
        : null;
      items.push({
        id: `${schedule.dateKey}--${block.entry.recurringAssignmentId}`,
        date: schedule.dateKey,
        dateObject: date,
        classId: block.entry.classId,
        recurringAssignmentId: block.entry.recurringAssignmentId,
        classDetails: block.classDetails,
        period: block.period,
        originalPeriod,
        occurrence: block.occurrence ?? null,
        status: block.status,
        planningState,
      });
    }
  }

  items.sort((first, second) => first.date.localeCompare(second.date) || first.period.displayOrder - second.period.displayOrder);
  return {
    items,
    teachingDaysFound,
    missingTemplate,
    startDate: getDateKey(startDate),
  };
}
