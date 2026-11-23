import {
  buildHarvestWindows,
  buildMonthGrid,
  cellIndicator,
  currentMonth,
  groupTasksByDate,
  harvestSegments,
  harvestWindowsOn,
  isHarvestDay,
  monthLabel,
  monthRange,
  shiftMonth,
} from '../../src/features/calendar/logic';
import {
  CATEGORY_COLORS,
  HARVEST_BAR_COLOR,
  TASK_CATEGORY,
  TASK_TYPE_LABELS,
  canCompleteTask,
  getTaskColor,
} from '../../src/constants/taskTypes';
import type { CalendarTask, TaskType } from '../../src/types';

const task = (overrides: Partial<CalendarTask> = {}): CalendarTask => ({
  id: 't',
  farm_crop_id: 'c',
  plant_id: 'p',
  plant_name: 'Kale',
  task_type: 'watering',
  title: 'Watering',
  description: null,
  scheduled_date: '2025-03-01',
  completed_at: null,
  ...overrides,
});

describe('buildMonthGrid', () => {
  it('has 7 columns in every row', () => {
    for (const month of [1, 2, 3, 6, 12]) {
      for (const week of buildMonthGrid({ year: 2025, month })) expect(week).toHaveLength(7);
    }
  });

  it('puts the 1st under the right weekday (Sunday first)', () => {
    // March 1, 2025 is a Saturday, so six blanks come first.
    const [first] = buildMonthGrid({ year: 2025, month: 3 });
    expect(first.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(first[6]).toEqual({ date: '2025-03-01', day: 1 });
    // June 1, 2025 is a Sunday, so there are no leading blanks.
    expect(buildMonthGrid({ year: 2025, month: 6 })[0][0]).toEqual({ date: '2025-06-01', day: 1 });
  });

  it('includes every day once and in order', () => {
    const days = buildMonthGrid({ year: 2025, month: 3 })
      .flat()
      .filter((cell) => cell !== null);
    expect(days).toHaveLength(31);
    expect(days.map((d) => d.day)).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    expect(days[30].date).toBe('2025-03-31');
  });

  it('handles leap February and non-leap February', () => {
    const leap = buildMonthGrid({ year: 2024, month: 2 }).flat().filter(Boolean);
    expect(leap).toHaveLength(29);
    expect(leap[28]).toEqual({ date: '2024-02-29', day: 29 });
    expect(buildMonthGrid({ year: 2025, month: 2 }).flat().filter(Boolean)).toHaveLength(28);
    expect(buildMonthGrid({ year: 1900, month: 2 }).flat().filter(Boolean)).toHaveLength(28);
    expect(buildMonthGrid({ year: 2000, month: 2 }).flat().filter(Boolean)).toHaveLength(29);
  });

  it('uses 4, 5 or 6 rows as needed', () => {
    // Feb 2026 starts on a Sunday and has 28 days: exactly four rows, no blanks.
    const feb2026 = buildMonthGrid({ year: 2026, month: 2 });
    expect(feb2026).toHaveLength(4);
    expect(feb2026.flat().every((cell) => cell !== null)).toBe(true);
    expect(buildMonthGrid({ year: 2025, month: 6 })).toHaveLength(5);
    expect(buildMonthGrid({ year: 2025, month: 3 })).toHaveLength(6);
  });

  it('rejects an invalid month', () => {
    for (const month of [0, 13, 1.5, NaN]) {
      expect(() => buildMonthGrid({ year: 2025, month })).toThrow(/invalid month/i);
    }
  });
});

describe('shiftMonth', () => {
  it('moves within a year', () => {
    expect(shiftMonth({ year: 2025, month: 3 }, 1)).toEqual({ year: 2025, month: 4 });
    expect(shiftMonth({ year: 2025, month: 3 }, -1)).toEqual({ year: 2025, month: 2 });
    expect(shiftMonth({ year: 2025, month: 3 }, 0)).toEqual({ year: 2025, month: 3 });
  });
  it('crosses year boundaries both ways', () => {
    expect(shiftMonth({ year: 2025, month: 12 }, 1)).toEqual({ year: 2026, month: 1 });
    expect(shiftMonth({ year: 2025, month: 1 }, -1)).toEqual({ year: 2024, month: 12 });
  });
  it('handles several months at once', () => {
    expect(shiftMonth({ year: 2025, month: 11 }, 14)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2025, month: 2 }, -14)).toEqual({ year: 2023, month: 12 });
  });
});

