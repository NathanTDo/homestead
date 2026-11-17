// Builds a crop's task schedule from a growing template and its care rules.
// Pure functions, no database or network access.
import { addDays, type IsoDate } from './dates.ts';

export type ActivityType = 'watering' | 'fertilizing' | 'pruning' | 'pest_inspection' | 'other';
export type TaskType =
  | 'planting'
  | 'germination'
  | 'transplanting'
  | 'maturity'
  | 'harvest_start'
  | 'harvest_end'
  | ActivityType;

export interface TemplateInput {
  germination_days: number | null;
  maturity_days: number | null;
  harvest_start_days: number | null;
  harvest_end_days: number | null;
}

export interface CareRuleInput {
  activity_type: ActivityType;
  description: string | null;
  start_day: number;
  /** null means a one-time task on start_day. */
  interval_days: number | null;
  end_day: number;
}

export interface ScheduledTask {
  farm_crop_id: string;
  task_type: TaskType;
  title: string;
  description: string | null;
  scheduled_date: IsoDate;
  /** `{farm_crop_id}:{task_type}:{scheduled_date}`, unique per task. */
  generation_key: string;
}

/** Most tasks one crop can get. Guards against runaway rules, and matches generate_tasks. */
export const MAX_TASKS_PER_CROP = 2000;

export class ScheduleError extends Error {}

export function buildGenerationKey(
  farmCropId: string,
  taskType: TaskType,
  scheduledDate: IsoDate,
): string {
  return `${farmCropId}:${taskType}:${scheduledDate}`;
}

/** "pest_inspection" -> "Pest inspection" */
export function activityTitle(activityType: ActivityType): string {
  const text = activityType.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface Candidate {
  task_type: TaskType;
  title: string;
  description: string | null;
  day: number;
}

/** Milestones are planting plus any template date that is set. A missing value is skipped. */
function milestoneCandidates(template: TemplateInput): Candidate[] {
  const milestones: [TaskType, string, number | null][] = [
    ['planting', 'Planting', 0],
    ['germination', 'Germination', template.germination_days],
    ['maturity', 'Expected maturity', template.maturity_days],
    ['harvest_start', 'Harvest window begins', template.harvest_start_days],
    ['harvest_end', 'Harvest window ends', template.harvest_end_days],
  ];
  return milestones
    .filter((m): m is [TaskType, string, number] => m[2] !== null)
    .map(([task_type, title, day]) => ({ task_type, title, description: null, day }));
}

/** Recurring rules repeat every `interval_days` from start_day to end_day. One-time rules run once on start_day. */
function careRuleCandidates(rule: CareRuleInput): Candidate[] {
  const base = {
    task_type: rule.activity_type,
    title: activityTitle(rule.activity_type),
    description: rule.description,
  };
  if (rule.interval_days === null) {
    return [{ ...base, day: rule.start_day }];
  }
  if (!Number.isInteger(rule.interval_days) || rule.interval_days < 1) {
    throw new ScheduleError(`Care rule interval must be a whole number of at least 1 day`);
  }
  const candidates: Candidate[] = [];
  for (let day = rule.start_day; day <= rule.end_day; day += rule.interval_days) {
    candidates.push({ ...base, day });
    if (candidates.length > MAX_TASKS_PER_CROP) {
      throw new ScheduleError('Schedule has too many tasks');
    }
  }
  return candidates;
}

/**
 * All tasks for a crop planted on `plantingDate`, sorted by date. Two tasks with the same
 * type on the same day collapse into one, because they would share a generation key.
 */
export function buildSchedule(
  farmCropId: string,
  plantingDate: IsoDate,
  template: TemplateInput,
  careRules: readonly CareRuleInput[],
): ScheduledTask[] {
  const candidates = [
    ...milestoneCandidates(template),
    ...careRules.flatMap((rule) => careRuleCandidates(rule)),
  ];

  const byKey = new Map<string, ScheduledTask>();
  for (const candidate of candidates) {
    const scheduled_date = addDays(plantingDate, candidate.day);
    const generation_key = buildGenerationKey(farmCropId, candidate.task_type, scheduled_date);
    if (!byKey.has(generation_key)) {
      byKey.set(generation_key, {
        farm_crop_id: farmCropId,
        task_type: candidate.task_type,
        title: candidate.title,
        description: candidate.description,
        scheduled_date,
        generation_key,
      });
    }
  }

  const tasks = [...byKey.values()].sort(
    (a, b) =>
      a.scheduled_date.localeCompare(b.scheduled_date) || a.task_type.localeCompare(b.task_type),
  );
  if (tasks.length > MAX_TASKS_PER_CROP) {
    throw new ScheduleError('Schedule has too many tasks');
  }
  return tasks;
}
