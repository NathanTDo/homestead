import {
  MAX_TASKS_PER_CROP,
  ScheduleError,
  activityTitle,
  buildGenerationKey,
  buildSchedule,
  type CareRuleInput,
  type TemplateInput,
} from '../../supabase/functions/_shared/schedule';

const CROP = '11111111-1111-1111-1111-111111111111';
const template: TemplateInput = {
  germination_days: 7,
  maturity_days: 60,
  harvest_start_days: 60,
  harvest_end_days: 75,
};
const rule = (overrides: Partial<CareRuleInput> = {}): CareRuleInput => ({
  activity_type: 'watering',
  description: 'Water',
  start_day: 0,
  interval_days: 2,
  end_day: 10,
  ...overrides,
});
const datesOf = (tasks: ReturnType<typeof buildSchedule>, type: string) =>
  tasks.filter((t) => t.task_type === type).map((t) => t.scheduled_date);

describe('milestones', () => {
  it('are calculated from the planting date', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, []);
    expect(tasks.map((t) => [t.task_type, t.scheduled_date])).toEqual([
      ['planting', '2025-03-01'],
      ['germination', '2025-03-08'],
      ['harvest_start', '2025-04-30'],
      ['maturity', '2025-04-30'],
      ['harvest_end', '2025-05-15'],
    ]);
  });

  it('skip a milestone when the template has no value, instead of using the planting date', () => {
    const tasks = buildSchedule(
      CROP,
      '2025-03-01',
      { ...template, germination_days: null, harvest_end_days: null },
      [],
    );
    expect(tasks.map((t) => t.task_type).sort()).toEqual(['harvest_start', 'maturity', 'planting']);
  });

  it('are always at least the planting task', () => {
    const empty: TemplateInput = {
      germination_days: null,
      maturity_days: null,
      harvest_start_days: null,
      harvest_end_days: null,
    };
    expect(buildSchedule(CROP, '2025-03-01', empty, []).map((t) => t.task_type)).toEqual([
      'planting',
    ]);
  });

  it('use readable titles', () => {
    const titles = buildSchedule(CROP, '2025-03-01', template, []).map((t) => t.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        'Planting',
        'Germination',
        'Expected maturity',
        'Harvest window begins',
        'Harvest window ends',
      ]),
    );
  });
});

describe('recurring care rules', () => {
  it('repeat every interval from start to end, inclusive', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, [rule()]);
    expect(datesOf(tasks, 'watering')).toEqual([
      '2025-03-01',
      '2025-03-03',
      '2025-03-05',
      '2025-03-07',
      '2025-03-09',
      '2025-03-11',
    ]);
  });

  it('start from start_day, not the planting day', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, [
      rule({ activity_type: 'fertilizing', start_day: 14, interval_days: 21, end_day: 60 }),
    ]);
    expect(datesOf(tasks, 'fertilizing')).toEqual(['2025-03-15', '2025-04-05', '2025-04-26']);
  });

  it('give one task when the interval is longer than the window', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, [rule({ interval_days: 100 })]);
    expect(datesOf(tasks, 'watering')).toEqual(['2025-03-01']);
  });

  it('give none when start_day is after end_day', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, [
      rule({ start_day: 20, end_day: 10 }),
    ]);
    expect(datesOf(tasks, 'watering')).toEqual([]);
  });

  it('give the right count for a long window', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, [
      rule({ end_day: 75, interval_days: 3 }),
    ]);
    expect(datesOf(tasks, 'watering')).toHaveLength(26); // days 0, 3, ..., 75
  });

  it.each([0, -1, 1.5, NaN])('reject an interval of %s', (interval_days) => {
    expect(() => buildSchedule(CROP, '2025-03-01', template, [rule({ interval_days })])).toThrow(
      ScheduleError,
    );
  });

  it('refuse a schedule that would be too large', () => {
    expect(() =>
      buildSchedule(CROP, '2025-03-01', template, [
        rule({ interval_days: 1, end_day: MAX_TASKS_PER_CROP + 10 }),
      ]),
    ).toThrow(/too many tasks/i);
  });
});

describe('one-time care rules', () => {
  it('give a single task on start_day', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, [
      rule({ activity_type: 'pruning', interval_days: null, start_day: 30, end_day: 45 }),
    ]);
    expect(datesOf(tasks, 'pruning')).toEqual(['2025-03-31']);
  });
});

