-- Onboarding now also creates the farm's starting crops from the plants the user picked
-- (up to 5, matching the five planned/active crop limit). Everything stays in one
-- transaction. `interested_produce` now holds plant slugs, not names.
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

  INSERT INTO farms (name, created_by) VALUES (v_name, v_user_id)
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
