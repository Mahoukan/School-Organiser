import { getClassColourOption } from "../../data/sampleClasses";
import styles from "./classes.module.css";

function ClassCard({ classItem, onEdit, onArchive, onRestore }) {
  const colour = getClassColourOption(classItem.colour);
  const yearLevel = /^year\b/i.test(classItem.yearLevel)
    ? classItem.yearLevel
    : `Year ${classItem.yearLevel}`;
  const details = [
    classItem.subject || null,
    classItem.yearLevel ? yearLevel : null,
    classItem.room ? `Room ${classItem.room}` : null,
  ].filter(Boolean);

  return (
    <article
      className={`${styles.classCard} ${classItem.archived ? styles.archivedCard : ""}`}
      style={{
        "--class-accent": classItem.colour,
        "--class-tint": colour.background,
        "--class-border": colour.border,
      }}
    >
      <div className={styles.cardBody}>
        <div className={styles.classIdentity}>
          <span className={styles.colourMarker} aria-hidden="true" />
          <div>
            <div className={styles.codeRow}>
              <h2>{classItem.shortCode}</h2>
              {classItem.archived && (
                <span className={styles.archivedLabel}>Archived</span>
              )}
            </div>
            <p className={styles.className}>{classItem.name}</p>
            {details.length > 0 && (
              <p className={styles.classDetails}>{details.join(" · ")}</p>
            )}
          </div>
        </div>

        <div className={styles.cardActions}>
          {classItem.archived ? (
            <button type="button" onClick={() => onRestore(classItem)}>
              Restore
            </button>
          ) : (
            <>
              <button type="button" onClick={() => onEdit(classItem)}>
                Edit
              </button>
              <button
                type="button"
                className={styles.archiveButton}
                onClick={() => onArchive(classItem)}
              >
                Archive
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ClassList({
  classes,
  showingArchived,
  onAdd,
  onEdit,
  onArchive,
  onRestore,
}) {
  if (classes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2>
          {showingArchived ? "No archived classes." : "No active classes yet."}
        </h2>
        <p>
          {showingArchived
            ? "Archived classes will appear here and can be restored."
            : "Create your first class to begin building your timetable."}
        </p>
        {!showingArchived && (
          <button type="button" className={styles.primaryButton} onClick={onAdd}>
            Add Class
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.classList}>
      {classes.map((classItem) => (
        <ClassCard
          key={classItem.id}
          classItem={classItem}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}
