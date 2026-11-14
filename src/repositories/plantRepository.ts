import { supabase } from '@/services/supabase/client';
import type { Plant } from '@/types';

/** Lists the catalog, optionally filtered by a name search. */
export async function searchPlants(query?: string): Promise<Plant[]> {
  let request = supabase.from('plants').select('*').order('name');
  const term = query?.trim();
  if (term) {
    // Escape LIKE wildcards so user input is matched literally.
    const escaped = term.replace(/[\\%_]/g, (c) => `\\${c}`);
    request = request.ilike('name', `%${escaped}%`);
  }
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function getPlantBySlug(slug: string): Promise<Plant | null> {
  const { data, error } = await supabase.from('plants').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}
