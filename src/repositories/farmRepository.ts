import { supabase } from '@/services/supabase/client';
import type { Farm, OnboardingData } from '@/types';

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

/**
 * Creates the user's farm, adds them as owner, and marks onboarding complete, all in one
 * database transaction. The user is taken from the session, never from the client.
 * Throws an Error whose message is one of: not_authenticated, invalid_farm_name,
 * invalid_onboarding_data, profile_not_found, already_onboarded.
 */
export async function createFarmWithMember(
  name: string,
  onboardingData: OnboardingData,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_farm_with_member', {
    p_farm_name: name,
    p_onboarding_data: onboardingData,
  });
  if (error) throw new Error(error.message);
  return data as string;
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
