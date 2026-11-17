-- Saves a generated schedule for a crop in one transaction: inserts the tasks (skipping any
-- that already exist) and activates the crop at the template's current version.
--
-- Only the service role can run this. It is called by the generate-schedule Edge Function,
-- which has already checked that the signed-in user belongs to the crop's farm. Signed-in
-- users must not call it directly, because it takes task rows from the caller.
CREATE OR REPLACE FUNCTION generate_tasks(p_farm_crop_id UUID, p_tasks JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_crop farm_crops%ROWTYPE;
  v_template growing_templates%ROWTYPE;
  v_inserted INTEGER;
BEGIN
  SELECT * INTO v_crop FROM farm_crops WHERE id = p_farm_crop_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'crop_not_found';
  END IF;
  IF v_crop.status = 'archived' THEN
    RAISE EXCEPTION 'crop_archived';
  END IF;
  IF v_crop.template_id IS NULL OR v_crop.planting_date IS NULL THEN
    RAISE EXCEPTION 'crop_not_ready';
  END IF;

  -- The template must be active and belong to this crop's plant.
  SELECT * INTO v_template FROM growing_templates WHERE id = v_crop.template_id;
  IF NOT FOUND OR NOT v_template.is_active OR v_template.plant_id <> v_crop.plant_id THEN
    RAISE EXCEPTION 'invalid_template';
  END IF;

  IF jsonb_typeof(p_tasks) <> 'array'
     OR jsonb_array_length(p_tasks) = 0
     OR jsonb_array_length(p_tasks) > 2000 THEN
    RAISE EXCEPTION 'invalid_tasks';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_tasks) AS t
    WHERE (t ->> 'farm_crop_id')::uuid IS DISTINCT FROM p_farm_crop_id
  ) THEN
    RAISE EXCEPTION 'invalid_tasks';
  END IF;

  INSERT INTO growing_tasks
    (farm_crop_id, task_type, title, description, scheduled_date, generation_key)
  SELECT
    p_farm_crop_id,
    t ->> 'task_type',
    t ->> 'title',
    t ->> 'description',
    (t ->> 'scheduled_date')::date,
    t ->> 'generation_key'
  FROM jsonb_array_elements(p_tasks) AS t
  ON CONFLICT (generation_key) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  UPDATE farm_crops
  SET status = 'active', selected_template_version = v_template.version
  WHERE id = p_farm_crop_id;

  RETURN v_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION generate_tasks(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_tasks(UUID, JSONB) TO service_role;
