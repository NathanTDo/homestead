# Product Decisions

Resolved product decisions for the Farm Planning App MVP. These apply across all implementation phases and override any conflicting guidance in the source PRD where noted.

## 1. End-to-End User Flow

The flow is: select plant → choose season/template → choose planting date → generate schedule via Edge Function → tasks appear on calendar.

Users can select any season, not just the current one, to prepare for future growing seasons.

## 2. Onboarding Survey

Onboarding survey data is collected and stored but does not influence app behavior in the MVP. Collected fields: farming location, farming type, preferred growing seasons, produce interests, farming experience level.

## 3. Farm Creation

Users name their own farm during onboarding. The initial farm is created as part of the onboarding flow (not auto-created on signup).

## 4. Schedule Regeneration

Not in MVP scope. Deferred to v1.1. Each crop generates a schedule once at creation time.

## 5. Crop Limit

The limit is 5 active crops (not 5 selected plants). Crops have a status lifecycle allowing removal/archiving to free a slot.

## 6. Crop Status Values

- `planned` — Crop selected but not yet planted or scheduled.
- `active` — Schedule generated, in progress.
- `archived` — Harvest complete or user-removed.

## 7. Image Storage

Bundled local assets for the MVP. The architecture should allow switching to Supabase Storage later if scaling is needed.

## 8. Testing Framework

- Jest + React Native Testing Library for unit and component tests.
- Supabase local database (via Supabase CLI) for integration tests.

## 9. Plant Search

Text search by plant name only. No season filtering in the MVP.

## 10. Profile Tab Scope

Display name, farm name, sign out. Minimal for MVP.

## 11. Deletion Policy

Soft delete: set crop status to `archived`. Never cascade-delete growing tasks. Preserve completed task history.

## 12. Generation Key

Format: `{farm_crop_id}:{task_type}:{scheduled_date}` used as a unique constraint to prevent duplicate task generation.

## Architectural Constraints

- Framework: React Native + Expo (latest stable SDK) with TypeScript (strict mode).
- Navigation: Expo Router with file-based routing and tab navigation.
- Backend: Supabase (PostgreSQL, Auth, Edge Functions, RLS).
- Architecture: Modular monolith with domain-based organization.
- Data access: Repository pattern — UI components never contain direct Supabase queries.
- Server-side logic: Supabase Edge Functions for schedule generation.
- Build: Expo development build, not Expo Go exclusively.
- No microservices, Kubernetes, Redis, or unnecessary infrastructure for the MVP.
