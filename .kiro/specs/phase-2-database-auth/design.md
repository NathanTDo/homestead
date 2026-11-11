# Design: Phase 2 — Database and Authentication

## Overview

Phase 2 implements the full database schema, authentication, Row Level Security, and seed data. This is the data foundation for all subsequent phases. The schema is designed for future multi-tenant support (farm_members table) even though the MVP has one user per farm.

## Database Schema

### profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  onboarding_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`onboarding_data` stores the survey responses as a JSONB object with keys: `farming_location`, `farming_type`, `preferred_seasons` (array), `interested_produce` (array), `experience_level`. Stored for future use — does not influence MVP behavior.

### farms

```sql
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  farming_method TEXT NOT NULL DEFAULT 'outdoor',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`ON DELETE RESTRICT` prevents deleting a profile that owns farms without explicit handling. Farm deletion is not an MVP feature.

### farm_members

```sql
CREATE TABLE farm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(farm_id, user_id)
);
```

The farm creator is automatically added as a member with role 'owner' during farm creation (handled in Phase 3 application logic).

### plants

```sql
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`image_url` stores a key (e.g., "garlic") that the app resolves to a bundled asset (`assets/images/garlic.png`). This allows swapping to Supabase Storage URLs later without schema changes.

### growing_templates

```sql
CREATE TABLE growing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  season TEXT NOT NULL CHECK (season IN ('spring', 'summer', 'fall', 'winter')),
  germination_days INTEGER,
  maturity_days INTEGER,
  harvest_start_days INTEGER,
  harvest_end_days INTEGER,
  source_reference TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plant_id, season, version)
);
```

The unique constraint on (plant_id, season, version) ensures versioned templates are unique per season. When a template is updated, a new version is inserted rather than overwriting, preserving the version history.

### care_rules

```sql
CREATE TABLE care_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES growing_templates(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('watering', 'fertilizing', 'pruning', 'pest_inspection', 'other')),
  description TEXT,
  start_day INTEGER NOT NULL,
  interval_days INTEGER,
  end_day INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`interval_days` is null for one-time activities (e.g., transplanting). Non-null for recurring activities (e.g., watering every 2 days). `start_day` and `end_day` define the window during which the activity occurs, measured in days after planting.

### farm_crops

```sql
CREATE TABLE farm_crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  template_id UUID REFERENCES growing_templates(id) ON DELETE RESTRICT,
  planting_date DATE,
  selected_template_version INTEGER,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`template_id` and `planting_date` are nullable — a crop is created as 'planned' when a user selects a plant, and these fields are filled in Phase 4 when the user chooses a template and planting date. `selected_template_version` locks the template version at schedule generation time.

`ON DELETE RESTRICT` on all foreign keys prevents deleting referenced rows while crops exist, supporting the soft-delete policy.

### growing_tasks

```sql
CREATE TABLE growing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_crop_id UUID NOT NULL REFERENCES farm_crops(id) ON DELETE RESTRICT,
  task_type TEXT NOT NULL CHECK (task_type IN ('planting', 'germination', 'transplanting', 'maturity', 'harvest_start', 'harvest_end', 'watering', 'fertilizing', 'pruning', 'pest_inspection', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  generation_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(generation_key)
);
```

The unique constraint on `generation_key` enforces idempotency. The format is `{farm_crop_id}:{task_type}:{scheduled_date}`. Re-running schedule generation for the same crop will conflict on existing keys and skip duplicates (ON CONFLICT DO NOTHING).

## Triggers

### Profile Auto-Creation

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Five Active Crop Limit

```sql
CREATE OR REPLACE FUNCTION enforce_crop_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM farm_crops
  WHERE farm_id = NEW.farm_id
    AND status IN ('planned', 'active')
    AND id IS DISTINCT FROM NEW.id;
  
  IF active_count >= 5 THEN
    RAISE EXCEPTION 'A farm cannot have more than 5 active or planned crops';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_crop_limit
BEFORE INSERT OR UPDATE ON farm_crops
FOR EACH ROW
WHEN (NEW.status IN ('planned', 'active'))
EXECUTE FUNCTION enforce_crop_limit();
```

`id IS DISTINCT FROM NEW.id` excludes the current row from the count, allowing status updates on existing crops.

### Updated_at Auto-Update

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to all tables with an `updated_at` column.

## Row Level Security

### profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### farms
```sql
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read farms they belong to"
  ON farms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM farm_members
    WHERE farm_members.farm_id = farms.id
      AND farm_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert farms they create"
  ON farms FOR INSERT
  WITH CHECK (created_by = auth.uid());
```

### farm_members
```sql
ALTER TABLE farm_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read memberships for their farms"
  ON farm_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM farm_members fm2
      WHERE fm2.farm_id = farm_members.farm_id
        AND fm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own membership"
  ON farm_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### farm_crops
```sql
ALTER TABLE farm_crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage crops for their farms"
  ON farm_crops FOR ALL
  USING (EXISTS (
    SELECT 1 FROM farm_members
    WHERE farm_members.farm_id = farm_crops.farm_id
      AND farm_members.user_id = auth.uid()
  ));
```

### growing_tasks
```sql
ALTER TABLE growing_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read tasks for their farm crops"
  ON growing_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM farm_crops
    JOIN farm_members ON farm_members.farm_id = farm_crops.farm_id
    WHERE farm_crops.id = growing_tasks.farm_crop_id
      AND farm_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks for their farm crops"
  ON growing_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM farm_crops
    JOIN farm_members ON farm_members.farm_id = farm_crops.farm_id
    WHERE farm_crops.id = growing_tasks.farm_crop_id
      AND farm_members.user_id = auth.uid()
  ));
```

### Catalog tables (plants, growing_templates, care_rules)
```sql
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE growing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_rules ENABLE ROW LEVEL SECURITY;

-- Readable by all authenticated users
CREATE POLICY "Authenticated users can read plants"
  ON plants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read templates"
  ON growing_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read care rules"
  ON care_rules FOR SELECT TO authenticated USING (true);
```

No INSERT/UPDATE/DELETE policies on catalog tables — only the service role (used by Edge Functions and seed scripts) can write.

## Authentication

Supabase Auth with email/password. The auth screens live in `app/(auth)/` with:
- `login.tsx` — email and password sign-in
- `signup.tsx` — email and password sign-up

After authentication, the root layout checks onboarding state to route to either `(onboarding)` or `(tabs)`.

## Seed Data

The `supabase/seed.sql` file inserts 15 plants. Template and care rule seeds are added in Phase 4. Example:

```sql
INSERT INTO plants (name, slug, description, image_url) VALUES
  ('Garlic', 'garlic', 'A hardy bulb plant grown for its flavorful cloves.', 'garlic'),
  ('Peas', 'peas', 'Cool-season legume producing edible pods and seeds.', 'peas'),
  ('Bok Choy', 'bok-choy', 'Chinese cabbage with crisp stems and dark green leaves.', 'bok-choy'),
  -- ... 12 more plants
  ('Kohlrabi', 'kohlrabi', 'A brassica with a swollen stem that has a mild, turnip-like flavor.', 'kohlrabi')
ON CONFLICT (slug) DO NOTHING;
```

## Out of Scope for Phase 2

- Auth UI implementation (screens built in Phase 3, but auth config is done here)
- Onboarding survey UI (Phase 3)
- Plant catalog UI (Phase 3)
- Growing template seeds (Phase 4)
- Any application features
