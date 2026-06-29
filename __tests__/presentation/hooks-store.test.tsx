import React from 'react';
import * as Location from 'expo-location';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { notifyManager } from '@tanstack/query-core';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { Container } from '@di/container';
import { ContainerProvider, useContainer } from '@presentation/hooks/useContainer';
import { useActivities, useActivityMutations } from '@presentation/hooks/useActivities';
import { useCitySearch } from '@presentation/hooks/useCitySearch';
import { useDebouncedValue } from '@presentation/hooks/useDebouncedValue';
import { useDeviceCity } from '@presentation/hooks/useDeviceCity';
import { useRecommendation } from '@presentation/hooks/useRecommendation';
import { useSelectionStore } from '@presentation/stores/useSelectionStore';
import {
  makeActivity,
  makeActivityDraft,
  makeCity,
  makeScoredHour,
} from '../fixtures';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@di/container', () => ({
  container: {},
}));

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

const queryClients: QueryClient[] = [];

beforeAll(() => {
  notifyManager.setScheduler((callback) => callback());
});

afterAll(() => {
  notifyManager.setScheduler((callback) => setTimeout(callback, 0));
});

afterEach(() => {
  act(() => {
    queryClients.forEach((client) => client.clear());
  });
  queryClients.length = 0;
});

function makeContainer(overrides: Partial<Container> = {}): Container {
  return {
    searchCities: { execute: jest.fn().mockResolvedValue([makeCity()]) },
    getRecommendation: {
      execute: jest.fn().mockResolvedValue({
        activityId: 'preset-walk',
        scoredHours: [],
        bestWindow: null,
      }),
    },
    listActivities: { execute: jest.fn().mockResolvedValue([makeActivity()]) },
    saveActivity: {
      create: jest.fn().mockResolvedValue(makeActivity({ id: 'custom-1', isPreset: false })),
      update: jest.fn().mockResolvedValue(makeActivity({ id: 'custom-1', isPreset: false })),
    },
    deleteActivity: { execute: jest.fn().mockResolvedValue(undefined) },
    ...overrides,
  } as unknown as Container;
}

function wrapperFor(container: Container) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  queryClients.push(client);

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ContainerProvider value={container}>{children}</ContainerProvider>
      </QueryClientProvider>
    );
  };
}

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('updates only after the configured delay', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'Rio' } },
    );

    rerender({ value: 'Niterói' });
    expect(result.current).toBe('Rio');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('Niterói');
    unmount();
  });
});

describe('selection store', () => {
  beforeEach(() => {
    useSelectionStore.setState({ city: null, activityId: 'preset-walk' });
  });

  it('stores the selected city and activity', () => {
    const city = makeCity();

    act(() => {
      useSelectionStore.getState().setCity(city);
      useSelectionStore.getState().setActivityId('run');
    });

    expect(useSelectionStore.getState().city).toEqual(city);
    expect(useSelectionStore.getState().activityId).toBe('run');
  });
});

