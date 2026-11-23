# Requirements: Phase 7 — Farm Location and Weather

## 1. Farm Location

### REQ-001: Location Stored on the Farm

The farm shall have an optional location, a zip code or place name of at most 100 characters, stored in `farms.location`. Surrounding whitespace is removed, and an empty value is stored as no location.

### REQ-002: Onboarding Saves the Location

When a farm is created in onboarding, `create_farm_with_member` shall save the survey's farming location to `farms.location` (trimmed, cut to 100 characters).

### REQ-003: Existing Farms Are Backfilled

The migration shall copy the onboarding location from the creator's profile to every farm that has no location.

### REQ-004: Owner Can Change the Location

A farm owner shall be able to set, change or clear the farm's location through `update_farm_location(p_farm_id, p_location)`. The function shall reject locations over 100 characters (`invalid_location`), callers who are not signed in (`not_authenticated`), and callers who are not an owner of that farm (`farm_not_found`).

### REQ-005: No General Farm Updates

Users shall not receive a general UPDATE permission on `farms`. The farm name and creator shall stay unchangeable by users.

### REQ-006: Profile Tab Editing

The Profile tab shall have no navigation header and shall show a centered, bold "Profile" title in the same style as the calendar title. It shall show a "Farm location" field with the current location and a "Save location" button. The button shall be disabled until the text differs from the saved location. The screen shall confirm a save, show a message when saving fails, keep the user's text on failure, and reject text over 100 characters before calling the server.

## 2. Weather Widget

### REQ-007: Widget Placement

The home tab shall have no navigation header and shall show a centered, bold "Home" title in the same style as the calendar title, above a weather widget in a box that fills the right half of the screen width. The left half shall stay empty for later content.

### REQ-008: Widget Contents

The widget shall show: the place name, the current temperature, a short sky condition label with an icon, and today's high and low as "H: n° L: n°". Temperatures are in degrees Fahrenheit and rounded to whole numbers.

### REQ-009: Weather Source

The weather shall come from Open-Meteo. A zip code (5 digits, optional +4) shall be looked up as a US postal code. Any other text shall be looked up as a place name. For "City, State" the result in the named state shall be preferred when the state is spelled out. The service needs no API key.

### REQ-010: Widget States

The widget shall show, inside its box:

- a loading indicator while the weather loads
- "No farm location set" when the farm has no location, without calling the weather service
- `Could not find "<location>"` when the location matches no place
- an offline message or "Could not load the weather." with a "Try again" action when a request fails

### REQ-011: Request Limits

Each weather request shall time out after 10 seconds and shall surface a timeout as a network error, so the offline message and retry are shown.

## 3. Watering Guidelines Data

### REQ-012: Weather-Based Watering Guidelines

The catalog shall hold, for each of the 15 plants, a watering interval range in days for warm, mild and cool weather, with a short note. The table is `plant_watering_guidelines`, unique per plant and weather, with `min_interval_days >= 1` and `max_interval_days >= min_interval_days`.

### REQ-013: Weather Bands

Warm weather means an average daily high of 75°F or more over today and the next two days. Mild is 60°F up to 75°F. Cool is below 60°F.

### REQ-014: Read-Only Catalog

Signed-in users shall be able to read the guidelines and shall not be able to change them. Writes go through the service role.

### REQ-015: Unverified Data

The guideline values are general horticultural guidance and have not been checked against a local extension service. The seed file shall say so.

## 4. Out of Scope

- Showing watering reminders on the home screen. This moves to a separate daily reminders feature, which will use the guidelines table and the weather band logic that this phase leaves in place.
- Push notifications, tracking when a crop was last watered, and rain-based skipping of tasks.
- Caching the geocode or forecast.
- Celsius and other units.
