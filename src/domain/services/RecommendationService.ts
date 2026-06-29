import { Activity } from '@domain/entities/Activity';
import { Forecast, HourlyWeather } from '@domain/entities/HourlyWeather';
import {
  DailyRecommendation,
  RecommendationWindow,
  ScoredHour,
} from '@domain/entities/Recommendation';

export class RecommendationService {
  private static readonly MIN_GOOD_SCORE = 55;
  private static readonly MIN_WINDOW_HOURS = 1;
  private static readonly CONTEXT_WEIGHTS = {
    humidity: 1,
    timeOfDay: 1.5,
  } as const;

  recommend(forecast: Forecast, activity: Activity): DailyRecommendation {
    const candidates = forecast.hours.filter((h) => h.isDay);

    const scoredHours = candidates.map((hour) => this.scoreHour(hour, activity));
    const bestWindow = this.findBestWindow(scoredHours);

    return { activityId: activity.id, scoredHours, bestWindow };
  }

  private scoreHour(hour: HourlyWeather, activity: Activity): ScoredHour {
    const temperature = this.scoreTemperature(hour.apparentTemperatureC, activity);
    const precipitation = this.scoreCeiling(
      hour.precipitationProbability,
      activity.maxPrecipitationProbability,
    );
    const wind = this.scoreCeiling(hour.windSpeedKmh, activity.maxWindKmh);
    const uv = this.scoreCeiling(hour.uvIndex, activity.maxUvIndex);
    const humidity = this.scoreHumidity(hour.relativeHumidity);
    const timeOfDay = this.scoreTimeOfDay(hour);

    const w = activity.weights;
    const context = RecommendationService.CONTEXT_WEIGHTS;
    const totalWeight =
      w.temperature +
      w.precipitation +
      w.wind +
      w.uv +
      context.humidity +
      context.timeOfDay;
    const weighted =
      (temperature * w.temperature +
        precipitation * w.precipitation +
        wind * w.wind +
        uv * w.uv +
        humidity * context.humidity +
        timeOfDay * context.timeOfDay) /
      totalWeight;

    return {
      hour,
      score: Math.round(weighted * 100),
      factors: {
        temperature: Math.round(temperature * 100),
        precipitation: Math.round(precipitation * 100),
        wind: Math.round(wind * 100),
        uv: Math.round(uv * 100),
        humidity: Math.round(humidity * 100),
        timeOfDay: Math.round(timeOfDay * 100),
      },
    };
  }

  private scoreTemperature(tempC: number, activity: Activity): number {
    const { idealMin, idealMax, hardMin, hardMax } = activity.temperatureC;
    if (tempC >= idealMin && tempC <= idealMax) return 1;
    if (tempC < idealMin) {
      if (tempC <= hardMin) return 0;
      return (tempC - hardMin) / (idealMin - hardMin);
    }
    if (tempC >= hardMax) return 0;
    return (hardMax - tempC) / (hardMax - idealMax);
  }

  private scoreCeiling(value: number, max: number): number {
    if (max <= 0) return value <= 0 ? 1 : 0;
    return this.clamp01(1 - value / max);
  }

  private scoreHumidity(humidity: number): number {
    if (humidity >= 40 && humidity <= 70) return 1;
    if (humidity < 40) return this.clamp01(humidity / 40);
    return this.clamp01(1 - (humidity - 70) / 30);
  }

  private scoreTimeOfDay(hour: HourlyWeather): number {
    const h = hour.time.getHours();
    if (h >= 6 && h <= 10) return 1;
    if (h >= 16 && h <= 19) return 0.95;
    if (h >= 11 && h <= 15) {
      const heatOrSun = hour.apparentTemperatureC >= 30 || hour.uvIndex >= 7;
      return heatOrSun ? 0.45 : 0.75;
    }
    return 0.5;
  }

  private clamp01(n: number): number {
    return Math.max(0, Math.min(1, n));
  }

  private findBestWindow(scored: readonly ScoredHour[]): RecommendationWindow | null {
    const runs: ScoredHour[][] = [];
    let current: ScoredHour[] = [];

    for (const sh of scored) {
      if (sh.score >= RecommendationService.MIN_GOOD_SCORE) {
        current.push(sh);
      } else if (current.length) {
        runs.push(current);
        current = [];
      }
    }
    if (current.length) runs.push(current);

    const viable = runs.filter(
      (r) => r.length >= RecommendationService.MIN_WINDOW_HOURS,
    );
    if (!viable.length) return null;

    const best = viable.reduce((a, b) => {
      if (b.length !== a.length) return b.length > a.length ? b : a;
      return this.avg(b) > this.avg(a) ? b : a;
    });

    return this.buildWindow(best);
  }

  private buildWindow(run: ScoredHour[]): RecommendationWindow {
    const start = run[0].hour.time;
    const last = run[run.length - 1].hour;
    const end = new Date(last.time.getTime() + 60 * 60 * 1000);
    const averageScore = Math.round(this.avg(run));

    const peak = run.reduce((a, b) => (b.score > a.score ? b : a));
    return {
      start,
      end,
      averageScore,
      headline: this.formatRange(start, end),
      reason: this.describe(peak),
    };
  }

  private describe(peak: ScoredHour): string {
    const h = peak.hour;
    const parts: string[] = [`temperatura aparente de ${Math.round(h.apparentTemperatureC)}°C`];
    parts.push(
      h.precipitationProbability <= 20
        ? 'baixa chance de chuva'
        : `${h.precipitationProbability}% de chance de chuva`,
    );
    parts.push(
      h.windSpeedKmh <= 15 ? 'vento leve' : `vento de ${Math.round(h.windSpeedKmh)} km/h`,
    );
    parts.push(
      h.uvIndex <= 3 ? 'UV baixo' : h.uvIndex <= 6 ? 'UV moderado' : `UV ${Math.round(h.uvIndex)}`,
    );
    if (h.relativeHumidity >= 75) {
      parts.push(`umidade alta (${Math.round(h.relativeHumidity)}%)`);
    } else if (h.relativeHumidity <= 35) {
      parts.push(`ar seco (${Math.round(h.relativeHumidity)}%)`);
    }
    return parts.join(', ') + '.';
  }

  private formatRange(start: Date, end: Date): string {
    const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}h`;
    return `entre ${fmt(start)} e ${fmt(end)}`;
  }

  private avg(run: ScoredHour[]): number {
    return run.reduce((s, x) => s + x.score, 0) / run.length;
  }
}
