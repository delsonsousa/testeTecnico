export interface GeocodingResultDto {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  admin1: string | null;
  timezone: string;
}

export interface GeocodingResponseDto {
  results?: GeocodingResultDto[];
}
