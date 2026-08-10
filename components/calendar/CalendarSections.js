"use client";

import { useEffect, useState } from "react";
import SectionIntro from "../SectionIntro";
import CalendarManager from "./CalendarManager";
import OverlayManager from "./OverlayManager";
import DatedEventsManager from "../events/DatedEventsManager";
import styles from "./calendar.module.css";

export default function CalendarSections({ initialSection = "events", contextualDate = null }) {
  const initialTab = ["teacher-absences", "class-absences"].includes(initialSection) ? "absences" : initialSection;
  const [section, setSection] = useState(initialTab);
  const options = [{ value: "events", label: "One-Off Events" }, { value: "academic", label: "Academic Calendar" }, { value: "absences", label: "Absences" }, { value: "exceptions", label: "Exceptions" }];
  useEffect(() => {
    const target = document.getElementById(initialSection);
    if (!target) return;
    requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  }, [initialSection]);
  return <section className={styles.page}>
    <SectionIntro title="Calendar" description="Manage teaching weeks, absences and calendar exceptions." />
    <div className={styles.sectionTabs} aria-label="Calendar section">{options.map((option) => <button key={option.value} type="button" aria-pressed={section === option.value} onClick={() => setSection(option.value)}>{option.label}</button>)}</div>
    {section === "events" ? <DatedEventsManager contextualDate={contextualDate} /> : section === "academic" ? <CalendarManager /> : <OverlayManager mode={section} contextualDate={contextualDate} />}
  </section>;
}
