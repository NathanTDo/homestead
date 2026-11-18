import { parseIsoDate, type IsoDate } from '../../supabase/functions/_shared/dates';
// Calendar dates are passed around as "YYYY-MM-DD" strings. The date math is shared with the
// generate-schedule Edge Function so the app and server always agree.
export {
  addDays,
  formatIsoDate,
  parseIsoDate,
  type IsoDate,
} from '../../supabase/functions/_shared/dates';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2025-03-01" -> "Mar 1, 2025". */
export function formatDate(date: IsoDate): string {
  const parsed = parseIsoDate(date);
  return `${MONTHS[parsed.getUTCMonth()]} ${parsed.getUTCDate()}, ${parsed.getUTCFullYear()}`;
}

/** The calendar day a device Date shows on the user's clock, as "YYYY-MM-DD". */
export function isoDateFromLocal(date: Date): IsoDate {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** A device Date (local midnight) for a "YYYY-MM-DD" day, for use with date pickers. */
export function localDateFromIso(date: IsoDate): Date {
  const parsed = parseIsoDate(date);
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

export function todayIso(now: Date = new Date()): IsoDate {
  return isoDateFromLocal(now);
}
