import { useQuery } from '@tanstack/react-query';
import { City } from '@domain/entities/City';
import { Activity } from '@domain/entities/Activity';
import { useContainer } from './useContainer';

export function useRecommendation(city: City | null, activity: Activity | null) {
  const { getRecommendation } = useContainer();
  return useQuery({
    queryKey: ['recommendation', city?.id, activity?.id],
    queryFn: () => getRecommendation.execute(city!, activity!),
    enabled: !!city && !!activity,
    staleTime: 1000 * 60 * 15, // previsão revalida a cada 15 min
  });
}
