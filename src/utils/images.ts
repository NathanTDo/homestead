import type { ImageSourcePropType } from 'react-native';

/**
 * Maps a plant's `image_url` key (from the database) to a bundled image.
 * To use a real photo, add the file to assets/images/ and a line here, for example:
 *   garlic: require('../../assets/images/garlic.png'),
 * Plants without an entry show a colored tile with the plant's first letter instead.
 */
const plantImages: Record<string, ImageSourcePropType> = {};

export function getPlantImage(imageKey: string | null | undefined): ImageSourcePropType | null {
  if (!imageKey) return null;
  return Object.prototype.hasOwnProperty.call(plantImages, imageKey) ? plantImages[imageKey] : null;
}

const TILE_COLORS = [
  '#2f7d32',
  '#558b2f',
  '#00796b',
  '#6d4c41',
  '#8d6e63',
  '#827717',
  '#33691e',
  '#4e342e',
] as const;

/** A stable tile color for a plant, so the same plant always looks the same. */
export function getTileColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TILE_COLORS[hash % TILE_COLORS.length];
}
