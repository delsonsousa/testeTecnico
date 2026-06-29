import { useQuery } from '@tanstack/react-query';
import { useContainer } from './useContainer';

export function useCitySearch(query: string) {
  const { searchCities } = useContainer();
  return useQuery({
    queryKey: ['cities', query],
    queryFn: () => searchCities.execute(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 60, // cidades não mudam
  });
}
