import { City } from '@domain/entities/City';
import { Forecast } from '@domain/entities/HourlyWeather';
import { IForecastRepository } from '@domain/repositories/IForecastRepository';
import { OpenMeteoForecastDataSource } from '@data/datasources/OpenMeteoForecastDataSource';
import { ForecastMapper } from '@data/mappers/ForecastMapper';

export class ForecastRepository implements IForecastRepository {
  constructor(private readonly dataSource: OpenMeteoForecastDataSource) {}

  async getTodayForecast(city: City): Promise<Forecast> {
    const dto = await this.dataSource.getToday(city);
    return ForecastMapper.toDomain(dto, city);
  }
}
