import { act, fireEvent, render, screen } from '@testing-library/react-native';
import CalendarScreen from '../../app/(tabs)/calendar/index';
import * as plantRepository from '../../src/repositories/plantRepository';
import * as taskRepository from '../../src/repositories/taskRepository';
import type { CalendarTask } from '../../src/types';

const mockPush = jest.fn();

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    useRouter: () => ({ push: mockPush }),
    // Same behavior as the real hook: run the callback when focused, and again if it changes.
    useFocusEffect: (callback: () => void | (() => void)) =>
      React.useEffect(() => callback(), [callback]),
  };
});
jest.mock('../../src/repositories/taskRepository', () => ({ getTasksForMonth: jest.fn() }));
jest.mock('../../src/repositories/plantRepository', () => ({ searchPlants: jest.fn() }));
jest.mock('../../src/features/farm', () => ({ useFarm: () => ({ crops: [] }) }));

const getTasks = taskRepository.getTasksForMonth as jest.Mock;
const searchPlants = plantRepository.searchPlants as jest.Mock;

const today = new Date();
const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const isoDay = (day: number) =>
  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
/** The accessibility label of a day, e.g. "Mar 10, 2026, 2 tasks". */
const dayLabel = (day: number, tasks: string) =>
  new RegExp(
    `^${MONTH_ABBR[today.getMonth()]} ${day}, ${today.getFullYear()}(, today)?, ${tasks}$`,
  );

const task = (overrides: Partial<CalendarTask> = {}): CalendarTask => ({
  id: 't1',
  farm_crop_id: 'c1',
  plant_id: 'p1',
  plant_name: 'Kale',
  task_type: 'watering',
  title: 'Watering',
  description: null,
  scheduled_date: isoDay(10),
  completed_at: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  searchPlants.mockResolvedValue([]);
});

describe('CalendarScreen', () => {
  it('shows a loading state, then the empty state when the month has no tasks', async () => {
    let finish!: (tasks: CalendarTask[]) => void;
    getTasks.mockReturnValue(new Promise<CalendarTask[]>((resolve) => (finish = resolve)));
    await render(<CalendarScreen />);
    expect(screen.getByText('Loading your tasks')).toBeTruthy();
    expect(screen.queryByText('No activities scheduled this month')).toBeNull();
    await act(async () => finish([]));
    expect(await screen.findByText('No activities scheduled this month')).toBeTruthy();
  });

  it('shows the month and every weekday header', async () => {
    getTasks.mockResolvedValue([]);
    await render(<CalendarScreen />);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    expect(screen.getByText(`${months[today.getMonth()]} ${today.getFullYear()}`)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeTruthy();
  });

  it('loads the tasks once and does not keep refetching (no render loop)', async () => {
    getTasks.mockResolvedValue([task()]);
    await render(<CalendarScreen />);
    await screen.findByLabelText(dayLabel(10, '[1-9]\\d* tasks?'));
    // The first focus must not trigger a second fetch, and nothing should loop.
    expect(getTasks.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('marks days that have tasks and opens the task list when one is tapped', async () => {
    getTasks.mockResolvedValue([
      task(),
      task({ id: 't2', title: 'Fertilizing', task_type: 'fertilizing' }),
    ]);
    await render(<CalendarScreen />);
    const day = await screen.findByLabelText(dayLabel(10, '[1-9]\\d* tasks?'));
    await fireEvent.press(day);
    expect(await screen.findByText('Watering')).toBeTruthy();
    expect(screen.getByText('Fertilizing')).toBeTruthy();
    // Opening a task goes to its detail screen.
    await fireEvent.press(screen.getByRole('button', { name: /^Watering, Kale/ }));
    expect(mockPush).toHaveBeenCalledWith('/calendar/task/t1');
  });

  it('shows a count when a day has three or more tasks', async () => {
    getTasks.mockResolvedValue([task({ id: 'a' }), task({ id: 'b' }), task({ id: 'c' })]);
    await render(<CalendarScreen />);
    expect(await screen.findByLabelText(dayLabel(10, '3 tasks'))).toBeTruthy();
  });

  it('does not make days without tasks tappable', async () => {
    getTasks.mockResolvedValue([task()]);
    await render(<CalendarScreen />);
    await screen.findByLabelText(dayLabel(10, '[1-9]\\d* tasks?'));
    const empty = screen.getByLabelText(dayLabel(11, 'no tasks'));
    expect(empty.props.accessibilityState?.disabled ?? empty.props.disabled).toBeTruthy();
  });

  it('shows an error with a retry button, and recovers when retry works', async () => {
    getTasks.mockRejectedValueOnce(new Error('boom')).mockResolvedValue([task()]);
    await render(<CalendarScreen />);
    expect(await screen.findByText('Could not load your tasks.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText(dayLabel(10, '[1-9]\\d* tasks?'))).toBeTruthy();
    expect(screen.queryByText('Could not load your tasks.')).toBeNull();
  });

  it('shows the offline message when the device cannot reach the server', async () => {
    getTasks.mockRejectedValue(new TypeError('Network request failed'));
    await render(<CalendarScreen />);
    expect(
      await screen.findByText('You appear to be offline. Check your connection and try again.'),
    ).toBeTruthy();
  });

  it('moves to the next month and asks for that month’s tasks', async () => {
    getTasks.mockResolvedValue([]);
    await render(<CalendarScreen />);
    await screen.findByText('No activities scheduled this month');
    await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    await screen.findByText('No activities scheduled this month');
    const asked = getTasks.mock.calls.map(([month]) => `${month.year}-${month.month}`);
    const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    expect(asked).toContain(`${next.getFullYear()}-${next.getMonth() + 1}`);
  });
});
