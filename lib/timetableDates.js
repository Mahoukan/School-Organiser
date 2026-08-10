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
