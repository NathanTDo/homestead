import { act, fireEvent, render, screen } from '@testing-library/react-native';
import PlantsScreen from '../../app/(tabs)/plants/index';
import * as plantRepository from '../../src/repositories/plantRepository';
import type { FarmCrop, Plant } from '../../src/types';

const mockPush = jest.fn();
let mockCrops: FarmCrop[] = [];

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../src/repositories/plantRepository', () => ({ searchPlants: jest.fn() }));
jest.mock('../../src/features/farm', () => ({ useFarm: () => ({ crops: mockCrops }) }));

const searchPlants = plantRepository.searchPlants as jest.Mock;

const plant = (name: string): Plant => ({
  id: name.toLowerCase(),
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  description: null,
  image_url: null,
  created_at: '',
});
const PLANTS = ['Garlic', 'Kale', 'Kohlrabi', 'Bok Choy'].map(plant);

beforeEach(() => {
  jest.clearAllMocks();
  mockCrops = [];
  searchPlants.mockResolvedValue(PLANTS);
});

describe('PlantsScreen', () => {
  it('shows a loading state, then every plant', async () => {
    let finish!: (plants: Plant[]) => void;
    searchPlants.mockReturnValue(new Promise<Plant[]>((resolve) => (finish = resolve)));
    await render(<PlantsScreen />);
    expect(screen.getByText('Loading plants')).toBeTruthy();
    await act(async () => finish(PLANTS));
    expect(await screen.findByRole('button', { name: 'Garlic' })).toBeTruthy();
    for (const p of PLANTS) expect(screen.getByRole('button', { name: p.name })).toBeTruthy();
  });

  it('asks the user to add plants when they have none selected', async () => {
    await render(<PlantsScreen />);
    expect(await screen.findByText('Add plants to get started')).toBeTruthy();
    expect(screen.getByText('0 / 5')).toBeTruthy();
  });

  it('shows the selected plants and the counter', async () => {
    mockCrops = [{ id: 'c1', plant_id: 'kale', status: 'planned' } as FarmCrop];
    await render(<PlantsScreen />);
    await screen.findByRole('button', { name: 'Garlic' });
    expect(screen.queryByText('Add plants to get started')).toBeNull();
    expect(screen.getByText('1 / 5')).toBeTruthy();
  });

  it('filters by name, ignoring case, and says so when nothing matches', async () => {
    await render(<PlantsScreen />);
    await screen.findByRole('button', { name: 'Garlic' });
    await fireEvent.changeText(screen.getByLabelText('Search plants'), 'KO');
    expect(screen.getByRole('button', { name: 'Kohlrabi' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Garlic' })).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Search plants'), 'zzz');
    expect(screen.getByText('No plants match your search')).toBeTruthy();
    expect(screen.getByText('Try a different name.')).toBeTruthy();
  });

  it('opens a plant when its card is tapped', async () => {
    await render(<PlantsScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Bok Choy' }));
    expect(mockPush).toHaveBeenCalledWith('/plants/bok-choy');
  });

  it('shows an error with retry, and recovers', async () => {
    searchPlants.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(PLANTS);
    await render(<PlantsScreen />);
    expect(await screen.findByText('Could not load plants.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: 'Garlic' })).toBeTruthy();
  });

  it('shows the offline message when the device is offline', async () => {
    searchPlants.mockRejectedValue(new Error('Network request failed'));
    await render(<PlantsScreen />);
    expect(
      await screen.findByText('You appear to be offline. Check your connection and try again.'),
    ).toBeTruthy();
  });
});
