import { getTaskColor } from '@/constants/taskTypes';
import type { CalendarTask, TaskType } from '@/types';
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

/** Tasks the harvest bar stands for: expected maturity and the two ends of the harvest window. */
const BAR_MARKER_TYPES: readonly TaskType[] = ['maturity', 'harvest_start', 'harvest_end'];

/**
 * What a calendar cell shows: dots for 1 or 2 tasks, a count for 3 or more. With
 * `hideHarvestMarkers`, the maturity and harvest window begins and ends tasks get no dot and
 * are not counted, because the harvest bar already marks those days.
 */
export function cellIndicator(
  allTasks: readonly CalendarTask[],
  { hideHarvestMarkers = false }: { hideHarvestMarkers?: boolean } = {},
): CellIndicator {
  const tasks = hideHarvestMarkers
    ? allTasks.filter((task) => !BAR_MARKER_TYPES.includes(task.task_type))
    : allTasks;
  if (tasks.length === 0) return { kind: 'none' };
  const allDone = tasks.every((task) => task.completed_at !== null);
  if (tasks.length >= 3) return { kind: 'count', count: tasks.length, allDone };
  const colors = [...new Set(tasks.map((task) => getTaskColor(task.task_type)))];
  return { kind: 'dots', colors, allDone };
}

/** One crop's harvest window, as the calendar's green bar shows it. */
export interface HarvestWindow {
  farm_crop_id: string;
  plant_id: string;
  plant_name: string;
  /** The expected maturity date, if the crop has one. */
  maturity: IsoDate | null;
  harvestStart: IsoDate;
  harvestEnd: IsoDate;
  /** First and last day of the bar. It covers the maturity date too, if that falls outside. */
  start: IsoDate;
  end: IsoDate;
}

/** The part of a window that decides where the bar is drawn. */
export type BarRange = Pick<HarvestWindow, 'start' | 'end'>;

/**
 * Builds each crop's window from its "harvest window begins" and "harvest window ends" tasks,
 * plus its maturity task if there is one. The bar covers the maturity date too, because
 * maturity gets no dot of its own. A crop missing a harvest task, or whose end is before its
 * start, has no window.
 */
export function buildHarvestWindows(tasks: readonly CalendarTask[]): HarvestWindow[] {
  const byCrop = new Map<string, Partial<Record<TaskType, CalendarTask>>>();
  for (const task of tasks) {
    const crop = byCrop.get(task.farm_crop_id) ?? {};
    crop[task.task_type] = task;
    byCrop.set(task.farm_crop_id, crop);
  }
  const windows: HarvestWindow[] = [];
  for (const [farm_crop_id, crop] of byCrop) {
    const begins = crop.harvest_start;
    const ends = crop.harvest_end;
    if (!begins || !ends || ends.scheduled_date < begins.scheduled_date) continue;
    const maturity = crop.maturity?.scheduled_date ?? null;
    const harvestStart = begins.scheduled_date;
    const harvestEnd = ends.scheduled_date;
    windows.push({
      farm_crop_id,
      plant_id: begins.plant_id,
      plant_name: begins.plant_name,
      maturity,
      harvestStart,
      harvestEnd,
      start: maturity && maturity < harvestStart ? maturity : harvestStart,
      end: maturity && maturity > harvestEnd ? maturity : harvestEnd,
    });
  }
  return windows;
}

/** The windows whose bar covers a day. */
export function harvestWindowsOn(
  date: IsoDate,
  windows: readonly HarvestWindow[],
): HarvestWindow[] {
  return windows.filter((w) => w.start <= date && date <= w.end);
}

/** True when some crop can be harvested on this day. */
export function isHarvestDay(date: IsoDate, windows: readonly BarRange[]): boolean {
  return windows.some((w) => w.start <= date && date <= w.end);
}

/**
 * How the harvest bar is drawn in one day cell. The bar runs through the middle of each cell,
 * so a run of days starts at the center of its first cell and ends at the center of its last.
 * `startsHere` and `endsHere` are about the run of days within one calendar row (Sunday to
 * Saturday), not the whole window: a window that wraps to the next row ends at the center of
 * Saturday and starts again at the center of the next Sunday, with rounded ends both times.
 * A run of one day is a dot.
 */
export interface HarvestSegment {
  startsHere: boolean;
  endsHere: boolean;
}

/**
 * The harvest segment of every cell in a calendar row, null where no crop can be harvested.
 * Windows that touch or overlap (several crops) form one continuous run.
 */
export function harvestSegments(
  week: GridWeek,
  windows: readonly BarRange[],
): (HarvestSegment | null)[] {
  const covered = week.map((cell) => cell !== null && isHarvestDay(cell.date, windows));
  return covered.map((isCovered, i) =>
    isCovered ? { startsHere: !covered[i - 1], endsHere: !covered[i + 1] } : null,
  );
}
