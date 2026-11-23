import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchCurrentWeather, geocodeLocation } from '@/services/weather/openMeteo';
import type { CurrentWeather } from '@/services/weather/openMeteo';

export interface LocalWeather extends CurrentWeather {
  /** The place the weather is for, as the weather service names it. */
  placeName: string;
}

/** Loads the current weather for a farm's location. `data` is null when the place is not found. */
export function useLocalWeather(location: string) {
  return useAsyncData<LocalWeather | null>(async () => {
    const point = await geocodeLocation(location);
    if (!point) return null;
    return { placeName: point.name, ...(await fetchCurrentWeather(point)) };
  }, `weather:${location}`);
}
