import { supabase } from '@/services/supabase/client';
import type { PlantWateringGuideline } from '@/types';

/** The warm, mild and cool watering guidelines for the given plants. */
export async function listGuidelines(plantIds: string[]): Promise<PlantWateringGuideline[]> {
  if (plantIds.length === 0) return [];
  const { data, error } = await supabase
    .from('plant_watering_guidelines')
    .select('*')
    .in('plant_id', plantIds);
  if (error) throw error;
  return data;
}
