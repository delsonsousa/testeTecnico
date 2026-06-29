import { ENV } from '@shared/config/env';
import { City } from '@domain/entities/City';
import { IHttpClient } from '@infrastructure/http/IHttpClient';
import { ForecastResponseDto } from '@data/dto/ForecastDto';

export class OpenMeteoForecastDataSource {
  constructor(private readonly http: IHttpClient) {}

  getToday(city: City): Promise<ForecastResponseDto> {
    return this.http.get<ForecastResponseDto>({
      url: `${ENV.forecastBaseUrl}/forecast`,
      params: {
        latitude: city.latitude,
        longitude: city.longitude,
        hourly:
          'temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,uv_index,relative_humidity_2m,is_day',
        timezone: 'auto',
        forecast_days: 1,
      },
    });
  }
}
