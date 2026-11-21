import * as taskRepository from '../../src/repositories/taskRepository';
import { as, createTestFarm, insertTask, useTestData } from './helpers/testData';

// REQ-005: completing a task persists, and un-completing reverses it.
describe('task completion', () => {
  const data = useTestData();
  const { admin } = data;

  async function userWithTask() {
    const user = as(await data.createUser('tasks'));
    const { crops } = await createTestFarm(user, ['kale']);
    const task = await insertTask(admin, crops[0].id, {
      type: 'watering',
      date: '2025-03-01',
      key: `${crops[0].id}:watering:2025-03-01`,
      title: 'Watering',
      description: 'Water the plants',
    });
    return { user, task };
  }

  it('sets completed_at to now and changes nothing else', async () => {
    const { task } = await userWithTask();
    const before = Date.now();
    const done = await taskRepository.completeTask(task.id);
    expect(done.completed_at).not.toBeNull();
    expect(Math.abs(new Date(done.completed_at!).getTime() - before)).toBeLessThan(60_000);
    expect(done).toMatchObject({
      id: task.id,
      title: 'Watering',
      task_type: 'watering',
      scheduled_date: '2025-03-01',
    });
  });

  it('stays completed when the task is read again, and after signing in again', async () => {
    const { user, task } = await userWithTask();
    await taskRepository.completeTask(task.id);

    expect((await taskRepository.getTaskById(task.id))?.completed_at).not.toBeNull();
    const month = await taskRepository.getTasksForMonth({ year: 2025, month: 3 });
    expect(month.find((t) => t.id === task.id)?.completed_at).not.toBeNull();

    // A fresh session, as when the app is reopened or used on another phone.
    as(await data.signInAgain(user));
    expect((await taskRepository.getTaskById(task.id))?.completed_at).not.toBeNull();
  });

  it('can be un-completed', async () => {
    const { task } = await userWithTask();
    await taskRepository.completeTask(task.id);
    const undone = await taskRepository.uncompleteTask(task.id);
    expect(undone.completed_at).toBeNull();
    expect((await taskRepository.getTaskById(task.id))?.completed_at).toBeNull();
  });

  it('can be completed again after being un-completed', async () => {
    const { task } = await userWithTask();
    await taskRepository.completeTask(task.id);
    await taskRepository.uncompleteTask(task.id);
    const again = await taskRepository.completeTask(task.id);
    expect(again.completed_at).not.toBeNull();
  });

  it('cannot be completed by a user outside the farm', async () => {
    const { task } = await userWithTask();
    as(await data.createUser('outsider'));
    await expect(taskRepository.completeTask(task.id)).rejects.toBeTruthy();
    const { data: row } = await admin
      .from('growing_tasks')
      .select('completed_at')
      .eq('id', task.id)
      .single();
    expect(row!.completed_at).toBeNull();
  });
});
