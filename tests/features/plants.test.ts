import { filterPlants } from '../../src/features/plants/filter';
import { getPlantImage, getTileColor } from '../../src/utils/images';
import type { Plant } from '../../src/types';

const plant = (name: string): Plant => ({
  id: name,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  description: null,
  image_url: name.toLowerCase().replace(/\s+/g, '-'),
  created_at: '',
});
const plants = ['Garlic', 'Bok Choy', 'Kale', 'Kohlrabi', 'Crown Daisy'].map(plant);

describe('filterPlants', () => {
  it('returns every plant for an empty or blank query', () => {
    expect(filterPlants(plants, '')).toHaveLength(5);
    expect(filterPlants(plants, '   ')).toHaveLength(5);
  });
  it('matches case-insensitively on part of the name', () => {
    expect(filterPlants(plants, 'KA').map((p) => p.name)).toEqual(['Kale']);
    expect(filterPlants(plants, 'o').map((p) => p.name)).toEqual([
      'Bok Choy',
      'Kohlrabi',
      'Crown Daisy',
    ]);
  });
  it('matches across a space and trims the query', () => {
    expect(filterPlants(plants, ' bok c ').map((p) => p.name)).toEqual(['Bok Choy']);
  });
  it('returns an empty list when nothing matches', () => {
    expect(filterPlants(plants, 'zzz')).toEqual([]);
  });
  it('treats special characters literally', () => {
    expect(filterPlants(plants, '%')).toEqual([]);
    expect(filterPlants(plants, '.*')).toEqual([]);
  });
  it('does not modify the input list', () => {
    const copy = [...plants];
    filterPlants(plants, 'k');
    expect(plants).toEqual(copy);
  });
});

describe('plant images', () => {
  it('returns null (so a tile is shown) when there is no bundled image', () => {
    expect(getPlantImage('garlic')).toBeNull();
    expect(getPlantImage(null)).toBeNull();
    expect(getPlantImage('')).toBeNull();
    expect(getPlantImage('toString')).toBeNull();
    expect(getPlantImage('__proto__')).toBeNull();
  });
  it('picks a stable color for the same key', () => {
    expect(getTileColor('kale')).toBe(getTileColor('kale'));
    expect(getTileColor('kale')).toMatch(/^#[0-9a-f]{6}$/);
  });
});
