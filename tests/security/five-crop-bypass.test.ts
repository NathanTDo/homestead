import * as cropRepository from '../../src/repositories/cropRepository';
import * as plantRepository from '../../src/repositories/plantRepository';
import { as, createTestFarm, useTestData } from '../integration/helpers/testData';

// REQ-009: the five-crop limit cannot be bypassed.
describe('five-crop limit cannot be bypassed', () => {
  const data = useTestData();
  const { admin } = data;

  async function fullFarm(startingSlugs: string[]) {
    const user = as(await data.createUser('limit'));
    const { farmId } = await createTestFarm(user, startingSlugs);
    const plants = await plantRepository.searchPlants();
    const plantId = (slug: string) => plants.find((p) => p.slug === slug)!.id;
    return { user, farmId, plantId };
  }

  it('holds when requests arrive at the same moment', async () => {
    // Several tries, because a race does not always show on the first one.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { farmId, plantId } = await fullFarm(['garlic', 'peas', 'kale', 'radish']);
      await Promise.allSettled([
        cropRepository.createCrop(farmId, plantId('daikon')),
        cropRepository.createCrop(farmId, plantId('chives')),
        cropRepository.createCrop(farmId, plantId('lettuce')),
      ]);
      expect(await cropRepository.listCrops(farmId, ['planned', 'active'])).toHaveLength(5);
    }
  });

  it('holds when the service role inserts directly, and for either status', async () => {
    const { farmId, plantId } = await fullFarm(['garlic', 'peas', 'kale', 'radish', 'daikon']);
    for (const status of ['planned', 'active']) {
      const result = await admin
        .from('farm_crops')
        .insert({ farm_id: farmId, plant_id: plantId('chives'), status });
      expect(result.error?.message).toMatch(/more than 5/);
    }
  });

  it('holds when a crop is restored from archived, by the user or the service role', async () => {
    const { user, farmId, plantId } = await fullFarm(['garlic']);
    const [archivedCrop] = await cropRepository.listCrops(farmId);
    await cropRepository.archiveCrop(archivedCrop.id);
    for (const slug of ['peas', 'kale', 'radish', 'daikon', 'chives']) {
      await cropRepository.createCrop(farmId, plantId(slug));
    }
    await expect(
      cropRepository.updateCrop(archivedCrop.id, { status: 'planned' }),
    ).rejects.toBeTruthy();
    const direct = await admin
      .from('farm_crops')
      .update({ status: 'active' })
      .eq('id', archivedCrop.id);
    expect(direct.error?.message).toMatch(/more than 5/);
    expect(await cropRepository.listCrops(farmId, ['planned', 'active'])).toHaveLength(5);
    expect(user.id).toBeTruthy();
  });

  it('counts only the farm in question', async () => {
    const full = await fullFarm(['garlic', 'peas', 'kale', 'radish', 'daikon']);
    const other = await fullFarm([]);
    await expect(
      cropRepository.createCrop(other.farmId, other.plantId('garlic')),
    ).resolves.toBeTruthy();
    expect(full.farmId).not.toBe(other.farmId);
  });
});
