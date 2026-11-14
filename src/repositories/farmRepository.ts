import { supabase } from '@/services/supabase/client';
import type { Farm } from '@/types';

export interface CreateFarmInput {
  name: string;
  location?: string | null;
  farming_method?: string;
}

export async function listFarms(): Promise<Farm[]> {
  const { data, error } = await supabase.from('farms').select('*').order('created_at');
  if (error) throw error;
  return data;
}

export async function getFarm(farmId: string): Promise<Farm | null> {
  const { data, error } = await supabase.from('farms').select('*').eq('id', farmId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Creates the farm and the creator's owner membership. */
export async function createFarm(userId: string, input: CreateFarmInput): Promise<Farm> {
  const { data: farm, error } = await supabase
    .from('farms')
    .insert({ ...input, created_by: userId })
    .select()
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase
    .from('farm_members')
    .insert({ farm_id: farm.id, user_id: userId, role: 'owner' });
  if (memberError) throw memberError;

  return farm;
}

export async function updateFarm(farmId: string, updates: Partial<CreateFarmInput>): Promise<Farm> {
  const { data, error } = await supabase
    .from('farms')
    .update(updates)
    .eq('id', farmId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
