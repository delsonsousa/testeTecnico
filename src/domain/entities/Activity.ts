export interface ComfortRange {
  readonly idealMin: number;
  readonly idealMax: number;
  readonly hardMin: number;
  readonly hardMax: number;
}

export interface ActivityWeights {
  readonly temperature: number;
  readonly precipitation: number;
  readonly wind: number;
  readonly uv: number;
}

export interface Activity {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly weights: ActivityWeights;
  readonly temperatureC: ComfortRange;
  readonly maxPrecipitationProbability: number;
  readonly maxWindKmh: number;
  readonly maxUvIndex: number;
  readonly isPreset: boolean;
}

export type ActivityDraft = Omit<Activity, 'id' | 'isPreset'>;
