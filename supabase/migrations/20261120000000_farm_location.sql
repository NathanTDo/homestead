-- Farm location: new farms now store the onboarding location on farms.location, existing farms
-- are backfilled from the survey answer, and farm owners can change it with update_farm_location.
-- Users have no UPDATE policy on farms (name and creator stay fixed), so the change goes through
-- a function that only touches the location.
UPDATE farms f
SET location = NULLIF(left(trim(p.onboarding_data ->> 'farming_location'), 100), '')
FROM profiles p
WHERE p.id = f.created_by AND f.location IS NULL;

CREATE OR REPLACE FUNCTION create_farm_with_member(
  p_farm_name TEXT,
  p_onboarding_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_name TEXT := trim(p_farm_name);
  v_input JSONB := COALESCE(p_onboarding_data, '{}'::jsonb);
  v_completed TEXT;
  v_farm_id UUID;
  v_location TEXT := NULLIF(left(trim(COALESCE(v_input ->> 'farming_location', '')), 100), '');
  v_slugs TEXT[];
  v_inserted INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_name IS NULL OR length(v_name) = 0 OR length(v_name) > 60 THEN
    RAISE EXCEPTION 'invalid_farm_name';
  END IF;
  IF jsonb_typeof(v_input) <> 'object' OR length(v_input::text) > 5000 THEN
    RAISE EXCEPTION 'invalid_onboarding_data';
  END IF;
  IF v_input ? 'interested_produce' AND jsonb_typeof(v_input -> 'interested_produce') <> 'array' THEN
    RAISE EXCEPTION 'invalid_onboarding_data';
  END IF;

  -- Distinct plant slugs the user picked.
  SELECT COALESCE(array_agg(DISTINCT s), '{}'::text[]) INTO v_slugs
  FROM jsonb_array_elements_text(COALESCE(v_input -> 'interested_produce', '[]'::jsonb)) AS s;
  IF cardinality(v_slugs) > 5 THEN
    RAISE EXCEPTION 'too_many_crops';
  END IF;

  -- Lock the profile row so a double tap cannot create two farms.
  SELECT onboarding_data ->> 'completed' INTO v_completed
  FROM profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;
  IF v_completed = 'true' THEN
    RAISE EXCEPTION 'already_onboarded';
  END IF;

  INSERT INTO farms (name, location, created_by) VALUES (v_name, v_location, v_user_id)
  RETURNING id INTO v_farm_id;

  INSERT INTO farm_members (farm_id, user_id, role) VALUES (v_farm_id, v_user_id, 'owner');

  INSERT INTO farm_crops (farm_id, plant_id, status)
  SELECT v_farm_id, p.id, 'planned' FROM plants p WHERE p.slug = ANY (v_slugs);
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted <> cardinality(v_slugs) THEN
    RAISE EXCEPTION 'invalid_plant';
  END IF;

  UPDATE profiles
  SET onboarding_data = jsonb_strip_nulls(jsonb_build_object(
    'farming_location', v_input -> 'farming_location',
    'farming_type', v_input -> 'farming_type',
    'preferred_seasons', v_input -> 'preferred_seasons',
    'interested_produce', to_jsonb(v_slugs),
    'experience_level', v_input -> 'experience_level',
    'completed', true
  ))
  WHERE id = v_user_id;

  RETURN v_farm_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION create_farm_with_member(TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_farm_with_member(TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION update_farm_location(p_farm_id UUID, p_location TEXT)
RETURNS TEXT AS $$
DECLARE
  v_location TEXT := NULLIF(trim(COALESCE(p_location, '')), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF v_location IS NOT NULL AND length(v_location) > 100 THEN
    RAISE EXCEPTION 'invalid_location';
  END IF;
  UPDATE farms SET location = v_location
  WHERE id = p_farm_id
    AND EXISTS (
      SELECT 1 FROM farm_members
      WHERE farm_id = p_farm_id AND user_id = auth.uid() AND role = 'owner'
    );
  IF NOT FOUND THEN
    RAISE EXCEPTION 'farm_not_found';
  END IF;
  RETURN v_location;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION update_farm_location(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION update_farm_location(UUID, TEXT) TO authenticated;
