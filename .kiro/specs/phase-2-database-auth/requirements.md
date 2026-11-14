# Requirements: Phase 2 — Database

## 1. Database Migrations

### REQ-001: SQL Migration Management
The system shall use SQL migration files managed by the Supabase CLI for all database schema changes.

### REQ-002: Migration Naming Convention
Migrations shall be named with a timestamp prefix in the format `YYYYMMDDHHMMSS_description.sql`.

## 2. Database Schema

### REQ-003: Profiles Table
The system shall create a `profiles` table with: id (UUID, PK, references `auth.users` ON DELETE CASCADE), email (TEXT), display_name (TEXT, nullable), onboarding_data (JSONB, nullable), created_at, updated_at.

### REQ-004: Farms Table
The system shall create a `farms` table with: id (UUID, PK, default `gen_random_uuid()`), name (TEXT), location (TEXT, nullable), farming_method (TEXT, default 'outdoor'), created_by (UUID, references profiles ON DELETE RESTRICT), created_at, updated_at.

### REQ-005: Farm Members Table
The system shall create a `farm_members` table with: id (UUID, PK), farm_id (UUID, references farms ON DELETE CASCADE), user_id (UUID, references profiles ON DELETE CASCADE), role (TEXT, CHECK in 'owner', 'member', default 'owner'), created_at. A unique constraint on (farm_id, user_id) shall prevent duplicate memberships.

### REQ-006: Plants Table
The system shall create a `plants` table with: id (UUID, PK), name (TEXT), slug (TEXT, UNIQUE), description (TEXT, nullable), image_url (TEXT, nullable — stores a key that maps to a bundled asset), created_at.

### REQ-007: Growing Templates Table
The system shall create a `growing_templates` table with: id (UUID, PK), plant_id (UUID, references plants ON DELETE CASCADE), version (INTEGER, default 1), season (TEXT, CHECK in 'spring', 'summer', 'fall', 'winter'), germination_days (INTEGER, nullable), maturity_days (INTEGER, nullable), harvest_start_days (INTEGER, nullable), harvest_end_days (INTEGER, nullable), source_reference (TEXT, nullable), is_active (BOOLEAN, default true), created_at. A unique constraint on (plant_id, season, version) shall prevent duplicate templates.

### REQ-008: Care Rules Table
The system shall create a `care_rules` table with: id (UUID, PK), template_id (UUID, references growing_templates ON DELETE CASCADE), activity_type (TEXT, CHECK in 'watering', 'fertilizing', 'pruning', 'pest_inspection', 'other'), description (TEXT, nullable), start_day (INTEGER), interval_days (INTEGER, nullable — null for one-time activities), end_day (INTEGER), created_at.

### REQ-009: Farm Crops Table
The system shall create a `farm_crops` table with: id (UUID, PK), farm_id (UUID, references farms ON DELETE RESTRICT), plant_id (UUID, references plants ON DELETE RESTRICT), template_id (UUID, references growing_templates ON DELETE RESTRICT, nullable — filled when user selects a template), planting_date (DATE, nullable — filled when user selects a planting date), selected_template_version (INTEGER, nullable), status (TEXT, CHECK in 'planned', 'active', 'archived', default 'planned'), created_at, updated_at.

### REQ-010: Growing Tasks Table
The system shall create a `growing_tasks` table with: id (UUID, PK), farm_crop_id (UUID, references farm_crops ON DELETE RESTRICT), task_type (TEXT, CHECK in 'planting', 'germination', 'transplanting', 'maturity', 'harvest_start', 'harvest_end', 'watering', 'fertilizing', 'pruning', 'pest_inspection', 'other'), title (TEXT), description (TEXT, nullable), scheduled_date (DATE), completed_at (TIMESTAMPTZ, nullable), generation_key (TEXT), created_at, updated_at.

### REQ-011: Generation Key Uniqueness
The system shall enforce a unique constraint on `growing_tasks.generation_key` to prevent duplicate task generation. The generation key format shall be `{farm_crop_id}:{task_type}:{scheduled_date}`.

### REQ-012: Five Active Crop Limit
The system shall enforce at the database level that a farm has no more than five crops with status 'planned' or 'active'. A trigger shall reject inserts or status updates that would exceed this limit.

### REQ-013: Soft Delete Policy
The system shall never cascade-delete `growing_tasks` when a `farm_crop` is deleted. Foreign keys from `growing_tasks` to `farm_crops` shall use ON DELETE RESTRICT. Crop removal shall set status to 'archived' rather than deleting the row.

### REQ-014: Profile Auto-Creation
The system shall automatically create a `profiles` row when a new user signs up, using a trigger on `auth.users` that inserts the user's id and email.

### REQ-015: Updated_at Triggers
The system shall automatically update the `updated_at` column on all tables that have one whenever a row is updated.

## 3. Authentication (Backend)

### REQ-016: Supabase Auth
The system shall use Supabase Auth with email and password authentication for the MVP.

### REQ-017: Auth UI (moved to Phase 3)
Sign-in and sign-up screens, auth state routing, and sign-out are implemented in Phase 3 (see Phase 3 REQ-001 to REQ-003). Phase 2 covers only the backend: Supabase Auth configuration and the profile auto-creation trigger.

## 4. Row Level Security

### REQ-018: RLS Enabled on All User-Owned Tables
The system shall enable RLS on: profiles, farms, farm_members, farm_crops, growing_tasks.

### REQ-019: RLS — Profiles
Users shall only read and update their own profile row.

### REQ-020: RLS — Farms
Users shall only read farms where they are a member (via `farm_members`). Users shall only insert farms where they are the `created_by` user.

### REQ-021: RLS — Farm Members
Users shall only read farm_members rows for farms where they are a member.

### REQ-022: RLS — Farm Crops
Users shall only read, insert, update farm_crops for farms where they are a member.

### REQ-023: RLS — Growing Tasks
Users shall only read and update growing_tasks for farm_crops belonging to farms where they are a member.

### REQ-024: RLS — Catalog Tables
Plants, growing_templates, and care_rules shall be readable by all authenticated users. Only service-role can write to these tables.

## 5. Seed Data

### REQ-025: Plant Catalog Seed
The system shall seed 15 plants into the `plants` table: garlic, peas, bok choy, lettuce, arugula, spinach, celtuce, gai lan, chives, radish, daikon, kale, cilantro, crown daisy, kohlrabi. Each plant shall have a name, slug, description, and image key.

## 6. Indexes

### REQ-026: Performance Indexes
The system shall create indexes on: `farm_crops(farm_id)`, `farm_crops(farm_id, status)`, `growing_tasks(farm_crop_id)`, `growing_tasks(scheduled_date)`, `farm_members(user_id)`, `farm_members(farm_id)`.
