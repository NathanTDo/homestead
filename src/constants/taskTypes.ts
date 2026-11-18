import type { TaskType } from '@/types';

export type TaskCategory = 'milestone' | 'harvest' | 'maintenance' | 'other';

export const TASK_CATEGORY: Record<TaskType, TaskCategory> = {
  planting: 'milestone',
  germination: 'milestone',
  transplanting: 'milestone',
  maturity: 'milestone',
  harvest_start: 'harvest',
  harvest_end: 'harvest',
  watering: 'maintenance',
  fertilizing: 'maintenance',
  pruning: 'maintenance',
  pest_inspection: 'maintenance',
  other: 'other',
};

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  milestone: '#2563EB', // blue
  harvest: '#16A34A', // green
  maintenance: '#EA580C', // orange
  other: '#6B7280', // gray
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  milestone: 'Growing milestone',
  harvest: 'Harvest',
  maintenance: 'Maintenance',
  other: 'Other',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  planting: 'Planting',
  germination: 'Germination',
  transplanting: 'Transplanting',
  maturity: 'Maturity',
  harvest_start: 'Harvest window begins',
  harvest_end: 'Harvest window ends',
  watering: 'Watering',
  fertilizing: 'Fertilizing',
  pruning: 'Pruning',
  pest_inspection: 'Pest inspection',
  other: 'Other',
};

/** What a milestone means, for task types that have no description of their own. */
export const TASK_TYPE_HELP: Partial<Record<TaskType, string>> = {
  planting: 'The day to plant this crop.',
  germination: 'Seedlings are expected to sprout around this date.',
  transplanting: 'Time to move seedlings to their final spot.',
  maturity: 'The crop is expected to be fully grown around this date.',
  harvest_start: 'The harvest window opens. Start checking for ripe produce.',
  harvest_end: 'The harvest window closes. Pick what is left.',
};

export function getTaskColor(type: TaskType): string {
  return CATEGORY_COLORS[TASK_CATEGORY[type]];
}

/** Maintenance tasks can be ticked off by the user. Milestones are dates to watch for. */
export function canCompleteTask(type: TaskType): boolean {
  const category = TASK_CATEGORY[type];
  return category === 'maintenance' || category === 'other';
}
