import * as cropRepository from '../../src/repositories/cropRepository';
import * as taskRepository from '../../src/repositories/taskRepository';
import { as, createTestFarm, insertTask, useTestData } from './helpers/testData';

// REQ-006: calendar queries return the right tasks for a month, with plant names.
describe('calendar retrieval', () => {
  const data = useTestData();
  const { admin } = data;

  async function seed() {
    const user = as(await data.createUser('calendar'));
    const { crops } = await createTestFarm(user, ['kale', 'peas']);
    const kale = crops.find((c) => c.plants.slug === 'kale')!;
    const peas = crops.find((c) => c.plants.slug === 'peas')!;
    const add = (crop: typeof kale, type: string, date: string, key: string) =>
      insertTask(admin, crop.id, {
        type,
        date,
        key: `${crop.id}:${key}`,
        title: `${type} ${date}`,
      });

    await add(kale, 'watering', '2025-12-31', 'a');
    await add(kale, 'planting', '2026-01-01', 'b');
    await add(kale, 'watering', '2026-01-31', 'c');
    await add(kale, 'watering', '2026-02-01', 'd');
    await add(kale, 'watering', '2024-02-29', 'e');
    await add(peas, 'fertilizing', '2025-12-31', 'f');
    await add(peas, 'watering', '2025-12-15', 'g');
    for (const crop of [kale, peas]) {
      await admin.from('farm_crops').update({ status: 'active' }).eq('id', crop.id);
    }
    return { user, kale, peas };
  }

  const dates = (tasks: { scheduled_date: string }[]) => tasks.map((t) => t.scheduled_date);

  it('returns a month’s tasks in date order, with plant names', async () => {
    await seed();
    const december = await taskRepository.getTasksForMonth({ year: 2025, month: 12 });
    expect(dates(december)).toEqual(['2025-12-15', '2025-12-31', '2025-12-31']);
    expect(new Set(december.map((t) => t.plant_name))).toEqual(new Set(['Kale', 'Peas']));
    expect(december[0]).toMatchObject({
      plant_name: 'Peas',
      task_type: 'watering',
      completed_at: null,
    });
  });

  it('puts Dec 31 in December and Jan 1 in January, and Feb 1 outside January', async () => {
    await seed();
    expect(dates(await taskRepository.getTasksForMonth({ year: 2026, month: 1 }))).toEqual([
      '2026-01-01',
      '2026-01-31',
    ]);
    expect(dates(await taskRepository.getTasksForMonth({ year: 2026, month: 2 }))).toEqual([
      '2026-02-01',
    ]);
  });

  it('finds a task on a leap day', async () => {
    await seed();
    expect(dates(await taskRepository.getTasksForMonth({ year: 2024, month: 2 }))).toEqual([
      '2024-02-29',
    ]);
    expect(await taskRepository.getTasksForMonth({ year: 2025, month: 2 })).toEqual([]);
  });

  it('returns an empty list for a month with no tasks', async () => {
    await seed();
    expect(await taskRepository.getTasksForMonth({ year: 2025, month: 3 })).toEqual([]);
  });

  it('filters by plant', async () => {
    const { peas, kale } = await seed();
    const onlyPeas = await taskRepository.getTasksForMonth(
      { year: 2025, month: 12 },
      peas.plant_id,
    );
    expect(onlyPeas.map((t) => t.plant_name)).toEqual(['Peas', 'Peas']);
    const onlyKale = await taskRepository.getTasksForMonth(
      { year: 2025, month: 12 },
      kale.plant_id,
    );
    expect(onlyKale).toHaveLength(1);
    expect(await taskRepository.getTasksForMonth({ year: 2025, month: 12 }, null)).toHaveLength(3);
  });

  it('hides tasks of removed crops but keeps them in the database', async () => {
    const { peas } = await seed();
    await cropRepository.archiveCrop(peas.id);
    const december = await taskRepository.getTasksForMonth({ year: 2025, month: 12 });
    expect(new Set(december.map((t) => t.plant_name))).toEqual(new Set(['Kale']));
    const { count } = await admin
      .from('growing_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('farm_crop_id', peas.id);
    expect(count).toBe(2);
  });

  it('returns one task with its plant name, and null for an unknown or invalid id', async () => {
    await seed();
    const [first] = await taskRepository.getTasksForMonth({ year: 2025, month: 12 });
    expect(await taskRepository.getTaskById(first.id)).toEqual(first);
    expect(await taskRepository.getTaskById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('shows a user nothing from another farm', async () => {
    await seed();
    as(await data.createUser('other'));
    expect(await taskRepository.getTasksForMonth({ year: 2025, month: 12 })).toEqual([]);
  });
});
