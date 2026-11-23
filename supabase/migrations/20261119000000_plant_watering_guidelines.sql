-- Weather-based watering guidance per plant (warm / mild / cool). Catalog table:
-- authenticated users can read, writes go through the service role only.
CREATE TABLE plant_watering_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  weather TEXT NOT NULL CHECK (weather IN ('warm', 'mild', 'cool')),
  min_interval_days INTEGER NOT NULL CHECK (min_interval_days >= 1),
  max_interval_days INTEGER NOT NULL CHECK (max_interval_days >= min_interval_days),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plant_id, weather)
);
CREATE INDEX idx_plant_watering_guidelines_plant_id ON plant_watering_guidelines (plant_id);
ALTER TABLE plant_watering_guidelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read watering guidelines" ON plant_watering_guidelines
  FOR SELECT TO authenticated USING (true);
