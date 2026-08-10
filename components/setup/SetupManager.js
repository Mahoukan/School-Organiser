"use client";

import { useState } from "react";
import PeriodStructureManager from "./PeriodStructureManager";
import RecurringTimetableSetup from "./RecurringTimetableSetup";
import styles from "./setup.module.css";

export default function SetupManager() {
  const [area, setArea] = useState("periods");
  return (
    <section className={styles.setupPage} aria-labelledby="setup-title">
      <header className={styles.pageHeader}><h1 id="setup-title">Setup</h1><p>Configure reusable day timetables and your recurring timetable.</p></header>
      <div className={styles.setupTabs} aria-label="Setup area">
        <button type="button" aria-pressed={area === "periods"} onClick={() => setArea("periods")}>Day Timetables</button>
        <button type="button" aria-pressed={area === "timetable"} onClick={() => setArea("timetable")}>Recurring Timetable</button>
      </div>
      {area === "periods" ? <PeriodStructureManager /> : <RecurringTimetableSetup />}
    </section>
  );
}
