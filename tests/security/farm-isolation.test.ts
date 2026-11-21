import * as cropRepository from '../../src/repositories/cropRepository';
import * as farmRepository from '../../src/repositories/farmRepository';
import * as profileRepository from '../../src/repositories/profileRepository';
import * as taskRepository from '../../src/repositories/taskRepository';
import {
  as,
  createTestFarm,
  expectNoRows,
  insertTask,
  useTestData,
} from '../integration/helpers/testData';

// REQ-007: a user cannot see or change another user's farm, crops or tasks.
describe('farm isolation', () => {
  const data = useTestData();
  const { admin } = data;

  async function twoFarms() {
    const a = await data.createUser('a');
    const b = await data.createUser('b');
    const farmA = await createTestFarm(a, ['kale']);
    const farmB = await createTestFarm(b, ['peas']);
    const taskA = await insertTask(admin, farmA.crops[0].id, {
      type: 'watering',
      date: '2025-03-01',
      key: `${farmA.crops[0].id}:w`,
    });
    const taskB = await insertTask(admin, farmB.crops[0].id, {
      type: 'watering',
      date: '2025-03-01',
      key: `${farmB.crops[0].id}:w`,
    });
    return { a, b, farmA, farmB, taskA, taskB };
  }

  it('shows each user only their own farm, crops, tasks, membership and profile', async () => {
    const { a, b, farmA, farmB } = await twoFarms();
    as(a);
    const { data: farms } = await a.client.from('farms').select('id');
    expect(farms).toEqual([{ id: farmA.farmId }]);
    const { data: crops } = await a.client.from('farm_crops').select('id');
    expect(crops).toEqual([{ id: farmA.crops[0].id }]);
    const { data: tasks } = await a.client.from('growing_tasks').select('farm_crop_id');
    expect(tasks).toEqual([{ farm_crop_id: farmA.crops[0].id }]);
    const { data: members } = await a.client.from('farm_members').select('user_id');
    expect(members).toEqual([{ user_id: a.id }]);
    const { data: profiles } = await a.client.from('profiles').select('id');
    expect(profiles).toEqual([{ id: a.id }]);
    expect(await farmRepository.getFarmForUser(a.id)).toMatchObject({ id: farmA.farmId });
    expect(await farmRepository.getFarmForUser(b.id)).toBeNull();
    expect(farmB.farmId).not.toBe(farmA.farmId);
  });

  it('returns nothing when asking for another user’s rows by id', async () => {
    const { a, b, farmB, taskB } = await twoFarms();
    as(a);
    expectNoRows(await a.client.from('farms').select('*').eq('id', farmB.farmId));
    expectNoRows(await a.client.from('farm_crops').select('*').eq('id', farmB.crops[0].id));
    expectNoRows(await a.client.from('growing_tasks').select('*').eq('id', taskB.id));
    expectNoRows(await a.client.from('farm_members').select('*').eq('farm_id', farmB.farmId));
    expectNoRows(await a.client.from('profiles').select('*').eq('id', b.id));
    expect(await profileRepository.getProfile(b.id)).toBeNull();
    expect(await cropRepository.listCrops(farmB.farmId)).toEqual([]);
    expect(await taskRepository.getTaskById(taskB.id)).toBeNull();
  });

  it('cannot change another user’s farm, crops, tasks or profile', async () => {
    const { a, b, farmB, taskB } = await twoFarms();
    as(a);
    await a.client.from('farms').update({ name: 'Hacked' }).eq('id', farmB.farmId);
    await a.client.from('farm_crops').update({ status: 'archived' }).eq('id', farmB.crops[0].id);
    await a.client
      .from('growing_tasks')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', taskB.id);
    await a.client.from('profiles').update({ display_name: 'Hacked' }).eq('id', b.id);
    await expect(taskRepository.completeTask(taskB.id)).rejects.toBeTruthy();
    await expect(cropRepository.archiveCrop(farmB.crops[0].id)).rejects.toBeTruthy();

    const farm = await admin.from('farms').select('name').eq('id', farmB.farmId).single();
    expect(farm.data?.name).not.toBe('Hacked');
    expect(
      (await admin.from('farm_crops').select('status').eq('id', farmB.crops[0].id).single()).data
        ?.status,
    ).toBe('planned');
    expect(
      (await admin.from('growing_tasks').select('completed_at').eq('id', taskB.id).single()).data
        ?.completed_at,
    ).toBeNull();
    expect(
      (await admin.from('profiles').select('display_name').eq('id', b.id).single()).data
        ?.display_name,
    ).not.toBe('Hacked');
  });

  it('cannot delete another user’s rows', async () => {
    const { a, farmB, taskB } = await twoFarms();
    as(a);
    await a.client.from('growing_tasks').delete().eq('id', taskB.id);
    await a.client.from('farm_crops').delete().eq('id', farmB.crops[0].id);
    await a.client.from('farms').delete().eq('id', farmB.farmId);
    await a.client.from('farm_members').delete().eq('farm_id', farmB.farmId);
    expect((await admin.from('growing_tasks').select('id').eq('id', taskB.id)).data).toHaveLength(
      1,
    );
    expect(
      (await admin.from('farm_crops').select('id').eq('id', farmB.crops[0].id)).data,
    ).toHaveLength(1);
    expect((await admin.from('farms').select('id').eq('id', farmB.farmId)).data).toHaveLength(1);
    expect(
      (await admin.from('farm_members').select('id').eq('farm_id', farmB.farmId)).data,
    ).toHaveLength(1);
  });

  it('does not show another user’s tasks on the calendar', async () => {
    const { a, taskA, taskB } = await twoFarms();
    as(a);
    const month = await taskRepository.getTasksForMonth({ year: 2025, month: 3 });
    expect(month.map((t) => t.id)).toEqual([taskA.id]);
    expect(month.map((t) => t.id)).not.toContain(taskB.id);
  });

  it('does not let a user delete their own crops or tasks through the app', async () => {
    const { a, farmA, taskA } = await twoFarms();
    as(a);
    await a.client.from('farm_crops').delete().eq('id', farmA.crops[0].id);
    await a.client.from('growing_tasks').delete().eq('id', taskA.id);
    expect(
      (await admin.from('farm_crops').select('id').eq('id', farmA.crops[0].id)).data,
    ).toHaveLength(1);
    expect((await admin.from('growing_tasks').select('id').eq('id', taskA.id)).data).toHaveLength(
      1,
    );
  });
});
