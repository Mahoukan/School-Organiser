import { useEffect, useRef } from "react";

export default function ModalDialog({
  children,
  className,
  labelledBy,
  describedBy,
  onClose,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={onClose}
      onClose={onClose}
    >
      {children}
    </dialog>
  );
}
