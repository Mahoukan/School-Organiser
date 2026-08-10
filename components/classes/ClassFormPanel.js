import { useState } from "react";

import {
  CLASS_ACADEMIC_YEAR,
  classColourOptions,
} from "../../data/sampleClasses";
import ModalDialog from "./ModalDialog";
import styles from "./classes.module.css";

const fieldLimits = {
  name: 100,
  shortCode: 12,
  subject: 100,
  yearLevel: 20,
  room: 30,
};

const emptyClass = {
  name: "",
  shortCode: "",
  subject: "",
  yearLevel: "",
  room: "",
  colour: "",
};

function TextField({
  id,
  label,
  required = false,
  value,
  error,
  maxLength,
  placeholder,
  onChange,
}) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.formField}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required={required}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ClassFormPanel({
  existingClasses,
  editingClass,
  onSave,
  onClose,
}) {
  const [values, setValues] = useState(() =>
    editingClass
      ? {
          name: editingClass.name,
          shortCode: editingClass.shortCode,
          subject: editingClass.subject,
          yearLevel: editingClass.yearLevel,
          room: editingClass.room,
          colour: editingClass.colour,
        }
      : emptyClass,
  );
  const [errors, setErrors] = useState({});
  const title = editingClass ? `Edit ${editingClass.shortCode}` : "Add Class";

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors = {};
    const trimmed = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    );
    const normalizedCode = trimmed.shortCode.toUpperCase();

    if (!trimmed.name) nextErrors.name = "Enter a class name.";
    if (!normalizedCode) nextErrors.shortCode = "Enter a short code.";
    if (!trimmed.colour) nextErrors.colour = "Select a class colour.";

    Object.entries(fieldLimits).forEach(([field, limit]) => {
      if (trimmed[field].length > limit) {
        nextErrors[field] = `${field === "shortCode" ? "Short code" : "This field"} must be ${limit} characters or fewer.`;
      }
    });

    const duplicate = existingClasses.some(
      (classItem) =>
        classItem.id !== editingClass?.id &&
        classItem.academicYear === CLASS_ACADEMIC_YEAR &&
        classItem.shortCode.trim().toUpperCase() === normalizedCode,
    );
    if (normalizedCode && duplicate) {
      nextErrors.shortCode = `A 2026 class already uses ${normalizedCode}.`;
    }

    setErrors(nextErrors);
    return {
      valid: Object.keys(nextErrors).length === 0,
      values: { ...trimmed, shortCode: normalizedCode },
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validate();
    if (!result.valid) return;

    await onSave({
      ...result.values,
      academicYear: CLASS_ACADEMIC_YEAR,
      archived: editingClass?.archived ?? false,
    });
  }

  const colourErrorId = "class-colour-error";

  return (
    <ModalDialog
      className={styles.formPanel}
      labelledBy="class-form-title"
      onClose={onClose}
    >
      <form className={styles.classForm} noValidate onSubmit={handleSubmit}>
        <header className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>
              {editingClass ? "Class details" : "New class"}
            </p>
            <h2 id="class-form-title">{title}</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close class form"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.formBody}>
          <TextField
            id="class-name"
            label="Class Name"
            required
            value={values.name}
            error={errors.name}
            maxLength={fieldLimits.name}
            placeholder="Year 10 Digital Technology"
            onChange={(value) => updateField("name", value)}
          />
          <TextField
            id="short-code"
            label="Short Code"
            required
            value={values.shortCode}
            error={errors.shortCode}
            maxLength={fieldLimits.shortCode}
            placeholder="10DGT"
            onChange={(value) => updateField("shortCode", value)}
          />
          <TextField
            id="subject"
            label="Subject"
            value={values.subject}
            error={errors.subject}
            maxLength={fieldLimits.subject}
            placeholder="Digital Technology"
            onChange={(value) => updateField("subject", value)}
          />
          <div className={styles.formRow}>
            <TextField
              id="year-level"
              label="Year Level"
              value={values.yearLevel}
              error={errors.yearLevel}
              maxLength={fieldLimits.yearLevel}
              placeholder="10"
              onChange={(value) => updateField("yearLevel", value)}
            />
            <TextField
              id="default-room"
              label="Default Room"
              value={values.room}
              error={errors.room}
              maxLength={fieldLimits.room}
              placeholder="DT1"
              onChange={(value) => updateField("room", value)}
            />
          </div>

          <fieldset
            className={styles.colourFieldset}
            aria-describedby={errors.colour ? colourErrorId : undefined}
          >
            <legend>
              Colour<span aria-hidden="true"> *</span>
            </legend>
            <div className={styles.colourOptions}>
              {classColourOptions.map((option) => (
                <label key={option.value} className={styles.colourOption}>
                  <input
                    type="radio"
                    name="colour"
                    value={option.value}
                    checked={values.colour === option.value}
                    onChange={() => updateField("colour", option.value)}
                  />
                  <span
                    className={styles.colourSwatch}
                    style={{ background: option.value }}
                    aria-hidden="true"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {errors.colour && (
              <p id={colourErrorId} className={styles.fieldError}>
                {errors.colour}
              </p>
            )}
          </fieldset>

          <div className={styles.readOnlyField}>
            <span>Academic Year</span>
            <strong>{CLASS_ACADEMIC_YEAR}</strong>
            <small>Fixed for this prototype.</small>
          </div>
        </div>

        <footer className={styles.panelFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.primaryButton}>
            {editingClass ? "Save Changes" : "Create Class"}
          </button>
        </footer>
      </form>
    </ModalDialog>
  );
}
