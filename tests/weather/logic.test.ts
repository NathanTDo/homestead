import {
  buildReminders,
  classifyWeather,
  formatInterval,
  summarizeForecast,
  type DailyForecast,
} from '../../src/features/weather/logic';
import type { PlantWateringGuideline } from '../../src/types';

const day = (highF: number, rainInches = 0): DailyForecast => ({
  date: '2026-01-01',
  highF,
  lowF: highF - 10,
  rainInches,
});

describe('classifyWeather', () => {
  it('uses 75°F and 60°F as the band edges', () => {
    expect(classifyWeather(75)).toBe('warm');
    expect(classifyWeather(74.9)).toBe('mild');
    expect(classifyWeather(60)).toBe('mild');
    expect(classifyWeather(59.9)).toBe('cool');
  });
});

describe('summarizeForecast', () => {
  it('returns null for an empty forecast', () => {
    expect(summarizeForecast([])).toBeNull();
  });
  it('classifies by the average high', () => {
    const summary = summarizeForecast([day(80), day(70), day(78)]);
    expect(summary?.condition).toBe('warm');
    expect(summary?.averageHighF).toBe(76);
  });
  it('flags rain over today and tomorrow, not the third day', () => {
    expect(summarizeForecast([day(70, 0.1), day(70, 0.15), day(70)])?.rainExpected).toBe(true);
    expect(summarizeForecast([day(70), day(70), day(70, 2)])?.rainExpected).toBe(false);
    expect(summarizeForecast([day(70, 0.2), day(70), day(70)])?.rainExpected).toBe(false);
  });
});

describe('formatInterval', () => {
  it('formats ranges and single values', () => {
    expect(formatInterval(1, 2)).toBe('Every 1–2 days');
    expect(formatInterval(3, 3)).toBe('Every 3 days');
    expect(formatInterval(1, 1)).toBe('Every day');
  });
});

describe('buildReminders', () => {
  const guideline = (
    plant_id: string,
    weather: PlantWateringGuideline['weather'],
    min: number,
    max: number,
  ): PlantWateringGuideline => ({
    id: `${plant_id}-${weather}`,
    plant_id,
    weather,
    min_interval_days: min,
    max_interval_days: max,
    notes: null,
    created_at: '',
  });
  const plants = [
    { id: 'kale', name: 'Kale' },
    { id: 'garlic', name: 'Garlic' },
  ];
  const guidelines = [
    guideline('kale', 'warm', 2, 3),
    guideline('kale', 'cool', 4, 7),
    guideline('garlic', 'cool', 7, 10),
  ];

  it('picks the guideline for the weather and keeps the plant order', () => {
    const reminders = buildReminders(plants, guidelines, 'cool');
    expect(reminders.map((r) => [r.plantName, r.frequency])).toEqual([
      ['Kale', 'Every 4–7 days'],
      ['Garlic', 'Every 7–10 days'],
    ]);
  });
  it('skips plants with no guideline for that weather', () => {
    expect(buildReminders(plants, guidelines, 'warm').map((r) => r.plantName)).toEqual(['Kale']);
  });
});
