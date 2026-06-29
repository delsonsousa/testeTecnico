import { City } from '@domain/entities/City';
import { ICityRepository } from '@domain/repositories/ICityRepository';
import { OpenMeteoCityDataSource } from '@data/datasources/OpenMeteoCityDataSource';
import { CityMapper } from '@data/mappers/CityMapper';

export class CityRepository implements ICityRepository {
  constructor(private readonly dataSource: OpenMeteoCityDataSource) {}

  async search(query: string): Promise<City[]> {
    const dto = await this.dataSource.search(query);
    return (dto.results ?? []).map(CityMapper.toDomain);
  }
}
