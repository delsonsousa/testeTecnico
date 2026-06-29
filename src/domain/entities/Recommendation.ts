import { HourlyWeather } from './HourlyWeather';

export interface ScoredHour {
  readonly hour: HourlyWeather;
  readonly score: number;
  readonly factors: {
    readonly temperature: number;
    readonly precipitation: number;
    readonly wind: number;
    readonly uv: number;
    readonly humidity: number;
    readonly timeOfDay: number;
  };
}

export interface RecommendationWindow {
  readonly start: Date;
  readonly end: Date;
  readonly averageScore: number;
  readonly headline: string;
  readonly reason: string;
}

export interface DailyRecommendation {
  readonly activityId: string;
  readonly scoredHours: readonly ScoredHour[];
  readonly bestWindow: RecommendationWindow | null;
}
