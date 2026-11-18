import { supabase } from '@/services/supabase/client';
import type { GrowingTemplateWithRules } from '@/types';

/** Active templates for a plant, with their care rules. */
export async function getActiveTemplates(plantId: string): Promise<GrowingTemplateWithRules[]> {
  const { data, error } = await supabase
    .from('growing_templates')
    .select('*, care_rules(*)')
    .eq('plant_id', plantId)
    .eq('is_active', true)
    .order('season');
  if (error) throw error;
  return data as GrowingTemplateWithRules[];
}
