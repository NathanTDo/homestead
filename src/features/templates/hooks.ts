import { useMemo } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import * as templateRepository from '@/repositories/templateRepository';
import { latestPerSeason } from './logic';

/** Active templates for a plant, one per season, in calendar order. */
export function useTemplates(plantId: string | null) {
  const { data, loading, error, offline, reload } = useAsyncData(
    () => (plantId ? templateRepository.getActiveTemplates(plantId) : Promise.resolve([])),
    `templates:${plantId}`,
  );
  const templates = useMemo(() => (data ? latestPerSeason(data) : []), [data]);
  return { templates, loading, error, offline, reload };
}
