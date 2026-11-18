import {
  buildMonthGrid,
  cellIndicator,
  currentMonth,
  groupTasksByDate,
  monthLabel,
  monthRange,
  shiftMonth,
} from '../../src/features/calendar/logic';
import {
  CATEGORY_COLORS,
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
      colors: [CATEGORY_COLORS.maintenance],
      allDone: false,
    });
    const two = cellIndicator([task({ task_type: 'planting' }), task({ task_type: 'watering' })]);
    expect(two).toEqual({
      kind: 'dots',
      colors: [CATEGORY_COLORS.milestone, CATEGORY_COLORS.maintenance],
      allDone: false,
    });
    // Two waterings on the same day (two plants) share one dot.
    expect(cellIndicator([task(), task()])).toMatchObject({
      kind: 'dots',
      colors: [CATEGORY_COLORS.maintenance],
    });
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
    expect(
      new Set([CATEGORY_COLORS.milestone, CATEGORY_COLORS.harvest, CATEGORY_COLORS.maintenance])
        .size,
    ).toBe(3);
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
