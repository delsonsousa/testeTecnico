import { CityRepository } from '@data/repositories/CityRepository';
import { OpenMeteoCityDataSource } from '@data/datasources/OpenMeteoCityDataSource';
import { IHttpClient } from '@infrastructure/http/IHttpClient';

describe('CityRepository', () => {
  it('maps results and returns [] when the API omits results', async () => {
    const http: IHttpClient = { get: jest.fn().mockResolvedValue({}) };
    const repo = new CityRepository(new OpenMeteoCityDataSource(http));
    expect(await repo.search('zzz')).toEqual([]);
  });

  it('maps DTO results into domain cities', async () => {
    const http: IHttpClient = {
      get: jest.fn().mockResolvedValue({
        results: [
          {
            id: 1,
            name: 'Rio',
            latitude: -22.9,
            longitude: -43.2,
            country: 'Brasil',
            admin1: 'RJ',
            timezone: 'America/Sao_Paulo',
          },
        ],
      }),
    };
    const repo = new CityRepository(new OpenMeteoCityDataSource(http));
    const cities = await repo.search('Rio');
    expect(cities[0].name).toBe('Rio');
    expect(cities[0].country).toBe('Brasil');
  });
});
