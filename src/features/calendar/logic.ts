import { CATEGORY_COLORS, TASK_CATEGORY } from '@/constants/taskTypes';
import type { CalendarTask } from '@/types';
import { formatIsoDate, parseIsoDate, todayIso, type IsoDate } from '@/utils/dates';

export interface MonthRef {
  year: number;
  /** 1 to 12 */
  month: number;
}

export interface DayCell {
  date: IsoDate;
  day: number;
}

/** One row of the month grid, Sunday first. A null is a blank cell outside the month. */
export type GridWeek = (DayCell | null)[];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function firstOfMonth({ year, month }: MonthRef): IsoDate {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month: ${year}-${month}`);
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
}

export function monthLabel(ref: MonthRef): string {
  firstOfMonth(ref);
  return `${MONTH_NAMES[ref.month - 1]} ${ref.year}`;
}

export function currentMonth(today: IsoDate = todayIso()): MonthRef {
  const date = parseIsoDate(today);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

/** The month `delta` months from `ref`. Handles year changes in both directions. */
export function shiftMonth(ref: MonthRef, delta: number): MonthRef {
  firstOfMonth(ref);
  const total = ref.year * 12 + (ref.month - 1) + delta;
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 };
}

/** The first day of the month and the first day of the next. Use with `>=` and `<`. */
export function monthRange(ref: MonthRef): { from: IsoDate; to: IsoDate } {
  return { from: firstOfMonth(ref), to: firstOfMonth(shiftMonth(ref, 1)) };
}

/** The weeks of a month for a calendar grid: 7 columns, Sunday first, blanks as null. */
export function buildMonthGrid(ref: MonthRef): GridWeek[] {
  const first = firstOfMonth(ref);
  const leadingBlanks = parseIsoDate(first).getUTCDay();
  const daysInMonth = new Date(Date.UTC(ref.year, ref.month, 0)).getUTCDate();

  const cells: (DayCell | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: formatIsoDate(new Date(Date.UTC(ref.year, ref.month - 1, day))), day });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: GridWeek[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Groups tasks by their scheduled date. Tasks keep their original order within a day. */
export function groupTasksByDate(tasks: readonly CalendarTask[]): Map<IsoDate, CalendarTask[]> {
  const grouped = new Map<IsoDate, CalendarTask[]>();
  for (const task of tasks) {
    const day = grouped.get(task.scheduled_date);
    if (day) day.push(task);
    else grouped.set(task.scheduled_date, [task]);
  }
  return grouped;
}

export type CellIndicator =
  | { kind: 'none' }
  | { kind: 'dots'; colors: string[]; allDone: boolean }
  | { kind: 'count'; count: number; allDone: boolean };

/** What a calendar cell shows: dots for 1 or 2 tasks, a count for 3 or more. */
export function cellIndicator(tasks: readonly CalendarTask[]): CellIndicator {
  if (tasks.length === 0) return { kind: 'none' };
  const allDone = tasks.every((task) => task.completed_at !== null);
  if (tasks.length >= 3) return { kind: 'count', count: tasks.length, allDone };
  const colors = [...new Set(tasks.map((task) => CATEGORY_COLORS[TASK_CATEGORY[task.task_type]]))];
  return { kind: 'dots', colors, allDone };
}
