import { City } from '@domain/entities/City';

export interface ICityRepository {
  search(query: string): Promise<City[]>;
}
