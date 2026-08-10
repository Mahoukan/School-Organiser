"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { sampleRecurringAssignments } from "../../data/sampleAssignments";
import {
  sampleAcademicYear,
  sampleTeachingWeeks,
  sampleTerms,
} from "../../data/sampleAcademicCalendar";
import { sampleClasses } from "../../data/sampleClasses";
import {
  getTemporaryEvent,
  periods,
  weekdays,
} from "../../data/sampleTimetable";
import { findAssignmentForSlot } from "../../lib/recurringTimetable";
import {
  generateMissingWeeks,
  validateTeachingWeek,
  validateTerm,
} from "../../lib/academicCalendar";
import {
  findLessonOccurrence,
  getLessonOccurrenceId,
  hasLessonContent,
  normalizeLessonContent,
} from "../../lib/lessonOccurrences";

const SchoolDataContext = createContext(null);

export default function SchoolDataProvider({ children }) {
  const [academicYear] = useState(() => ({ ...sampleAcademicYear }));
  const [terms, setTerms] = useState(() => sampleTerms.map((term) => ({ ...term })));
  const [teachingWeeks, setTeachingWeeks] = useState(() =>
    sampleTeachingWeeks.map((week) => ({ ...week })),
  );
  const [classes, setClasses] = useState(() =>
    sampleClasses.map((classItem) => ({ ...classItem })),
  );
  const [recurringAssignments, setRecurringAssignments] = useState(() =>
    sampleRecurringAssignments.map((assignment) => ({ ...assignment })),
  );
  const [lessonOccurrences, setLessonOccurrences] = useState([]);

  const createClass = useCallback((values) => {
    const newClass = {
      id: `class-${crypto.randomUUID()}`,
      ...values,
    };
    setClasses((current) => [...current, newClass]);
    return newClass;
  }, []);

  const updateClass = useCallback((classId, values) => {
    setClasses((current) =>
      current.map((classItem) =>
        classItem.id === classId ? { ...classItem, ...values } : classItem,
      ),
    );
  }, []);

  const getAssignmentCount = useCallback(
    (classId) =>
      recurringAssignments.filter(
        (assignment) => assignment.classId === classId,
      ).length,
    [recurringAssignments],
  );

  const archiveClass = useCallback(
    (classId) => {
      const assignmentCount = getAssignmentCount(classId);
      if (assignmentCount > 0) {
        return { ok: false, assignmentCount };
      }

      setClasses((current) =>
        current.map((classItem) =>
          classItem.id === classId
            ? { ...classItem, archived: true }
            : classItem,
        ),
      );
      return { ok: true, assignmentCount: 0 };
    },
    [getAssignmentCount],
  );

  const restoreClass = useCallback(
    (classId) => {
      const classItem = classes.find((candidate) => candidate.id === classId);
      const duplicate = classes.some(
        (candidate) =>
          candidate.id !== classId &&
          !candidate.archived &&
          candidate.academicYear === classItem.academicYear &&
          candidate.shortCode.toUpperCase() === classItem.shortCode.toUpperCase(),
      );

      if (duplicate) return { ok: false, reason: "duplicate" };

      setClasses((current) =>
        current.map((candidate) =>
          candidate.id === classId
            ? { ...candidate, archived: false }
            : candidate,
        ),
      );
      return { ok: true };
    },
    [classes],
  );

  const assignClassToSlot = useCallback(
    ({ classId, cycleWeek, weekday, periodId }) => {
      const classItem = classes.find((candidate) => candidate.id === classId);
      const period = periods.find((candidate) => candidate.id === periodId);
      const validWeekday = weekdays.some((candidate) => candidate.key === weekday);
      const event = getTemporaryEvent(cycleWeek, weekday, periodId);

      if (
        !classItem ||
        classItem.archived ||
        !["A", "B"].includes(cycleWeek) ||
        !validWeekday ||
        period?.type !== "teaching" ||
        event
      ) {
        return { ok: false };
      }

      setRecurringAssignments((current) => {
        const existing = findAssignmentForSlot(
          current,
          cycleWeek,
          weekday,
          periodId,
        );

        if (existing) {
          return current.map((assignment) =>
            assignment.id === existing.id
              ? { ...assignment, classId }
              : assignment,
          );
        }

        return [
          ...current,
          {
            id: `assignment-${crypto.randomUUID()}`,
            classId,
            cycleWeek,
            weekday,
            periodId,
          },
        ];
      });
      return { ok: true };
    },
    [classes],
  );

  const removeAssignment = useCallback((cycleWeek, weekday, periodId) => {
    setRecurringAssignments((current) =>
      current.filter(
        (assignment) =>
          !(
            assignment.cycleWeek === cycleWeek &&
            assignment.weekday === weekday &&
            assignment.periodId === periodId
          ),
      ),
    );
  }, []);

  const saveTerm = useCallback(
    (values) => {
      const errors = validateTerm(values, terms, teachingWeeks, academicYear, values.id);
      if (Object.keys(errors).length) return { ok: false, errors };
      const term = {
        id: values.id ?? `term-${crypto.randomUUID()}`,
        academicYear: academicYear.year,
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        displayOrder:
          values.displayOrder ?? Math.max(0, ...terms.map((item) => item.displayOrder)) + 1,
      };
      setTerms((current) =>
        values.id
          ? current.map((item) => (item.id === values.id ? term : item))
          : [...current, term],
      );
      return { ok: true, term };
    },
    [academicYear, teachingWeeks, terms],
  );

  const removeTerm = useCallback(
    (termId) => {
      if (teachingWeeks.some((week) => week.termId === termId)) {
        return { ok: false, message: "Remove this term's teaching weeks first." };
      }
      setTerms((current) => current.filter((term) => term.id !== termId));
      return { ok: true };
    },
    [teachingWeeks],
  );

  const saveTeachingWeek = useCallback(
    (values) => {
      const term = terms.find((item) => item.id === values.termId);
      if (!term) return { ok: false, errors: { weekStartDate: "Term not found." } };
      const errors = validateTeachingWeek(values, term, teachingWeeks, values.id);
      if (Object.keys(errors).length) return { ok: false, errors };
      const week = {
        id: values.weekStartDate,
        termId: values.termId,
        weekStartDate: values.weekStartDate,
        cycleWeek: values.cycleWeek,
      };
      setTeachingWeeks((current) =>
        values.id
          ? current.map((item) => (item.id === values.id ? week : item))
          : [...current, week],
      );
      return { ok: true, week };
    },
    [teachingWeeks, terms],
  );

  const removeTeachingWeek = useCallback((weekId) => {
    setTeachingWeeks((current) => current.filter((week) => week.id !== weekId));
  }, []);

  const generateTeachingWeeks = useCallback(
    (termId, firstCycleWeek) => {
      const term = terms.find((item) => item.id === termId);
      if (!term) return 0;
      const generated = generateMissingWeeks(term, teachingWeeks, firstCycleWeek);
      setTeachingWeeks((current) => [...current, ...generated]);
      return generated.length;
    },
    [teachingWeeks, terms],
  );

  const getLessonOccurrence = useCallback(
    (dateKey, recurringAssignmentId) =>
      findLessonOccurrence(
        lessonOccurrences,
        dateKey,
        recurringAssignmentId,
      ),
    [lessonOccurrences],
  );

  const saveLessonOccurrence = useCallback((lessonDetails) => {
    const content = normalizeLessonContent(lessonDetails);
    const occurrenceId = getLessonOccurrenceId(
      lessonDetails.date,
      lessonDetails.recurringAssignmentId,
    );

    setLessonOccurrences((current) => {
      if (!hasLessonContent(content)) {
        return current.filter((occurrence) => occurrence.id !== occurrenceId);
      }

      const savedOccurrence = {
        id: occurrenceId,
        date: lessonDetails.date,
        recurringAssignmentId: lessonDetails.recurringAssignmentId,
        classId: lessonDetails.classId,
        periodId: lessonDetails.periodId,
        ...content,
      };
      const existing = current.some(
        (occurrence) => occurrence.id === occurrenceId,
      );

      return existing
        ? current.map((occurrence) =>
            occurrence.id === occurrenceId ? savedOccurrence : occurrence,
          )
        : [...current, savedOccurrence];
    });

    return hasLessonContent(content) ? { ...lessonDetails, ...content } : null;
  }, []);

  const value = useMemo(
    () => ({
      academicYear,
      terms,
      teachingWeeks,
      classes,
      recurringAssignments,
      lessonOccurrences,
      createClass,
      updateClass,
      archiveClass,
      restoreClass,
      getAssignmentCount,
      assignClassToSlot,
      removeAssignment,
      saveTerm,
      removeTerm,
      saveTeachingWeek,
      removeTeachingWeek,
      generateTeachingWeeks,
      getLessonOccurrence,
      saveLessonOccurrence,
    }),
    [
      academicYear,
      terms,
      teachingWeeks,
      classes,
      recurringAssignments,
      lessonOccurrences,
      createClass,
      updateClass,
      archiveClass,
      restoreClass,
      getAssignmentCount,
      assignClassToSlot,
      removeAssignment,
      saveTerm,
      removeTerm,
      saveTeachingWeek,
      removeTeachingWeek,
      generateTeachingWeeks,
      getLessonOccurrence,
      saveLessonOccurrence,
    ],
  );

  return (
    <SchoolDataContext.Provider value={value}>
      {children}
    </SchoolDataContext.Provider>
  );
}

export function useSchoolData() {
  const context = useContext(SchoolDataContext);
  if (!context) {
    throw new Error("useSchoolData must be used within SchoolDataProvider.");
  }
  return context;
}
