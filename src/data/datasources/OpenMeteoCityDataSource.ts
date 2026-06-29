import { ENV } from '@shared/config/env';
import { IHttpClient } from '@infrastructure/http/IHttpClient';
import { GeocodingResponseDto } from '@data/dto/GeocodingDto';

export class OpenMeteoCityDataSource {
  constructor(private readonly http: IHttpClient) {}

  search(query: string): Promise<GeocodingResponseDto> {
    return this.http.get<GeocodingResponseDto>({
      url: `${ENV.geocodingBaseUrl}/search`,
      params: { name: query, count: 8, language: ENV.language, format: 'json' },
    });
  }
}
