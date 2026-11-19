import { getEnv } from '../integration/helpers/env';
import {
  createAnonymousClient,
  createTestFarm,
  expectNoRows,
  insertTask,
  useTestData,
} from '../integration/helpers/testData';

// REQ-010: without signing in, no user data can be read or written.
describe('unauthenticated access', () => {
  const data = useTestData();
  const { admin } = data;
  const anon = createAnonymousClient();

  let cropId: string;
  let farmId: string;

  beforeAll(async () => {
    // Real data exists, so an empty result means access was denied and not that there was nothing to read.
    const user = await data.createUser('owner');
    const farm = await createTestFarm(user, ['kale']);
    farmId = farm.farmId;
    cropId = farm.crops[0].id;
    await insertTask(admin, cropId, { type: 'watering', date: '2025-03-01', key: `${cropId}:w` });
    const { count } = await admin
      .from('growing_tasks')
      .select('id', { count: 'exact', head: true });
    expect(count).toBeGreaterThan(0);
  });

  it.each(['profiles', 'farms', 'farm_members', 'farm_crops', 'growing_tasks'])(
    'cannot read %s',
    async (table) => {
      expectNoRows(await anon.from(table).select('*'));
    },
  );

  it('cannot read by id either', async () => {
    expectNoRows(await anon.from('farms').select('*').eq('id', farmId));
    expectNoRows(await anon.from('farm_crops').select('*').eq('id', cropId));
  });

  it.each(['plants', 'growing_templates', 'care_rules'])(
    'cannot read the catalog table %s',
    async (table) => {
      expectNoRows(await anon.from(table).select('*'));
    },
  );

  it('cannot write to user tables', async () => {
    expect(
      (
        await anon
          .from('farms')
          .insert({ name: 'Anon', created_by: '00000000-0000-0000-0000-000000000000' })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await anon
          .from('farm_crops')
          .insert({ farm_id: farmId, plant_id: '00000000-0000-0000-0000-000000000000' })
      ).error,
    ).not.toBeNull();
    await anon.from('farm_crops').update({ status: 'archived' }).eq('id', cropId);
    await anon
      .from('growing_tasks')
      .update({ completed_at: new Date().toISOString() })
      .eq('farm_crop_id', cropId);
    await anon.from('farms').delete().eq('id', farmId);
    expect(
      (await admin.from('farm_crops').select('status').eq('id', cropId).single()).data?.status,
    ).toBe('planned');
    expect(
      (await admin.from('growing_tasks').select('completed_at').eq('farm_crop_id', cropId).single())
        .data?.completed_at,
    ).toBeNull();
    expect((await admin.from('farms').select('id').eq('id', farmId)).data).toHaveLength(1);
  });

  it('cannot call the database functions', async () => {
    const createFarm = await anon.rpc('create_farm_with_member', {
      p_farm_name: 'Anon Farm',
      p_onboarding_data: {},
    });
    expect(createFarm.error).not.toBeNull();
    const generate = await anon.rpc('generate_tasks', { p_farm_crop_id: cropId, p_tasks: [] });
    expect(generate.error).not.toBeNull();
    expect((await admin.from('farms').select('id').eq('name', 'Anon Farm')).data).toEqual([]);
  });

  it('is turned away by the schedule function without a user token', async () => {
    const call = (headers: Record<string, string>) =>
      fetch(`${getEnv().url}/functions/v1/generate-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ farm_crop_id: cropId }),
      });
    expect((await call({})).status).toBe(401);
    expect((await call({ apikey: getEnv().anonKey })).status).toBe(401);
    expect(
      (await call({ apikey: getEnv().anonKey, Authorization: 'Bearer not-a-real-token' })).status,
    ).toBe(401);
  });
});
