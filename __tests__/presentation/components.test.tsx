import React from 'react';
import { AccessibilityInfo, Animated, Text } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ActivityChips } from '@presentation/components/ActivityChips';
import { Card, PrimaryButton, PrimaryButtonLabel } from '@presentation/components/Pressable';
import { Screen } from '@presentation/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@presentation/components/StateViews';
import { RecommendationCard } from '@presentation/components/RecommendationCard';
import { HourTimeline } from '@presentation/components/HourTimeline';
import { FadeInView } from '@presentation/components/FadeInView';
import { ScalePressable } from '@presentation/components/ScalePressable';
import { scoreColor, scoreLabel } from '@presentation/theme/scoreColor';
import { theme } from '@presentation/theme/theme';
import { makeActivity, makeScoredHour } from '../fixtures';
import { renderWithTheme } from '../test-utils';

jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaView: 'SafeAreaView',
  };
});

describe('score helpers', () => {
  it('maps scores to product labels and theme colors', () => {
    expect(scoreLabel(85)).toBe('Muito bom');
    expect(scoreLabel(55)).toBe('Ok');
    expect(scoreLabel(35)).toBe('Atenção');
    expect(scoreLabel(10)).toBe('Evite');

    expect(scoreColor(80, theme)).toBe(theme.colors.good);
    expect(scoreColor(60, theme)).toBe(theme.colors.fair);
    expect(scoreColor(20, theme)).toBe(theme.colors.poor);
  });
});

describe('ActivityChips', () => {
  it('renders activities and calls onSelect with the selected id', () => {
    const onSelect = jest.fn();
    const activities = [
      makeActivity({ id: 'walk', name: 'Caminhada', emoji: '🚶' }),
      makeActivity({ id: 'run', name: 'Corrida', emoji: '🏃' }),
    ];

    renderWithTheme(
      <ActivityChips activities={activities} selectedId="run" onSelect={onSelect} />,
    );

    fireEvent.press(screen.getByLabelText('Selecionar atividade Caminhada'));

    expect(onSelect).toHaveBeenCalledWith('walk');
    expect(screen.getByLabelText('Selecionar atividade Corrida').props.accessibilityState)
      .toEqual({ selected: true });
  });
});

describe('StateViews', () => {
  it('renders loading, empty and error states with retry action', () => {
    const onRetry = jest.fn();

    const loading = renderWithTheme(<LoadingView />);
    expect(loading.getByText('Consultando o céu…')).toBeTruthy();
    loading.unmount();

    const empty = renderWithTheme(<EmptyView title="Nada por aqui" hint="Tente outra busca." />);
    expect(empty.getByText('Nada por aqui')).toBeTruthy();
    expect(empty.getByText('Tente outra busca.')).toBeTruthy();
    empty.unmount();

    renderWithTheme(<ErrorView message="Falhou" onRetry={onRetry} />);
    fireEvent.press(screen.getByText('Tentar de novo'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('base presentation components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders screen and pressable primitives with theme', () => {
    renderWithTheme(
      <Screen>
        <Card>
          <Text>Card simples</Text>
        </Card>
        <PrimaryButton disabled>
          <PrimaryButtonLabel disabled>Salvar</PrimaryButtonLabel>
        </PrimaryButton>
      </Screen>,
    );

    expect(screen.getByText('Card simples')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('skips entrance animation when reduced motion is enabled', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);

    const view = renderWithTheme(
      <FadeInView>
        <Text>Sem movimento</Text>
      </FadeInView>,
    );

    await waitFor(() => {
      expect(Animated.timing).not.toHaveBeenCalled();
    });
    expect(view.getByText('Sem movimento')).toBeTruthy();
    view.unmount();
  });

  it('animates entrance even when reduced motion cannot be checked', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockRejectedValue(new Error('unavailable'));

    renderWithTheme(
      <FadeInView delay={20} distance={4}>
        <Text>Entrada suave</Text>
      </FadeInView>,
    );

    await waitFor(() => {
      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 1,
          delay: 20,
          useNativeDriver: true,
        }),
      );
    });
  });

  it('does not start entrance animation after unmounting', async () => {
    let resolveReduceMotion!: (value: boolean) => void;
    const reduceMotion = new Promise<boolean>((resolve) => {
      resolveReduceMotion = resolve;
    });
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockReturnValue(reduceMotion);

    const view = renderWithTheme(
      <FadeInView>
        <Text>Saindo da tela</Text>
      </FadeInView>,
    );

    view.unmount();

    await act(async () => {
      resolveReduceMotion(false);
      await reduceMotion;
    });

    expect(Animated.timing).not.toHaveBeenCalled();
  });

  it('scales on press and still calls the original press handlers', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();

    renderWithTheme(
      <ScalePressable
        accessibilityLabel="Botão animado"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        pressedScale={0.94}
      >
        <Text>Botão animado</Text>
      </ScalePressable>,
    );

    const button = screen.getByLabelText('Botão animado');
    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');

    expect(Animated.spring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 0.94, useNativeDriver: true }),
    );
    expect(Animated.spring).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ toValue: 1, useNativeDriver: true }),
    );
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it('scales on press even when no extra handlers are provided', () => {
    renderWithTheme(
      <ScalePressable accessibilityLabel="Botão sem handlers">
        <Text>Botão sem handlers</Text>
      </ScalePressable>,
    );

    const button = screen.getByLabelText('Botão sem handlers');
    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');

    expect(Animated.spring).toHaveBeenCalledTimes(2);
  });

  it('does not animate disabled pressables', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();

    renderWithTheme(
      <ScalePressable
        disabled
        accessibilityLabel="Botão desabilitado"
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text>Não disponível</Text>
      </ScalePressable>,
    );

    const button = screen.getByLabelText('Botão desabilitado');
    const pressable = button.parent?.parent;

    pressable?.props.onPressIn({ nativeEvent: {} });
    pressable?.props.onPressOut({ nativeEvent: {} });

    expect(Animated.spring).not.toHaveBeenCalled();
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });
});