describe('monthRange', () => {
  it('runs from the 1st to the 1st of the next month', () => {
    expect(monthRange({ year: 2025, month: 3 })).toEqual({ from: '2025-03-01', to: '2025-04-01' });
    expect(monthRange({ year: 2024, month: 2 })).toEqual({ from: '2024-02-01', to: '2024-03-01' });
  });
  it('rolls December into January of the next year, with padded months', () => {
    expect(monthRange({ year: 2025, month: 12 })).toEqual({ from: '2025-12-01', to: '2026-01-01' });
    expect(monthRange({ year: 2025, month: 1 })).toEqual({ from: '2025-01-01', to: '2025-02-01' });
  });
});

describe('monthLabel and currentMonth', () => {
  it('labels a month', () => {
    expect(monthLabel({ year: 2026, month: 11 })).toBe('November 2026');
    expect(monthLabel({ year: 2025, month: 1 })).toBe('January 2025');
  });
  it('reads the month from a date', () => {
    expect(currentMonth('2025-12-31')).toEqual({ year: 2025, month: 12 });
    expect(currentMonth('2024-02-29')).toEqual({ year: 2024, month: 2 });
  });
});

describe('groupTasksByDate', () => {
  it('groups by day and keeps order within a day', () => {
    const grouped = groupTasksByDate([
      task({ id: 'a', scheduled_date: '2025-03-01' }),
      task({ id: 'b', scheduled_date: '2025-03-02' }),
      task({ id: 'c', scheduled_date: '2025-03-01' }),
    ]);
    expect([...grouped.keys()]).toEqual(['2025-03-01', '2025-03-02']);
    expect(grouped.get('2025-03-01')?.map((t) => t.id)).toEqual(['a', 'c']);
  });
  it('returns an empty map for no tasks', () => {
    expect(groupTasksByDate([]).size).toBe(0);
  });
});

describe('cellIndicator', () => {
  it('shows nothing for an empty day', () => {
    expect(cellIndicator([])).toEqual({ kind: 'none' });
  });
  it('shows one dot per distinct type of activity for one or two tasks', () => {
    expect(cellIndicator([task()])).toEqual({
      kind: 'dots',
      colors: [getTaskColor('watering')],
      allDone: false,
    });
    const two = cellIndicator([task({ task_type: 'planting' }), task({ task_type: 'watering' })]);
    expect(two).toEqual({
      kind: 'dots',
      colors: [getTaskColor('planting'), getTaskColor('watering')],
      allDone: false,
    });
    // Two waterings on the same day (two plants) share one dot.
    expect(cellIndicator([task(), task()])).toMatchObject({
      kind: 'dots',
      colors: [getTaskColor('watering')],
    });
    // Milestones and the harvest window share one green, so they show one dot.
    expect(
      cellIndicator([task({ task_type: 'maturity' }), task({ task_type: 'harvest_start' })]),
    ).toMatchObject({ kind: 'dots', colors: [CATEGORY_COLORS.milestone] });
  });
  it('shows a count for three or more tasks', () => {
    expect(cellIndicator([task(), task(), task()])).toEqual({
      kind: 'count',
      count: 3,
      allDone: false,
    });
    expect(cellIndicator(Array.from({ length: 12 }, () => task()))).toMatchObject({
      kind: 'count',
      count: 12,
    });
  });
  it('reports when every task is done', () => {
    const done = task({ completed_at: '2025-03-01T10:00:00Z' });
    expect(cellIndicator([done])).toMatchObject({ allDone: true });
    expect(cellIndicator([done, task()])).toMatchObject({ allDone: false });
    expect(cellIndicator([done, done, done])).toMatchObject({ kind: 'count', allDone: true });
  });
});

