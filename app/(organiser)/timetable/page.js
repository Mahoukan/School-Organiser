import { Suspense } from "react";
import TimetablePrototype from "../../../components/timetable/TimetablePrototype";

export default function TimetablePage() {
  return <Suspense fallback={<div className="data-state" role="status">Loading timetable…</div>}><TimetablePrototype /></Suspense>;
}