describe('RecommendationCard', () => {
  it('shows the best window, score and reason when there is a recommendation', () => {
    const activity = makeActivity({ name: 'Corrida', emoji: '🏃' });

    renderWithTheme(
      <RecommendationCard
        activity={activity}
        recommendation={{
          activityId: activity.id,
          scoredHours: [],
          bestWindow: {
            start: new Date(2026, 5, 25, 7),
            end: new Date(2026, 5, 25, 10),
            averageScore: 82,
            headline: 'entre 07h e 10h',
            reason: 'temperatura aparente de 20°C, vento leve.',
          },
        }}
      />,
    );

    expect(screen.getByText('entre 07h e 10h')).toBeTruthy();
    expect(screen.getByText('82%')).toBeTruthy();
    expect(screen.getByText('temperatura aparente de 20°C, vento leve.')).toBeTruthy();
  });

  it('shows a clear empty recommendation state', () => {
    const activity = makeActivity({ name: 'Corrida' });

    renderWithTheme(
      <RecommendationCard
        activity={activity}
        recommendation={{ activityId: activity.id, scoredHours: [], bestWindow: null }}
      />,
    );

    expect(screen.getByText('Sem janela ideal hoje')).toBeTruthy();
    expect(screen.getByText(/não ficam confortáveis para corrida/i)).toBeTruthy();
  });
});

describe('HourTimeline', () => {
  it('marks the best window and exposes useful hourly details', () => {
    const firstHour = makeScoredHour({
      hour: 7,
      temp: 19,
      precip: 10,
      wind: 5,
      uv: 1,
      score: 89,
    });

    renderWithTheme(
      <HourTimeline
        hours={[
          firstHour,
          makeScoredHour({ hour: 8, temp: 21, precip: 60, wind: 12, uv: 2, score: 42 }),
          makeScoredHour({ hour: 12, temp: 24, precip: 0, wind: 8, uv: 8, score: 74 }),
        ]}
        bestWindow={{
          start: firstHour.hour.time,
          end: new Date(firstHour.hour.time.getTime() + 60 * 60 * 1000),
          averageScore: 89,
          headline: 'entre 07h e 08h',
          reason: 'boa janela',
        }}
      />,
    );

    expect(screen.getByText('Próximas horas')).toBeTruthy();
    expect(screen.getByText('Janela ideal')).toBeTruthy();
    expect(screen.getByText('60%')).toBeTruthy();
    expect(screen.getByLabelText(/07h: Janela ideal, 89%/)).toBeTruthy();
  });

  it('renders with null bestWindow and shows partly-sunny icon for medium precipitation', () => {
    renderWithTheme(
      <HourTimeline
        hours={[makeScoredHour({ hour: 14, temp: 25, precip: 40, uv: 3, score: 55 })]}
        bestWindow={null}
      />,
    );

    expect(screen.getByText('40%')).toBeTruthy();
    expect(screen.getByText('Ok')).toBeTruthy();
  });
});
