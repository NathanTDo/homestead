import { supabase } from '@/services/supabase/client';
import type { GrowingTask } from '@/types';

export async function listTasks(options: {
  farmCropId?: string;
  from?: string;
  to?: string;
}): Promise<GrowingTask[]> {
  let request = supabase.from('growing_tasks').select('*').order('scheduled_date');
  if (options.farmCropId) request = request.eq('farm_crop_id', options.farmCropId);
  if (options.from) request = request.gte('scheduled_date', options.from);
  if (options.to) request = request.lte('scheduled_date', options.to);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function setTaskCompleted(taskId: string, completed: boolean): Promise<GrowingTask> {
  const { data, error } = await supabase
    .from('growing_tasks')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