describe('task types', () => {
  const types = Object.keys(TASK_CATEGORY) as TaskType[];
  it('every task type has a category, label and color', () => {
    for (const type of types) {
      expect(TASK_TYPE_LABELS[type]).toBeTruthy();
      expect(getTaskColor(type)).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
  it('groups milestones, harvest and maintenance as the spec says', () => {
    expect(getTaskColor('germination')).toBe(CATEGORY_COLORS.milestone);
    expect(getTaskColor('harvest_start')).toBe(CATEGORY_COLORS.harvest);
    expect(getTaskColor('harvest_end')).toBe(CATEGORY_COLORS.harvest);
    expect(getTaskColor('fertilizing')).toBe(CATEGORY_COLORS.maintenance);
  });
  it('colors watering blue and every milestone green', () => {
    expect(getTaskColor('watering')).toBe('#3B82F6');
    for (const type of ['planting', 'germination', 'transplanting', 'maturity'] as const) {
      expect(getTaskColor(type)).toBe('#22C55E');
    }
    expect(getTaskColor('harvest_start')).toBe('#22C55E');
    expect(getTaskColor('harvest_end')).toBe('#22C55E');
    expect(HARVEST_BAR_COLOR).toBe('#22C55E');
    // Other care tasks keep their own color, different from watering and the milestones.
    expect(getTaskColor('fertilizing')).not.toBe(getTaskColor('watering'));
    expect(getTaskColor('fertilizing')).not.toBe(getTaskColor('planting'));
  });
  it('lets users complete maintenance tasks but not milestones', () => {
    for (const type of [
      'watering',
      'fertilizing',
      'pruning',
      'pest_inspection',
      'other',
    ] as TaskType[]) {
      expect(canCompleteTask(type)).toBe(true);
    }
    for (const type of [
      'planting',
      'germination',
      'transplanting',
      'maturity',
      'harvest_start',
      'harvest_end',
    ] as TaskType[]) {
      expect(canCompleteTask(type)).toBe(false);
    }
  });
});

describe('buildHarvestWindows', () => {
  const at = (task_type: TaskType, scheduled_date: string, farm_crop_id = 'c') =>
    task({ task_type, scheduled_date, farm_crop_id });

  it('builds a window from the start and end tasks of a crop', () => {
    expect(
      buildHarvestWindows([
        at('harvest_end', '2025-03-20'),
        at('harvest_start', '2025-03-10'),
        at('watering', '2025-03-11'),
      ]),
    ).toEqual([
      {
        farm_crop_id: 'c',
        plant_id: 'p',
        plant_name: 'Kale',
        maturity: null,
        harvestStart: '2025-03-10',
        harvestEnd: '2025-03-20',
        start: '2025-03-10',
        end: '2025-03-20',
      },
    ]);
  });
  it('keeps the maturity date and leaves the bar alone when maturity is inside the window', () => {
    const [window] = buildHarvestWindows([
      at('maturity', '2025-03-10'),
      at('harvest_start', '2025-03-10'),
      at('harvest_end', '2025-03-20'),
    ]);
    expect(window).toMatchObject({
      maturity: '2025-03-10',
      start: '2025-03-10',
      end: '2025-03-20',
    });
  });
  it('extends the bar to cover a maturity date before the window or after it', () => {
    const [early] = buildHarvestWindows([
      at('maturity', '2025-03-05'),
      at('harvest_start', '2025-03-10'),
      at('harvest_end', '2025-03-20'),
    ]);
    expect(early).toMatchObject({
      harvestStart: '2025-03-10',
      start: '2025-03-05',
      end: '2025-03-20',
    });
    const [late] = buildHarvestWindows([
      at('maturity', '2025-03-25'),
      at('harvest_start', '2025-03-10'),
      at('harvest_end', '2025-03-20'),
    ]);
    expect(late).toMatchObject({
      harvestEnd: '2025-03-20',
      start: '2025-03-10',
      end: '2025-03-25',
    });
  });
  it('keeps crops apart', () => {
    const windows = buildHarvestWindows([
      at('harvest_start', '2025-03-10', 'a'),
      at('harvest_end', '2025-03-12', 'a'),
      at('harvest_start', '2025-04-01', 'b'),
      at('harvest_end', '2025-04-05', 'b'),
      at('maturity', '2025-03-01', 'b'),
    ]);
    expect(windows.map((w) => [w.farm_crop_id, w.start])).toEqual([
      ['a', '2025-03-10'],
      ['b', '2025-03-01'],
    ]);
  });
  it('ignores a crop with a missing end or an end before its start, or only a maturity date', () => {
    expect(buildHarvestWindows([at('harvest_start', '2025-03-10')])).toEqual([]);
    expect(buildHarvestWindows([at('harvest_end', '2025-03-10')])).toEqual([]);
    expect(buildHarvestWindows([at('maturity', '2025-03-10')])).toEqual([]);
    expect(
      buildHarvestWindows([at('harvest_start', '2025-03-10'), at('harvest_end', '2025-03-09')]),
    ).toEqual([]);
  });
});

describe('harvestWindowsOn', () => {
  const window = (farm_crop_id: string, start: string, end: string) =>
    buildHarvestWindows([
      task({ task_type: 'harvest_start', scheduled_date: start, farm_crop_id }),
      task({ task_type: 'harvest_end', scheduled_date: end, farm_crop_id }),
    ])[0];
  const windows = [
    window('a', '2025-03-10', '2025-03-12'),
    window('b', '2025-03-12', '2025-03-15'),
  ];

  it('returns every window whose bar covers the day, ends included', () => {
    expect(harvestWindowsOn('2025-03-09', windows)).toEqual([]);
    expect(harvestWindowsOn('2025-03-10', windows).map((w) => w.farm_crop_id)).toEqual(['a']);
    expect(harvestWindowsOn('2025-03-12', windows).map((w) => w.farm_crop_id)).toEqual(['a', 'b']);
    expect(harvestWindowsOn('2025-03-15', windows).map((w) => w.farm_crop_id)).toEqual(['b']);
    expect(harvestWindowsOn('2025-03-16', windows)).toEqual([]);
  });
});

describe('isHarvestDay', () => {
  const windows = [{ farm_crop_id: 'c', start: '2025-03-10', end: '2025-03-12' }];

  it('includes the first and last day and nothing outside', () => {
    expect(isHarvestDay('2025-03-09', windows)).toBe(false);
    expect(isHarvestDay('2025-03-10', windows)).toBe(true);
    expect(isHarvestDay('2025-03-12', windows)).toBe(true);
    expect(isHarvestDay('2025-03-13', windows)).toBe(false);
    expect(isHarvestDay('2025-03-10', [])).toBe(false);
  });
});

describe('harvestSegments', () => {
  // Weeks of March 2025: the 1st is a Saturday, so row 2 is Sun the 2nd to Sat the 8th.
  const weeks = buildMonthGrid({ year: 2025, month: 3 });
  const win = (start: string, end: string, farm_crop_id = 'c') => ({ farm_crop_id, start, end });
  const shape = (week: (typeof weeks)[number], windows: ReturnType<typeof win>[]) =>
    harvestSegments(week, windows).map((s) =>
      s ? `${s.startsHere ? '[' : '-'}${s.endsHere ? ']' : '-'}` : '.',
    );

  it('is empty when there are no windows', () => {
    expect(harvestSegments(weeks[1], []).every((s) => s === null)).toBe(true);
  });
  it('starts and ends the run inside a week', () => {
    // Mon 3rd to Wed 5th.
    expect(shape(weeks[1], [win('2025-03-03', '2025-03-05')])).toEqual([
      '.',
      '[-',
      '--',
      '-]',
      '.',
      '.',
      '.',
    ]);
  });
  it('shows a one-day window as a single segment that starts and ends', () => {
    expect(harvestSegments(weeks[1], [win('2025-03-04', '2025-03-04')])[2]).toEqual({
      startsHere: true,
      endsHere: true,
    });
  });
  it('ends the run at Saturday and starts a new one at the next Sunday when a window wraps', () => {
    const wrapping = [win('2025-03-05', '2025-03-11')];
    // Row 2: Wed 5th to Sat 8th. Row 3: Sun 9th to Tue 11th.
    expect(shape(weeks[1], wrapping)).toEqual(['.', '.', '.', '[-', '--', '--', '-]']);
    expect(shape(weeks[2], wrapping)).toEqual(['[-', '--', '-]', '.', '.', '.', '.']);
  });
  it('gives a window that starts on Saturday a one-day segment, then continues next Sunday', () => {
    const wrapping = [win('2025-03-08', '2025-03-10')];
    expect(harvestSegments(weeks[1], wrapping)[6]).toEqual({ startsHere: true, endsHere: true });
    expect(shape(weeks[2], wrapping)).toEqual(['[-', '-]', '.', '.', '.', '.', '.']);
  });
  it('joins windows that touch or overlap into one run', () => {
    const two = [win('2025-03-03', '2025-03-04', 'a'), win('2025-03-04', '2025-03-06', 'b')];
    expect(shape(weeks[1], two)).toEqual(['.', '[-', '--', '--', '-]', '.', '.']);
  });
  it('ends the run at a blank cell outside the month', () => {
    // Mar 31 is a Monday, so the rest of the last row is blank.
    const last = weeks[weeks.length - 1];
    expect(shape(last, [win('2025-03-30', '2025-04-05')])).toEqual([
      '[-',
      '-]',
      '.',
      '.',
      '.',
      '.',
      '.',
    ]);
  });
  it('treats the covered days across a month and year end as covered', () => {
    const dec = buildMonthGrid({ year: 2025, month: 12 });
    const jan = buildMonthGrid({ year: 2026, month: 1 });
    const across = [win('2025-12-30', '2026-01-02')];
    expect(harvestSegments(dec[dec.length - 1], across).filter(Boolean)).toHaveLength(2);
    expect(harvestSegments(jan[0], across).filter(Boolean)).toHaveLength(2);
  });
});

describe('cellIndicator with hideHarvestMarkers', () => {
  const start = task({ task_type: 'harvest_start' });
  const end = task({ task_type: 'harvest_end' });

  it('drops the harvest window begins and ends tasks from the dots', () => {
    expect(cellIndicator([start], { hideHarvestMarkers: true })).toEqual({ kind: 'none' });
    expect(cellIndicator([end], { hideHarvestMarkers: true })).toEqual({ kind: 'none' });
    expect(cellIndicator([start, task()], { hideHarvestMarkers: true })).toEqual({
      kind: 'dots',
      colors: [getTaskColor('watering')],
      allDone: false,
    });
  });
  it('also drops the maturity task, which the bar covers', () => {
    expect(cellIndicator([task({ task_type: 'maturity' })], { hideHarvestMarkers: true })).toEqual({
      kind: 'none',
    });
    expect(cellIndicator([task({ task_type: 'maturity' })]).kind).toBe('dots');
  });
  it('does not count them in the badge', () => {
    expect(
      cellIndicator([start, task(), task(), task()], { hideHarvestMarkers: true }),
    ).toMatchObject({ kind: 'count', count: 3 });
    expect(cellIndicator([start, task(), task()], { hideHarvestMarkers: true }).kind).toBe('dots');
  });
  it('keeps them when the bar is not drawn', () => {
    expect(cellIndicator([start]).kind).toBe('dots');
  });
});
