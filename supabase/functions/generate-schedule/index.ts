// Supabase Edge Function (Deno): builds and saves the task schedule for one crop.
//
// Request:  POST { "farm_crop_id": "<uuid>" }  with the signed-in user's JWT.
// Steps:    authenticate -> read the crop as the user (row level security limits this to
//           farm members) -> validate -> build the schedule -> save it with the
//           service-role-only generate_tasks() function, which also activates the crop.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  buildSchedule,
  ScheduleError,
  type CareRuleInput,
  type ScheduledTask,
} from '../_shared/schedule.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fail(status: number, error: string, message: string): Response {
  return json({ error, message }, status);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail(405, 'method_not_allowed', 'Use POST.');

  const authorization = req.headers.get('Authorization');
  if (!authorization) return fail(401, 'unauthenticated', 'Sign in first.');

  let farmCropId: unknown;
  try {
    farmCropId = (await req.json())?.farm_crop_id;
  } catch {
    return fail(400, 'invalid_request', 'Send a JSON body.');
  }
  if (typeof farmCropId !== 'string' || !UUID.test(farmCropId)) {
    return fail(400, 'invalid_request', 'farm_crop_id must be a UUID.');
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  // Reads run as the user, so row level security applies to everything fetched here.
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return fail(401, 'unauthenticated', 'Sign in again.');

  // A crop in someone else's farm is invisible here, so it looks the same as a missing one.
  const { data: crop, error: cropError } = await userClient
    .from('farm_crops')
    .select('id, plant_id, template_id, planting_date, status')
    .eq('id', farmCropId)
    .maybeSingle();
  if (cropError) return fail(500, 'server_error', 'Could not load the crop.');
  if (!crop) return fail(404, 'crop_not_found', 'Crop not found.');
  if (crop.status === 'archived') return fail(409, 'crop_archived', 'This crop was removed.');
  if (!crop.template_id || !crop.planting_date) {
    return fail(422, 'crop_not_ready', 'Choose a template and a planting date first.');
  }

  const { data: template, error: templateError } = await userClient
    .from('growing_templates')
    .select(
      'id, plant_id, version, is_active, germination_days, maturity_days, harvest_start_days, harvest_end_days, care_rules(activity_type, description, start_day, interval_days, end_day)',
    )
    .eq('id', crop.template_id)
    .maybeSingle();
  if (templateError) return fail(500, 'server_error', 'Could not load the template.');
  if (!template || !template.is_active || template.plant_id !== crop.plant_id) {
    return fail(422, 'invalid_template', 'That template does not apply to this plant.');
  }

  // Each crop is scheduled once. Asking again returns the saved schedule unchanged.
  if (crop.status === 'active') {
    const { data: existing, error: existingError } = await userClient
      .from('growing_tasks')
      .select('farm_crop_id, task_type, title, description, scheduled_date, generation_key')
      .eq('farm_crop_id', farmCropId)
      .order('scheduled_date');
    if (existingError) return fail(500, 'server_error', 'Could not load the schedule.');
    return json({
      crop_status: 'active',
      template_version: template.version,
      created: 0,
      tasks: existing,
    });
  }

  let tasks: ScheduledTask[];
  try {
    tasks = buildSchedule(
      farmCropId,
      crop.planting_date,
      template,
      template.care_rules as CareRuleInput[],
    );
  } catch (error) {
    if (error instanceof ScheduleError) return fail(422, 'invalid_schedule', error.message);
    return fail(422, 'invalid_schedule', 'The schedule could not be calculated.');
  }

  // Writes use the service role, only after the checks above.
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const { data: created, error: saveError } = await admin.rpc('generate_tasks', {
    p_farm_crop_id: farmCropId,
    p_tasks: tasks,
  });
  if (saveError) {
    const known: Record<string, [number, string]> = {
      crop_archived: [409, 'This crop was removed.'],
      crop_not_ready: [422, 'Choose a template and a planting date first.'],
      invalid_template: [422, 'That template does not apply to this plant.'],
    };
    const match = Object.keys(known).find((code) => saveError.message.includes(code));
    if (match) return fail(known[match][0], match, known[match][1]);
    return fail(500, 'server_error', 'Could not save the schedule.');
  }

  return json({
    crop_status: 'active',
    template_version: template.version,
    created,
    tasks,
  });
});
