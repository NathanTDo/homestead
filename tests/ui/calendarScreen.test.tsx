import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
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
jest.mock('../../src/repositories/taskRepository', () => ({
  getTasksForMonth: jest.fn(),
  getHarvestTasks: jest.fn(),
}));
jest.mock('../../src/repositories/plantRepository', () => ({ searchPlants: jest.fn() }));
jest.mock('../../src/features/farm', () => ({ useFarm: () => ({ crops: [] }) }));

const getTasks = taskRepository.getTasksForMonth as jest.Mock;
const getHarvestTasks = taskRepository.getHarvestTasks as jest.Mock;
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
  getHarvestTasks.mockResolvedValue([]);
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

  // Day numbers are placed in the grid by weekday. Find a run of days inside one row of this month.
  const weekdayOf = (day: number) => new Date(today.getFullYear(), today.getMonth(), day).getDay();
  const startOfRow = (() => {
    for (let day = 1; day <= 21; day++) if (weekdayOf(day) === 1) return day; // a Monday
    return 1;
  })();
  const harvest = (start: number, end: number) => [
    task({
      id: 'h1',
      title: 'Harvest window begins',
      task_type: 'harvest_start',
      scheduled_date: isoDay(start),
    }),
    task({
      id: 'h2',
      title: 'Harvest window ends',
      task_type: 'harvest_end',
      scheduled_date: isoDay(end),
    }),
  ];

  it('draws a harvest bar across the days of a harvest window', async () => {
    getTasks.mockResolvedValue([task({ scheduled_date: isoDay(startOfRow + 5) })]);
    getHarvestTasks.mockResolvedValue(harvest(startOfRow, startOfRow + 2));
    await render(<CalendarScreen />);
    const first = startOfRow;
    expect(await screen.findByLabelText(dayLabel(first, 'no tasks, harvest window'))).toBeTruthy();
    expect(screen.getByLabelText(dayLabel(first + 1, 'no tasks, harvest window'))).toBeTruthy();
    expect(screen.getByLabelText(dayLabel(first + 2, 'no tasks, harvest window'))).toBeTruthy();
    expect(screen.getByLabelText(dayLabel(first + 3, 'no tasks'))).toBeTruthy();
    expect(screen.getByLabelText(dayLabel(first - 1, 'no tasks'))).toBeTruthy();
    expect(screen.getAllByTestId('harvest-bar')).toHaveLength(3);
  });
  it('starts the bar at the middle of the first day and ends it at the middle of the last', async () => {
    getTasks.mockResolvedValue([]);
    getHarvestTasks.mockResolvedValue(harvest(startOfRow, startOfRow + 2));
    await render(<CalendarScreen />);
    const bars = (await screen.findAllByTestId('harvest-bar')).map((bar) =>
      StyleSheet.flatten(bar.props.style),
    );
    expect(bars).toHaveLength(3);
    // First day: from the middle, rounded on the left, open on the right.
    expect(bars[0]).toMatchObject({ left: '50%', borderTopLeftRadius: 4, right: 0 });
    expect(bars[0].borderTopRightRadius).toBeUndefined();
    // Middle day: edge to edge with square ends.
    expect(bars[1]).toMatchObject({ left: 0, right: 0 });
    expect(bars[1].borderTopLeftRadius).toBeUndefined();
    // Last day: open on the left, to the middle, rounded on the right.
    expect(bars[2]).toMatchObject({ left: 0, right: '50%', borderTopRightRadius: 4 });
    expect(bars[2].borderTopLeftRadius).toBeUndefined();
    expect(bars[0].backgroundColor).toBe('#22C55E');
  });
  it('shows a one-day window as a dot', async () => {
    getTasks.mockResolvedValue([]);
    getHarvestTasks.mockResolvedValue(harvest(startOfRow, startOfRow));
    await render(<CalendarScreen />);
    const [bar] = await screen.findAllByTestId('harvest-bar');
    expect(StyleSheet.flatten(bar.props.style)).toMatchObject({ width: 7, height: 7 });
  });
  it('ends the bar at Saturday and starts it again at Sunday with rounded ends', async () => {
    // A window from a Friday to the following Monday, wrapping over the weekend.
    let friday = 1;
    for (let day = 1; day <= 21; day++)
      if (weekdayOf(day) === 5) {
        friday = day;
        break;
      }
    getTasks.mockResolvedValue([]);
    getHarvestTasks.mockResolvedValue(harvest(friday, friday + 3));
    await render(<CalendarScreen />);
    const bars = (await screen.findAllByTestId('harvest-bar')).map((bar) =>
      StyleSheet.flatten(bar.props.style),
    );
    // Fri, Sat, Sun, Mon.
    expect(bars).toHaveLength(4);
    expect(bars[0]).toMatchObject({ left: '50%', right: 0 });
    // Saturday ends in the middle with a rounded end. The segment is open on its left.
    expect(bars[1]).toMatchObject({ left: 0, right: '50%', borderTopRightRadius: 4 });
    // Sunday starts in the middle with a rounded start.
    expect(bars[2]).toMatchObject({ left: '50%', borderTopLeftRadius: 4, right: 0 });
    expect(bars[3]).toMatchObject({ left: 0, right: '50%', borderTopRightRadius: 4 });
  });
  it('opens the day list from a day that only has the bar, and explains the bar', async () => {
    getTasks.mockResolvedValue([]);
    getHarvestTasks.mockResolvedValue(harvest(startOfRow, startOfRow + 2));
    await render(<CalendarScreen />);
    const middle = await screen.findByLabelText(
      dayLabel(startOfRow + 1, 'no tasks, harvest window'),
    );
    expect(middle.props.accessibilityState?.disabled ?? middle.props.disabled).toBeFalsy();
    await fireEvent.press(middle);
    expect(await screen.findByText('Harvest window')).toBeTruthy();
    expect(screen.getByText(/^Kale · .* to .*$/)).toBeTruthy();
    expect(screen.queryByText('No activities on this date')).toBeNull();
    // Opening it goes to the harvest window screen for that crop.
    await fireEvent.press(screen.getByRole('button', { name: 'Harvest window, Kale' }));
    expect(mockPush).toHaveBeenCalledWith('/calendar/harvest/c1');
  });
  it('extends the bar to the maturity day and gives that day no dot of its own', async () => {
    getTasks.mockResolvedValue([
      task({ id: 'm', task_type: 'maturity', scheduled_date: isoDay(startOfRow) }),
    ]);
    getHarvestTasks.mockResolvedValue([
      task({ id: 'm', task_type: 'maturity', scheduled_date: isoDay(startOfRow) }),
      task({ id: 'h1', task_type: 'harvest_start', scheduled_date: isoDay(startOfRow + 1) }),
      task({ id: 'h2', task_type: 'harvest_end', scheduled_date: isoDay(startOfRow + 2) }),
    ]);
    await render(<CalendarScreen />);
    // The maturity day is part of the bar and is still tappable.
    expect(
      await screen.findByLabelText(dayLabel(startOfRow, '1 task, harvest window')),
    ).toBeTruthy();
    expect(screen.getAllByTestId('harvest-bar')).toHaveLength(3);
  });
  it('leaves out the dot for harvest window begins and ends, but keeps the day tappable', async () => {
    getTasks.mockResolvedValue(harvest(startOfRow, startOfRow + 2));
    getHarvestTasks.mockResolvedValue(harvest(startOfRow, startOfRow + 2));
    await render(<CalendarScreen />);
    const day = await screen.findByLabelText(dayLabel(startOfRow, '1 task, harvest window'));
    expect(day.props.accessibilityState?.disabled ?? day.props.disabled).toBeFalsy();
    await fireEvent.press(day);
    expect(await screen.findByText('Harvest window begins')).toBeTruthy();
  });
  it('still shows the calendar when the harvest windows fail to load', async () => {
    getTasks.mockResolvedValue([task()]);
    getHarvestTasks.mockRejectedValue(new Error('boom'));
    await render(<CalendarScreen />);
    expect(await screen.findByLabelText(dayLabel(10, '1 task'))).toBeTruthy();
    expect(screen.queryAllByTestId('harvest-bar')).toHaveLength(0);
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
