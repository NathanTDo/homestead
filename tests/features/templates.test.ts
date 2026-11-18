import {
  describeScheduleError,
  describeTemplate,
  harvestWindowText,
  latestPerSeason,
} from '../../src/features/templates/logic';
import type { GrowingTemplateWithRules, Season } from '../../src/types';

let counter = 0;
const template = (
  season: Season,
  overrides: Partial<GrowingTemplateWithRules> = {},
): GrowingTemplateWithRules => ({
  id: `t${++counter}`,
  plant_id: 'p1',
  version: 1,
  season,
  germination_days: 7,
  maturity_days: 50,
  harvest_start_days: 50,
  harvest_end_days: 65,
  source_reference: null,
  is_active: true,
  created_at: '',
  care_rules: [],
  ...overrides,
});

describe('latestPerSeason', () => {
  it('orders seasons spring, summer, fall, winter', () => {
    const result = latestPerSeason([template('winter'), template('fall'), template('spring')]);
    expect(result.map((t) => t.season)).toEqual(['spring', 'fall', 'winter']);
  });
  it('keeps only the highest version of each season', () => {
    const v1 = template('spring', { version: 1 });
    const v2 = template('spring', { version: 2 });
    const fall = template('fall');
    const result = latestPerSeason([v2, v1, fall]);
    expect(result.map((t) => t.id)).toEqual([v2.id, fall.id]);
  });
  it('handles an empty list', () => {
    expect(latestPerSeason([])).toEqual([]);
  });
});

describe('describeTemplate', () => {
  it('lists germination, maturity and the harvest window', () => {
    expect(describeTemplate(template('spring'))).toEqual([
      'Germination: 7 days',
      'Maturity: 50 days',
      'Harvest window: day 50 to day 65',
    ]);
  });
  it('uses the singular for one day and skips missing values', () => {
    const t = template('spring', {
      germination_days: 1,
      maturity_days: null,
      harvest_start_days: null,
      harvest_end_days: null,
    });
    expect(describeTemplate(t)).toEqual(['Germination: 1 day']);
  });
  it('describes a harvest with only a start', () => {
    const t = template('spring', { harvest_end_days: null });
    expect(describeTemplate(t)).toContain('Harvest starts: day 50');
  });
});

describe('harvestWindowText', () => {
  it('shows the harvest dates for a planting date', () => {
    expect(harvestWindowText(template('spring'), '2025-03-01')).toBe(
      'Harvest Apr 20, 2025 to May 5, 2025',
    );
  });
  it('crosses a year boundary and a leap day', () => {
    expect(harvestWindowText(template('fall'), '2024-12-20')).toBe(
      'Harvest Feb 8, 2025 to Feb 23, 2025',
    );
    expect(
      harvestWindowText(
        template('spring', { harvest_start_days: 365, harvest_end_days: 366 }),
        '2024-02-29',
      ),
    ).toBe('Harvest Feb 28, 2025 to Mar 1, 2025');
  });
  it('handles a template with no harvest start', () => {
    expect(
      harvestWindowText(template('spring', { harvest_start_days: null }), '2025-03-01'),
    ).toBeNull();
    expect(harvestWindowText(template('spring', { harvest_end_days: null }), '2025-03-01')).toBe(
      'Harvest from Apr 20, 2025',
    );
  });
});

describe('describeScheduleError', () => {
  it('explains known codes', () => {
    expect(describeScheduleError('crop_not_ready')).toMatch(/season and a planting date/i);
    expect(describeScheduleError('invalid_template')).toMatch(/not available/i);
    expect(describeScheduleError('crop_archived')).toMatch(/removed/i);
    expect(describeScheduleError('unauthenticated')).toMatch(/sign in/i);
  });
  it('explains network failures and falls back for unknown codes', () => {
    expect(describeScheduleError('network')).toMatch(/connection/i);
    expect(describeScheduleError('something_else')).toMatch(/try again/i);
    expect(describeScheduleError(null)).toMatch(/try again/i);
    expect(describeScheduleError(undefined)).toMatch(/try again/i);
  });
});
