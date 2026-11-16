import type { Plant } from '@/types';

/** Case-insensitive partial match on the plant name. An empty query returns every plant. */
export function filterPlants(plants: readonly Plant[], query: string): Plant[] {
  const term = query.trim().toLowerCase();
  if (!term) return [...plants];
  return plants.filter((plant) => plant.name.toLowerCase().includes(term));
}