describe('container hooks', () => {
  it('returns the injected container', () => {
    const container = makeContainer();
    const { result } = renderHook(() => useContainer(), {
      wrapper: wrapperFor(container),
    });

    expect(result.current).toBe(container);
  });

  it('loads activities through React Query', async () => {
    const container = makeContainer();
    const { result } = renderHook(() => useActivities(), {
      wrapper: wrapperFor(container),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(container.listActivities.execute).toHaveBeenCalledTimes(1);
    expect(result.current.data?.[0].name).toBe('Caminhada');
  });

  it('does not search cities before the query has at least two chars', () => {
    const container = makeContainer();

    renderHook(() => useCitySearch('a'), {
      wrapper: wrapperFor(container),
    });

    expect(container.searchCities.execute).not.toHaveBeenCalled();
  });

  it('searches cities when the query is valid', async () => {
    const container = makeContainer();
    const { result } = renderHook(() => useCitySearch('Rio'), {
      wrapper: wrapperFor(container),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(container.searchCities.execute).toHaveBeenCalledWith('Rio');
  });

  it('fetches a recommendation only when city and activity exist', async () => {
    const recommendation = {
      activityId: 'preset-walk',
      scoredHours: [makeScoredHour({ hour: 10, score: 90 })],
      bestWindow: null,
    };
    const container = makeContainer({
      getRecommendation: { execute: jest.fn().mockResolvedValue(recommendation) },
    } as unknown as Partial<Container>);

    const { rerender, result } = renderHook(
      ({ enabled }) =>
        useRecommendation(enabled ? makeCity() : null, enabled ? makeActivity() : null),
      {
        wrapper: wrapperFor(container),
        initialProps: { enabled: false },
      },
    );

    expect(container.getRecommendation.execute).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(container.getRecommendation.execute).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Rio de Janeiro' }),
      expect.objectContaining({ name: 'Caminhada' }),
    );
  });

  it('uses the default container when no value prop is provided', () => {
    const { result } = renderHook(() => useContainer(), {
      wrapper: ({ children }) => <ContainerProvider>{children}</ContainerProvider>,
    });

    expect(result.current).toBeDefined();
  });

  it('runs activity mutations through the use cases', async () => {
    const container = makeContainer();
    const { result } = renderHook(() => useActivityMutations(), {
      wrapper: wrapperFor(container),
    });

    await act(async () => {
      await result.current.create.mutateAsync(makeActivityDraft({ name: 'Surfe' }));
      await result.current.update.mutateAsync({
        id: 'custom-1',
        draft: makeActivityDraft({ name: 'Remo' }),
      });
      await result.current.remove.mutateAsync('custom-1');
    });

    expect(container.saveActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Surfe' }),
    );
    expect(container.saveActivity.update).toHaveBeenCalledWith(
      'custom-1',
      expect.objectContaining({ name: 'Remo' }),
    );
    expect(container.deleteActivity.execute).toHaveBeenCalledWith('custom-1');
  });
});

describe('useDeviceCity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when location permission is denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    const container = makeContainer();
    const { result } = renderHook(() => useDeviceCity(), {
      wrapper: wrapperFor(container),
    });

    await act(async () => {
      await expect(result.current.detectCity()).resolves.toBeNull();
    });

    expect(result.current.error).toBe('Permissão de localização negada.');
    expect(container.searchCities.execute).not.toHaveBeenCalled();
  });

  it('detects the city from device location', async () => {
    const city = makeCity({ name: 'Niterói' });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: -22.9, longitude: -43.1 },
    });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([{ city: 'Niterói' }]);

    const container = makeContainer({
      searchCities: { execute: jest.fn().mockResolvedValue([city]) },
    } as unknown as Partial<Container>);
    const { result } = renderHook(() => useDeviceCity(), {
      wrapper: wrapperFor(container),
    });

    await act(async () => {
      await expect(result.current.detectCity()).resolves.toEqual(city);
    });

    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.Balanced,
    });
    expect(container.searchCities.execute).toHaveBeenCalledWith('Niterói');
    expect(result.current.error).toBeNull();
  });

  it('handles missing reverse geocode city names', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: {} });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([{}]);

    const { result } = renderHook(() => useDeviceCity(), {
      wrapper: wrapperFor(makeContainer()),
    });

    await act(async () => {
      await expect(result.current.detectCity()).resolves.toBeNull();
    });

    expect(result.current.error).toBe('Não foi possível identificar a cidade.');
  });

  it('handles cities not found after reverse geocoding', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: {} });
    (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([{ subregion: 'Maricá' }]);

    const container = makeContainer({
      searchCities: { execute: jest.fn().mockResolvedValue([]) },
    } as unknown as Partial<Container>);
    const { result } = renderHook(() => useDeviceCity(), {
      wrapper: wrapperFor(container),
    });

    await act(async () => {
      await expect(result.current.detectCity()).resolves.toBeNull();
    });

    expect(container.searchCities.execute).toHaveBeenCalledWith('Maricá');
    expect(result.current.error).toBe('Cidade não encontrada.');
  });

  it('handles geolocation failures', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error('native failure'),
    );

    const { result } = renderHook(() => useDeviceCity(), {
      wrapper: wrapperFor(makeContainer()),
    });

    await act(async () => {
      await expect(result.current.detectCity()).resolves.toBeNull();
    });

    expect(result.current.error).toBe('Erro ao obter localização.');
  });
});
