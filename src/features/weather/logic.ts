import type { PlantWateringGuideline, WeatherCondition } from '@/types';

export interface DailyForecast {
  date: string;
  highF: number;
  lowF: number;
  rainInches: number;
}

export interface ForecastSummary {
  condition: WeatherCondition;
  /** Average of the daily highs, rounded. */
  averageHighF: number;
  today: DailyForecast;
  /** Rain is expected today or tomorrow. */
  rainExpected: boolean;
  rainInches: number;
}

/** Average high at or above this is warm weather. Matches the bands used in the seed data. */
export const WARM_FROM_F = 75;
/** Average high at or above this (and below warm) is mild weather. Below it is cool. */
export const MILD_FROM_F = 60;
/** Rain over today and tomorrow at or above this much is enough to skip a watering. */
export const RAIN_SKIP_INCHES = 0.25;

export function classifyWeather(averageHighF: number): WeatherCondition {
  if (averageHighF >= WARM_FROM_F) return 'warm';
  if (averageHighF >= MILD_FROM_F) return 'mild';
  return 'cool';
}

/** Reduces a short forecast (today first) to a weather condition and a rain flag. */
export function summarizeForecast(days: readonly DailyForecast[]): ForecastSummary | null {
  if (days.length === 0) return null;
  const average = days.reduce((sum, d) => sum + d.highF, 0) / days.length;
  const rainInches = days.slice(0, 2).reduce((sum, d) => sum + d.rainInches, 0);
  return {
    condition: classifyWeather(average),
    averageHighF: Math.round(average),
    today: days[0],
    rainExpected: rainInches >= RAIN_SKIP_INCHES,
    rainInches: Math.round(rainInches * 100) / 100,
  };
}

export interface WateringReminder {
  plantId: string;
  plantName: string;
  /** "Every 1–2 days" or "Every 3 days". */
  frequency: string;
  notes: string | null;
}

export function formatInterval(min: number, max: number): string {
  if (min === max) return min === 1 ? 'Every day' : `Every ${min} days`;
  return `Every ${min}–${max} days`;
}

/** One reminder per plant that has a guideline for the current weather, in the given order. */
export function buildReminders(
  plants: readonly { id: string; name: string }[],
  guidelines: readonly PlantWateringGuideline[],
  condition: WeatherCondition,
): WateringReminder[] {
  return plants.flatMap((plant) => {
    const g = guidelines.find((x) => x.plant_id === plant.id && x.weather === condition);
    return g
      ? [
          {
            plantId: plant.id,
            plantName: plant.name,
            frequency: formatInterval(g.min_interval_days, g.max_interval_days),
            notes: g.notes,
          },
        ]
      : [];
  });
}
