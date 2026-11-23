# Design: Phase 7 — Farm Location and Weather

## Overview

This phase gives a farm a location the user can edit, shows the current weather for that location in a widget on the home tab, and adds weather-based watering guideline data for a later daily reminders feature. The watering reminders list that was first built on the home screen was removed and is deferred (see Out of Scope in the requirements).

## Home Screen Layout

```
┌──────────────────────────────┐
│            Home              │  ← bold title, no navigation header (as on the calendar)
│ ┌────────────┬─────────────┐ │
│ │            │ San Francisco│ │
│ │ (reserved  │ 62°  ☂      │ │
│ │  for later)│ Rain        │ │
│ │            │ H: 66° L: 49°│ │
│ └────────────┴─────────────┘ │
└──────────────────────────────┘
```

Two equal flex halves in a row. The right half holds `WeatherWidget`.

## Components and Files

| File                                              | Purpose                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `app/(tabs)/index.tsx`                            | Home screen: the "Home" title and the two-half row                                                                             |
| `app/(tabs)/_layout.tsx`                          | Hides the home and profile tabs' navigation headers (`headerShown: false`)                                                     |
| `app/(tabs)/profile.tsx`                          | Adds the "Farm location" field and save button                                                                                 |
| `src/components/weather/WeatherWidget.tsx`        | The box. Renders loading, empty, not-found, error and weather states                                                           |
| `src/features/weather/hooks.ts`                   | `useLocalWeather(location)`: geocode, then fetch current weather, through `useAsyncData`                                       |
| `src/features/weather/conditions.ts`              | `describeWeatherCode(code)`: WMO weather code to label and icon                                                                |
| `src/features/weather/logic.ts`                   | `classifyWeather`, `summarizeForecast`, `buildReminders`, `formatInterval`. Not used by a screen yet. Kept for daily reminders |
| `src/services/weather/openMeteo.ts`               | `geocodeLocation`, `fetchCurrentWeather`, `fetchForecast`                                                                      |
| `src/repositories/wateringGuidelineRepository.ts` | `listGuidelines(plantIds)`. Not used by a screen yet                                                                           |
| `src/repositories/farmRepository.ts`              | Adds `updateFarmLocation`                                                                                                      |
| `src/features/farm/FarmProvider.tsx`              | Adds `setLocation`, which saves and updates the farm in state                                                                  |
| `src/features/onboarding/survey.ts`               | Adds `validateLocation` and `describeLocationError`                                                                            |

## Weather Service

Open-Meteo is called directly from the app. It is free, needs no key, and its terms limit the free tier to non-commercial use. A paid plan or another provider is needed if the app becomes commercial.

### Geocoding

`GET https://geocoding-api.open-meteo.com/v1/search`

- Zip code (`^\d{5}(-\d{4})?$`): `name=<first 5 digits>&countryCode=US`
- Otherwise: `name=<text before the first comma>`. If a state follows the comma and a result's `admin1` equals it (case-insensitive), that result wins. Otherwise the first result is used.
- No results: `null`, shown as `Could not find "<location>"`.

### Current Weather

`GET https://api.open-meteo.com/v1/forecast` with `current=temperature_2m,weather_code`, `daily=temperature_2m_max,temperature_2m_min`, `temperature_unit=fahrenheit`, `forecast_days=1`, `timezone=auto`. The high and low are the first daily values, so they refer to the farm's local day.

### Forecast for Reminders

`fetchForecast` returns three days of highs, lows and rain in inches. `summarizeForecast` averages the highs into a warm, mild or cool condition and flags rain of 0.25 in or more over today and tomorrow. It has no screen yet.

### Errors

`getJson` aborts after 10 seconds and throws `Weather request timed out`. A non-2xx response throws `Weather service returned <status>`. `useAsyncData` treats timeouts and fetch failures as offline errors.

### Privacy

The zip code or place name leaves the device and goes to Open-Meteo. It is not tied to an account or sent with any identifier from the app.

## Database

### Migration `20261119000000_plant_watering_guidelines.sql`

```sql
CREATE TABLE plant_watering_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  weather TEXT NOT NULL CHECK (weather IN ('warm', 'mild', 'cool')),
  min_interval_days INTEGER NOT NULL CHECK (min_interval_days >= 1),
  max_interval_days INTEGER NOT NULL CHECK (max_interval_days >= min_interval_days),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plant_id, weather)
);
```

Row level security is on, with a read-only SELECT policy for `authenticated`, like the other catalog tables.
The 45 rows (15 plants, 3 weather bands) are in `supabase/seed.sql`, inserted with `ON CONFLICT DO NOTHING`, so the seed can run more than once. `db push` does not run the seed, so a hosted project needs the seed run by hand.

### Migration `20261120000000_farm_location.sql`

- Backfills `farms.location` from `profiles.onboarding_data ->> 'farming_location'` where the farm has no location.
- Replaces `create_farm_with_member` so the new farm gets `v_location` (trimmed, at most 100 characters, empty becomes NULL). The rest of the function is unchanged.
- Adds `update_farm_location(p_farm_id UUID, p_location TEXT) RETURNS TEXT`, `SECURITY DEFINER` with `search_path = public`. It updates only `location`, and only when the caller is an owner in `farm_members`. `EXECUTE` is revoked from `PUBLIC` and `anon` and granted to `authenticated`.
  A function is used instead of an UPDATE policy so users cannot change `name` or `created_by`.

### Types

`WeatherCondition` (`'warm' | 'mild' | 'cool'`) and `PlantWateringGuideline` in `src/types/database.ts`.

## Profile Location Field

The Profile tab draws its own bold "Profile" title like the home and calendar tabs, with the content below it.

State: `draft` text, `saving`, and a `message` (success or error). `changed` is true when the trimmed draft differs from `farm.location`. Save calls `validateLocation`, then `FarmProvider.setLocation`, which calls `updateFarmLocation` and replaces `farm.location` in state with the saved value, so the home tab updates without a reload. Errors are mapped by `describeLocationError`.

## Watering Guideline Data

Weather bands match the seed comments: warm above about 75°F, mild about 60 to 75°F, cool below about 60°F. Intervals assume no meaningful rain. The values were written from general horticultural knowledge and need review before real use (REQ-015).

## Testing

- `tests/weather/logic.test.ts`: band edges, forecast summary, rain flag, interval text, reminder building.
- `tests/weather/openMeteo.test.ts`: zip and place geocoding, state preference, blank input, failures, forecast and current weather mapping.
- `tests/weather/conditions.test.ts`: weather code labels.
- `tests/ui/homeScreen.test.tsx`: "Home" title, widget values, loading, no location, not found, offline with retry.
- `tests/ui/profileScreen.test.tsx`: field, disabled button, save, clear, failure, length check.
- `tests/integration/farm-creation.test.ts`: onboarding saves the location, owner can change and clear it, over-length is rejected, a non-owner cannot change it.
- Manual: the widget layout on a phone and a tablet.
