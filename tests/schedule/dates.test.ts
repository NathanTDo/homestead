import { addDays, formatIsoDate, parseIsoDate } from '../../supabase/functions/_shared/dates';

describe('addDays', () => {
  it('returns the same date for 0, null and undefined', () => {
    expect(addDays('2025-06-15', 0)).toBe('2025-06-15');
    expect(addDays('2025-06-15', null)).toBe('2025-06-15');
    expect(addDays('2025-06-15', undefined)).toBe('2025-06-15');
  });

  it('adds and subtracts days', () => {
    expect(addDays('2025-06-15', 1)).toBe('2025-06-16');
    expect(addDays('2025-06-15', 60)).toBe('2025-08-14');
    expect(addDays('2025-06-15', -15)).toBe('2025-05-31');
  });

  it('crosses month boundaries', () => {
    expect(addDays('2025-01-31', 1)).toBe('2025-02-01');
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28');
    expect(addDays('2025-04-30', 1)).toBe('2025-05-01');
    expect(addDays('2025-01-01', 31)).toBe('2025-02-01');
  });

  it('crosses year boundaries', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2025-11-15', 240)).toBe('2026-07-13');
  });

  it('handles leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    expect(addDays('2024-02-29', 365)).toBe('2025-02-28');
    expect(addDays('2024-02-29', 366)).toBe('2025-03-01');
    expect(addDays('2000-02-28', 1)).toBe('2000-02-29'); // divisible by 400
    expect(addDays('1900-02-28', 1)).toBe('1900-03-01'); // divisible by 100 but not 400
  });

  it('is not affected by daylight saving changes', () => {
    expect(addDays('2025-03-08', 1)).toBe('2025-03-09');
    expect(addDays('2025-03-09', 1)).toBe('2025-03-10');
    expect(addDays('2025-11-01', 1)).toBe('2025-11-02');
    expect(addDays('2025-11-02', 1)).toBe('2025-11-03');
    expect(addDays('2025-03-01', 365)).toBe('2026-03-01');
  });

  it('handles large offsets', () => {
    expect(addDays('2025-01-01', 10000)).toBe('2052-05-19');
  });

  it('rejects invalid dates and non-whole days', () => {
    for (const bad of [
      '',
      'abc',
      '2025-2-3',
      '2025-02-30',
      '2025-13-01',
      '2025-00-10',
      '2023-02-29',
    ]) {
      expect(() => addDays(bad, 1)).toThrow(/invalid date/i);
    }
    expect(() => addDays('2025-01-01', 1.5)).toThrow(/whole number/);
    expect(() => addDays('2025-01-01', NaN)).toThrow(/whole number/);
  });
});

describe('parseIsoDate / formatIsoDate', () => {
  it('round-trips', () => {
    for (const d of ['2025-01-01', '2024-02-29', '2025-12-31', '0999-05-05']) {
      expect(formatIsoDate(parseIsoDate(d))).toBe(d);
    }
  });
});
