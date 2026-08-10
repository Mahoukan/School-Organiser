import ModalDialog from "./ModalDialog";
import styles from "./classes.module.css";

export default function ClassArchiveDialog({ classItem, onCancel, onConfirm }) {
  return (
    <ModalDialog
      className={styles.confirmDialog}
      labelledBy="archive-dialog-title"
      describedBy="archive-dialog-description"
      onClose={onCancel}
    >
      <div className={styles.confirmContent}>
        <p className={styles.panelEyebrow}>Archive class</p>
        <h2 id="archive-dialog-title">Archive {classItem.shortCode}?</h2>
        <p id="archive-dialog-description">
          The class will be removed from your active classes but can be restored
          later. It will not be permanently deleted.
        </p>
      </div>
      <div className={styles.confirmActions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={styles.dangerButton} onClick={onConfirm}>
          Archive
        </button>
      </div>
    </ModalDialog>
  );
}
