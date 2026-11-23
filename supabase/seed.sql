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
-- ---------------------------------------------------------------------------
-- Weather-based watering guidelines (general horticultural guidance, compiled from
-- ChatGPT research; not yet verified against a local extension service).
-- Weather: warm (above ~75°F / 24°C), mild (~60-75°F / 15-24°C), cool (below ~60°F / 15°C).
-- Intervals are in days between waterings and assume no meaningful rain; check that the
-- top inch of soil is dry first. Columns: slug, weather, min days, max days, notes.
-- ---------------------------------------------------------------------------
WITH guideline_data (slug, weather, min_days, max_days, notes) AS (
  VALUES
    ('garlic',      'warm', 3, 4, 'Bulbs are sizing up, so keep soil evenly moist. Stop watering 2 weeks before harvest.'),
    ('garlic',      'mild', 4, 7, 'Water when the top inch of soil is dry.'),
    ('garlic',      'cool', 7, 10, 'Mostly dormant. Water only during dry spells and avoid soggy soil.'),
    ('peas',        'warm', 1, 2, 'Peas stall in heat. Mulch and keep soil evenly moist, especially at flowering and pod fill.'),
    ('peas',        'mild', 2, 3, 'Keep soil consistently moist, not wet.'),
    ('peas',        'cool', 3, 5, 'Depends on rainfall. Avoid waterlogged soil, which causes rot.'),
    ('bok-choy',    'warm', 1, 2, 'Dry spells cause bolting and bitter leaves. Mulch to hold moisture.'),
    ('bok-choy',    'mild', 2, 3, 'Keep soil evenly moist.'),
    ('bok-choy',    'cool', 3, 4, 'Water less often, depending on rainfall and drainage.'),
    ('lettuce',     'warm', 1, 2, 'Shallow roots dry out fast. Water daily if needed and shade in afternoon heat.'),
    ('lettuce',     'mild', 2, 3, 'Keep the top inch of soil moist.'),
    ('lettuce',     'cool', 3, 4, 'Slow growth means less water. Avoid wet leaves in cold weather.'),
    ('arugula',     'warm', 1, 2, 'Heat and dry soil make it bolt and turn very peppery. Keep soil moist.'),
    ('arugula',     'mild', 2, 3, 'Water regularly for tender leaves.'),
    ('arugula',     'cool', 3, 5, 'Water only when the top of the soil is dry.'),
    ('spinach',     'warm', 1, 2, 'Bolts quickly in heat. Keep soil cool and moist with mulch.'),
    ('spinach',     'mild', 2, 3, 'Keep soil evenly moist.'),
    ('spinach',     'cool', 3, 5, 'Tolerates cold. Water based on rainfall and soil dryness.'),
    ('celtuce',     'warm', 1, 2, 'Uneven watering makes the stem woody or bitter. Keep moisture steady.'),
    ('celtuce',     'mild', 2, 3, 'Water deeply and evenly.'),
    ('celtuce',     'cool', 3, 5, 'Water when the soil surface is dry.'),
    ('gai-lan',     'warm', 1, 2, 'Keep soil moist for tender stems. Mulch to reduce evaporation.'),
    ('gai-lan',     'mild', 2, 3, 'Water evenly.'),
    ('gai-lan',     'cool', 3, 5, 'Depends on rainfall and soil conditions.'),
    ('chives',      'warm', 2, 3, 'Water regularly. Established clumps tolerate short dry periods.'),
    ('chives',      'mild', 3, 4, 'Water when the top inch of soil is dry.'),
    ('chives',      'cool', 5, 7, 'Growth slows or goes dormant. Water sparingly.'),
    ('radish',      'warm', 1, 2, 'Irregular watering causes split, woody or very hot roots. Keep soil evenly moist.'),
    ('radish',      'mild', 2, 3, 'Keep soil evenly moist.'),
    ('radish',      'cool', 3, 4, 'Water lightly, depending on rainfall.'),
    ('daikon',      'warm', 1, 2, 'Deep, even moisture prevents cracked or forked roots.'),
    ('daikon',      'mild', 2, 3, 'Water deeply and evenly.'),
    ('daikon',      'cool', 3, 5, 'Water deeply but less often. Avoid waterlogged soil.'),
    ('kale',        'warm', 2, 3, 'Water deeply. Mulch to keep roots cool and leaves from turning tough.'),
    ('kale',        'mild', 3, 4, 'Water when the top inch of soil is dry.'),
    ('kale',        'cool', 4, 7, 'Hardy in cold. Water only when the soil is dry, depending on rainfall.'),
    ('cilantro',    'warm', 1, 2, 'Bolts fast in heat. Keep soil moist and give afternoon shade.'),
    ('cilantro',    'mild', 2, 3, 'Keep soil lightly and evenly moist.'),
    ('cilantro',    'cool', 3, 5, 'Water when the soil surface is dry.'),
    ('crown-daisy', 'warm', 1, 2, 'Keep soil moist to delay bolting and keep leaves tender.'),
    ('crown-daisy', 'mild', 2, 3, 'Water evenly.'),
    ('crown-daisy', 'cool', 3, 5, 'Water based on rainfall and how quickly the soil dries.'),
    ('kohlrabi',    'warm', 1, 2, 'Steady moisture keeps the swollen stem tender and prevents splitting.'),
    ('kohlrabi',    'mild', 2, 3, 'Water evenly.'),
    ('kohlrabi',    'cool', 3, 5, 'Depends on rainfall and soil conditions.')
)
INSERT INTO plant_watering_guidelines (plant_id, weather, min_interval_days, max_interval_days, notes)
SELECT p.id, g.weather, g.min_days, g.max_days, g.notes
FROM guideline_data g
JOIN plants p ON p.slug = g.slug
ON CONFLICT (plant_id, weather) DO NOTHING;
