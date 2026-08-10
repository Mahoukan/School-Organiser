import CalendarSections from "../../../components/calendar/CalendarSections";

const allowedSections = new Set(["events", "academic", "teacher-absences", "class-absences", "exceptions"]);

export default async function CalendarPage({ searchParams }) {
  const query = await searchParams;
  const section = allowedSections.has(query?.section) ? query.section : "events";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query?.date ?? "") ? query.date : null;
  return <CalendarSections key={`${section}-${date ?? ""}`} initialSection={section} contextualDate={date} />;
}
