import {
  as,
  createAdminClient,
  createTestFarm,
  useTestData,
} from '../integration/helpers/testData';

// Phase 6 task 3.5: signed-in users can read the catalog but not change it, and some database
// functions are for the server only.
describe('catalog tables', () => {
  const data = useTestData();
  const { admin } = data;

  it('can be read by a signed-in user', async () => {
    const user = await data.createUser('reader');
    const plants = await user.client.from('plants').select('id');
    const templates = await user.client.from('growing_templates').select('id');
    const rules = await user.client.from('care_rules').select('id');
    expect(plants.data).toHaveLength(15);
    expect(templates.data?.length).toBeGreaterThanOrEqual(15);
    expect(rules.data?.length).toBeGreaterThanOrEqual(30);
  });

  it('cannot be changed by a signed-in user', async () => {
    const user = await data.createUser('writer');
    const [{ data: plant }, { data: template }, { data: rule }] = await Promise.all([
      admin.from('plants').select('*').eq('slug', 'kale').single(),
      admin
        .from('growing_templates')
        .select('*')
        .eq(
          'plant_id',
          (await admin.from('plants').select('id').eq('slug', 'kale').single()).data!.id,
        )
        .limit(1)
        .single(),
      admin.from('care_rules').select('*').limit(1).single(),
    ]);

    // Inserts are refused.
    expect(
      (await user.client.from('plants').insert({ name: 'Fake', slug: 'fake' })).error,
    ).not.toBeNull();
    expect(
      (
        await user.client
          .from('growing_templates')
          .insert({ plant_id: plant.id, season: 'winter', version: 9 })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await user.client
          .from('care_rules')
          .insert({ template_id: template.id, activity_type: 'other', start_day: 0, end_day: 1 })
      ).error,
    ).not.toBeNull();

    // Updates and deletes change no rows.
    await user.client.from('plants').update({ name: 'Hacked' }).eq('id', plant.id);
    await user.client.from('growing_templates').update({ maturity_days: 1 }).eq('id', template.id);
    await user.client.from('care_rules').update({ interval_days: 99 }).eq('id', rule.id);
    await user.client.from('plants').delete().eq('id', plant.id);
    await user.client.from('growing_templates').delete().eq('id', template.id);
    await user.client.from('care_rules').delete().eq('id', rule.id);

    expect((await admin.from('plants').select('name').eq('id', plant.id).single()).data?.name).toBe(
      plant.name,
    );
    expect(
      (await admin.from('growing_templates').select('maturity_days').eq('id', template.id).single())
        .data?.maturity_days,
    ).toBe(template.maturity_days);
    expect(
      (await admin.from('care_rules').select('interval_days').eq('id', rule.id).single()).data
        ?.interval_days,
    ).toBe(rule.interval_days);
    expect((await admin.from('plants').select('id', { count: 'exact', head: true })).count).toBe(
      15,
    );
    expect((await admin.from('plants').select('id').eq('slug', 'fake')).data).toEqual([]);
  });
});

describe('server-only database functions', () => {
  const data = useTestData();

  it('generate_tasks cannot be called by a signed-in user, even for their own crop', async () => {
    const user = as(await data.createUser('caller'));
    const { crops } = await createTestFarm(user, ['kale']);
    const result = await user.client.rpc('generate_tasks', {
      p_farm_crop_id: crops[0].id,
      p_tasks: [],
    });
    expect(result.error?.message).toMatch(/permission denied/i);
    const { count } = await data.admin
      .from('growing_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('farm_crop_id', crops[0].id);
    expect(count).toBe(0);
  });

  it('generate_tasks is available to the server', async () => {
    // With bad input it answers with its own validation error, which shows it was allowed to run.
    const result = await createAdminClient().rpc('generate_tasks', {
      p_farm_crop_id: '00000000-0000-0000-0000-000000000000',
      p_tasks: [],
    });
    expect(result.error?.message).toMatch(/crop_not_found/);
  });

  it('create_farm_with_member takes the user from the session, not from the caller', async () => {
    const user = await data.createUser('identity');
    // A caller-supplied user id is not part of the function, so it cannot be abused.
    const result = await user.client.rpc('create_farm_with_member', {
      p_farm_name: 'Mine',
      p_onboarding_data: {},
      p_user_id: '00000000-0000-0000-0000-000000000000',
    });
    expect(result.error).not.toBeNull();
    const ok = await user.client.rpc('create_farm_with_member', {
      p_farm_name: 'Mine',
      p_onboarding_data: {},
    });
    expect(ok.error).toBeNull();
    const { data: farm } = await data.admin
      .from('farms')
      .select('created_by')
      .eq('id', ok.data)
      .single();
    expect(farm?.created_by).toBe(user.id);
  });
});
