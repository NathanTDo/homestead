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
