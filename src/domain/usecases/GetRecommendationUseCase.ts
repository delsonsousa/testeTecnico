import { Activity } from '@domain/entities/Activity';
import { City } from '@domain/entities/City';
import { DailyRecommendation } from '@domain/entities/Recommendation';
import { IForecastRepository } from '@domain/repositories/IForecastRepository';
import { RecommendationService } from '@domain/services/RecommendationService';

export class GetRecommendationUseCase {
  constructor(
    private readonly forecastRepository: IForecastRepository,
    private readonly recommendationService: RecommendationService,
  ) {}

  async execute(city: City, activity: Activity): Promise<DailyRecommendation> {
    const forecast = await this.forecastRepository.getTodayForecast(city);
    return this.recommendationService.recommend(forecast, activity);
  }
}
