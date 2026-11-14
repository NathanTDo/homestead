-- Phase 2: initial schema, triggers, RLS, indexes.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  onboarding_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  farming_method TEXT NOT NULL DEFAULT 'outdoor',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE farm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (farm_id, user_id)
);

CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT, -- key that maps to a bundled asset
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  UNIQUE (plant_id, season, version)
);

CREATE TABLE care_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES growing_templates(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN ('watering', 'fertilizing', 'pruning', 'pest_inspection', 'other')),
  description TEXT,
  start_day INTEGER NOT NULL,
  interval_days INTEGER, -- NULL for one-time activities
  end_day INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE growing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_crop_id UUID NOT NULL REFERENCES farm_crops(id) ON DELETE RESTRICT,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'planting', 'germination', 'transplanting', 'maturity', 'harvest_start', 'harvest_end',
    'watering', 'fertilizing', 'pruning', 'pest_inspection', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  generation_key TEXT NOT NULL, -- {farm_crop_id}:{task_type}:{scheduled_date}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (generation_key)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_farm_crops_farm_id ON farm_crops (farm_id);
CREATE INDEX idx_farm_crops_farm_id_status ON farm_crops (farm_id, status);
CREATE INDEX idx_growing_tasks_farm_crop_id ON growing_tasks (farm_crop_id);
CREATE INDEX idx_growing_tasks_scheduled_date ON growing_tasks (scheduled_date);
CREATE INDEX idx_farm_members_user_id ON farm_members (user_id);
CREATE INDEX idx_farm_members_farm_id ON farm_members (farm_id);

-- ---------------------------------------------------------------------------
-- Functions and triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION enforce_crop_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM public.farm_crops
  WHERE farm_id = NEW.farm_id
    AND status IN ('planned', 'active')
    AND id IS DISTINCT FROM NEW.id;

  IF active_count >= 5 THEN
    RAISE EXCEPTION 'A farm cannot have more than 5 active or planned crops';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER check_crop_limit
BEFORE INSERT OR UPDATE ON farm_crops
FOR EACH ROW
WHEN (NEW.status IN ('planned', 'active'))
EXECUTE FUNCTION enforce_crop_limit();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON farms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON farm_crops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON growing_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Membership check used by RLS policies. SECURITY DEFINER bypasses RLS on
-- farm_members, which avoids infinite recursion in the farm_members policy.
CREATE OR REPLACE FUNCTION is_farm_member(target_farm_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = target_farm_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE growing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE growing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_rules ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- farms
-- The creator can also read the farm so INSERT ... RETURNING works before the
-- owner membership row exists.
CREATE POLICY "Users can read farms they belong to" ON farms
  FOR SELECT TO authenticated USING (created_by = auth.uid() OR is_farm_member(id));
CREATE POLICY "Users can insert farms they create" ON farms
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- farm_members
CREATE POLICY "Users can read memberships for their farms" ON farm_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_farm_member(farm_id));
-- A user may only add themselves, and only to a farm they created.
CREATE POLICY "Farm creators can insert own membership" ON farm_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM farms WHERE farms.id = farm_members.farm_id AND farms.created_by = auth.uid()
    )
  );

-- farm_crops
CREATE POLICY "Members can read farm crops" ON farm_crops
  FOR SELECT TO authenticated USING (is_farm_member(farm_id));
CREATE POLICY "Members can insert farm crops" ON farm_crops
  FOR INSERT TO authenticated WITH CHECK (is_farm_member(farm_id));
CREATE POLICY "Members can update farm crops" ON farm_crops
  FOR UPDATE TO authenticated USING (is_farm_member(farm_id)) WITH CHECK (is_farm_member(farm_id));

-- growing_tasks (inserts come from the service role via Edge Functions)
CREATE POLICY "Members can read growing tasks" ON growing_tasks
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM farm_crops
      WHERE farm_crops.id = growing_tasks.farm_crop_id AND is_farm_member(farm_crops.farm_id)
    )
  );
CREATE POLICY "Members can update growing tasks" ON growing_tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM farm_crops
      WHERE farm_crops.id = growing_tasks.farm_crop_id AND is_farm_member(farm_crops.farm_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farm_crops
      WHERE farm_crops.id = growing_tasks.farm_crop_id AND is_farm_member(farm_crops.farm_id)
    )
  );

-- Catalog tables: read-only for authenticated users, writes via service role only
CREATE POLICY "Authenticated users can read plants" ON plants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read templates" ON growing_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read care rules" ON care_rules
  FOR SELECT TO authenticated USING (true);
