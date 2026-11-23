import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Short label and icon for a WMO weather code, as returned by Open-Meteo. */
export function describeWeatherCode(code: number): { label: string; icon: IconName } {
  if (code === 0) return { label: 'Clear', icon: 'sunny-outline' };
  if (code <= 2) return { label: 'Partly cloudy', icon: 'partly-sunny-outline' };
  if (code === 3) return { label: 'Overcast', icon: 'cloud-outline' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'cloud-outline' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: 'rainy-outline' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: 'Rain', icon: 'rainy-outline' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: 'Snow', icon: 'snow-outline' };
  }
  if (code >= 95) return { label: 'Thunderstorm', icon: 'thunderstorm-outline' };
  return { label: 'Cloudy', icon: 'cloud-outline' };
}
