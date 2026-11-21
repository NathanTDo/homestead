import * as cropRepository from '../../src/repositories/cropRepository';
import * as taskRepository from '../../src/repositories/taskRepository';
import * as templateRepository from '../../src/repositories/templateRepository';
import { generateSchedule } from '../../src/repositories/scheduleRepository';
import { addDays } from '../../src/utils/dates';
import {
  as,
  createAdminClient,
  createTestFarm,
  getPlant,
  getTemplate,
  isFunctionServed,
  useTestData,
  type TemplateRow,
} from './helpers/testData';
import { getEnv } from './helpers/env';

const PLANTING_DATE = '2025-03-01';

/** How many tasks a care rule makes, worked out from the rule's own numbers. */
function expectedCount(rule: TemplateRow['care_rules'][number]): number {
  if (rule.interval_days === null) return 1;
  if (rule.end_day < rule.start_day) return 0;
  return Math.floor((rule.end_day - rule.start_day) / rule.interval_days) + 1;
}

// REQ-003 and REQ-004: schedule generation through the real Edge Function.
describe('schedule generation', () => {
  const data = useTestData();
  const { admin } = data;

  beforeAll(async () => {
    if (!(await isFunctionServed())) {
      throw new Error(
        'The Edge Function is not running. Start it in another terminal with `supabase functions serve`.',
      );
    }
  });

  async function cropReadyFor(
    plantSlug: string,
    season: string,
    plantingDate: string | null = PLANTING_DATE,
  ) {
    const user = as(await data.createUser('schedule'));
    const { crops } = await createTestFarm(user, [plantSlug]);
    const crop = crops[0];
    const template = await getTemplate(admin, plantSlug, season);
    if (plantingDate) {
      await cropRepository.updateCropSchedule(crop.id, {
        templateId: template.id,
        templateVersion: template.version,
        plantingDate,
      });
    }
    return { user, crop, template };
  }

  it('creates the right milestone and maintenance tasks on the right dates', async () => {
    const { user, crop, template } = await cropReadyFor('lettuce', 'spring');
    const result = await generateSchedule(crop.id);

    const byType = (type: string) =>
      result.tasks.filter((t) => t.task_type === type).map((t) => t.scheduled_date);
    expect(byType('planting')).toEqual([PLANTING_DATE]);
    expect(byType('germination')).toEqual([addDays(PLANTING_DATE, template.germination_days)]);
    expect(byType('maturity')).toEqual([addDays(PLANTING_DATE, template.maturity_days)]);
    expect(byType('harvest_start')).toEqual([addDays(PLANTING_DATE, template.harvest_start_days)]);
    expect(byType('harvest_end')).toEqual([addDays(PLANTING_DATE, template.harvest_end_days)]);

    // Recurring tasks: first and last date, spacing, and count from each care rule.
    for (const rule of template.care_rules) {
      const dates = byType(rule.activity_type);
      expect(dates).toHaveLength(expectedCount(rule));
      expect(dates[0]).toBe(addDays(PLANTING_DATE, rule.start_day));
      if (rule.interval_days !== null) {
        dates.slice(1).forEach((date, i) => {
          expect(date).toBe(addDays(dates[i], rule.interval_days));
        });
        expect(dates[dates.length - 1] <= addDays(PLANTING_DATE, rule.end_day)).toBe(true);
      }
    }

    const milestones = 5;
    const maintenance = template.care_rules.reduce((sum, rule) => sum + expectedCount(rule), 0);
    expect(result.tasks).toHaveLength(milestones + maintenance);
    expect(result.created).toBe(milestones + maintenance);

    // Saved, with keys in the documented format, and visible on the calendar.
    const saved = await taskRepository.getTasksForMonth({ year: 2025, month: 3 });
    expect(saved.every((t) => t.farm_crop_id === crop.id)).toBe(true);
    const { data: rows } = await admin
      .from('growing_tasks')
      .select('task_type, scheduled_date, generation_key')
      .eq('farm_crop_id', crop.id);
    expect(rows).toHaveLength(result.tasks.length);
    for (const row of rows ?? []) {
      expect(row.generation_key).toBe(`${crop.id}:${row.task_type}:${row.scheduled_date}`);
    }
    expect(user.id).toBeTruthy();
  });

  it('activates the crop and records the template version', async () => {
    const { crop, template } = await cropReadyFor('lettuce', 'spring');
    const result = await generateSchedule(crop.id);
    expect(result).toMatchObject({ crop_status: 'active', template_version: template.version });
    const [updated] = await cropRepository.listCrops(await adminFarmId(crop.id));
    expect(updated).toMatchObject({
      status: 'active',
      selected_template_version: template.version,
    });
  });

  async function adminFarmId(cropId: string) {
    const { data: row } = await admin
      .from('farm_crops')
      .select('farm_id')
      .eq('id', cropId)
      .single();
    return row!.farm_id as string;
  }

  // REQ-004
  it('creates no duplicates when generation runs twice', async () => {
    const { crop } = await cropReadyFor('radish', 'spring');
    const first = await generateSchedule(crop.id);
    const countAfterFirst = (
      await admin
        .from('growing_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('farm_crop_id', crop.id)
    ).count;

    const second = await generateSchedule(crop.id);
    const countAfterSecond = (
      await admin
        .from('growing_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('farm_crop_id', crop.id)
    ).count;

    expect(second.created).toBe(0);
    expect(second.tasks).toHaveLength(first.tasks.length);
    expect(countAfterSecond).toBe(countAfterFirst);
    const { data: keys } = await admin
      .from('growing_tasks')
      .select('generation_key')
      .eq('farm_crop_id', crop.id);
    expect(new Set((keys ?? []).map((k) => k.generation_key)).size).toBe(keys?.length);
  });

  it('keeps completed tasks as they are when generation is requested again', async () => {
    const { crop } = await cropReadyFor('radish', 'fall');
    await generateSchedule(crop.id);
    const { data: task } = await admin
      .from('growing_tasks')
      .select('id')
      .eq('farm_crop_id', crop.id)
      .eq('task_type', 'watering')
      .limit(1)
      .single();
    await taskRepository.completeTask(task!.id);
    await generateSchedule(crop.id);
    const { data: after } = await admin
      .from('growing_tasks')
      .select('completed_at')
      .eq('id', task!.id)
      .single();
    expect(after!.completed_at).not.toBeNull();
  });

  it('builds the schedule across a month and year boundary', async () => {
    const { crop } = await cropReadyFor('lettuce', 'fall', '2024-12-20');
    const result = await generateSchedule(crop.id);
    const dates = result.tasks.map((t) => t.scheduled_date);
    expect(dates).toContain('2025-01-01');
    expect([...dates].sort()).toEqual(dates);
  });

  it('asks for a template and planting date first', async () => {
    const { crop } = await cropReadyFor('kale', 'spring', null);
    await expect(generateSchedule(crop.id)).rejects.toMatchObject({ code: 'crop_not_ready' });
    const { count } = await admin
      .from('growing_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('farm_crop_id', crop.id);
    expect(count).toBe(0);
  });

  it('rejects a template that belongs to a different plant', async () => {
    const { crop } = await cropReadyFor('kale', 'spring', null);
    const lettuce = await getTemplate(admin, 'lettuce', 'spring');
    await cropRepository.updateCropSchedule(crop.id, {
      templateId: lettuce.id,
      templateVersion: 1,
      plantingDate: PLANTING_DATE,
    });
    await expect(generateSchedule(crop.id)).rejects.toMatchObject({ code: 'invalid_template' });
    const status = await admin.from('farm_crops').select('status').eq('id', crop.id).single();
    expect(status.data?.status).toBe('planned');
  });

  it('rejects an inactive template', async () => {
    const { crop, template } = await cropReadyFor('daikon', 'fall');
    await admin.from('growing_templates').update({ is_active: false }).eq('id', template.id);
    try {
      await expect(generateSchedule(crop.id)).rejects.toMatchObject({ code: 'invalid_template' });
      expect(await templateRepository.getActiveTemplates(template.plant_id)).toEqual([]);
    } finally {
      await admin.from('growing_templates').update({ is_active: true }).eq('id', template.id);
    }
  });

  it('refuses a removed crop', async () => {
    const { crop } = await cropReadyFor('chives', 'spring');
    await cropRepository.archiveCrop(crop.id);
    await expect(generateSchedule(crop.id)).rejects.toMatchObject({ code: 'crop_archived' });
  });

  it('does not let another user generate (or see) a crop in a farm they are not in', async () => {
    const { crop } = await cropReadyFor('lettuce', 'spring');
    as(await data.createUser('intruder'));
    await expect(generateSchedule(crop.id)).rejects.toMatchObject({ code: 'crop_not_found' });
    const { count } = await admin
      .from('growing_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('farm_crop_id', crop.id);
    expect(count).toBe(0);
    expect(
      (await admin.from('farm_crops').select('status').eq('id', crop.id).single()).data?.status,
    ).toBe('planned');
  });

  it('rejects a request with no sign-in', async () => {
    const response = await fetch(`${getEnv().url}/functions/v1/generate-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: getEnv().anonKey },
      body: JSON.stringify({ farm_crop_id: '00000000-0000-0000-0000-000000000000' }),
    });
    expect(response.status).toBe(401);
  });

  it('rejects a bad request body with a clear error', async () => {
    const { user } = await cropReadyFor('lettuce', 'spring');
    const { data: session } = await user.client.auth.getSession();
    const call = (body: unknown) =>
      fetch(`${getEnv().url}/functions/v1/generate-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: getEnv().anonKey,
          Authorization: `Bearer ${session.session!.access_token}`,
        },
        body: JSON.stringify(body),
      });
    expect((await call({})).status).toBe(400);
    expect((await call({ farm_crop_id: 'not-a-uuid' })).status).toBe(400);
  });

  // REQ-015 of Phase 4: later template changes never alter existing schedules.
  it('keeps an existing schedule unchanged when the template is edited or a new version is added', async () => {
    const { crop, template } = await cropReadyFor('crown-daisy', 'spring');
    await generateSchedule(crop.id);
    const snapshot = async () =>
      (
        await admin
          .from('growing_tasks')
          .select('generation_key')
          .eq('farm_crop_id', crop.id)
          .order('generation_key')
      ).data;
    const before = await snapshot();

    const plant = await getPlant(admin, 'crown-daisy');
    const edit = await admin
      .from('growing_templates')
      .update({ maturity_days: 999 })
      .eq('id', template.id);
    const v2 = await admin
      .from('growing_templates')
      .insert({
        plant_id: plant.id,
        version: 2,
        season: 'spring',
        germination_days: 3,
        maturity_days: 30,
        harvest_start_days: 30,
        harvest_end_days: 40,
        source_reference: 'test',
        is_active: true,
      })
      .select('id')
      .single();
    try {
      expect(edit.error).toBeNull();
      expect(await snapshot()).toEqual(before);
      const [updated] =
        (
          await admin
            .from('farm_crops')
            .select('selected_template_version, template_id')
            .eq('id', crop.id)
        ).data ?? [];
      expect(updated).toMatchObject({ selected_template_version: 1, template_id: template.id });
      // The app offers only the newest version to new crops.
      const offered = await templateRepository.getActiveTemplates(plant.id);
      expect(
        offered
          .filter((t) => t.season === 'spring')
          .map((t) => t.version)
          .sort(),
      ).toEqual([1, 2]);
    } finally {
      await admin
        .from('growing_templates')
        .update({ maturity_days: template.maturity_days })
        .eq('id', template.id);
      if (v2.data)
        await createAdminClient().from('growing_templates').delete().eq('id', v2.data.id);
    }
  });
});
