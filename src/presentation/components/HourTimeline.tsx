import React from 'react';
import styled, { useTheme } from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { RecommendationWindow, ScoredHour } from '@domain/entities/Recommendation';
import { scoreColor } from '@presentation/theme/scoreColor';
import { AppTheme } from '@presentation/theme/theme';
import { Caption } from './Text';
import { scoreLabel } from '@presentation/theme/scoreColor';
import { AnimatedMeter } from './AnimatedMeter';
import { FadeInView } from './FadeInView';

const Container = styled.View`
  margin-top: ${({ theme }) => theme.spacing(6)}px;
`;

const Panel = styled.View`
  margin-top: ${({ theme }) => theme.spacing(3)}px;
  background-color: rgba(29, 37, 41, 0.86);
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: rgba(181, 192, 194, 0.18);
  overflow: hidden;
`;

const PanelHeader = styled.View`
  padding: ${({ theme }) => theme.spacing(4)}px;
  padding-bottom: ${({ theme }) => theme.spacing(3)}px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(181, 192, 194, 0.16);
  gap: ${({ theme }) => theme.spacing(2)}px;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)}px;
`;

const HeaderLabel = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: 800;
  text-transform: uppercase;
`;

const HeaderHint = styled(Caption)`
  line-height: 18px;
`;

const LegendRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)}px;
`;

const LegendTrack = styled.View`
  flex: 1;
  height: 5px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  overflow: hidden;
`;

const LegendFill = styled.View`
  width: 72%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.good};
  border-radius: ${({ theme }) => theme.radius.pill}px;
`;

const HourRow = styled.View<{ active: boolean }>`
  position: relative;
  flex-direction: row;
  align-items: center;
  min-height: 76px;
  padding-vertical: ${({ theme }) => theme.spacing(3)}px;
  padding-horizontal: ${({ theme }) => theme.spacing(4)}px;
  background-color: ${({ theme, active }) =>
    active ? 'rgba(245, 181, 68, 0.13)' : theme.colors.nightElevated};
`;

const ActiveRail = styled.View<{ active: boolean }>`
  position: absolute;
  left: 0;
  top: ${({ theme }) => theme.spacing(3)}px;
  bottom: ${({ theme }) => theme.spacing(3)}px;
  width: 4px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme, active }) =>
    active ? theme.colors.amber : 'transparent'};
`;

const Separator = styled.View`
  height: 1px;
  margin-left: ${({ theme }) => theme.spacing(4)}px;
  background-color: rgba(181, 192, 194, 0.13);
`;

const HourCell = styled.View`
  width: 50px;
`;

const HourText = styled.Text<{ active: boolean }>`
  color: ${({ theme, active }) =>
    active ? theme.colors.textPrimary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  font-weight: 800;
`;

const ConditionCell = styled.View`
  width: 60px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)}px;
`;

const RainText = styled.Text`
  color: #50d5ff;
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: 800;
`;

const TempCell = styled.View`
  width: 48px;
  align-items: flex-end;
`;

const Temperature = styled.Text<{ active: boolean }>`
  color: ${({ theme, active }) =>
    active ? theme.colors.textPrimary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: 800;
`;

const ScoreCell = styled.View`
  flex: 1;
  gap: ${({ theme }) => theme.spacing(1.5)}px;
`;

const StatusRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)}px;
`;

const Status = styled.Text<{ active: boolean }>`
  color: ${({ theme, active }) =>
    active ? theme.colors.amber : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  font-weight: 800;
`;

const Detail = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
`;

const MeterValue = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: 800;
`;

function hourLabel(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}h`;
}

function isInWindow(hour: Date, window: RecommendationWindow | null): boolean {
  if (!window) return false;
  return hour >= window.start && hour < window.end;
}

function statusLabel(score: number, active: boolean): string {
  if (active) return 'Janela ideal';
  return scoreLabel(score);
}

function iconForHour(hour: ScoredHour): keyof typeof Ionicons.glyphMap {
  if (hour.hour.precipitationProbability >= 55) return 'rainy';
  if (hour.hour.precipitationProbability >= 30) return 'partly-sunny';
  if (hour.hour.uvIndex >= 7) return 'sunny';
  return 'partly-sunny-outline';
}

export function HourTimeline({
  hours,
  bestWindow,
}: {
  hours: readonly ScoredHour[];
  bestWindow: RecommendationWindow | null;
}) {
  const theme = useTheme() as AppTheme;
  return (
    <Container>
      <FadeInView>
        <Panel>
        <PanelHeader>
          <HeaderRow>
            <HeaderTitle>
              <Ionicons name="time-outline" size={15} color={theme.colors.textMuted} />
              <HeaderLabel>Próximas horas</HeaderLabel>
            </HeaderTitle>
            <HeaderLabel>Combina</HeaderLabel>
          </HeaderRow>
          <HeaderHint>
            Quanto maior a faixa, melhor aquele horário para o perfil escolhido.
          </HeaderHint>
          <LegendRow accessibilityLabel="Escala de combinação com o perfil: quanto maior a barra, melhor o horário.">
            <Caption>baixo</Caption>
            <LegendTrack>
              <LegendFill />
            </LegendTrack>
            <Caption>alto</Caption>
          </LegendRow>
        </PanelHeader>

        {hours.map((sh, index) => {
          const active = isInWindow(sh.hour.time, bestWindow);
          const color = scoreColor(sh.score, theme);
          const label = `${hourLabel(sh.hour.time)}: ${statusLabel(sh.score, active)}, ${
            sh.score
          }% de combinação com o perfil, ${Math.round(sh.hour.apparentTemperatureC)} graus de sensação, ${
            sh.hour.precipitationProbability
          }% de chuva, vento ${Math.round(sh.hour.windSpeedKmh)} quilômetros por hora, UV ${Math.round(
            sh.hour.uvIndex,
          )}.`;

          return (
            <React.Fragment key={sh.hour.time.toISOString()}>
              {index > 0 && <Separator />}
              <FadeInView delay={index * 35} distance={6}>
                <HourRow
                  active={active}
                  accessible
                  accessibilityLabel={label}
                >
                  <ActiveRail active={active} />
                  <HourCell>
                    <HourText active={active}>{hourLabel(sh.hour.time)}</HourText>
                  </HourCell>
                  <ConditionCell>
                    <Ionicons
                      name={iconForHour(sh)}
                      size={24}
                      color={
                        sh.hour.precipitationProbability >= 55
                          ? '#50D5FF'
                          : theme.colors.amber
                      }
                    />
                    {sh.hour.precipitationProbability >= 30 && (
                      <RainText>{sh.hour.precipitationProbability}%</RainText>
                    )}
                  </ConditionCell>
                  <TempCell>
                    <Temperature active={active}>
                      {Math.round(sh.hour.temperatureC)}°
                    </Temperature>
                  </TempCell>
                  <ScoreCell>
                    <StatusRow>
                      <Status active={active}>{statusLabel(sh.score, active)}</Status>
                      <MeterValue>{sh.score}%</MeterValue>
                    </StatusRow>
                    <AnimatedMeter value={sh.score} color={color} />
                    <Detail>
                      Sens. {Math.round(sh.hour.apparentTemperatureC)}° · vento{' '}
                      {Math.round(sh.hour.windSpeedKmh)} km/h · UV{' '}
                      {Math.round(sh.hour.uvIndex)}
                    </Detail>
                  </ScoreCell>
                </HourRow>
              </FadeInView>
            </React.Fragment>
          );
        })}
        </Panel>
      </FadeInView>
    </Container>
  );
}
