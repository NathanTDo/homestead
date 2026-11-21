import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';
import { setActiveClient } from './activeClient';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
}

const PASSWORD = 'test-pass-123';
// Every test user's email starts with this, so cleanup can only ever touch test data.
const EMAIL_PREFIX = 'it-';

function newClient(key: string): SupabaseClient {
  return createClient(getEnv().url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A client with the anon key and no signed-in user. */
export function createAnonymousClient(): SupabaseClient {
  return newClient(getEnv().anonKey);
}

/** A client that bypasses row level security. Only for setup, checks and cleanup. */
export function createAdminClient(): SupabaseClient {
  return newClient(getEnv().serviceKey);
}

/** Makes the app's repositories run as this user (or as nobody, for an anonymous client). */
export function as<T extends { client: SupabaseClient }>(who: T): T {
  setActiveClient(who.client);
  return who;
}

export const anonymous = { client: createAnonymousClient };

const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let counter = 0;

/**
 * Tracks the users a test file creates and removes them, and everything they own, afterwards.
 * Call once at the top of a test file.
 */
export function useTestData() {
  const users: TestUser[] = [];
  const admin = createAdminClient();

  async function createUser(label: string): Promise<TestUser> {
    const email = `${EMAIL_PREFIX}${runId}-${label}-${++counter}@example.com`;
    const client = newClient(getEnv().anonKey);
    const { data, error } = await client.auth.signUp({ email, password: PASSWORD });
    if (error || !data.user) throw new Error(`Could not create test user: ${error?.message}`);
    if (!data.session) {
      const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
      if (signIn.error) throw new Error(`Could not sign in test user: ${signIn.error.message}`);
    }
    const user = { id: data.user.id, email, password: PASSWORD, client };
    users.push(user);
    return user;
  }

  /** A second client for the same user, as if they signed in again on another device. */
  async function signInAgain(user: TestUser): Promise<TestUser> {
    const client = newClient(getEnv().anonKey);
    const { error } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    if (error) throw new Error(`Could not sign in again: ${error.message}`);
    return { ...user, client };
  }

  async function cleanup() {
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return;
    const { data: farms } = await admin.from('farms').select('id').in('created_by', ids);
    const farmIds = (farms ?? []).map((f) => f.id as string);
    if (farmIds.length > 0) {
      const { data: crops } = await admin.from('farm_crops').select('id').in('farm_id', farmIds);
      const cropIds = (crops ?? []).map((c) => c.id as string);
      if (cropIds.length > 0)
        await admin.from('growing_tasks').delete().in('farm_crop_id', cropIds);
      await admin.from('farm_crops').delete().in('farm_id', farmIds);
      await admin.from('farms').delete().in('id', farmIds);
    }
    for (const id of ids) await admin.auth.admin.deleteUser(id);
    users.length = 0;
  }

  afterAll(cleanup);
  return { createUser, signInAgain, admin, cleanup };
}

/** Looks up a seeded plant by slug. */
export async function getPlant(admin: SupabaseClient, slug: string) {
  const { data, error } = await admin
    .from('plants')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();
  if (error) throw new Error(`Seed plant "${slug}" not found: ${error.message}`);
  return data as { id: string; name: string; slug: string };
}

export interface CareRuleRow {
  activity_type: string;
  start_day: number;
  interval_days: number | null;
  end_day: number;
}

export interface TemplateRow {
  id: string;
  plant_id: string;
  version: number;
  season: string;
  germination_days: number | null;
  maturity_days: number | null;
  harvest_start_days: number | null;
  harvest_end_days: number | null;
  is_active: boolean;
  care_rules: CareRuleRow[];
}

/** The active template of a plant for a season, with its care rules. */
export async function getTemplate(admin: SupabaseClient, plantSlug: string, season: string) {
  const plant = await getPlant(admin, plantSlug);
  const { data, error } = await admin
    .from('growing_templates')
    .select('*, care_rules(*)')
    .eq('plant_id', plant.id)
    .eq('season', season)
    .eq('version', 1)
    .single();
  if (error) throw new Error(`Seed template ${plantSlug}/${season} not found: ${error.message}`);
  return data as TemplateRow;
}

/** Onboards a user (creating a farm) as that user, and returns the farm and its starting crops. */
export async function createTestFarm(user: TestUser, startingPlantSlugs: string[] = []) {
  const { data: farmId, error } = await user.client.rpc('create_farm_with_member', {
    p_farm_name: `Test Farm ${user.email.slice(3, 9)}`,
    p_onboarding_data: { interested_produce: startingPlantSlugs },
  });
  if (error) throw new Error(`Could not create test farm: ${error.message}`);
  const { data: crops } = await user.client
    .from('farm_crops')
    .select('id, plant_id, status, plants(slug)')
    .eq('farm_id', farmId);
  return {
    farmId: farmId as string,
    crops: (crops ?? []) as unknown as {
      id: string;
      plant_id: string;
      status: string;
      plants: { slug: string };
    }[],
  };
}

/** Inserts a task directly (bypassing row level security), for tests that need exact dates. */
export async function insertTask(
  admin: SupabaseClient,
  cropId: string,
  task: { type: string; date: string; key: string; title?: string; description?: string | null },
) {
  const { data, error } = await admin
    .from('growing_tasks')
    .insert({
      farm_crop_id: cropId,
      task_type: task.type,
      title: task.title ?? task.type,
      description: task.description ?? null,
      scheduled_date: task.date,
      generation_key: task.key,
    })
    .select()
    .single();
  if (error) throw new Error(`Could not insert task: ${error.message}`);
  return data as { id: string; scheduled_date: string; completed_at: string | null };
}

/** True when the Edge Function server is running (`supabase functions serve`). */
export async function isFunctionServed(): Promise<boolean> {
  try {
    const response = await fetch(`${getEnv().url}/functions/v1/generate-schedule`, {
      method: 'POST',
    });
    return response.status !== 404;
  } catch {
    return false;
  }
}

/** Passes when the call returned no rows, or was refused. Fails if it returned data. */
export function expectNoRows(result: { data: unknown; error: unknown }) {
  const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
  expect(rows).toHaveLength(0);
}
