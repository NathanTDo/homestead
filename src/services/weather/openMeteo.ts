/**
 * Location lookup and forecast from Open-Meteo (https://open-meteo.com). It is free and
 * needs no API key. Temperatures are in °F and rain in inches.
 */
import type { DailyForecast } from '@/features/weather/logic';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10000;
const US_ZIP = /^(\d{5})(?:-\d{4})?$/;

export interface GeoPoint {
  name: string;
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Weather request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Finds coordinates for a US zip code ("94103") or a place name ("Portland, OR").
 * Returns null when nothing matches.
 */
export async function geocodeLocation(location: string): Promise<GeoPoint | null> {
  const text = location.trim();
  if (!text) return null;
  const zip = US_ZIP.exec(text);
  const [place, region] = text.split(',').map((part) => part.trim());
  const params = new URLSearchParams({
    name: zip ? zip[1] : place,
    count: '10',
    language: 'en',
    format: 'json',
  });
  if (zip) params.set('countryCode', 'US');
  const { results } = await getJson<{ results?: GeocodingResult[] }>(
    `${GEOCODING_URL}?${params.toString()}`,
  );
  if (!results?.length) return null;
  // For "City, State", prefer a result in that state when the state is spelled out.
  const wanted = region?.toLowerCase();
  const match = (wanted && results.find((r) => r.admin1?.toLowerCase() === wanted)) || results[0];
  return { name: match.name, latitude: match.latitude, longitude: match.longitude };
}

interface ForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

/** Daily highs, lows and rain for today and the next two days at a point. */
export async function fetchForecast(point: GeoPoint, days = 3): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    forecast_days: String(days),
    timezone: 'auto',
  });
  const { daily } = await getJson<ForecastResponse>(`${FORECAST_URL}?${params.toString()}`);
  return daily.time.map((date, i) => ({
    date,
    highF: daily.temperature_2m_max[i],
    lowF: daily.temperature_2m_min[i],
    rainInches: daily.precipitation_sum[i] ?? 0,
  }));
}

export interface CurrentWeather {
  temperatureF: number;
  /** WMO weather code, see describeWeatherCode. */
  weatherCode: number;
  highF: number;
  lowF: number;
}

/** The temperature and sky right now, plus today's high and low, at a point. */
export async function fetchCurrentWeather(point: GeoPoint): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    forecast_days: '1',
    timezone: 'auto',
  });
  const { current, daily } = await getJson<{
    current: { temperature_2m: number; weather_code: number };
    daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
  }>(`${FORECAST_URL}?${params.toString()}`);
  return {
    temperatureF: current.temperature_2m,
    weatherCode: current.weather_code,
    highF: daily.temperature_2m_max[0],
    lowF: daily.temperature_2m_min[0],
  };
}
