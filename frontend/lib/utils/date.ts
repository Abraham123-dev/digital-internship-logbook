// Nigeria-time utilities.
// RULE: Never use new Date() or Date.now() for display. Always use the server time.
// The server's current time is fetched once on mount and used as the reference.
// These helpers format dates and durations for display.

import type { Week } from "@/types/logbook";

const NIGERIA_TZ = "Africa/Lagos";

// Format a date string (YYYY-MM-DD) as a full date for display.
// e.g. "2025-10-20" → "Sunday, 20 October 2025"
export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: NIGERIA_TZ,
  });
}

// Format a date string as a short day name + date.
// e.g. "2025-10-20" → "Mon 20"
export function formatShortDay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    timeZone: NIGERIA_TZ,
  });
}

// Format a date string as day name only.
// e.g. "2025-10-20" → "Monday"
export function formatDayName(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    timeZone: NIGERIA_TZ,
  });
}

// Format a week's date range for display.
// e.g. "14 – 20 October 2025"
export function formatWeekRange(week: Pick<Week, "startDate" | "endDate">): string {
  const start = new Date(week.startDate + "T00:00:00");
  const end = new Date(week.endDate + "T00:00:00");
  const startDay = start.toLocaleDateString("en-NG", { day: "numeric", timeZone: NIGERIA_TZ });
  const endFull = end.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: NIGERIA_TZ });
  return `${startDay} – ${endFull}`;
}

// Format a datetime string for display.
// e.g. "2025-10-20T22:00:00Z" → "Sunday, 20 October · 11:00 p.m."
export function formatDatetime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: NIGERIA_TZ,
  });
}

// Format a time string from ISO datetime.
// e.g. "2025-10-20T14:35:00Z" → "3:35 p.m."
export function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: NIGERIA_TZ,
  });
}
