import { useMemo } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import * as taskRepository from '@/repositories/taskRepository';
import { groupTasksByDate, type MonthRef } from './logic';

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useTask(taskId: string) {
  return useAsyncData(
    // An id that is not a UUID can never match, so skip the request.
    () => (UUID.test(taskId) ? taskRepository.getTaskById(taskId) : Promise.resolve(null)),
    `task:${taskId}`,
  );
}
