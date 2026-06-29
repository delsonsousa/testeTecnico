import { Activity, ActivityDraft } from '@domain/entities/Activity';
import { City } from '@domain/entities/City';
import { Forecast, HourlyWeather } from '@domain/entities/HourlyWeather';
import { ScoredHour } from '@domain/entities/Recommendation';

export const makeCity = (over: Partial<City> = {}): City => ({
  id: 1,
  name: 'Rio de Janeiro',
  country: 'Brasil',
  admin1: 'Rio de Janeiro',
  latitude: -22.9,
  longitude: -43.2,
  timezone: 'America/Sao_Paulo',
  ...over,
});

export const makeActivity = (over: Partial<Activity> = {}): Activity => ({
  id: 'preset-walk',
  name: 'Caminhada',
  emoji: '🚶',
  weights: { temperature: 3, precipitation: 4, wind: 2, uv: 1 },
  temperatureC: { idealMin: 16, idealMax: 26, hardMin: 5, hardMax: 36 },
  maxPrecipitationProbability: 50,
  maxWindKmh: 35,
  maxUvIndex: 9,
  isPreset: true,
  ...over,
});

export const makeActivityDraft = (
  over: Partial<ActivityDraft> = {},
): ActivityDraft => {
  const activity = makeActivity(over);
  return {
    name: activity.name,
    emoji: activity.emoji,
    weights: activity.weights,
    temperatureC: activity.temperatureC,
    maxPrecipitationProbability: activity.maxPrecipitationProbability,
    maxWindKmh: activity.maxWindKmh,
    maxUvIndex: activity.maxUvIndex,
    ...over,
  };
};

interface HourSpec {
  hour: number;
  temp?: number;
  precip?: number;
  wind?: number;
  uv?: number;
  humidity?: number;
  isDay?: boolean;
}

export const makeHour = (spec: HourSpec): HourlyWeather => {
  const t = new Date(2026, 5, 25, spec.hour, 0, 0);
  return {
    time: t,
    temperatureC: spec.temp ?? 22,
    apparentTemperatureC: spec.temp ?? 22,
    precipitationProbability: spec.precip ?? 0,
    windSpeedKmh: spec.wind ?? 5,
    uvIndex: spec.uv ?? 2,
    relativeHumidity: spec.humidity ?? 55,
    isDay: spec.isDay ?? true,
  };
};

export const makeForecast = (hours: HourlyWeather[]): Forecast => ({
  cityId: 1,
  timezone: 'America/Sao_Paulo',
  hours,
});

export const makeScoredHour = (
  spec: HourSpec & { score?: number; factors?: Partial<ScoredHour['factors']> },
): ScoredHour => ({
  hour: makeHour(spec),
  score: spec.score ?? 80,
  factors: {
    temperature: 100,
    precipitation: 100,
    wind: 100,
    uv: 100,
    humidity: 100,
    timeOfDay: 100,
    ...spec.factors,
  },
});
