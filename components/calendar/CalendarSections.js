"use client";

import { useState } from "react";
import SectionIntro from "../SectionIntro";
import CalendarManager from "./CalendarManager";
import OverlayManager from "./OverlayManager";
import DatedEventsManager from "../events/DatedEventsManager";
import styles from "./calendar.module.css";

export default function CalendarSections() {
  const [section, setSection] = useState("events");
  const options = [{ value: "events", label: "One-Off Events" }, { value: "academic", label: "Academic Calendar" }, { value: "absences", label: "Absences" }, { value: "exceptions", label: "Exceptions" }];
  return <section className={styles.page}>
    <SectionIntro title="Calendar" description="Manage teaching weeks, absences and calendar exceptions." />
    <div className={styles.sectionTabs} aria-label="Calendar section">{options.map((option) => <button key={option.value} type="button" aria-pressed={section === option.value} onClick={() => setSection(option.value)}>{option.label}</button>)}</div>
    {section === "events" ? <DatedEventsManager /> : section === "academic" ? <CalendarManager /> : <OverlayManager mode={section} />}
  </section>;
}
