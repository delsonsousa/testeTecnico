import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ValidationError } from '@shared/errors/AppError';
import { formatCityLabel } from '@domain/entities/City';
import { SearchScreen } from '@presentation/screens/SearchScreen';
import { RecommendationScreen } from '@presentation/screens/RecommendationScreen';
import { ActivitiesScreen } from '@presentation/screens/ActivitiesScreen';
import { ActivityFormScreen } from '@presentation/screens/ActivityFormScreen';
import { useActivities, useActivityMutations } from '@presentation/hooks/useActivities';
import { useCitySearch } from '@presentation/hooks/useCitySearch';
import { useDeviceCity } from '@presentation/hooks/useDeviceCity';
import { useRecommendation } from '@presentation/hooks/useRecommendation';
import { makeActivity, makeCity, makeScoredHour } from '../fixtures';
import { renderWithTheme } from '../test-utils';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: Record<string, unknown> = {};

const mockSelection = {
  city: null as ReturnType<typeof makeCity> | null,
  activityId: 'preset-walk',
  setCity: jest.fn(),
  setActivityId: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaView: 'SafeAreaView',
  };
});

jest.mock('@presentation/hooks/useActivities', () => ({
  useActivities: jest.fn(),
  useActivityMutations: jest.fn(),
}));

jest.mock('@presentation/hooks/useCitySearch', () => ({
  useCitySearch: jest.fn(),
}));

jest.mock('@presentation/hooks/useDeviceCity', () => ({
  useDeviceCity: jest.fn(),
}));

jest.mock('@presentation/hooks/useRecommendation', () => ({
  useRecommendation: jest.fn(),
}));

