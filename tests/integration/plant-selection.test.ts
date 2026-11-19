import { describeCropError } from '../../src/features/crops/limits';
import * as cropRepository from '../../src/repositories/cropRepository';
import * as plantRepository from '../../src/repositories/plantRepository';
import { as, createTestFarm, useTestData } from './helpers/testData';

// REQ-002: users select plants as planned crops, and the five-crop limit holds.
describe('plant selection', () => {
  const data = useTestData();
  const { admin } = data;

  async function farmWithPlants() {
    const user = as(await data.createUser('select'));
    const { farmId } = await createTestFarm(user);
    const plants = await plantRepository.searchPlants();
    const bySlug = new Map(plants.map((p) => [p.slug, p.id]));
    const plantId = (slug: string) => bySlug.get(slug)!;
    return { user, farmId, plantId };
  }

  it('lets a user browse all 15 plants and search by name', async () => {
    as(await data.createUser('browse'));
    expect(await plantRepository.searchPlants()).toHaveLength(15);
    expect((await plantRepository.searchPlants('KALE')).map((p) => p.slug)).toEqual(['kale']);
    expect((await plantRepository.searchPlants('o')).length).toBeGreaterThan(1);
    expect(await plantRepository.searchPlants('%')).toEqual([]);
    expect(await plantRepository.getPlantBySlug('garlic')).toMatchObject({ name: 'Garlic' });
    expect(await plantRepository.getPlantBySlug('nope')).toBeNull();
  });

  it('creates a planned crop that persists', async () => {
    const { farmId, plantId } = await farmWithPlants();
    const crop = await cropRepository.createCrop(farmId, plantId('kale'));
    expect(crop).toMatchObject({
      farm_id: farmId,
      plant_id: plantId('kale'),
      status: 'planned',
      template_id: null,
      planting_date: null,
    });
    expect(await cropRepository.listCrops(farmId, ['planned', 'active'])).toEqual([crop]);
  });

  it('allows 5 crops and rejects the 6th with the limit error', async () => {
    const { farmId, plantId } = await farmWithPlants();
    for (const slug of ['garlic', 'peas', 'kale', 'radish', 'daikon']) {
      await cropRepository.createCrop(farmId, plantId(slug));
    }
    const sixth = cropRepository.createCrop(farmId, plantId('chives'));
    await expect(sixth).rejects.toMatchObject({ message: expect.stringMatching(/more than 5/) });
    // The message the app shows for that error.
    await sixth.catch((error) => expect(describeCropError(error)).toMatch(/up to 5 crops/));
    expect(await cropRepository.listCrops(farmId, ['planned', 'active'])).toHaveLength(5);
  });

  it('frees a slot when a crop is archived, and keeps the archived crop', async () => {
    const { farmId, plantId } = await farmWithPlants();
    const crops = [];
    for (const slug of ['garlic', 'peas', 'kale', 'radish', 'daikon']) {
      crops.push(await cropRepository.createCrop(farmId, plantId(slug)));
    }
    const archived = await cropRepository.archiveCrop(crops[0].id);
    expect(archived.status).toBe('archived');

    await expect(cropRepository.createCrop(farmId, plantId('chives'))).resolves.toMatchObject({
      status: 'planned',
    });
    expect(await cropRepository.listCrops(farmId, ['planned', 'active'])).toHaveLength(5);
    expect(await cropRepository.listCrops(farmId, ['archived'])).toHaveLength(1);
  });

  it('does not let an archived crop come back when the farm is full', async () => {
    const { farmId, plantId } = await farmWithPlants();
    const first = await cropRepository.createCrop(farmId, plantId('garlic'));
    await cropRepository.archiveCrop(first.id);
    for (const slug of ['peas', 'kale', 'radish', 'daikon', 'chives']) {
      await cropRepository.createCrop(farmId, plantId(slug));
    }
    await expect(cropRepository.updateCrop(first.id, { status: 'planned' })).rejects.toMatchObject({
      message: expect.stringMatching(/more than 5/),
    });
  });

  it('still lets a full farm edit one of its crops', async () => {
    const { farmId, plantId } = await farmWithPlants();
    const crops = [];
    for (const slug of ['garlic', 'peas', 'kale', 'radish', 'daikon']) {
      crops.push(await cropRepository.createCrop(farmId, plantId(slug)));
    }
    const edited = await cropRepository.updateCrop(crops[2].id, { planting_date: '2025-03-01' });
    expect(edited).toMatchObject({ planting_date: '2025-03-01', status: 'planned' });
  });

  // REQ-009: the trigger is the rule, whoever inserts.
  it('enforces the limit even when row level security is bypassed', async () => {
    const { farmId, plantId } = await farmWithPlants();
    for (const slug of ['garlic', 'peas', 'kale', 'radish', 'daikon']) {
      await cropRepository.createCrop(farmId, plantId(slug));
    }
    const direct = await admin
      .from('farm_crops')
      .insert({ farm_id: farmId, plant_id: plantId('chives'), status: 'planned' });
    expect(direct.error?.message).toMatch(/more than 5/);
    const asActive = await admin
      .from('farm_crops')
      .insert({ farm_id: farmId, plant_id: plantId('chives'), status: 'active' });
    expect(asActive.error?.message).toMatch(/more than 5/);
    const { count } = await admin
      .from('farm_crops')
      .select('id', { count: 'exact', head: true })
      .eq('farm_id', farmId);
    expect(count).toBe(5);
  });

  it('keeps tasks when a crop is archived and refuses to delete a crop that has tasks', async () => {
    const { farmId, plantId } = await farmWithPlants();
    const crop = await cropRepository.createCrop(farmId, plantId('kale'));
    await admin.from('growing_tasks').insert({
      farm_crop_id: crop.id,
      task_type: 'watering',
      title: 'Watering',
      scheduled_date: '2025-03-01',
      generation_key: `${crop.id}:watering:2025-03-01`,
    });
    await cropRepository.archiveCrop(crop.id);
    const { count } = await admin
      .from('growing_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('farm_crop_id', crop.id);
    expect(count).toBe(1);
    const removal = await admin.from('farm_crops').delete().eq('id', crop.id);
    expect(removal.error?.message).toMatch(/foreign key/i);
  });
});
