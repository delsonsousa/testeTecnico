import { City } from '@domain/entities/City';
import { Forecast, HourlyWeather } from '@domain/entities/HourlyWeather';
import { ForecastResponseDto } from '@data/dto/ForecastDto';

export const ForecastMapper = {
  toDomain(dto: ForecastResponseDto, city: City): Forecast {
    const h = dto.hourly;
    const hours: HourlyWeather[] = h.time.map((iso, i) => ({
      // Open-Meteo returns local time (timezone applied) without offset suffix.
      time: new Date(iso),
      temperatureC: h.temperature_2m[i],
      apparentTemperatureC: h.apparent_temperature[i],
      precipitationProbability: h.precipitation_probability[i] ?? 0,
      windSpeedKmh: h.wind_speed_10m[i],
      uvIndex: h.uv_index[i] ?? 0,
      relativeHumidity: h.relative_humidity_2m[i] ?? 50,
      isDay: h.is_day[i] === 1,
    }));
    return { cityId: city.id, timezone: dto.timezone, hours };
  },
};
