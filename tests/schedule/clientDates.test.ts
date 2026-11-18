import {
  addDays,
  formatDate,
  isoDateFromLocal,
  localDateFromIso,
  todayIso,
} from '../../src/utils/dates';

describe('formatDate', () => {
  it('formats a day for display', () => {
    expect(formatDate('2025-03-01')).toBe('Mar 1, 2025');
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025');
  });
  it('rejects invalid dates', () => {
    expect(() => formatDate('2025-02-30')).toThrow();
  });
});

describe('local date conversion', () => {
  it('reads the day shown on the device clock, not the UTC day', () => {
    // 23:30 local on Mar 1 is already Mar 2 in UTC for zones behind UTC, and the reverse
    // for zones ahead. The result must still be the local day.
    expect(isoDateFromLocal(new Date(2025, 2, 1, 23, 30))).toBe('2025-03-01');
    expect(isoDateFromLocal(new Date(2025, 2, 1, 0, 30))).toBe('2025-03-01');
  });
  it('round-trips through a picker Date', () => {
    for (const day of ['2025-01-01', '2024-02-29', '2025-12-31', '2025-03-09', '2025-11-02']) {
      expect(isoDateFromLocal(localDateFromIso(day))).toBe(day);
    }
  });
  it('todayIso uses the local day', () => {
    expect(todayIso(new Date(2025, 5, 15, 23, 59))).toBe('2025-06-15');
  });
  it('re-exports the shared addDays', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });
});
