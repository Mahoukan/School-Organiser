"use client";

import { useMemo, useState } from "react";

import { useSchoolData } from "../providers/SchoolDataProvider";
import ClassArchiveDialog from "./ClassArchiveDialog";
import ClassFormPanel from "./ClassFormPanel";
import ClassList from "./ClassList";
import styles from "./classes.module.css";

function sortByShortCode(classes) {
  return [...classes].sort((first, second) =>
    first.shortCode.localeCompare(second.shortCode, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

export default function ClassManager() {
  const {
    classes,
    createClass,
    updateClass,
    archiveClass,
    restoreClass: restoreSharedClass,
    getAssignmentCount,
  } = useSchoolData();
  const [view, setView] = useState("active");
  const [formState, setFormState] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [notice, setNotice] = useState(null);

  const activeClasses = useMemo(
    () => sortByShortCode(classes.filter((classItem) => !classItem.archived)),
    [classes],
  );
  const archivedClasses = useMemo(
    () => sortByShortCode(classes.filter((classItem) => classItem.archived)),
    [classes],
  );
  const displayedClasses = view === "active" ? activeClasses : archivedClasses;

  function openCreateForm() {
    setNotice(null);
    setFormState({ mode: "create", classItem: null });
  }

  function openEditForm(classItem) {
    setNotice(null);
    setFormState({ mode: "edit", classItem });
  }

  async function saveClass(values) {
    if (formState.mode === "edit") {
      const result = await updateClass(formState.classItem.id, values);
      if (!result.ok) { setNotice({ type: "error", message: result.message }); return result; }
      setNotice({ type: "success", message: `${values.shortCode} updated.` });
    } else {
      const result = await createClass(values);
      if (!result.ok) { setNotice({ type: "error", message: result.message }); return result; }
      setView("active");
      setNotice({ type: "success", message: `${values.shortCode} created.` });
    }
    setFormState(null);
    return { ok: true };
  }

  async function confirmArchive() {
    const result = await archiveClass(archiveTarget.id);
    if (!result.ok) {
      setNotice({
        type: "error",
        message: result.message,
      });
      setArchiveTarget(null);
      return;
    }

    setNotice({
      type: "success",
      message: `${archiveTarget.shortCode} archived.`,
    });
    setArchiveTarget(null);
  }

  function requestArchive(classItem) {
    const assignmentCount = getAssignmentCount(classItem.id);
    if (assignmentCount > 0) {
      const periodLabel = assignmentCount === 1 ? "period" : "periods";
      setNotice({
        type: "error",
        message: `${classItem.shortCode} is still assigned to ${assignmentCount} timetable ${periodLabel}. Remove those assignments in Setup before archiving the class.`,
      });
      return;
    }

    setNotice(null);
    setArchiveTarget(classItem);
  }

  async function restoreClass(classItem) {
    const result = await restoreSharedClass(classItem.id);
    if (!result.ok) {
      setNotice({
        type: "error",
        message: result.message,
      });
      return;
    }

    setNotice({ type: "success", message: `${classItem.shortCode} restored.` });
  }

  return (
    <section className={styles.classesPage} aria-labelledby="classes-title">
      <header className={styles.pageHeader}>
        <div>
          <h1 id="classes-title">Classes</h1>
          <p>Manage your classes and lesson history.</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={openCreateForm}>
          Add Class
        </button>
      </header>

      <div className={styles.listToolbar}>
        <div className={styles.viewSelector} aria-label="Class status">
          <button
            type="button"
            aria-pressed={view === "active"}
            onClick={() => {
              setView("active");
              setNotice(null);
            }}
          >
            Active ({activeClasses.length})
          </button>
          <button
            type="button"
            aria-pressed={view === "archived"}
            onClick={() => {
              setView("archived");
              setNotice(null);
            }}
          >
            Archived ({archivedClasses.length})
          </button>
        </div>
      </div>

      {notice && (
        <p
          className={`${styles.notice} ${notice.type === "error" ? styles.errorNotice : ""}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.message}
        </p>
      )}

      <ClassList
        classes={displayedClasses}
        showingArchived={view === "archived"}
        onAdd={openCreateForm}
        onEdit={openEditForm}
        onArchive={requestArchive}
        onRestore={restoreClass}
      />

      {formState && (
        <ClassFormPanel
          key={formState.classItem?.id ?? "create-class"}
          existingClasses={classes}
          editingClass={formState.classItem}
          onSave={saveClass}
          onClose={() => setFormState(null)}
        />
      )}

      {archiveTarget && (
        <ClassArchiveDialog
          classItem={archiveTarget}
          onCancel={() => setArchiveTarget(null)}
          onConfirm={confirmArchive}
        />
      )}
    </section>
  );
}
