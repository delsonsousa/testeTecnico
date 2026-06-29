import { OpenMeteoCityDataSource } from '@data/datasources/OpenMeteoCityDataSource';
import { OpenMeteoForecastDataSource } from '@data/datasources/OpenMeteoForecastDataSource';
import { ForecastRepository } from '@data/repositories/ForecastRepository';
import { IHttpClient } from '@infrastructure/http/IHttpClient';
import { ENV } from '@shared/config/env';
import { makeCity } from '../fixtures';

describe('OpenMeteo data sources', () => {
  it('builds the geocoding request with the expected params', async () => {
    const http: IHttpClient = { get: jest.fn().mockResolvedValue({ results: [] }) };
    const ds = new OpenMeteoCityDataSource(http);

    await ds.search('Niterói');

    expect(http.get).toHaveBeenCalledWith({
      url: `${ENV.geocodingBaseUrl}/search`,
      params: { name: 'Niterói', count: 8, language: ENV.language, format: 'json' },
    });
  });

  it('requests the hourly fields needed by the recommendation', async () => {
    const http: IHttpClient = { get: jest.fn().mockResolvedValue({}) };
    const ds = new OpenMeteoForecastDataSource(http);
    const city = makeCity();

    await ds.getToday(city);

    expect(http.get).toHaveBeenCalledWith({
      url: `${ENV.forecastBaseUrl}/forecast`,
      params: expect.objectContaining({
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: 'auto',
        forecast_days: 1,
        hourly: expect.stringContaining('relative_humidity_2m'),
      }),
    });
    expect((http.get as jest.Mock).mock.calls[0][0].params.hourly).toContain('is_day');
  });
});

describe('ForecastRepository', () => {
  it('maps the datasource DTO into a domain forecast', async () => {
    const dataSource = {
      getToday: jest.fn().mockResolvedValue({
        timezone: 'America/Sao_Paulo',
        hourly: {
          time: ['2026-06-25T09:00'],
          temperature_2m: [20],
          apparent_temperature: [22],
          precipitation_probability: [15],
          wind_speed_10m: [8],
          uv_index: [2],
          relative_humidity_2m: [60],
          is_day: [1],
        },
      }),
    } as unknown as OpenMeteoForecastDataSource;

    const city = makeCity({ id: 99 });
    const repo = new ForecastRepository(dataSource);

    const forecast = await repo.getTodayForecast(city);

    expect(dataSource.getToday).toHaveBeenCalledWith(city);
    expect(forecast.cityId).toBe(99);
    expect(forecast.hours[0].apparentTemperatureC).toBe(22);
  });
});
