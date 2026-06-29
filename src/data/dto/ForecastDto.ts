export interface ForecastResponseDto {
  timezone: string;
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    uv_index: number[];
    relative_humidity_2m: number[];
    is_day: number[];
  };
}
