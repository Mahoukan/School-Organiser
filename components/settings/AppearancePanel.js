"use client";

import {
  ACCENT_COLOURS,
  CONTENT_FONTS,
  DENSITIES,
  HEADING_FONTS,
  HIGHLIGHT_COLOURS,
  INTERFACE_FONTS,
  NEUTRAL_TONES,
  THEMES,
} from "../../lib/userPreferences";
import { useSchoolData } from "../providers/SchoolDataProvider";
import styles from "./settings.module.css";

function ChoiceGroup({ legend, description, options, value, onChange, disabled, variant = "segment" }) {
  const choicesClass = variant === "colour" ? styles.colourChoices : variant === "font" ? styles.fontChoices : variant === "tone" ? styles.toneChoices : styles.segmentedChoices;
  return <fieldset className={styles.choiceGroup} disabled={disabled}>
    <legend>{legend}</legend>
    <p className={styles.choiceDescription}>{description}</p>
    <div className={choicesClass}>
      {options.map((option) => <label className={styles.choice} key={option.value}>
        <input type="radio" name={legend} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span className={styles.choiceLabel}>
          {variant === "colour" && <span className={styles.swatch} data-swatch={option.value} aria-hidden="true" />}
          {variant === "tone" && <span className={styles.tonePreview} data-tone={option.value} aria-hidden="true"><span /><span /></span>}
          <span className={styles.choiceCopy}>
            <strong>{option.label}</strong>
            {variant === "font" && <span className={styles.fontSample} data-font={option.value}>The quick brown fox</span>}
          </span>
          <span className={styles.selectedText}>{value === option.value ? "Selected" : ""}</span>
        </span>
      </label>)}
    </div>
  </fieldset>;
}

function AppearancePreview() {
  return <section className={styles.preview} aria-labelledby="appearance-preview-heading">
    <div className={styles.previewHeading}>
      <div><span>Appearance preview</span><h3 id="appearance-preview-heading">Tuesday 11 August</h3></div>
      <span className={styles.previewNow}>Now</span>
    </div>
    <div className={styles.previewLesson}>
      <span className={styles.previewClassMarker} aria-hidden="true" />
      <div><strong>10DGT</strong><span>Introduction to Databases</span></div>
      <span className={styles.previewStatus}>Completed</span>
    </div>
    <p className={styles.previewContent}>This is an example lesson-plan paragraph using the selected lesson font.</p>
    <div className={styles.previewFooter}><span>P3 · 11:00–11:55</span><span className={styles.previewAction}>Primary action</span></div>
  </section>;
}

export default function AppearancePanel() {
  const { preferences, updatePreferences, preferenceSavePending, preferenceSaveError } = useSchoolData();
  return <section className={`${styles.panel} ${styles.appearancePanel}`} aria-labelledby="appearance-heading">
    <div className={styles.panelHeading}>
      <div><h2 id="appearance-heading">Appearance</h2><p>Personalise the organiser on every device where you sign in.</p></div>
      <span className={styles.saveStatus} role="status" aria-live="polite">{preferenceSavePending ? "Saving…" : ""}</span>
    </div>
    {preferenceSaveError && <p className={styles.error} role="alert">{preferenceSaveError}</p>}
    <AppearancePreview />
    <ChoiceGroup legend="Theme" description="Choose light, dark, or follow this device’s system setting." options={THEMES} value={preferences.theme} onChange={(theme) => updatePreferences({ theme })} disabled={preferenceSavePending} />
    <ChoiceGroup legend="Primary colour" description="Used for primary buttons, selected navigation, links and active controls." options={ACCENT_COLOURS} value={preferences.accentColour} onChange={(accentColour) => updatePreferences({ accentColour })} disabled={preferenceSavePending} variant="colour" />
    <ChoiceGroup legend="Highlight colour" description="Used for Today, Now/current-period and selected-date emphasis." options={HIGHLIGHT_COLOURS} value={preferences.highlightColour} onChange={(highlightColour) => updatePreferences({ highlightColour })} disabled={preferenceSavePending} variant="colour" />
    <ChoiceGroup legend="Neutral tone" description="Controls backgrounds, surfaces, borders and muted interface colours. Cool preserves the original organiser palette." options={NEUTRAL_TONES} value={preferences.neutralTone} onChange={(neutralTone) => updatePreferences({ neutralTone })} disabled={preferenceSavePending} variant="tone" />
    <ChoiceGroup legend="Interface font" description="Used throughout navigation, timetable, forms, buttons and general interface text." options={INTERFACE_FONTS} value={preferences.interfaceFont} onChange={(interfaceFont) => updatePreferences({ interfaceFont })} disabled={preferenceSavePending} variant="font" />
    <ChoiceGroup legend="Heading font" description="Used for page titles, section headings and prominent date headings." options={HEADING_FONTS} value={preferences.headingFont} onChange={(headingFont) => updatePreferences({ headingFont })} disabled={preferenceSavePending} variant="font" />
    <ChoiceGroup legend="Lesson font" description="Used for lesson-plan editing, rendered Markdown and long-form lesson content." options={CONTENT_FONTS} value={preferences.contentFont} onChange={(contentFont) => updatePreferences({ contentFont })} disabled={preferenceSavePending} variant="font" />
    <ChoiceGroup legend="Density" description="Controls interface spacing without changing the information shown." options={DENSITIES} value={preferences.density} onChange={(density) => updatePreferences({ density })} disabled={preferenceSavePending} />
    <p className={styles.semanticNote}>Class colours, event colours, lesson statuses, warnings and destructive actions keep their own semantic colours for clarity.</p>
  </section>;
}
