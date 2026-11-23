import { useMemo } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import * as taskRepository from '@/repositories/taskRepository';
import { buildHarvestWindows, groupTasksByDate, type MonthRef } from './logic';

/** Tasks for the displayed month, optionally for one plant, grouped by date. */
export function useCalendarTasks(month: MonthRef, plantId: string | null) {
  const { data, loading, error, offline, reload, refresh } = useAsyncData(
    () => taskRepository.getTasksForMonth(month, plantId),
    `tasks:${month.year}-${month.month}:${plantId ?? 'all'}`,
  );
  const tasks = useMemo(() => data ?? [], [data]);
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  return { tasks, tasksByDate, loading, error, offline, reload, refresh };
}

/**
 * Harvest windows for the calendar's bar, optionally for one plant. They do not depend on the
 * displayed month, so a window that crosses months is drawn in each. A failed request just
 * means no bar is drawn on the calendar. The harvest window screen uses `loading` and `error`.
 */
export function useHarvestWindows(plantId: string | null) {
  const { data, loading, error, offline, reload, refresh } = useAsyncData(
    () => taskRepository.getHarvestTasks(plantId),
    `harvest:${plantId ?? 'all'}`,
  );
  const windows = useMemo(() => buildHarvestWindows(data ?? []), [data]);
  return { windows, loading, error, offline, reload, refresh };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useTask(taskId: string) {
  return useAsyncData(
    // An id that is not a UUID can never match, so skip the request.
    () => (UUID.test(taskId) ? taskRepository.getTaskById(taskId) : Promise.resolve(null)),
    `task:${taskId}`,
  );
}
