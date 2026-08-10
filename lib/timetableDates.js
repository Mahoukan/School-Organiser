export function toDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function addDays(date, amount) {
  const result = toDateOnly(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function getMonday(date) {
  const result = toDateOnly(date);
  const daysFromMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - daysFromMonday);
  return result;
}

export function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

export function getFortnightStart(date) {
  return getMonday(date);
}

export function getWeekdayIndex(date) {
  const index = date.getDay() - 1;
  return Math.min(Math.max(index, 0), 4);
}

export function formatDayHeading(date) {
  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function monthName(date) {
  return new Intl.DateTimeFormat("en-NZ", { month: "long" }).format(date);
}

export function formatDateRange(start, end) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${monthName(end)} ${end.getFullYear()}`;
  }

  if (sameYear) {
    return `${start.getDate()} ${monthName(start)}–${end.getDate()} ${monthName(end)} ${end.getFullYear()}`;
  }

  return `${start.getDate()} ${monthName(start)} ${start.getFullYear()}–${end.getDate()} ${monthName(end)} ${end.getFullYear()}`;
}

export function isSameDate(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function parseDateQuery(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

export function getTimetableUrl({ date, view = "day" }) {
  const safeView = ["day", "week", "fortnight"].includes(view) ? view : "day";
  const dateValue = typeof date === "string"
    ? parseDateQuery(date)
    : date instanceof Date && !Number.isNaN(date.valueOf())
      ? toDateOnly(date)
      : null;
  const resolvedDate = dateValue ?? toDateOnly(new Date());
  const safeDate = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, "0")}-${String(resolvedDate.getDate()).padStart(2, "0")}`;
  return `/timetable?view=${safeView}&date=${safeDate}`;
}
