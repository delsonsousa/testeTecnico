import { City } from '@domain/entities/City';
import { GeocodingResultDto } from '@data/dto/GeocodingDto';

export const CityMapper = {
  toDomain(dto: GeocodingResultDto): City {
    return {
      id: dto.id,
      name: dto.name,
      country: dto.country ?? '',
      admin1: dto.admin1 ?? null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone,
    };
  },
};