describe('date boundaries', () => {
  it('planting on the last day of a month', () => {
    const tasks = buildSchedule(CROP, '2025-01-31', template, [rule({ end_day: 4 })]);
    expect(datesOf(tasks, 'planting')).toEqual(['2025-01-31']);
    expect(datesOf(tasks, 'germination')).toEqual(['2025-02-07']);
    expect(datesOf(tasks, 'watering')).toEqual(['2025-01-31', '2025-02-02', '2025-02-04']);
  });

  it('planting on the first day of a month', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, []);
    expect(datesOf(tasks, 'maturity')).toEqual(['2025-04-30']);
  });

  it('tasks that span a month boundary stay in order', () => {
    const dates = datesOf(
      buildSchedule(CROP, '2025-04-28', template, [rule({ end_day: 8 })]),
      'watering',
    );
    expect(dates).toEqual(['2025-04-28', '2025-04-30', '2025-05-02', '2025-05-04', '2025-05-06']);
  });

  it('leap day: planting on Feb 28 of a leap year, and on Feb 29', () => {
    const feb28 = buildSchedule(CROP, '2024-02-28', template, [rule({ end_day: 4 })]);
    expect(datesOf(feb28, 'watering')).toEqual(['2024-02-28', '2024-03-01', '2024-03-03']);
    const feb29 = buildSchedule(CROP, '2024-02-29', template, []);
    expect(datesOf(feb29, 'planting')).toEqual(['2024-02-29']);
    expect(datesOf(feb29, 'germination')).toEqual(['2024-03-07']);
  });

  it('a year-long schedule from a leap day lands on the right dates', () => {
    const long: TemplateInput = {
      ...template,
      maturity_days: 365,
      harvest_start_days: 365,
      harvest_end_days: 366,
    };
    const tasks = buildSchedule(CROP, '2024-02-29', long, []);
    expect(datesOf(tasks, 'maturity')).toEqual(['2025-02-28']);
    expect(datesOf(tasks, 'harvest_end')).toEqual(['2025-03-01']);
  });

  it('crosses the year boundary', () => {
    const tasks = buildSchedule(CROP, '2025-12-20', template, [rule({ end_day: 14 })]);
    expect(datesOf(tasks, 'watering')).toContain('2026-01-01');
    expect(datesOf(tasks, 'germination')).toEqual(['2025-12-27']);
  });

  it('rejects an invalid planting date', () => {
    expect(() => buildSchedule(CROP, '2025-02-30', template, [])).toThrow(/invalid date/i);
  });
});

describe('generation keys and idempotency', () => {
  it('use the format {farm_crop_id}:{task_type}:{scheduled_date}', () => {
    expect(buildGenerationKey(CROP, 'watering', '2025-03-01')).toBe(`${CROP}:watering:2025-03-01`);
    for (const t of buildSchedule(CROP, '2025-03-01', template, [rule()])) {
      expect(t.generation_key).toBe(`${CROP}:${t.task_type}:${t.scheduled_date}`);
      expect(t.farm_crop_id).toBe(CROP);
    }
  });

  it('are unique within a schedule', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, [rule(), rule({ interval_days: 1 })]);
    expect(new Set(tasks.map((t) => t.generation_key)).size).toBe(tasks.length);
  });

  it('merge two rules of the same type that fall on the same day', () => {
    const tasks = buildSchedule(CROP, '2025-03-01', template, [
      rule({ end_day: 4 }),
      rule({ end_day: 4 }),
    ]);
    expect(datesOf(tasks, 'watering')).toEqual(['2025-03-01', '2025-03-03', '2025-03-05']);
  });

  it('are different for different crops', () => {
    const a = buildSchedule(CROP, '2025-03-01', template, [rule()]);
    const b = buildSchedule('22222222-2222-2222-2222-222222222222', '2025-03-01', template, [
      rule(),
    ]);
    const keysA = new Set(a.map((t) => t.generation_key));
    expect(b.some((t) => keysA.has(t.generation_key))).toBe(false);
  });

  it('running generation twice adds no new tasks when conflicts are skipped', () => {
    // Mirrors `INSERT ... ON CONFLICT (generation_key) DO NOTHING`.
    const stored = new Map<string, unknown>();
    const insertIgnoringConflicts = (tasks: ReturnType<typeof buildSchedule>) => {
      let inserted = 0;
      for (const task of tasks) {
        if (!stored.has(task.generation_key)) {
          stored.set(task.generation_key, task);
          inserted++;
        }
      }
      return inserted;
    };
    const run = () =>
      buildSchedule(CROP, '2025-03-01', template, [
        rule(),
        rule({ activity_type: 'fertilizing', start_day: 14, interval_days: 21, end_day: 60 }),
      ]);
    const first = insertIgnoringConflicts(run());
    expect(first).toBeGreaterThan(0);
    expect(insertIgnoringConflicts(run())).toBe(0);
    expect(stored.size).toBe(first);
  });

  it('is deterministic and sorted by date', () => {
    const a = buildSchedule(CROP, '2025-03-01', template, [rule()]);
    expect(buildSchedule(CROP, '2025-03-01', template, [rule()])).toEqual(a);
    const dates = a.map((t) => t.scheduled_date);
    expect([...dates].sort()).toEqual(dates);
  });
});

describe('activityTitle', () => {
  it('capitalizes and replaces underscores', () => {
    expect(activityTitle('watering')).toBe('Watering');
    expect(activityTitle('pest_inspection')).toBe('Pest inspection');
  });
});
