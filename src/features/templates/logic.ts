import { addDays, formatDate, type IsoDate } from '@/utils/dates';
import type { GrowingTemplateWithRules, Season } from '@/types';

const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter'];

/** One template per season (the highest version), in calendar order. */
export function latestPerSeason(templates: readonly GrowingTemplateWithRules[]) {
  const latest = new Map<Season, GrowingTemplateWithRules>();
  for (const template of templates) {
    const current = latest.get(template.season);
    if (!current || template.version > current.version) latest.set(template.season, template);
  }
  return [...latest.values()].sort(
    (a, b) => SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season),
  );
}

function days(count: number | null): string | null {
  if (count === null) return null;
  return count === 1 ? '1 day' : `${count} days`;
}

/** Short lines describing a template, skipping values it doesn't have. */
export function describeTemplate(template: GrowingTemplateWithRules): string[] {
  const lines: string[] = [];
  const germination = days(template.germination_days);
  const maturity = days(template.maturity_days);
  if (germination) lines.push(`Germination: ${germination}`);
  if (maturity) lines.push(`Maturity: ${maturity}`);
  const { harvest_start_days: start, harvest_end_days: end } = template;
  if (start !== null && end !== null) lines.push(`Harvest window: day ${start} to day ${end}`);
  else if (start !== null) lines.push(`Harvest starts: day ${start}`);
  return lines;
}

/** The harvest window as dates for a planting date, or null if the template has none. */
export function harvestWindowText(
  template: GrowingTemplateWithRules,
  plantingDate: IsoDate,
): string | null {
  const { harvest_start_days: start, harvest_end_days: end } = template;
  if (start === null) return null;
  const from = formatDate(addDays(plantingDate, start));
  return end === null
    ? `Harvest from ${from}`
    : `Harvest ${from} to ${formatDate(addDays(plantingDate, end))}`;
}

const SCHEDULE_ERROR_MESSAGES: Record<string, string> = {
  crop_not_ready: 'Choose a season and a planting date first.',
  invalid_template: 'That season is not available for this plant. Choose another.',
  crop_archived: 'This crop was removed from your farm.',
  crop_not_found: 'We could not find this crop on your farm.',
  unauthenticated: 'Your session expired. Sign in again.',
  invalid_schedule: 'We could not build a schedule from this template.',
};

/** Turns a generate-schedule error code (or a network failure) into a message for the user. */
export function describeScheduleError(code: string | null | undefined): string {
  if (code && SCHEDULE_ERROR_MESSAGES[code]) return SCHEDULE_ERROR_MESSAGES[code];
  if (code === 'network') return 'Could not reach the server. Check your connection and try again.';
  return 'Could not create the schedule. Try again.';
}
