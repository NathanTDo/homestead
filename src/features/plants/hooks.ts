import { useMemo } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import * as plantRepository from '@/repositories/plantRepository';
import { filterPlants } from './filter';

/** The plant catalog, filtered by name. The full list loads once and is filtered locally. */
export function usePlants(searchQuery: string) {
  const { data, loading, error, reload } = useAsyncData(
    () => plantRepository.searchPlants(),
    'plants',
  );
  const plants = useMemo(() => (data ? filterPlants(data, searchQuery) : []), [data, searchQuery]);
  return { plants, totalCount: data?.length ?? 0, loading, error, reload };
}

export function usePlant(slug: string) {
  return useAsyncData(() => plantRepository.getPlantBySlug(slug), `plant:${slug}`);
}
