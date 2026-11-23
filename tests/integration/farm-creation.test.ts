import * as farmRepository from '../../src/repositories/farmRepository';
import * as cropRepository from '../../src/repositories/cropRepository';
import * as profileRepository from '../../src/repositories/profileRepository';
import { anonymous, as, useTestData } from './helpers/testData';

// REQ-001: a user can create a farm with create_farm_with_member.
describe('create_farm_with_member', () => {
  const data = useTestData();
  const { admin } = data;

  it('creates the farm, the owner membership and the onboarding data', async () => {
    const user = as(await data.createUser('farm'));
    const farmId = await farmRepository.createFarmWithMember('  Sunny Acres  ', {
      farming_location: 'Oregon',
      farming_type: 'outdoor',
      experience_level: 'beginner',
      preferred_seasons: ['spring', 'fall'],
      interested_produce: ['peas', 'kale'],
    });

    const farm = await farmRepository.getFarmForUser(user.id);
    expect(farm).toMatchObject({
      id: farmId,
      name: 'Sunny Acres',
      farming_method: 'outdoor',
      created_by: user.id,
    });

    const { data: members } = await admin
      .from('farm_members')
      .select('user_id, role')
      .eq('farm_id', farmId);
    expect(members).toEqual([{ user_id: user.id, role: 'owner' }]);

    const profile = await profileRepository.getProfile(user.id);
    expect(profile?.onboarding_data).toEqual({
      completed: true,
      farming_location: 'Oregon',
      farming_type: 'outdoor',
      experience_level: 'beginner',
      preferred_seasons: ['spring', 'fall'],
      interested_produce: ['kale', 'peas'],
    });
  });

  it('turns the picked plants into planned crops', async () => {
    const user = as(await data.createUser('crops'));
    const farmId = await farmRepository.createFarmWithMember('Crop Farm', {
      interested_produce: ['kale', 'peas', 'kale'],
    });
    const crops = await cropRepository.listCrops(farmId);
    expect(crops).toHaveLength(2);
    expect(crops.every((crop) => crop.status === 'planned')).toBe(true);
    expect(user.id).toBeTruthy();
  });

  it('stores only the known onboarding keys and cannot be told it is complete', async () => {
    const user = as(await data.createUser('keys'));
    await farmRepository.createFarmWithMember('Key Farm', {
      farming_type: 'indoor',
      ...({ is_admin: true, completed: false } as object),
    });
    const profile = await profileRepository.getProfile(user.id);
    expect(profile?.onboarding_data).toEqual({
      completed: true,
      farming_type: 'indoor',
      interested_produce: [],
    });
  });

  it('rejects a blank, missing or over-long farm name and creates nothing', async () => {
    const user = as(await data.createUser('names'));
    for (const name of ['   ', '', 'x'.repeat(61)]) {
      await expect(farmRepository.createFarmWithMember(name, {})).rejects.toThrow(
        /invalid_farm_name/,
      );
    }
    expect(await farmRepository.getFarmForUser(user.id)).toBeNull();
    const profile = await profileRepository.getProfile(user.id);
    expect(profile?.onboarding_data).toBeNull();
  });

  it('rejects more than 5 starting crops, an unknown plant and bad data, all without side effects', async () => {
    const user = as(await data.createUser('bad'));
    await expect(
      farmRepository.createFarmWithMember('F', {
        interested_produce: ['garlic', 'peas', 'kale', 'radish', 'daikon', 'chives'],
      }),
    ).rejects.toThrow(/too_many_crops/);
    await expect(
      farmRepository.createFarmWithMember('F', { interested_produce: ['garlic', 'not-a-plant'] }),
    ).rejects.toThrow(/invalid_plant/);
    await expect(
      farmRepository.createFarmWithMember('F', {
        interested_produce: 'garlic' as unknown as string[],
      }),
    ).rejects.toThrow(/invalid_onboarding_data/);

    // Nothing was kept from the failed attempts: no farm, no crops, onboarding not complete.
    expect(await farmRepository.getFarmForUser(user.id)).toBeNull();
    const { data: farms } = await admin.from('farms').select('id').eq('created_by', user.id);
    expect(farms).toEqual([]);
    expect((await profileRepository.getProfile(user.id))?.onboarding_data).toBeNull();
  });

  it('accepts exactly 5 starting crops', async () => {
    as(await data.createUser('five'));
    const farmId = await farmRepository.createFarmWithMember('Five Farm', {
      interested_produce: ['garlic', 'peas', 'kale', 'radish', 'daikon'],
    });
    expect(await cropRepository.listCrops(farmId)).toHaveLength(5);
  });

  it('refuses a second onboarding and keeps a single farm', async () => {
    const user = as(await data.createUser('twice'));
    await farmRepository.createFarmWithMember('First', {});
    await expect(farmRepository.createFarmWithMember('Second', {})).rejects.toThrow(
      /already_onboarded/,
    );
    const { data: farms } = await admin.from('farms').select('name').eq('created_by', user.id);
    expect(farms).toEqual([{ name: 'First' }]);
  });

  it('handles two requests at once without creating two farms', async () => {
    const user = as(await data.createUser('race'));
    const results = await Promise.allSettled([
      farmRepository.createFarmWithMember('Race A', {}),
      farmRepository.createFarmWithMember('Race B', {}),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const { data: farms } = await admin.from('farms').select('id').eq('created_by', user.id);
    expect(farms).toHaveLength(1);
  });

  it('refuses an anonymous caller', async () => {
    as({ client: anonymous.client() });
    await expect(farmRepository.createFarmWithMember('Nope', {})).rejects.toThrow();
  });
});

describe('farm location', () => {
  const data = useTestData();

  it('stores the onboarding location on the farm', async () => {
    const user = as(await data.createUser('loc-create'));
    await farmRepository.createFarmWithMember('Loc Farm', { farming_location: '  94103 ' });
    expect((await farmRepository.getFarmForUser(user.id))?.location).toBe('94103');
  });

  it('lets the owner change and clear it with update_farm_location', async () => {
    const user = as(await data.createUser('loc-update'));
    const farmId = await farmRepository.createFarmWithMember('Loc Farm', {});
    expect(await farmRepository.updateFarmLocation(farmId, ' Portland, OR ')).toBe('Portland, OR');
    expect((await farmRepository.getFarmForUser(user.id))?.location).toBe('Portland, OR');
    expect(await farmRepository.updateFarmLocation(farmId, '  ')).toBeNull();
    expect((await farmRepository.getFarmForUser(user.id))?.location).toBeNull();
  });

  it('rejects a location over 100 characters', async () => {
    as(await data.createUser('loc-long'));
    const farmId = await farmRepository.createFarmWithMember('Loc Farm', {});
    await expect(farmRepository.updateFarmLocation(farmId, 'x'.repeat(101))).rejects.toThrow(
      'invalid_location',
    );
  });

  it("does not let another user change someone else's farm", async () => {
    const owner = as(await data.createUser('loc-owner'));
    const farmId = await farmRepository.createFarmWithMember('Loc Farm', { farming_location: '1' });
    as(await data.createUser('loc-other'));
    await expect(farmRepository.updateFarmLocation(farmId, 'hacked')).rejects.toThrow(
      'farm_not_found',
    );
    as(owner);
    expect((await farmRepository.getFarmForUser(owner.id))?.location).toBe('1');
  });
});
