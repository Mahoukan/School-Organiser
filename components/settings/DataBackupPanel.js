"use client";

import { useState } from "react";

import styles from "./settings.module.css";

function responseFilename(response) {
  const header = response.headers.get("Content-Disposition") ?? "";
  const match = header.match(/filename="([a-z0-9-]+\.json)"/i);
  return match?.[1] ?? "school-organiser-backup.json";
}

export default function DataBackupPanel() {
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  async function exportData() {
    if (preparing) return;
    setPreparing(true);
    setError("");
    try {
      const response = await fetch("/api/export", { cache: "no-store" });
      if (!response.ok) throw new Error("Export request failed.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = responseFilename(response);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setError("Could not export your organiser data. Please try again.");
    } finally {
      setPreparing(false);
    }
  }

  return <section className={styles.panel} aria-labelledby="data-backup-heading">
    <h2 id="data-backup-heading">Data &amp; Backup</h2>
    <p>Download a JSON copy of your organiser data. This portable export does not contain sign-in accounts, sessions, OAuth tokens, or application secrets.</p>
    <p className={styles.guidance}>PostgreSQL backups remain the primary disaster-recovery method. JSON import is not available in v1.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <button type="button" onClick={exportData} disabled={preparing}>{preparing ? "Preparing Export…" : "Export Organiser Data"}</button>
  </section>;
}
