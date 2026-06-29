import { RecommendationService } from '@domain/services/RecommendationService';
import { makeActivity, makeForecast, makeHour } from '../fixtures';

describe('RecommendationService', () => {
  const service = new RecommendationService();

  it('excludes night hours from scoring', () => {
    const forecast = makeForecast([
      makeHour({ hour: 3, temp: 22, isDay: false }),
      makeHour({ hour: 4, temp: 22, isDay: false }),
      makeHour({ hour: 14, temp: 22, isDay: true }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.scoredHours).toHaveLength(1);
    expect(rec.scoredHours[0].hour.time.getHours()).toBe(14);
  });

  it('gives a perfect-ish score to ideal conditions', () => {
    const forecast = makeForecast([
      makeHour({ hour: 10, temp: 21, precip: 0, wind: 2, uv: 1 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.scoredHours[0].score).toBeGreaterThanOrEqual(95);
  });

  it('penalizes high precipitation heavily for a rain-averse activity', () => {
    const picnic = makeActivity({
      id: 'picnic',
      weights: { temperature: 3, precipitation: 5, wind: 4, uv: 2 },
      maxPrecipitationProbability: 20,
    });
    const dry = service.recommend(
      makeForecast([makeHour({ hour: 12, temp: 24, precip: 0 })]),
      picnic,
    );
    const wet = service.recommend(
      makeForecast([makeHour({ hour: 12, temp: 24, precip: 80 })]),
      picnic,
    );
    expect(wet.scoredHours[0].score).toBeLessThan(dry.scoredHours[0].score);
    expect(wet.scoredHours[0].factors.precipitation).toBe(0);
  });

  it('finds the longest continuous good window', () => {
    const forecast = makeForecast([
      makeHour({ hour: 8, temp: 35, precip: 90 }),
      makeHour({ hour: 9, temp: 22, precip: 0 }),
      makeHour({ hour: 10, temp: 23, precip: 5 }),
      makeHour({ hour: 11, temp: 24, precip: 10 }),
      makeHour({ hour: 12, temp: 38, precip: 95 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow).not.toBeNull();
    expect(rec.bestWindow!.start.getHours()).toBe(9);
    expect(rec.bestWindow!.end.getHours()).toBe(12);
  });

  it('returns no window when every hour is poor', () => {
    const forecast = makeForecast([
      makeHour({ hour: 9, temp: 40, precip: 100, wind: 60 }),
      makeHour({ hour: 12, temp: 41, precip: 100, wind: 70 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow).toBeNull();
  });

  it('respects different activity temperature profiles', () => {
    const hot = makeForecast([makeHour({ hour: 13, temp: 30, precip: 0, uv: 8 })]);
    const beach = makeActivity({
      id: 'beach',
      temperatureC: { idealMin: 25, idealMax: 33, hardMin: 18, hardMax: 42 },
      maxUvIndex: 11,
    });
    const run = makeActivity({
      id: 'run',
      weights: { temperature: 4, precipitation: 3, wind: 2, uv: 3 },
      temperatureC: { idealMin: 10, idealMax: 21, hardMin: 2, hardMax: 32 },
      maxUvIndex: 7,
    });
    const beachScore = service.recommend(hot, beach).scoredHours[0].score;
    const runScore = service.recommend(hot, run).scoredHours[0].score;
    expect(beachScore).toBeGreaterThan(runScore);
  });

  it('penalizes very humid hours even when the rest of the weather is good', () => {
    const comfortable = service.recommend(
      makeForecast([makeHour({ hour: 9, temp: 23, humidity: 55 })]),
      makeActivity(),
    );
    const humid = service.recommend(
      makeForecast([makeHour({ hour: 9, temp: 23, humidity: 95 })]),
      makeActivity(),
    );

    expect(humid.scoredHours[0].score).toBeLessThan(comfortable.scoredHours[0].score);
    expect(humid.scoredHours[0].factors.humidity).toBeLessThan(comfortable.scoredHours[0].factors.humidity);
  });

  it('prefers a mild morning over a hot high-UV midday hour', () => {
    const forecast = makeForecast([
      makeHour({ hour: 9, temp: 24, uv: 3 }),
      makeHour({ hour: 13, temp: 31, uv: 9 }),
    ]);

    const rec = service.recommend(forecast, makeActivity());

    expect(rec.scoredHours[0].score).toBeGreaterThan(rec.scoredHours[1].score);
    expect(rec.bestWindow?.start.getHours()).toBe(9);
  });

  it('builds a human-readable reason with temperature, rain and wind', () => {
    const forecast = makeForecast([makeHour({ hour: 17, temp: 24, precip: 10, wind: 8 })]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow!.reason).toMatch(/°C/);
    expect(rec.bestWindow!.reason.toLowerCase()).toContain('vento');
    expect(rec.bestWindow!.reason.toLowerCase()).toContain('uv');
  });

  it('gives a zero temperature score when temp is at or below hardMin', () => {
    // makeActivity has hardMin=5; temp=3 is below that (line 73: return 0)
    const forecast = makeForecast([makeHour({ hour: 9, temp: 3 })]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.scoredHours[0].factors.temperature).toBe(0);
  });

  it('gives a partial temperature score when temp is between hardMin and idealMin', () => {
    // hardMin=5 < temp=10 < idealMin=16 → line 74: partial score
    const forecast = makeForecast([makeHour({ hour: 9, temp: 10 })]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.scoredHours[0].factors.temperature).toBeGreaterThan(0);
    expect(rec.scoredHours[0].factors.temperature).toBeLessThan(100);
  });

  it('scores late-evening hours (h > 19) with a 0.5 time-of-day factor', () => {
    const forecast = makeForecast([makeHour({ hour: 20, temp: 22, isDay: true })]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.scoredHours[0].factors.timeOfDay).toBe(50);
  });

  it('breaks same-length window ties by average score — second window wins', () => {
    // viable=[A(hour8,score≈93), B(hour10,score≈99)]; avg(b)>avg(a) → true branch → b wins
    const forecast = makeForecast([
      makeHour({ hour: 8, temp: 22, precip: 5, wind: 5, uv: 2 }),
      makeHour({ hour: 9, temp: 40, precip: 95, wind: 60 }),
      makeHour({ hour: 10, temp: 22, precip: 0, wind: 0, uv: 1 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow?.start.getHours()).toBe(10);
  });

  it('breaks same-length window ties by average score — first window wins', () => {
    // viable=[A(hour10,score≈99), B(hour8,score≈93)]; avg(b)>avg(a) → false → a wins
    const forecast = makeForecast([
      makeHour({ hour: 10, temp: 22, precip: 0, wind: 0, uv: 1 }),
      makeHour({ hour: 11, temp: 40, precip: 95, wind: 60 }),
      makeHour({ hour: 12, temp: 22, precip: 5, wind: 5, uv: 2 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow?.start.getHours()).toBe(10);
  });

  it('describes dry-air conditions in the best window reason', () => {
    const forecast = makeForecast([
      makeHour({ hour: 17, temp: 24, precip: 5, wind: 8, uv: 2, humidity: 20 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow!.reason).toContain('ar seco');
  });

  it('scores 100 when value is zero and max ceiling is zero', () => {
    // scoreCeiling: max <= 0 && value <= 0 → return 1
    const activity = makeActivity({ maxUvIndex: 0 });
    const rec = service.recommend(makeForecast([makeHour({ hour: 9, uv: 0 })]), activity);
    expect(rec.scoredHours[0].factors.uv).toBe(100);
  });

  it('scores 0 when value is positive and max ceiling is zero', () => {
    // scoreCeiling: max <= 0 && value > 0 → return 0
    const activity = makeActivity({ maxUvIndex: 0 });
    const rec = service.recommend(makeForecast([makeHour({ hour: 9, uv: 5 })]), activity);
    expect(rec.scoredHours[0].factors.uv).toBe(0);
  });

  it('picks the longer window B over shorter window A (b.length > a.length true)', () => {
    // viable = [A(1 hr), B(2 hr)] → b.length > a.length true → return b
    const forecast = makeForecast([
      makeHour({ hour: 8, temp: 22, precip: 0 }),
      makeHour({ hour: 9, temp: 40, precip: 98, wind: 60 }),
      makeHour({ hour: 10, temp: 22, precip: 0 }),
      makeHour({ hour: 11, temp: 22, precip: 0 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow?.start.getHours()).toBe(10);
  });

  it('keeps window A when it is longer than window B (b.length > a.length false)', () => {
    // viable = [A(2 hr), B(1 hr)] → b.length > a.length false → keep a
    const forecast = makeForecast([
      makeHour({ hour: 8, temp: 22, precip: 0 }),
      makeHour({ hour: 9, temp: 22, precip: 0 }),
      makeHour({ hour: 10, temp: 40, precip: 98, wind: 60 }),
      makeHour({ hour: 11, temp: 22, precip: 0 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow?.start.getHours()).toBe(8);
  });

  it('identifies the second hour as peak when it has a better score (b.score > a.score true)', () => {
    // 2-element window: hour9 lower score (high precip+wind), hour10 better
    const forecast = makeForecast([
      makeHour({ hour: 9, temp: 22, precip: 40, wind: 30, uv: 2 }),
      makeHour({ hour: 10, temp: 22, precip: 0, wind: 5, uv: 1 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow).not.toBeNull();
    // Peak is hour10 (better conditions); reason should reflect its low precip/wind
    expect(rec.bestWindow!.reason).toContain('baixa chance de chuva');
  });

  it('describes high wind conditions (wind > 15 km/h branch)', () => {
    const forecast = makeForecast([
      makeHour({ hour: 9, temp: 22, precip: 5, wind: 25, uv: 2 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow!.reason).toContain('km/h');
  });

  it('describes moderate UV (4 ≤ uvIndex ≤ 6 branch)', () => {
    const forecast = makeForecast([
      makeHour({ hour: 9, temp: 22, precip: 5, wind: 8, uv: 5 }),
    ]);
    const rec = service.recommend(forecast, makeActivity());
    expect(rec.bestWindow!.reason).toContain('UV moderado');
  });
});
