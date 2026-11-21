-- The five-crop limit counted a farm's crops and then inserted, as separate steps. Requests
-- running at the same moment each counted the same number and all passed, so a farm could
-- end up with more than 5. Taking a lock per farm first makes those requests wait their turn.
-- An advisory lock is used so it cannot clash with the row locks of foreign key checks.
CREATE OR REPLACE FUNCTION enforce_crop_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.farm_id::text, 0));

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
