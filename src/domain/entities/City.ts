export interface City {
  readonly id: number;
  readonly name: string;
  readonly country: string;
  readonly admin1: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly timezone: string;
}

export function formatCityLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ');
}
