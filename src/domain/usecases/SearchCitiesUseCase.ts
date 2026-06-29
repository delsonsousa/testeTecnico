import { City } from '@domain/entities/City';
import { ICityRepository } from '@domain/repositories/ICityRepository';

export class SearchCitiesUseCase {
  constructor(private readonly cityRepository: ICityRepository) {}

  async execute(query: string): Promise<City[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    return this.cityRepository.search(trimmed);
  }
}
