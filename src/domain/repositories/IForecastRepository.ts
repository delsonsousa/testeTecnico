import { City } from '@domain/entities/City';
import { Forecast } from '@domain/entities/HourlyWeather';

export interface IForecastRepository {
  getTodayForecast(city: City): Promise<Forecast>;
}
