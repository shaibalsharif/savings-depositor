import { format } from "date-fns";

/**
 * Safely formats a date value from a Drizzle `date` column (stored as "YYYY-MM-DD" string).
 *
 * WHY this exists:
 *   `new Date("2026-04-04")` creates a UTC midnight Date. In timezones east of UTC (e.g. Bangladesh
 *   UTC+6, which is midnight UTC = 6am local), this is fine. But in some Node.js environments or when
 *   the DB returns the date with a time component, the UTC-to-local conversion can shift the
 *   calendar day forward. Using `new Date(year, month-1, day)` creates LOCAL midnight with no
 *   UTC conversion at all, which is always correct for date-only values.
 *
 * @param dateStr  A "YYYY-MM-DD" string, ISO timestamp, or Date object.
 * @param fmt      A date-fns format string (default: "dd MMM yyyy").
 * @returns        The formatted date string, or "—" if the input is falsy.
 */
export function formatLocalDate(
  dateStr: string | Date | null | undefined,
  fmt = "dd MMM yyyy"
): string {
  if (!dateStr) return "—";
  const str = typeof dateStr === "string" ? dateStr : dateStr.toISOString();
  const parts = str.slice(0, 10).split("-");
  if (parts.length !== 3) return String(dateStr);
  // LOCAL midnight — no UTC shift
  const date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  return format(date, fmt);
}
