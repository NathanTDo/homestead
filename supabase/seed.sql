-- Supabase seed file: initial plant catalog (15 plants).
-- image_url holds a key that the app maps to a bundled asset.

INSERT INTO plants (name, slug, description, image_url) VALUES
  ('Garlic', 'garlic', 'A hardy bulb plant grown for its flavorful cloves.', 'garlic'),
  ('Peas', 'peas', 'Cool-season legume producing edible pods and seeds.', 'peas'),
  ('Bok Choy', 'bok-choy', 'Chinese cabbage with crisp stems and dark green leaves.', 'bok-choy'),
  ('Lettuce', 'lettuce', 'Fast-growing leafy green that thrives in cool weather.', 'lettuce'),
  ('Arugula', 'arugula', 'Peppery salad green that matures quickly from seed.', 'arugula'),
  ('Spinach', 'spinach', 'Nutrient-rich leafy green that prefers cool temperatures.', 'spinach'),
  ('Celtuce', 'celtuce', 'Stem lettuce grown for its crisp, mild-flavored stalk and leaves.', 'celtuce'),
  ('Gai Lan', 'gai-lan', 'Chinese broccoli with thick stems, glossy leaves, and a slightly bitter taste.', 'gai-lan'),
  ('Chives', 'chives', 'Perennial herb with mild onion-flavored hollow leaves.', 'chives'),
  ('Radish', 'radish', 'Quick-growing root vegetable with a crisp, peppery bite.', 'radish'),
  ('Daikon', 'daikon', 'Large, mild white radish popular in East Asian cooking.', 'daikon'),
  ('Kale', 'kale', 'Hardy, frost-tolerant leafy green with sturdy curly or flat leaves.', 'kale'),
  ('Cilantro', 'cilantro', 'Fast-growing herb with fragrant leaves; its seeds are coriander.', 'cilantro'),
  ('Crown Daisy', 'crown-daisy', 'Edible chrysanthemum leaf green with a distinctive herbal flavor.', 'crown-daisy'),
  ('Kohlrabi', 'kohlrabi', 'A brassica with a swollen stem that has a mild, turnip-like flavor.', 'kohlrabi')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Growing templates and care rules.
-- ALL VALUES ARE ILLUSTRATIVE PLACEHOLDERS pending agricultural verification
-- (see source_reference). Do not treat them as growing advice.
-- Columns: slug, season, germination, maturity, harvest start, harvest end (days after
-- planting), watering every N days, first fertilizing day, fertilizing every N days.
-- ---------------------------------------------------------------------------
WITH template_data (slug, season, germ, maturity, harvest_start, harvest_end, water_every, fert_start, fert_every) AS (
  VALUES
    ('garlic',      'fall',   14, 240, 240, 260, 7, 30, 30),
    ('peas',        'spring', 10,  60,  60,  75, 3, 21, 21),
    ('bok-choy',    'spring',  5,  45,  45,  60, 2, 14, 14),
    ('bok-choy',    'fall',    5,  45,  45,  60, 2, 14, 14),
    ('lettuce',     'spring',  7,  50,  50,  65, 2, 14, 14),
    ('lettuce',     'fall',    7,  50,  50,  65, 2, 14, 14),
    ('arugula',     'spring',  5,  40,  40,  55, 2, 14, 14),
    ('arugula',     'fall',    5,  40,  40,  55, 2, 14, 14),
    ('spinach',     'spring',  7,  45,  45,  60, 2, 14, 14),
    ('spinach',     'fall',    7,  45,  45,  60, 2, 14, 14),
    ('celtuce',     'spring',  7,  80,  80,  95, 3, 21, 21),
    ('gai-lan',     'fall',    5,  50,  50,  65, 2, 14, 14),
    ('chives',      'spring', 14,  90,  90, 180, 4, 30, 30),
    ('radish',      'spring',  4,  28,  28,  40, 2, 14, 14),
    ('radish',      'fall',    4,  28,  28,  40, 2, 14, 14),
    ('daikon',      'fall',    5,  60,  60,  80, 3, 21, 21),
    ('kale',        'spring',  7,  60,  60, 100, 3, 21, 21),
    ('kale',        'fall',    7,  60,  60, 100, 3, 21, 21),
    ('cilantro',    'spring', 10,  45,  45,  60, 2, 14, 14),
    ('crown-daisy', 'spring',  7,  45,  45,  60, 2, 14, 14),
    ('crown-daisy', 'fall',    7,  45,  45,  60, 2, 14, 14),
    ('kohlrabi',    'spring',  7,  55,  55,  70, 3, 21, 21)
),
inserted_templates AS (
  INSERT INTO growing_templates
    (plant_id, version, season, germination_days, maturity_days, harvest_start_days,
     harvest_end_days, source_reference, is_active)
  SELECT p.id, 1, d.season, d.germ, d.maturity, d.harvest_start, d.harvest_end,
         'Illustrative data — pending verification', true
  FROM template_data d
  JOIN plants p ON p.slug = d.slug
  ON CONFLICT (plant_id, season, version) DO NOTHING
  RETURNING id, plant_id, season
)
INSERT INTO care_rules (template_id, activity_type, description, start_day, interval_days, end_day)
SELECT t.id, r.activity_type, r.description, r.start_day, r.interval_days, r.end_day
FROM inserted_templates t
JOIN plants p ON p.id = t.plant_id
JOIN template_data d ON d.slug = p.slug AND d.season = t.season
CROSS JOIN LATERAL (
  VALUES
    ('watering',    'Water the plants',     0,            d.water_every, d.harvest_end),
    ('fertilizing', 'Apply fertilizer',     d.fert_start, d.fert_every,  d.maturity)
) AS r (activity_type, description, start_day, interval_days, end_day);
