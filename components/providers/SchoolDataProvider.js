"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { findLessonOccurrence } from "../../lib/lessonOccurrences";
import { getMovementForOccurrence, validateLessonMovement } from "../../lib/lessonMovements";
import { validateDayTemplateName, validateTemplateBlock } from "../../lib/dayTimetableTemplates";
import { validateRecurringEvent } from "../../lib/recurringEvents";
import { validateTeachingWeek, validateTerm } from "../../lib/academicCalendar";
import { validateCalendarException, validateClassAbsence, validateTeacherAbsence } from "../../lib/scheduleOverlays";
import { validateDatedEvent } from "../../lib/datedEvents";
import { normalizeUserPreferences } from "../../lib/userPreferences";

const SchoolDataContext = createContext(null);

function hydrateSchoolData(payload) {
  return {
    ...payload,
    preferences: normalizeUserPreferences(payload.preferences),
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

export default function SchoolDataProvider({ children, initialPreferences }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [appearance, setAppearance] = useState(() => normalizeUserPreferences(initialPreferences));
  const [preferenceSavePending, setPreferenceSavePending] = useState(false);
  const [preferenceSaveError, setPreferenceSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const pendingOperations = useRef(new Set());
  const preferenceSaveLock = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const response = await fetch("/api/school-data", { cache: "no-store" });
      if (response.status === 401) { router.replace("/signin"); return; }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We couldn't load your organiser data.");
      const hydrated = hydrateSchoolData(body);
      setData(hydrated);
      setAppearance(hydrated.preferences);
    } catch (error) { setLoadError(error.message); }
    finally { setLoading(false); }
  }, [router]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const persist = useCallback(async (resource, action, payload = {}) => {
    const response = await fetch(`/api/school-data/${resource}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
    if (response.status === 401) { router.replace("/signin"); throw new Error("Your session has expired."); }
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "The change could not be saved.");
    const hydrated = hydrateSchoolData(body);
    setData(hydrated);
    return hydrated;
  }, [router]);

  const operation = useCallback(async (resource, action, payload, success = {}) => {
    const key = `${resource}:${action}`;
    if (pendingOperations.current.has(key)) return { ok: false, pending: true, message: "This change is already being saved.", errors: { form: "This change is already being saved." } };
    pendingOperations.current.add(key);
    try { await persist(resource, action, payload); return { ok: true, ...success }; }
    catch (error) { return { ok: false, message: error.message, errors: { form: error.message } }; }
    finally { pendingOperations.current.delete(key); }
  }, [persist]);

  const createClass = useCallback(async (values) => operation("classes", "save", { values }, { classItem: values }), [operation]);
  const updateClass = useCallback(async (classId, values) => operation("classes", "save", { id: classId, values }), [operation]);
  const archiveClass = useCallback(async (classId) => operation("classes", "archive", { id: classId }), [operation]);
  const restoreClass = useCallback(async (classId) => operation("classes", "restore", { id: classId }), [operation]);
  const getAssignmentCount = useCallback((classId) => data.recurringAssignments.filter((item) => item.classId === classId).length, [data]);
  const assignClassToSlot = useCallback(async (values) => operation("recurring-items", "save-class", values), [operation]);
  const removeAssignment = useCallback(async (cycleWeek, weekday, periodId) => operation("recurring-items", "remove-class", { cycleWeek, weekday, periodId }), [operation]);

  const createDayTemplate = useCallback(async (name, sourceTemplateId) => { const errors = validateDayTemplateName({ name }, data.dayTimetableTemplates); if (Object.keys(errors).length) return { ok: false, errors }; return operation("day-templates", sourceTemplateId ? "duplicate" : "create", { name, sourceTemplateId }); }, [data, operation]);
  const renameDayTemplate = useCallback(async (id, name) => { const errors = validateDayTemplateName({ name }, data.dayTimetableTemplates, id); if (Object.keys(errors).length) return { ok: false, errors }; return operation("day-templates", "rename", { id, name }); }, [data, operation]);
  const deleteDayTemplate = useCallback(async (id) => operation("day-templates", "delete", { id }), [operation]);
  const saveDayTemplateBlock = useCallback(async (values) => { const errors = validateTemplateBlock(values, data.dayTimetableTemplateBlocks, values.templateId, values.id); if (Object.keys(errors).length) return { ok: false, errors }; return operation("day-templates", "save-block", values); }, [data, operation]);
  const removeDayTemplateBlock = useCallback(async (id) => operation("day-templates", "remove-block", { id }), [operation]);
  const moveDayTemplateBlock = useCallback(async (id, direction) => operation("day-templates", "move-block", { id, direction }), [operation]);
  const assignDayTemplate = useCallback(async (templateId, cycleWeek, weekday) => operation("day-templates", "assign", { templateId, cycleWeek, weekday }), [operation]);
  const bulkAssignDayTemplate = useCallback(async (templateId, days) => operation("day-templates", "bulk-assign", { templateId, days }), [operation]);

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
  const saveDatedEvent = useCallback(async (values) => { const errors = validateDatedEvent(values, data.academicYear); if (Object.keys(errors).length) return { ok: false, errors }; return operation("dated-events", "save", { values }, { event: values }); }, [data, operation]);
  const removeDatedEvent = useCallback(async (id) => operation("dated-events", "remove", { id }), [operation]);

  const updatePreferences = useCallback(async (patch) => {
    if (preferenceSaveLock.current) return { ok: false, pending: true, message: "Another preference is still being saved." };
    preferenceSaveLock.current = true;
    const previous = appearance;
    const optimistic = normalizeUserPreferences({ ...appearance, ...patch });
    setAppearance(optimistic);
    setData((current) => current ? { ...current, preferences: optimistic } : current);
    setPreferenceSavePending(true);
    setPreferenceSaveError("");
    try {
      const response = await fetch("/api/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (response.status === 401) { router.replace("/signin"); throw new Error("Your session has expired."); }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Preferences could not be saved.");
      const saved = normalizeUserPreferences(body.preferences);
      setAppearance(saved);
      setData((current) => current ? { ...current, preferences: saved } : current);
      return { ok: true, preferences: saved };
    } catch (error) {
      setAppearance(previous);
      setData((current) => current ? { ...current, preferences: previous } : current);
      setPreferenceSaveError(`${error.message} Your previous preferences have been restored.`);
      return { ok: false, message: error.message };
    } finally {
      preferenceSaveLock.current = false;
      setPreferenceSavePending(false);
    }
  }, [appearance, router]);

  const value = useMemo(() => data ? { ...data, preferences: appearance, updatePreferences, preferenceSavePending, preferenceSaveError, createClass, updateClass, archiveClass, restoreClass, getAssignmentCount, assignClassToSlot, removeAssignment, createDayTemplate, renameDayTemplate, deleteDayTemplate, saveDayTemplateBlock, removeDayTemplateBlock, moveDayTemplateBlock, assignDayTemplate, bulkAssignDayTemplate, saveTerm, removeTerm, saveTeachingWeek, removeTeachingWeek, generateTeachingWeeks, getLessonOccurrence, saveLessonOccurrence, saveTeacherAbsence, saveClassAbsence, saveCalendarException, removeTeacherAbsence, removeClassAbsence, removeCalendarException, findLessonMovement, saveLessonMovement, removeLessonMovement, saveRecurringEvent, removeRecurringEvent, saveDatedEvent, removeDatedEvent } : null, [data, appearance, updatePreferences, preferenceSavePending, preferenceSaveError, createClass, updateClass, archiveClass, restoreClass, getAssignmentCount, assignClassToSlot, removeAssignment, createDayTemplate, renameDayTemplate, deleteDayTemplate, saveDayTemplateBlock, removeDayTemplateBlock, moveDayTemplateBlock, assignDayTemplate, bulkAssignDayTemplate, saveTerm, removeTerm, saveTeachingWeek, removeTeachingWeek, generateTeachingWeeks, getLessonOccurrence, saveLessonOccurrence, saveTeacherAbsence, saveClassAbsence, saveCalendarException, removeTeacherAbsence, removeClassAbsence, removeCalendarException, findLessonMovement, saveLessonMovement, removeLessonMovement, saveRecurringEvent, removeRecurringEvent, saveDatedEvent, removeDatedEvent]);

  let content;
  if (loading) content = <div className="data-state" role="status">Loading your organiser…</div>;
  else if (loadError) content = <div className="data-state" role="alert"><h1>We couldn&apos;t load your organiser.</h1><p>{loadError}</p><p>Your saved data has not been changed.</p><button type="button" onClick={load}>Try Again</button></div>;
  else if (!data?.academicYear) content = <div className="data-state"><h1>Your organiser is ready for setup.</h1><p>No academic year is configured for this account yet.</p><button type="button" onClick={load}>Check Again</button></div>;
  else content = <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
  return <div className="appearance-root" data-theme={appearance.theme} data-accent={appearance.accentColour} data-density={appearance.density}>{content}</div>;
}

export function useSchoolData() { const context = useContext(SchoolDataContext); if (!context) throw new Error("useSchoolData must be used within SchoolDataProvider."); return context; }
