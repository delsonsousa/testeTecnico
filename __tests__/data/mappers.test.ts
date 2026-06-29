import { CityMapper } from '@data/mappers/CityMapper';
import { ForecastMapper } from '@data/mappers/ForecastMapper';
import { makeCity } from '../fixtures';

describe('CityMapper', () => {
  it('maps a geocoding DTO into a City, defaulting nulls', () => {
    const city = CityMapper.toDomain({
      id: 42,
      name: 'Niterói',
      latitude: -22.9,
      longitude: -43.1,
      country: null,
      admin1: null,
      timezone: 'America/Sao_Paulo',
    });
    expect(city.country).toBe('');
    expect(city.admin1).toBeNull();
    expect(city.id).toBe(42);
  });
});

describe('ForecastMapper', () => {
  it('zips parallel arrays into hourly entities', () => {
    const dto = {
      timezone: 'America/Sao_Paulo',
      hourly: {
        time: ['2026-06-25T10:00', '2026-06-25T11:00'],
        temperature_2m: [22, 23],
        apparent_temperature: [21, 22],
        precipitation_probability: [10, 20],
        wind_speed_10m: [5, 7],
        uv_index: [3, 4],
        relative_humidity_2m: [58, 64],
        is_day: [1, 1],
      },
    };
    const forecast = ForecastMapper.toDomain(dto, makeCity());
    expect(forecast.hours).toHaveLength(2);
    expect(forecast.hours[0].temperatureC).toBe(22);
    expect(forecast.hours[1].precipitationProbability).toBe(20);
    expect(forecast.hours[0].relativeHumidity).toBe(58);
    expect(forecast.hours[0].isDay).toBe(true);
  });

  it('defaults missing precipitation/uv to 0 and humidity to neutral comfort', () => {
    const missingNumber = undefined as unknown as number;
    const dto = {
      timezone: 'UTC',
      hourly: {
        time: ['2026-06-25T10:00'],
        temperature_2m: [20],
        apparent_temperature: [20],
        precipitation_probability: [missingNumber],
        wind_speed_10m: [4],
        uv_index: [missingNumber],
        relative_humidity_2m: [missingNumber],
        is_day: [1],
      },
    };
    const forecast = ForecastMapper.toDomain(dto, makeCity());
    expect(forecast.hours[0].precipitationProbability).toBe(0);
    expect(forecast.hours[0].uvIndex).toBe(0);
    expect(forecast.hours[0].relativeHumidity).toBe(50);
  });
});
