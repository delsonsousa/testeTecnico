import { FetchHttpClient } from '@infrastructure/http/FetchHttpClient';
import { AsyncStorageKeyValueStore } from '@infrastructure/cache/AsyncStorageKeyValueStore';

import { OpenMeteoCityDataSource } from '@data/datasources/OpenMeteoCityDataSource';
import { OpenMeteoForecastDataSource } from '@data/datasources/OpenMeteoForecastDataSource';
import { CityRepository } from '@data/repositories/CityRepository';
import { ForecastRepository } from '@data/repositories/ForecastRepository';
import { ActivityRepository } from '@data/repositories/ActivityRepository';

import { RecommendationService } from '@domain/services/RecommendationService';
import { SearchCitiesUseCase } from '@domain/usecases/SearchCitiesUseCase';
import { GetRecommendationUseCase } from '@domain/usecases/GetRecommendationUseCase';
import { ListActivitiesUseCase } from '@domain/usecases/ListActivitiesUseCase';
import { SaveActivityUseCase } from '@domain/usecases/SaveActivityUseCase';
import { DeleteActivityUseCase } from '@domain/usecases/DeleteActivityUseCase';

function buildContainer() {
  const http = new FetchHttpClient();
  const store = new AsyncStorageKeyValueStore();

  const cityRepository = new CityRepository(new OpenMeteoCityDataSource(http));
  const forecastRepository = new ForecastRepository(
    new OpenMeteoForecastDataSource(http),
  );
  const activityRepository = new ActivityRepository(store);

  const recommendationService = new RecommendationService();

  return {
    searchCities: new SearchCitiesUseCase(cityRepository),
    getRecommendation: new GetRecommendationUseCase(
      forecastRepository,
      recommendationService,
    ),
    listActivities: new ListActivitiesUseCase(activityRepository),
    saveActivity: new SaveActivityUseCase(activityRepository),
    deleteActivity: new DeleteActivityUseCase(activityRepository),
  };
}

export type Container = ReturnType<typeof buildContainer>;
export const container: Container = buildContainer();
