// Calendar date math on "YYYY-MM-DD" strings, done in UTC so results never depend on the
// device or server time zone. Plain TypeScript with no imports, so Deno (the Edge Function),
// Node (tests) and the app can all use it.

/** A calendar date as "YYYY-MM-DD". */
export type IsoDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" to a UTC Date. Throws for bad formats and impossible dates (2025-02-30). */
export function parseIsoDate(value: IsoDate): Date {
  const match = ISO_DATE.exec(value);
  if (!match) throw new Error(`Invalid date: ${value}`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

export function formatIsoDate(date: Date): IsoDate {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns `date` plus `days` calendar days (negative goes back). A null, undefined or zero
 * `days` returns the same date. `days` must be a whole number.
 */
export function addDays(date: IsoDate, days: number | null | undefined): IsoDate {
  const start = parseIsoDate(date);
  if (days === null || days === undefined) return date;
  if (!Number.isInteger(days)) throw new Error(`days must be a whole number: ${days}`);
  return formatIsoDate(new Date(start.getTime() + days * MS_PER_DAY));
}
