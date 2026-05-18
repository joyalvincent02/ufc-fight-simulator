/**
 * UFC events are listed on UFCStats.com using Las Vegas (America/Los_Angeles)
 * calendar dates. Events typically begin around 6pm Pacific time.
 *
 * These helpers convert that Las Vegas date into a proper Date object so
 * the browser can render the correct local date for any timezone.
 *
 * Example: UFC 325 is listed as Jan 31 on UFCStats, but for a user in
 * UTC+10 the event falls on Feb 1 — this is handled automatically.
 */

/**
 * Returns true if the given date falls in US Daylight Saving Time.
 * DST runs from the 2nd Sunday of March to the 1st Sunday of November.
 */
function isUSDST(year: number, month: number, day: number): boolean {
  if (month < 3 || month > 11) return false;
  if (month > 3 && month < 11) return true;

  const nthSunday = (m: number, n: number): number => {
    let count = 0;
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, m - 1, d);
      if (date.getMonth() !== m - 1) break;
      if (date.getDay() === 0 && ++count === n) return d;
    }
    return 1;
  };

  if (month === 3) return day >= nthSunday(3, 2);  // on/after 2nd Sunday
  return day < nthSunday(11, 1);                   // before 1st Sunday
}

/**
 * Parses a YYYY-MM-DD string (a Las Vegas calendar date) as 6pm
 * America/Los_Angeles, respecting PST/PDT automatically.
 */
export function parseVegasEventDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const offset = isUSDST(year, month, day) ? "-07:00" : "-08:00";
  return new Date(`${dateStr}T18:00:00${offset}`);
}

/**
 * Formats a UFC event date (YYYY-MM-DD Las Vegas date) for display in the
 * user's local timezone.  Returns a string like "Feb 1, 2026".
 */
export function formatVegasEventDate(dateStr: string): string {
  return parseVegasEventDate(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
