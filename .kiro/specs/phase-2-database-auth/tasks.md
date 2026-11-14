# Tasks: Phase 2 — Database

## 1. Initialize Supabase Project

- [x] 1.1 Initialize Supabase project with `supabase init` if not already configured
- [x] 1.2 Verify `supabase/config.toml` exists
- [x] 1.3 Create `supabase/.gitignore` for local config (if not present)

## 2. Create Database Migration

- [x] 2.1 Create initial migration file for all tables (profiles, farms, farm_members, plants, growing_templates, care_rules, farm_crops, growing_tasks)
- [x] 2.2 Add all foreign key constraints with correct ON DELETE policies (CASCADE for members/rules, RESTRICT for crops/tasks)
- [x] 2.3 Add CHECK constraints (crop status, task type, activity type, season, farm member role)
- [x] 2.4 Add UNIQUE constraints (plant slug, generation_key, plant_id+season+version, farm_id+user_id)
- [x] 2.5 Create performance indexes (farm_crops by farm_id and status, growing_tasks by farm_crop_id and scheduled_date, farm_members by user_id and farm_id)

## 3. Create Trigger Functions

- [x] 3.1 Create `handle_new_user()` trigger function for auto-creating profiles on signup
- [x] 3.2 Create `enforce_crop_limit()` trigger function for the five active crop limit
- [x] 3.3 Create `update_updated_at()` trigger function for auto-updating updated_at
- [x] 3.4 Attach triggers to appropriate tables

## 4. Configure Row Level Security

- [x] 4.1 Enable RLS on profiles, farms, farm_members, farm_crops, growing_tasks
- [x] 4.2 Enable RLS on plants, growing_templates, care_rules
- [x] 4.3 Create SELECT/UPDATE policies for profiles (own profile only)
- [x] 4.4 Create SELECT/INSERT policies for farms (farm membership)
- [x] 4.5 Create SELECT/INSERT policies for farm_members
- [x] 4.6 Create SELECT/INSERT/UPDATE policies for farm_crops (farm membership)
- [x] 4.7 Create SELECT/UPDATE policies for growing_tasks (via farm_crop → farm_members)
- [x] 4.8 Create SELECT policies for catalog tables (all authenticated users, no write policies)

## 5. Configure Supabase Auth

- [x] 5.1 Configure email/password authentication in Supabase dashboard or config
- [x] 5.2 Verify the `handle_new_user` trigger fires on signup (test with a new user)

## 6. Seed Plant Catalog

- [x] 6.1 Create `supabase/seed.sql` with 15 plant insert statements
- [x] 6.2 Include name, slug, description, and image_url (asset key) for each plant
- [x] 6.3 Run seed against local database and verify 15 plants exist

## 7. Create Repository Layer

- [x] 7.1 Create `src/repositories/farmRepository.ts` with farm CRUD operations
- [x] 7.2 Create `src/repositories/plantRepository.ts` with plant catalog queries
- [x] 7.3 Create `src/repositories/cropRepository.ts` with crop CRUD and status management
- [x] 7.4 Create `src/repositories/taskRepository.ts` with task queries and completion
- [x] 7.5 Create `src/repositories/profileRepository.ts` with profile read/update
- [x] 7.6 Create TypeScript types in `src/types/` matching database schema

## 8. Verification

- [x] 8.1 Run `supabase db reset` and verify migrations apply without errors
- [x] 8.2 Verify seed data inserts 15 plants
- [x] 8.3 Verify profile auto-creation trigger works on new auth user
- [x] 8.4 Verify five-crop limit trigger rejects the 6th crop
- [x] 8.5 Verify soft delete: archived crop does not count toward limit
- [x] 8.6 Verify RLS: a user cannot read another user's farm or crops
- [x] 8.7 Verify RLS: unauthenticated users cannot read any user-owned table
- [x] 8.8 Verify generation_key unique constraint rejects duplicate tasks
