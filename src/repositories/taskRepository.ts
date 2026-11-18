import { supabase } from '@/services/supabase/client';
import type { CalendarTask, GrowingTask } from '@/types';
import { monthRange, type MonthRef } from '@/features/calendar/logic';

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

const CALENDAR_COLUMNS =
  'id, task_type, title, description, scheduled_date, completed_at, farm_crop_id, farm_crops!inner(id, plant_id, status, plants!inner(name))';

interface CalendarRow {
  id: string;
  task_type: CalendarTask['task_type'];
  title: string;
  description: string | null;
  scheduled_date: string;
  completed_at: string | null;
  farm_crop_id: string;
  farm_crops: { plant_id: string; plants: { name: string } };
}

function toCalendarTask(row: CalendarRow): CalendarTask {
  return {
    id: row.id,
    task_type: row.task_type,
    title: row.title,
    description: row.description,
    scheduled_date: row.scheduled_date,
    completed_at: row.completed_at,
    farm_crop_id: row.farm_crop_id,
    plant_id: row.farm_crops.plant_id,
    plant_name: row.farm_crops.plants.name,
  };
}

/**
 * Tasks scheduled in a month, with plant names, optionally for one plant. Tasks of archived
 * (removed) crops are left out. They stay in the database as history.
 */
export async function getTasksForMonth(
  month: MonthRef,
  plantId?: string | null,
): Promise<CalendarTask[]> {
  const { from, to } = monthRange(month);
  let request = supabase
    .from('growing_tasks')
    .select(CALENDAR_COLUMNS)
    .gte('scheduled_date', from)
    .lt('scheduled_date', to)
    .neq('farm_crops.status', 'archived')
    .order('scheduled_date')
    .order('created_at');
  if (plantId) request = request.eq('farm_crops.plant_id', plantId);
  const { data, error } = await request;
  if (error) throw error;
  return (data as unknown as CalendarRow[]).map(toCalendarTask);
}

/** One task with its plant name, or null if it does not exist or is not visible to the user. */
export async function getTaskById(taskId: string): Promise<CalendarTask | null> {
  const { data, error } = await supabase
    .from('growing_tasks')
    .select(CALENDAR_COLUMNS)
    .eq('id', taskId)
    .maybeSingle();
  if (error) throw error;
  return data ? toCalendarTask(data as unknown as CalendarRow) : null;
}

export function completeTask(taskId: string): Promise<GrowingTask> {
  return setTaskCompleted(taskId, true);
}

export function uncompleteTask(taskId: string): Promise<GrowingTask> {
  return setTaskCompleted(taskId, false);
}
