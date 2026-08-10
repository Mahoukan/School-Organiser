"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { findLessonOccurrence } from "../../lib/lessonOccurrences";
import { getMovementForOccurrence, validateLessonMovement } from "../../lib/lessonMovements";
import { validateTimetableBlock } from "../../lib/periodStructures";
import { validateRecurringEvent } from "../../lib/recurringEvents";
import { validateTeachingWeek, validateTerm } from "../../lib/academicCalendar";
import { validateCalendarException, validateClassAbsence, validateTeacherAbsence } from "../../lib/scheduleOverlays";

const SchoolDataContext = createContext(null);

function hydrateSchoolData(payload) {
  return {
    ...payload,
    lessonOccurrences: (payload.lessonOccurrences ?? []).map((occurrence) => ({
      ...occurrence,
      title: occurrence.title ?? "",
      summary: occurrence.summary ?? "",
      plan: occurrence.plan ?? "",
      status: occurrence.status ?? "planned",
      cancellationReason: occurrence.cancellationReason ?? "",
      cancellationNote: occurrence.cancellationNote ?? "",
    })),
  };
}

export default function SchoolDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const response = await fetch("/api/school-data", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We couldn't load your organiser data.");
      setData(hydrateSchoolData(body));
    } catch (error) { setLoadError(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const persist = useCallback(async (resource, action, payload = {}) => {
    const response = await fetch(`/api/school-data/${resource}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "The change could not be saved.");
    const hydrated = hydrateSchoolData(body);
    setData(hydrated);
    return hydrated;
  }, []);

  const operation = useCallback(async (resource, action, payload, success = {}) => {
    try { await persist(resource, action, payload); return { ok: true, ...success }; }
    catch (error) { return { ok: false, message: error.message, errors: { form: error.message } }; }
  }, [persist]);

  const createClass = useCallback(async (values) => operation("classes", "save", { values }, { classItem: values }), [operation]);
  const updateClass = useCallback(async (classId, values) => operation("classes", "save", { id: classId, values }), [operation]);
  const archiveClass = useCallback(async (classId) => operation("classes", "archive", { id: classId }), [operation]);
  const restoreClass = useCallback(async (classId) => operation("classes", "restore", { id: classId }), [operation]);
  const getAssignmentCount = useCallback((classId) => data.recurringAssignments.filter((item) => item.classId === classId).length, [data]);
  const assignClassToSlot = useCallback(async (values) => operation("recurring-items", "save-class", values), [operation]);
  const removeAssignment = useCallback(async (cycleWeek, weekday, periodId) => operation("recurring-items", "remove-class", { cycleWeek, weekday, periodId }), [operation]);

  const saveTimetableBlock = useCallback(async (values) => {
    const errors = validateTimetableBlock(values, data.timetableBlocks, values.id);
    if (Object.keys(errors).length) return { ok: false, errors };
    return operation("period-blocks", "save", { values }, { block: values });
  }, [data, operation]);
  const removeTimetableBlock = useCallback(async (id) => operation("period-blocks", "remove", { id }), [operation]);
  const moveTimetableBlock = useCallback(async (id, direction) => operation("period-blocks", "move", { id, direction }), [operation]);

  const saveTeacherAbsence = useCallback(async (values) => { const errors = validateTeacherAbsence(values, data.academicYear); if (Object.keys(errors).length) return { ok: false, errors }; return operation("overlays", "save", { kind: "teacher", values }, { record: values }); }, [data, operation]);
  const saveClassAbsence = useCallback(async (values) => { const errors = validateClassAbsence(values, data.academicYear); if (Object.keys(errors).length) return { ok: false, errors }; return operation("overlays", "save", { kind: "class", values }, { record: values }); }, [data, operation]);
  const saveCalendarException = useCallback(async (values) => { const errors = validateCalendarException(values, data.academicYear); if (Object.keys(errors).length) return { ok: false, errors }; return operation("overlays", "save", { kind: "exception", values }, { record: values }); }, [data, operation]);
  const removeTeacherAbsence = useCallback(async (id) => operation("overlays", "remove", { kind: "teacher", id }), [operation]);
  const removeClassAbsence = useCallback(async (id) => operation("overlays", "remove", { kind: "class", id }), [operation]);
  const removeCalendarException = useCallback(async (id) => operation("overlays", "remove", { kind: "exception", id }), [operation]);

  const saveRecurringEvent = useCallback(async (values) => { const errors = validateRecurringEvent(values, data.timetableBlocks, data.recurringAssignments, data.recurringEvents); if (Object.keys(errors).length) return { ok: false, errors }; return operation("recurring-items", "save-event", { values }, { event: values }); }, [data, operation]);
  const removeRecurringEvent = useCallback(async (id) => operation("recurring-items", "remove-event", { id }), [operation]);
  const findLessonMovement = useCallback((date, recurringAssignmentId) => getMovementForOccurrence(data.lessonMovements, date, recurringAssignmentId), [data]);
  const saveLessonMovement = useCallback(async (values) => { const validation = validateLessonMovement({ ...values, recurringAssignments: data.recurringAssignments, timetableBlocks: data.timetableBlocks, lessonMovements: data.lessonMovements, recurringEvents: data.recurringEvents, teachingWeeks: data.teachingWeeks }); if (!validation.ok) return validation; return operation("movements", "save", { values }, { movement: values }); }, [data, operation]);
  const removeLessonMovement = useCallback(async (date, recurringAssignmentId) => operation("movements", "remove", { date, recurringAssignmentId }), [operation]);

  const saveTerm = useCallback(async (values) => { const errors = validateTerm(values, data.terms, data.teachingWeeks, data.academicYear, values.id); if (Object.keys(errors).length) return { ok: false, errors }; return operation("calendar", "save", { kind: "term", values }, { term: values }); }, [data, operation]);
  const removeTerm = useCallback(async (id) => operation("calendar", "remove", { kind: "term", id }), [operation]);
  const saveTeachingWeek = useCallback(async (values) => { const term = data.terms.find((item) => item.id === values.termId); if (!term) return { ok: false, errors: { weekStartDate: "Term not found." } }; const errors = validateTeachingWeek(values, term, data.teachingWeeks, values.id); if (Object.keys(errors).length) return { ok: false, errors }; return operation("calendar", "save", { kind: "week", values }, { week: values }); }, [data, operation]);
  const removeTeachingWeek = useCallback(async (id) => operation("calendar", "remove", { kind: "week", id }), [operation]);
  const generateTeachingWeeks = useCallback(async (termId, firstCycleWeek) => { const before = data.teachingWeeks.length; try { const next = await persist("calendar", "generate", { kind: "week", termId, firstCycleWeek }); return next.teachingWeeks.length - before; } catch { return 0; } }, [data, persist]);
  const getLessonOccurrence = useCallback((date, recurringAssignmentId) => findLessonOccurrence(data.lessonOccurrences, date, recurringAssignmentId), [data]);
  const saveLessonOccurrence = useCallback(async (values) => operation("lesson-occurrences", "save", { values }), [operation]);

  const value = useMemo(() => data ? { ...data, createClass, updateClass, archiveClass, restoreClass, getAssignmentCount, assignClassToSlot, removeAssignment, saveTimetableBlock, removeTimetableBlock, moveTimetableBlock, saveTerm, removeTerm, saveTeachingWeek, removeTeachingWeek, generateTeachingWeeks, getLessonOccurrence, saveLessonOccurrence, saveTeacherAbsence, saveClassAbsence, saveCalendarException, removeTeacherAbsence, removeClassAbsence, removeCalendarException, findLessonMovement, saveLessonMovement, removeLessonMovement, saveRecurringEvent, removeRecurringEvent } : null, [data, createClass, updateClass, archiveClass, restoreClass, getAssignmentCount, assignClassToSlot, removeAssignment, saveTimetableBlock, removeTimetableBlock, moveTimetableBlock, saveTerm, removeTerm, saveTeachingWeek, removeTeachingWeek, generateTeachingWeeks, getLessonOccurrence, saveLessonOccurrence, saveTeacherAbsence, saveClassAbsence, saveCalendarException, removeTeacherAbsence, removeClassAbsence, removeCalendarException, findLessonMovement, saveLessonMovement, removeLessonMovement, saveRecurringEvent, removeRecurringEvent]);

  if (loading) return <div className="data-state" role="status">Loading your organiser…</div>;
  if (loadError) return <div className="data-state" role="alert"><h1>We couldn&apos;t load your organiser data.</h1><p>{loadError}</p><button type="button" onClick={load}>Try Again</button></div>;
  if (!data?.academicYear) return <div className="data-state"><h1>Your organiser database is ready.</h1><p>Run <code>npm run db:seed</code> once to add the initial 2026 development data.</p><button type="button" onClick={load}>Check Again</button></div>;
  return <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData() { const context = useContext(SchoolDataContext); if (!context) throw new Error("useSchoolData must be used within SchoolDataProvider."); return context; }
