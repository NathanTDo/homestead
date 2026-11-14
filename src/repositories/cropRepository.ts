import { supabase } from '@/services/supabase/client';
import type { CropStatus, FarmCrop } from '@/types';

export async function listCrops(farmId: string, statuses?: CropStatus[]): Promise<FarmCrop[]> {
  let request = supabase.from('farm_crops').select('*').eq('farm_id', farmId).order('created_at');
  if (statuses?.length) request = request.in('status', statuses);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

/** The database rejects the insert if the farm already has 5 planned/active crops. */
export async function createCrop(farmId: string, plantId: string): Promise<FarmCrop> {
  const { data, error } = await supabase
    .from('farm_crops')
    .insert({ farm_id: farmId, plant_id: plantId, status: 'planned' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCrop(
  cropId: string,
  updates: Partial<
    Pick<FarmCrop, 'template_id' | 'planting_date' | 'selected_template_version' | 'status'>
  >,
): Promise<FarmCrop> {
  const { data, error } = await supabase
    .from('farm_crops')
    .update(updates)
    .eq('id', cropId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Soft delete: crops are archived, never deleted, so task history is preserved. */
export function archiveCrop(cropId: string): Promise<FarmCrop> {
  return updateCrop(cropId, { status: 'archived' });
}