jest.mock('@presentation/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

jest.mock('@presentation/stores/useSelectionStore', () => ({
  useSelectionStore: (selector: (state: typeof mockSelection) => unknown) =>
    selector(mockSelection),
}));

const mockedUseActivities = useActivities as jest.Mock;
const mockedUseActivityMutations = useActivityMutations as jest.Mock;
const mockedUseCitySearch = useCitySearch as jest.Mock;
const mockedUseDeviceCity = useDeviceCity as jest.Mock;
const mockedUseRecommendation = useRecommendation as jest.Mock;

describe('screens', () => {
  const city = makeCity({ name: 'Niterói', admin1: 'Rio de Janeiro' });
  const preset = makeActivity({ id: 'preset-walk', name: 'Caminhada', emoji: '🚶' });
  const custom = makeActivity({
    id: 'custom-surf',
    name: 'Surfe',
    emoji: '🏄',
    isPreset: false,
  });

  const createMutation = {
    isPending: false,
    mutateAsync: jest.fn().mockResolvedValue(custom),
  };
  const updateMutation = {
    isPending: false,
    mutateAsync: jest.fn().mockResolvedValue(custom),
  };
  const removeMutation = {
    mutate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
    mockSelection.city = null;
    mockSelection.activityId = 'preset-walk';

    mockedUseActivities.mockReturnValue({
      data: [preset, custom],
      isLoading: false,
    });
    mockedUseActivityMutations.mockReturnValue({
      create: createMutation,
      update: updateMutation,
      remove: removeMutation,
    });
    mockedUseCitySearch.mockReturnValue({
      data: [city],
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedUseDeviceCity.mockReturnValue({
      detectCity: jest.fn().mockResolvedValue(null),
      isLoading: false,
      error: null,
    });
    mockedUseRecommendation.mockReturnValue({
      data: {
        activityId: preset.id,
        scoredHours: [makeScoredHour({ hour: 9, score: 90 })],
        bestWindow: {
          start: new Date(2026, 5, 25, 9),
          end: new Date(2026, 5, 25, 10),
          averageScore: 90,
          headline: 'entre 09h e 10h',
          reason: 'temperatura aparente de 22°C, vento leve.',
        },
      },
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('searches a city and stores the selected result', () => {
    renderWithTheme(<SearchScreen />);

    fireEvent.changeText(screen.getByLabelText('Buscar cidade'), 'Nit');
    fireEvent.press(screen.getByLabelText(`Selecionar ${formatCityLabel(city)}`));

    expect(mockSelection.setCity).toHaveBeenCalledWith(city);
    expect(mockNavigate).toHaveBeenCalledWith('Recommendation');
  });

  it('shows the empty search prompt before the user types', () => {
    mockedUseCitySearch.mockReturnValue({
      data: [],
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithTheme(<SearchScreen />);

    expect(screen.getByText('Comece pela cidade')).toBeTruthy();
  });

  it('renders the recommendation when city, activity and forecast are available', () => {
    mockSelection.city = city;

    renderWithTheme(<RecommendationScreen />);

    expect(screen.getByText('Niterói')).toBeTruthy();
    expect(screen.getByText('entre 09h e 10h')).toBeTruthy();
    expect(screen.getByText('+ Gerenciar atividades')).toBeTruthy();
  });

  it('asks for a city before showing recommendations', () => {
    renderWithTheme(<RecommendationScreen />);

    expect(screen.getByText('Escolha uma cidade primeiro')).toBeTruthy();
  });

  it('renders activities and opens the activity form', () => {
    renderWithTheme(<ActivitiesScreen />);

    expect(screen.getByText('Perfis de atividade')).toBeTruthy();
    expect(screen.getByText('Caminhada')).toBeTruthy();
    expect(screen.getByText('Surfe')).toBeTruthy();

    fireEvent.press(screen.getAllByLabelText('Criar nova atividade')[0]);

    expect(mockNavigate).toHaveBeenCalledWith('ActivityForm', {});
  });

  it('shows the activities loading state', () => {
    mockedUseActivities.mockReturnValue({ data: undefined, isLoading: true });

    renderWithTheme(<ActivitiesScreen />);

    expect(screen.getByText('Carregando atividades…')).toBeTruthy();
  });

  it('creates a new activity from the form', async () => {
    renderWithTheme(<ActivityFormScreen />);

    fireEvent.changeText(screen.getByLabelText('Nome da atividade'), 'Remo');
    fireEvent.press(screen.getByText('Criar atividade'));

    await waitFor(() => expect(createMutation.mutateAsync).toHaveBeenCalled());
    expect(createMutation.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Remo' }),
    );
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('updates custom activities from the form', async () => {
    mockRouteParams = { activityId: custom.id };

    renderWithTheme(<ActivityFormScreen />);

    fireEvent.changeText(screen.getByLabelText('Nome da atividade'), 'Surfe leve');
    fireEvent.press(screen.getByText('Salvar alterações'));

    await waitFor(() => expect(updateMutation.mutateAsync).toHaveBeenCalled());
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: custom.id,
      draft: expect.objectContaining({ name: 'Surfe leve' }),
    });
  });

  it('navigates via the location button when a city is detected', async () => {
    const detectedCity = makeCity({ name: 'Niterói' });
    mockedUseDeviceCity.mockReturnValue({
      detectCity: jest.fn().mockResolvedValue(detectedCity),
      isLoading: false,
      error: null,
    });
    renderWithTheme(<SearchScreen />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Usar minha localização atual'));
    });

    expect(mockSelection.setCity).toHaveBeenCalledWith(detectedCity);
    expect(mockNavigate).toHaveBeenCalledWith('Recommendation');
  });

  it('shows the location error state when geolocation fails', () => {
    mockedUseDeviceCity.mockReturnValue({
      detectCity: jest.fn().mockResolvedValue(null),
      isLoading: false,
      error: 'Permissão de localização negada.',
    });
    renderWithTheme(<SearchScreen />);

    expect(screen.getByText('Localização indisponível')).toBeTruthy();
    expect(screen.getByText('Permissão de localização negada.')).toBeTruthy();
  });

  it('shows a spinner while detecting the device location', () => {
    mockedUseDeviceCity.mockReturnValue({
      detectCity: jest.fn(),
      isLoading: true,
      error: null,
    });
    renderWithTheme(<SearchScreen />);

    expect(screen.getByText('Comece pela cidade')).toBeTruthy();
  });

  it('renders separators between multiple city results', () => {
    const city2 = makeCity({ id: 2, name: 'São Paulo', admin1: 'São Paulo' });
    mockedUseCitySearch.mockReturnValue({
      data: [city, city2],
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithTheme(<SearchScreen />);
    fireEvent.changeText(screen.getByLabelText('Buscar cidade'), 'São');

    expect(screen.getByText('Niterói')).toBeTruthy();
    expect(screen.getByText('São Paulo')).toBeTruthy();
  });

  it('shows the loading view while cities are being fetched', () => {
    mockedUseCitySearch.mockReturnValue({
      data: null,
      isFetching: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithTheme(<SearchScreen />);
    fireEvent.changeText(screen.getByLabelText('Buscar cidade'), 'São');

    expect(screen.getByText('Procurando cidades…')).toBeTruthy();
  });

  it('shows the error view when the city search fails', () => {
    mockedUseCitySearch.mockReturnValue({
      data: null,
      isFetching: false,
      isError: true,
      error: new Error('Falha de rede'),
      refetch: jest.fn(),
    });
    renderWithTheme(<SearchScreen />);
    fireEvent.changeText(screen.getByLabelText('Buscar cidade'), 'São');

    expect(screen.getByText('Falha de rede')).toBeTruthy();
  });

  it('shows empty results when no cities match the query', () => {
    mockedUseCitySearch.mockReturnValue({
      data: [],
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithTheme(<SearchScreen />);
    fireEvent.changeText(screen.getByLabelText('Buscar cidade'), 'Xyzzy');

    expect(screen.getByText('Nenhuma cidade encontrada')).toBeTruthy();
  });

  it('does nothing when location detection returns null', async () => {
    mockedUseDeviceCity.mockReturnValue({
      detectCity: jest.fn().mockResolvedValue(null),
      isLoading: false,
      error: null,
    });
    renderWithTheme(<SearchScreen />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Usar minha localização atual'));
    });

    expect(mockSelection.setCity).not.toHaveBeenCalled();
  });

  it('navigates to Search when "Trocar" is pressed', () => {
    mockSelection.city = city;
    renderWithTheme(<RecommendationScreen />);

    fireEvent.press(screen.getByLabelText('Trocar cidade'));

    expect(mockNavigate).toHaveBeenCalledWith('Search');
  });

  it('navigates to Activities when managing activities is pressed', () => {
    mockSelection.city = city;
    renderWithTheme(<RecommendationScreen />);

    fireEvent.press(screen.getByLabelText('Gerenciar atividades'));

    expect(mockNavigate).toHaveBeenCalledWith('Activities');
  });

  it('shows a loading view while the forecast is being fetched', () => {
    mockSelection.city = city;
    mockedUseRecommendation.mockReturnValue({
      data: null,
      isFetching: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithTheme(<RecommendationScreen />);

    expect(screen.getByText('Consultando o céu…')).toBeTruthy();
  });

  it('shows an error view when the forecast fetch fails', () => {
    mockSelection.city = city;
    mockedUseRecommendation.mockReturnValue({
      data: null,
      isFetching: false,
      isError: true,
      error: new Error('Falha de rede'),
      refetch: jest.fn(),
    });
    renderWithTheme(<RecommendationScreen />);

    expect(screen.getByText('Falha de rede')).toBeTruthy();
  });

  it('renders nothing in the forecast area when there is no data', () => {
    mockSelection.city = city;
    mockedUseRecommendation.mockReturnValue({
      data: null,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithTheme(<RecommendationScreen />);

    expect(screen.getByText('Niterói')).toBeTruthy();
    expect(screen.queryByText('entre 09h e 10h')).toBeNull();
  });

  it('falls back to the first activity when the stored activityId does not match any', () => {
    mockSelection.city = city;
    mockSelection.activityId = 'nonexistent-id';
    renderWithTheme(<RecommendationScreen />);

    expect(screen.getByText('Niterói')).toBeTruthy();
  });

  it('renders null for the activity when the activities list is empty', () => {
    mockSelection.city = city;
    mockedUseActivities.mockReturnValue({ data: [], isLoading: false });
    mockedUseRecommendation.mockReturnValue({
      data: null,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithTheme(<RecommendationScreen />);

    expect(screen.getByText('Niterói')).toBeTruthy();
  });

  it('handles missing activities data without crashing', () => {
    mockSelection.city = city;
    mockedUseActivities.mockReturnValue({ data: undefined, isLoading: false });
    mockedUseRecommendation.mockReturnValue({
      data: null,
      isFetching: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    renderWithTheme(<RecommendationScreen />);

    expect(screen.getByText('Niterói')).toBeTruthy();
  });

  it('goes back when the back button is pressed', () => {
    renderWithTheme(<ActivitiesScreen />);

    fireEvent.press(screen.getByLabelText('Voltar'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('opens the activity form when a card is pressed', () => {
    renderWithTheme(<ActivitiesScreen />);

    fireEvent.press(screen.getByLabelText(new RegExp(`^${preset.name}\\.`)));

    expect(mockNavigate).toHaveBeenCalledWith('ActivityForm', { activityId: preset.id });
  });

  it('shows a delete confirmation on long press of a custom activity', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderWithTheme(<ActivitiesScreen />);

    fireEvent(screen.getByLabelText(new RegExp(`^${custom.name}\\.`)), 'longPress');

    expect(Alert.alert).toHaveBeenCalledWith(
      'Excluir atividade',
      `Remover "${custom.name}"?`,
      expect.any(Array),
    );
  });

  it('calls remove when the delete is confirmed in the Alert', () => {
    let capturedButtons: Array<{ onPress?: () => void }> = [];
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      capturedButtons = (buttons ?? []) as Array<{ onPress?: () => void }>;
    });
    renderWithTheme(<ActivitiesScreen />);

    fireEvent(screen.getByLabelText(new RegExp(`^${custom.name}\\.`)), 'longPress');
    capturedButtons[1]?.onPress?.();

    expect(removeMutation.mutate).toHaveBeenCalledWith(custom.id);
  });

  it('does nothing on long press of a preset activity', () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderWithTheme(<ActivitiesScreen />);

    fireEvent(screen.getByLabelText(new RegExp(`^${preset.name}\\.`)), 'longPress');

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('opens the new activity form from the footer button', () => {
    renderWithTheme(<ActivitiesScreen />);

    fireEvent.press(screen.getAllByLabelText('Criar nova atividade')[1]);

    expect(mockNavigate).toHaveBeenCalledWith('ActivityForm', {});
  });

  it('shows a ValidationError message when saving fails with a validation issue', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedUseActivityMutations.mockReturnValue({
      create: { isPending: false, mutateAsync: jest.fn().mockRejectedValue(new ValidationError('Nome obrigatório.')) },
      update: updateMutation,
      remove: removeMutation,
    });

    renderWithTheme(<ActivityFormScreen />);
    fireEvent.press(screen.getByLabelText('Criar atividade'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Confira os dados', 'Nome obrigatório.');
    });
  });

  it('shows a generic error message for unexpected save failures', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockedUseActivityMutations.mockReturnValue({
      create: { isPending: false, mutateAsync: jest.fn().mockRejectedValue(new Error('boom')) },
      update: updateMutation,
      remove: removeMutation,
    });

    renderWithTheme(<ActivityFormScreen />);
    fireEvent.press(screen.getByLabelText('Criar atividade'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Confira os dados', 'Não foi possível salvar.');
    });
  });

  it('shows the saving state while a mutation is pending', () => {
    mockedUseActivityMutations.mockReturnValue({
      create: { isPending: true, mutateAsync: jest.fn() },
      update: updateMutation,
      remove: removeMutation,
    });

    renderWithTheme(<ActivityFormScreen />);

    expect(screen.getByText('Salvando...')).toBeTruthy();
  });

  it('lets the user edit all form fields and keeps sensible fallbacks', async () => {
    renderWithTheme(<ActivityFormScreen />);

    fireEvent.changeText(screen.getByLabelText('Emoji da atividade'), '');
    fireEvent.changeText(
      screen.getByLabelText('Temperatura ideal mínima em graus Celsius'), 'abc',
    );
    fireEvent.changeText(
      screen.getByLabelText('Temperatura ideal máxima em graus Celsius'), '28',
    );
    fireEvent.changeText(
      screen.getByLabelText('Probabilidade máxima de chuva em porcentagem'), '60',
    );
    fireEvent.changeText(screen.getByLabelText('Vento máximo em quilômetros por hora'), '50');
    fireEvent.changeText(screen.getByLabelText('Índice UV máximo confortável'), '7');

    fireEvent.press(screen.getByLabelText('Criar atividade'));
    await waitFor(() => expect(createMutation.mutateAsync).toHaveBeenCalled());
  });

  it('shows the preset customization path when editing a preset activity', async () => {
    mockRouteParams = { activityId: preset.id };

    renderWithTheme(<ActivityFormScreen />);

    expect(screen.getByText('Personalizar atividade')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Salvar como perfil personalizado'));

    await waitFor(() => expect(createMutation.mutateAsync).toHaveBeenCalled());
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
