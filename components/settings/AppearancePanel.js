"use client";

import { ACCENT_COLOURS, DENSITIES, THEMES } from "../../lib/userPreferences";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./settings.module.css";

function ChoiceGroup({ legend, options, value, onChange, disabled, accents = false }) {
  return <fieldset className={styles.choiceGroup} disabled={disabled}>
    <legend>{legend}</legend>
    <div className={accents ? styles.accentChoices : styles.segmentedChoices}>
      {options.map((option) => <label className={styles.choice} key={option.value}>
        <input type="radio" name={legend} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span className={styles.choiceLabel}>
          {accents && <span className={styles.swatch} data-swatch={option.value} aria-hidden="true" />}
          <span>{option.label}</span>
          <span className={styles.selectedText}>{value === option.value ? "Selected" : ""}</span>
        </span>
      </label>)}
    </div>
  </fieldset>;
}

export default function AppearancePanel() {
  const { preferences, updatePreferences, preferenceSavePending, preferenceSaveError } = useSchoolData();
  return <section className={`${styles.panel} ${styles.appearancePanel}`} aria-labelledby="appearance-heading">
    <div className={styles.panelHeading}>
      <div><h2 id="appearance-heading">Appearance</h2><p>Personalise the organiser on every device where you sign in.</p></div>
      <span className={styles.saveStatus} role="status" aria-live="polite">{preferenceSavePending ? "Saving…" : ""}</span>
    </div>
    {preferenceSaveError && <p className={styles.error} role="alert">{preferenceSaveError}</p>}
    <ChoiceGroup legend="Theme" options={THEMES} value={preferences.theme} onChange={(theme) => updatePreferences({ theme })} disabled={preferenceSavePending} />
    <ChoiceGroup legend="Accent colour" options={ACCENT_COLOURS} value={preferences.accentColour} onChange={(accentColour) => updatePreferences({ accentColour })} disabled={preferenceSavePending} accents />
    <ChoiceGroup legend="Density" options={DENSITIES} value={preferences.density} onChange={(density) => updatePreferences({ density })} disabled={preferenceSavePending} />
  </section>;
}
