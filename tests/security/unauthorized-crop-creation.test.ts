import * as cropRepository from '../../src/repositories/cropRepository';
import * as plantRepository from '../../src/repositories/plantRepository';
import { as, createTestFarm, insertTask, useTestData } from '../integration/helpers/testData';

// REQ-008: a user cannot add crops to, or move things into, a farm they do not belong to.
describe('unauthorized crop creation', () => {
  const data = useTestData();
  const { admin } = data;

  async function setup() {
    const a = await data.createUser('a');
    const b = await data.createUser('b');
    const farmA = await createTestFarm(a, ['kale']);
    const farmB = await createTestFarm(b, ['peas']);
    as(a);
    const plants = await plantRepository.searchPlants();
    return {
      a,
      b,
      farmA,
      farmB,
      plantId: (slug: string) => plants.find((p) => p.slug === slug)!.id,
    };
  }

  const cropCount = async (farmId: string) =>
    (
      await admin
        .from('farm_crops')
        .select('id', { count: 'exact', head: true })
        .eq('farm_id', farmId)
    ).count;

  it('rejects a crop in someone else’s farm and adds nothing', async () => {
    const { farmA, farmB, plantId } = await setup();
    await expect(cropRepository.createCrop(farmB.farmId, plantId('garlic'))).rejects.toBeTruthy();
    expect(await cropCount(farmB.farmId)).toBe(1);
    // Control: the same call works for their own farm.
    await expect(cropRepository.createCrop(farmA.farmId, plantId('garlic'))).resolves.toBeTruthy();
  });

  it('rejects a crop for a farm that does not exist', async () => {
    const { plantId } = await setup();
    await expect(
      cropRepository.createCrop('00000000-0000-0000-0000-000000000000', plantId('garlic')),
    ).rejects.toBeTruthy();
  });

  it('cannot add themselves to someone else’s farm', async () => {
    const { a, farmB } = await setup();
    const result = await a.client
      .from('farm_members')
      .insert({ farm_id: farmB.farmId, user_id: a.id, role: 'member' });
    expect(result.error).not.toBeNull();
    const { data: members } = await admin
      .from('farm_members')
      .select('user_id')
      .eq('farm_id', farmB.farmId);
    expect(members).toHaveLength(1);
    expect((await a.client.from('farms').select('id').eq('id', farmB.farmId)).data).toEqual([]);
  });

  it('cannot add someone else to their own farm, or create a farm in someone else’s name', async () => {
    const { a, b, farmA } = await setup();
    const addOther = await a.client
      .from('farm_members')
      .insert({ farm_id: farmA.farmId, user_id: b.id, role: 'member' });
    expect(addOther.error).not.toBeNull();
    const fakeFarm = await a.client.from('farms').insert({ name: 'Fake', created_by: b.id });
    expect(fakeFarm.error).not.toBeNull();
    expect((await admin.from('farms').select('id').eq('name', 'Fake')).data).toEqual([]);
  });

  it('cannot move a crop into someone else’s farm', async () => {
    const { a, farmA, farmB } = await setup();
    const result = await a.client
      .from('farm_crops')
      .update({ farm_id: farmB.farmId })
      .eq('id', farmA.crops[0].id);
    expect(result.error).not.toBeNull();
    const { data: crop } = await admin
      .from('farm_crops')
      .select('farm_id')
      .eq('id', farmA.crops[0].id)
      .single();
    expect(crop?.farm_id).toBe(farmA.farmId);
  });

  it('cannot move a task onto someone else’s crop', async () => {
    const { a, farmA, farmB } = await setup();
    const task = await insertTask(admin, farmA.crops[0].id, {
      type: 'watering',
      date: '2025-03-01',
      key: `${farmA.crops[0].id}:w`,
    });
    const result = await a.client
      .from('growing_tasks')
      .update({ farm_crop_id: farmB.crops[0].id })
      .eq('id', task.id);
    expect(result.error).not.toBeNull();
    const { data: row } = await admin
      .from('growing_tasks')
      .select('farm_crop_id')
      .eq('id', task.id)
      .single();
    expect(row?.farm_crop_id).toBe(farmA.crops[0].id);
  });

  it('cannot create tasks directly (only the schedule function can)', async () => {
    const { a, farmA } = await setup();
    const result = await a.client.from('growing_tasks').insert({
      farm_crop_id: farmA.crops[0].id,
      task_type: 'watering',
      title: 'Sneaky',
      scheduled_date: '2025-03-01',
      generation_key: 'sneaky',
    });
    expect(result.error).not.toBeNull();
    expect(
      (await admin.from('growing_tasks').select('id').eq('generation_key', 'sneaky')).data,
    ).toEqual([]);
  });
});
