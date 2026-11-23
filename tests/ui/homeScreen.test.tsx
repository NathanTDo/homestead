import { render, screen } from '@testing-library/react-native';
import { OFFLINE_MESSAGE } from '../../src/components/common';
import HomeScreen from '../../app/(tabs)/index';
import * as openMeteo from '../../src/services/weather/openMeteo';

let mockLocation: string | null = '94103';
jest.mock('../../src/features/farm', () => ({
  useFarm: () => ({ farm: { name: 'Test Farm', location: mockLocation } }),
}));
jest.mock('../../src/services/weather/openMeteo', () => ({
  geocodeLocation: jest.fn(),
  fetchCurrentWeather: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLocation = '94103';
  (openMeteo.geocodeLocation as jest.Mock).mockResolvedValue({
    name: 'San Francisco',
    latitude: 1,
    longitude: 2,
  });
  (openMeteo.fetchCurrentWeather as jest.Mock).mockResolvedValue({
    temperatureF: 61.6,
    weatherCode: 61,
    highF: 66.2,
    lowF: 49.4,
  });
});

describe('HomeScreen weather widget', () => {
  it('shows the place, current temperature, condition, high and low', async () => {
    await render(<HomeScreen />);
    expect(screen.queryByText('Test Farm')).toBeNull();
    expect(await screen.findByText('San Francisco')).toBeTruthy();
    expect(screen.getByText('62°')).toBeTruthy();
    expect(screen.getByText('Rain')).toBeTruthy();
    expect(screen.getByText('H: 66° L: 49°')).toBeTruthy();
    expect(openMeteo.geocodeLocation).toHaveBeenCalledWith('94103');
  });
  it('shows a loading indicator first', async () => {
    (openMeteo.geocodeLocation as jest.Mock).mockReturnValue(new Promise(() => {}));
    await render(<HomeScreen />);
    expect(screen.getByLabelText('Loading weather')).toBeTruthy();
  });
  it('says so when the farm has no location, without calling the weather service', async () => {
    mockLocation = null;
    await render(<HomeScreen />);
    expect(screen.getByText('No farm location set')).toBeTruthy();
    expect(openMeteo.geocodeLocation).not.toHaveBeenCalled();
  });
  it('says so when the location cannot be found', async () => {
    (openMeteo.geocodeLocation as jest.Mock).mockResolvedValue(null);
    await render(<HomeScreen />);
    expect(await screen.findByText('Could not find "94103"')).toBeTruthy();
  });
  it('shows an offline message with a retry when the request fails', async () => {
    (openMeteo.fetchCurrentWeather as jest.Mock).mockRejectedValue(
      new Error('Network request failed'),
    );
    await render(<HomeScreen />);
    expect(await screen.findByText(OFFLINE_MESSAGE)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
