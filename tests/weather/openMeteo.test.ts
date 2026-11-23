import {
  fetchCurrentWeather,
  fetchForecast,
  geocodeLocation,
} from '../../src/services/weather/openMeteo';

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});
const respond = (body: unknown, ok = true, status = 200) =>
  fetchMock.mockResolvedValueOnce({ ok, status, json: async () => body });

describe('geocodeLocation', () => {
  it('searches a US zip code with the US country filter', async () => {
    respond({ results: [{ name: 'San Francisco', latitude: 37.7, longitude: -122.4 }] });
    const point = await geocodeLocation(' 94103-1234 ');
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get('name')).toBe('94103');
    expect(url.searchParams.get('countryCode')).toBe('US');
    expect(point).toEqual({ name: 'San Francisco', latitude: 37.7, longitude: -122.4 });
  });
  it('searches the city part of "City, State" and prefers a matching state', async () => {
    respond({
      results: [
        { name: 'Portland', latitude: 1, longitude: 1, admin1: 'Maine' },
        { name: 'Portland', latitude: 2, longitude: 2, admin1: 'Oregon' },
      ],
    });
    const point = await geocodeLocation('Portland, Oregon');
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('name')).toBe('Portland');
    expect(point?.latitude).toBe(2);
  });
  it('returns null for blank input without calling the network', async () => {
    expect(await geocodeLocation('  ')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('returns null when nothing matches', async () => {
    respond({});
    expect(await geocodeLocation('zzzzzz')).toBeNull();
  });
  it('throws when the service fails', async () => {
    respond({}, false, 500);
    await expect(geocodeLocation('94103')).rejects.toThrow('500');
  });
});

describe('fetchForecast', () => {
  it('maps the daily arrays to forecast days', async () => {
    respond({
      daily: {
        time: ['2026-01-01', '2026-01-02'],
        temperature_2m_max: [60, 70],
        temperature_2m_min: [40, 50],
        precipitation_sum: [0, 0.3],
      },
    });
    const days = await fetchForecast({ name: 'X', latitude: 1, longitude: 2 });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get('temperature_unit')).toBe('fahrenheit');
    expect(days).toEqual([
      { date: '2026-01-01', highF: 60, lowF: 40, rainInches: 0 },
      { date: '2026-01-02', highF: 70, lowF: 50, rainInches: 0.3 },
    ]);
  });
});

describe('fetchCurrentWeather', () => {
  it('returns the current reading with today’s high and low', async () => {
    respond({
      current: { temperature_2m: 61.6, weather_code: 3 },
      daily: { temperature_2m_max: [66], temperature_2m_min: [49] },
    });
    const weather = await fetchCurrentWeather({ name: 'X', latitude: 1, longitude: 2 });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get('current')).toBe('temperature_2m,weather_code');
    expect(url.searchParams.get('temperature_unit')).toBe('fahrenheit');
    expect(weather).toEqual({ temperatureF: 61.6, weatherCode: 3, highF: 66, lowF: 49 });
  });
});
