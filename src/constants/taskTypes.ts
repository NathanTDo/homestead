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

/** Every important milestone is green: planting, germination, maturity and the harvest window. */
const MILESTONE_GREEN = '#22C55E';
const WATERING_BLUE = '#3B82F6';
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  milestone: MILESTONE_GREEN,
  harvest: MILESTONE_GREEN,
  maintenance: '#F97316', // orange
  other: '#9CA3AF', // gray
};
/** Task types that stand out from the color of their category. */
const TASK_TYPE_COLORS: Partial<Record<TaskType, string>> = {
  watering: WATERING_BLUE,
};
/** The color of the bar that marks harvest windows on the calendar. */
export const HARVEST_BAR_COLOR = CATEGORY_COLORS.harvest;

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
  return TASK_TYPE_COLORS[type] ?? CATEGORY_COLORS[TASK_CATEGORY[type]];
}

/** Maintenance tasks can be ticked off by the user. Milestones are dates to watch for. */
export function canCompleteTask(type: TaskType): boolean {
  const category = TASK_CATEGORY[type];
  return category === 'maintenance' || category === 'other';
}
