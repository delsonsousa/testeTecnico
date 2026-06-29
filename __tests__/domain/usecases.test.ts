import { SearchCitiesUseCase } from '@domain/usecases/SearchCitiesUseCase';
import { SaveActivityUseCase } from '@domain/usecases/SaveActivityUseCase';
import { GetRecommendationUseCase } from '@domain/usecases/GetRecommendationUseCase';
import { DeleteActivityUseCase } from '@domain/usecases/DeleteActivityUseCase';
import { ListActivitiesUseCase } from '@domain/usecases/ListActivitiesUseCase';
import { RecommendationService } from '@domain/services/RecommendationService';
import { ValidationError } from '@shared/errors/AppError';
import { ICityRepository } from '@domain/repositories/ICityRepository';
import { IForecastRepository } from '@domain/repositories/IForecastRepository';
import { IActivityRepository } from '@domain/repositories/IActivityRepository';
import {
  makeActivity,
  makeActivityDraft,
  makeCity,
  makeForecast,
  makeHour,
} from '../fixtures';

describe('SearchCitiesUseCase', () => {
  let repo: ICityRepository;

  beforeEach(() => {
    repo = { search: jest.fn().mockResolvedValue([makeCity()]) };
  });

  it('skips the call for queries shorter than 2 chars', async () => {
    const uc = new SearchCitiesUseCase(repo);
    expect(await uc.execute('a')).toEqual([]);
    expect(repo.search).not.toHaveBeenCalled();
  });

  it('delegates to the repository for valid queries', async () => {
    const uc = new SearchCitiesUseCase(repo);
    const result = await uc.execute('Rio');
    expect(repo.search).toHaveBeenCalledWith('Rio');
    expect(result).toHaveLength(1);
  });
});

describe('SaveActivityUseCase', () => {
  let repo: IActivityRepository;

  beforeEach(() => {
    repo = {
      list: jest.fn().mockResolvedValue([makeActivity()]),
      create: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: 'x', isPreset: false })),
      update: jest.fn().mockImplementation((id, d) => Promise.resolve({ ...d, id, isPreset: false })),
      remove: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('rejects an empty name', async () => {
    const uc = new SaveActivityUseCase(repo);
    const draft = makeActivityDraft({ name: '  ' });
    await expect(uc.create(draft)).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects an inconsistent temperature range', async () => {
    const uc = new SaveActivityUseCase(repo);
    const draft = {
      ...makeActivityDraft(),
      temperatureC: { idealMin: 30, idealMax: 10, hardMin: 5, hardMax: 40 },
    };
    await expect(uc.create(draft)).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects invalid weather tolerances', async () => {
    const uc = new SaveActivityUseCase(repo);

    await expect(
      uc.create({ ...makeActivityDraft(), maxPrecipitationProbability: 120 }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      uc.create({ ...makeActivityDraft(), maxWindKmh: -1 }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      uc.create({ ...makeActivityDraft(), maxUvIndex: 13 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects drafts where every factor has zero weight', async () => {
    const uc = new SaveActivityUseCase(repo);

    await expect(
      uc.create({
        ...makeActivityDraft(),
        weights: { temperature: 0, precipitation: 0, wind: 0, uv: 0 },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('accepts a valid draft', async () => {
    const uc = new SaveActivityUseCase(repo);
    await expect(uc.create(makeActivityDraft())).resolves.toBeTruthy();
    expect(repo.create).toHaveBeenCalledWith(makeActivityDraft());
  });

  it('validates and updates an existing activity', async () => {
    const uc = new SaveActivityUseCase(repo);
    const draft = makeActivityDraft({ name: 'Remo' });

    await expect(uc.update('custom-1', draft)).resolves.toMatchObject({
      id: 'custom-1',
      name: 'Remo',
    });
    expect(repo.update).toHaveBeenCalledWith('custom-1', draft);
  });
});

describe('ListActivitiesUseCase', () => {
  it('delegates to the repository', async () => {
    const repo: IActivityRepository = {
      list: jest.fn().mockResolvedValue([makeActivity()]),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    await expect(new ListActivitiesUseCase(repo).execute()).resolves.toHaveLength(1);
    expect(repo.list).toHaveBeenCalledTimes(1);
  });
});

describe('DeleteActivityUseCase', () => {
  it('delegates removal to the repository', async () => {
    const repo: IActivityRepository = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    await new DeleteActivityUseCase(repo).execute('custom-1');

    expect(repo.remove).toHaveBeenCalledWith('custom-1');
  });
});

describe('GetRecommendationUseCase', () => {
  it('fetches the forecast then scores it', async () => {
    const forecast = makeForecast([makeHour({ hour: 12, temp: 22 })]);
    const forecastRepo: IForecastRepository = {
      getTodayForecast: jest.fn().mockResolvedValue(forecast),
    };
    const uc = new GetRecommendationUseCase(forecastRepo, new RecommendationService());
    const rec = await uc.execute(makeCity(), makeActivity());
    expect(forecastRepo.getTodayForecast).toHaveBeenCalled();
    expect(rec.scoredHours).toHaveLength(1);
  });
});
