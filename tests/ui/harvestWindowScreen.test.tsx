import { fireEvent, render, screen } from '@testing-library/react-native';
import HarvestWindowScreen from '../../app/(tabs)/calendar/harvest/[cropId]';
import * as taskRepository from '../../src/repositories/taskRepository';
import type { CalendarTask } from '../../src/types';

let mockCropId = 'crop-1';
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ cropId: mockCropId }),
  Stack: { Screen: () => null },
}));
jest.mock('../../src/repositories/taskRepository', () => ({ getHarvestTasks: jest.fn() }));
const getHarvestTasks = taskRepository.getHarvestTasks as jest.Mock;

const task = (overrides: Partial<CalendarTask>): CalendarTask => ({
  id: 't',
  farm_crop_id: 'crop-1',
  plant_id: 'kale',
  plant_name: 'Kale',
  task_type: 'harvest_start',
  title: 'x',
  description: null,
  scheduled_date: '2026-03-10',
  completed_at: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCropId = 'crop-1';
  getHarvestTasks.mockResolvedValue([
    task({ task_type: 'maturity', scheduled_date: '2026-03-10' }),
    task({ task_type: 'harvest_start', scheduled_date: '2026-03-10' }),
    task({ task_type: 'harvest_end', scheduled_date: '2026-04-05' }),
    task({
      farm_crop_id: 'crop-2',
      plant_name: 'Peas',
      task_type: 'harvest_start',
      scheduled_date: '2026-05-01',
    }),
    task({
      farm_crop_id: 'crop-2',
      plant_name: 'Peas',
      task_type: 'harvest_end',
      scheduled_date: '2026-05-09',
    }),
  ]);
});

describe('HarvestWindowScreen', () => {
  it('explains the bar for the crop in the route', async () => {
    await render(<HarvestWindowScreen />);
    expect(await screen.findByText('Harvest window')).toBeTruthy();
    expect(screen.getByText('Kale')).toBeTruthy();
    // Maturity and the harvest window both begin on Mar 10.
    expect(screen.getAllByText('Mar 10, 2026')).toHaveLength(2);
    expect(screen.getByText('Apr 5, 2026')).toBeTruthy();
    expect(screen.getByText('Expected maturity')).toBeTruthy();
    expect(screen.getByText(/The green bar runs from Mar 10, 2026 to Apr 5, 2026/)).toBeTruthy();
    expect(screen.queryByText('Peas')).toBeNull();
  });
  it('shows a loading state first', async () => {
    getHarvestTasks.mockReturnValue(new Promise(() => {}));
    await render(<HarvestWindowScreen />);
    expect(screen.getByText('Loading harvest window')).toBeTruthy();
  });
  it('says so when the crop has no window', async () => {
    mockCropId = 'unknown';
    await render(<HarvestWindowScreen />);
    expect(await screen.findByText('That harvest window could not be found')).toBeTruthy();
  });
  it('offers a retry when loading fails', async () => {
    getHarvestTasks.mockRejectedValueOnce(new Error('Network request failed'));
    await render(<HarvestWindowScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Kale')).toBeTruthy();
  });
});
