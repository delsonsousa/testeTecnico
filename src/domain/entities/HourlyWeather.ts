export interface HourlyWeather {
  readonly time: Date;
  readonly temperatureC: number;
  readonly apparentTemperatureC: number;
  readonly precipitationProbability: number;
  readonly windSpeedKmh: number;
  readonly uvIndex: number;
  readonly relativeHumidity: number;
  readonly isDay: boolean;
}

export interface Forecast {
  readonly cityId: number;
  readonly timezone: string;
  readonly hours: readonly HourlyWeather[];
}
