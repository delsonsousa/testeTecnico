import { useState } from 'react';
import * as Location from 'expo-location';
import { useContainer } from './useContainer';
import { City } from '@domain/entities/City';

type Status = 'idle' | 'loading' | 'error';

export function useDeviceCity() {
  const { searchCities } = useContainer();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const detectCity = async (): Promise<City | null> => {
    setStatus('loading');
    setError(null);
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setError('Permissão de localização negada.');
        setStatus('error');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [place] = await Location.reverseGeocodeAsync(position.coords);
      const cityName = place?.city ?? place?.subregion ?? place?.region;

      if (!cityName) {
        setError('Não foi possível identificar a cidade.');
        setStatus('error');
        return null;
      }

      const results = await searchCities.execute(cityName);
      if (!results.length) {
        setError('Cidade não encontrada.');
        setStatus('error');
        return null;
      }

      setStatus('idle');
      return results[0];
    } catch {
      setError('Erro ao obter localização.');
      setStatus('error');
      return null;
    }
  };

  return { detectCity, isLoading: status === 'loading', error };
}
