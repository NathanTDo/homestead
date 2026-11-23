# Tasks: Phase 7 — Farm Location and Weather

## 1. Watering Guidelines Data

- [x] 1.1 Add the `plant_watering_guidelines` table, RLS and read policy (`20261119000000_plant_watering_guidelines.sql`)
- [x] 1.2 Seed 45 guidelines (15 plants x warm, mild, cool) in `supabase/seed.sql`
- [x] 1.3 Add `WeatherCondition` and `PlantWateringGuideline` types
- [x] 1.4 Add `wateringGuidelineRepository.listGuidelines`
- [ ] 1.5 Have the guideline values reviewed against a local extension service

## 2. Farm Location

- [x] 2.1 Backfill `farms.location` from the survey answer (`20261120000000_farm_location.sql`)
- [x] 2.2 Save the onboarding location in `create_farm_with_member`
- [x] 2.3 Add the `update_farm_location` function with owner check and length check
- [x] 2.4 Add `farmRepository.updateFarmLocation`
- [x] 2.5 Add `setLocation` to `FarmProvider`
- [x] 2.6 Add `validateLocation` and `describeLocationError`
- [x] 2.7 Add the "Farm location" field and "Save location" button to the Profile tab

## 3. Weather Service

- [x] 3.1 Add `geocodeLocation` (US zip code and place name, state preference)
- [x] 3.2 Add `fetchCurrentWeather` (current temperature, weather code, today's high and low)
- [x] 3.3 Add `fetchForecast` and the band and rain logic in `features/weather/logic.ts` for later reminders
- [x] 3.4 Add the 10 second request timeout
- [x] 3.5 Add `describeWeatherCode`

## 4. Home Screen Widget

- [x] 4.1 Add the `useLocalWeather` hook
- [x] 4.2 Add `WeatherWidget` with loading, no location, not found and error states
- [x] 4.3 Lay out the home tab with the widget in the right half
- [x] 4.5 Replace the navigation header with a bold "Home" title that matches the calendar
- [x] 4.6 Replace the Profile tab's navigation header with a bold "Profile" title that matches the calendar
- [x] 4.4 Remove the watering reminders list from the home tab

## 5. Tests

- [x] 5.1 Unit tests for weather logic, weather codes and the Open-Meteo service
- [x] 5.2 Screen tests for the home tab and the Profile location field
- [x] 5.3 Integration tests for saving and changing the location
- [ ] 5.4 Check the widget layout by hand on a phone and a tablet

## 6. Documentation

- [x] 6.1 Write this spec
- [x] 6.2 Update the README (features, structure, database, limitations)
- [x] 6.3 Update `docs/TESTING.md`

## 7. Deferred

- [ ] 7.1 Daily reminders feature (own spec): use the guidelines table, `logic.ts` and the weather service to build a daily reminder list
