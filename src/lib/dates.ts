/**
 * Date-only columns (hearing dates) and date-derived verification stamps are
 * calendar dates, not instants — format them in UTC so "2026-06-11" never
 * renders as June 10 in US timezones.
 */
export function formatDateUTC(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" }
): string {
  return new Date(value).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}
