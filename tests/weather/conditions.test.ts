import { describeWeatherCode } from '../../src/features/weather/conditions';

describe('describeWeatherCode', () => {
  it.each([
    [0, 'Clear'],
    [2, 'Partly cloudy'],
    [3, 'Overcast'],
    [45, 'Fog'],
    [53, 'Drizzle'],
    [63, 'Rain'],
    [81, 'Rain'],
    [73, 'Snow'],
    [86, 'Snow'],
    [95, 'Thunderstorm'],
    [999, 'Thunderstorm'],
  ])('maps code %i to %s', (code, label) => {
    expect(describeWeatherCode(code).label).toBe(label);
  });
});
