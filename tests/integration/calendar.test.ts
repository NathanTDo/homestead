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

describe('harvest windows', () => {
  const data = useTestData();
  const { admin } = data;

  async function seedWindows() {
    const user = as(await data.createUser('harvest'));
    const { crops } = await createTestFarm(user, ['kale', 'peas']);
    const kale = crops.find((c) => c.plants.slug === 'kale')!;
    const peas = crops.find((c) => c.plants.slug === 'peas')!;
    const add = (crop: typeof kale, type: string, date: string) =>
      insertTask(admin, crop.id, { type, date, key: `${crop.id}:${type}`, title: type });
    // Kale's window crosses a year end, so no single month holds both of its tasks.
    await add(kale, 'harvest_start', '2025-12-20');
    await add(kale, 'harvest_end', '2026-01-10');
    await add(kale, 'maturity', '2025-12-20');
    await add(kale, 'watering', '2025-12-21');
    await add(kale, 'planting', '2025-10-01');
    await add(peas, 'harvest_start', '2026-03-01');
    await add(peas, 'harvest_end', '2026-03-15');
    return { kale, peas };
  }

  it('returns only maturity and harvest start and end tasks, from any month', async () => {
    await seedWindows();
    const tasks = await taskRepository.getHarvestTasks();
    expect(tasks.map((t) => t.task_type).sort()).toEqual([
      'harvest_end',
      'harvest_end',
      'harvest_start',
      'harvest_start',
      'maturity',
    ]);
    expect(tasks.map((t) => t.scheduled_date).sort()).toEqual([
      '2025-12-20',
      '2025-12-20',
      '2026-01-10',
      '2026-03-01',
      '2026-03-15',
    ]);
  });
  it('filters by plant', async () => {
    const { peas } = await seedWindows();
    const tasks = await taskRepository.getHarvestTasks(peas.plant_id);
    expect(tasks.map((t) => t.plant_name)).toEqual(['Peas', 'Peas']);
  });
  it('leaves out removed crops', async () => {
    const { peas } = await seedWindows();
    await cropRepository.archiveCrop(peas.id);
    const tasks = await taskRepository.getHarvestTasks();
    expect(new Set(tasks.map((t) => t.plant_name))).toEqual(new Set(['Kale']));
  });
  it('shows a user nothing from another farm', async () => {
    await seedWindows();
    as(await data.createUser('harvest-other'));
    expect(await taskRepository.getHarvestTasks()).toEqual([]);
  });
});
