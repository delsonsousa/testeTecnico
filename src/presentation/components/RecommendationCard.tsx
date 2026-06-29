import React from 'react';
import styled from 'styled-components/native';
import { DailyRecommendation } from '@domain/entities/Recommendation';
import { Activity } from '@domain/entities/Activity';
import { Display, Body, Caption, Eyebrow, Title } from './Text';
import { scoreLabel } from '@presentation/theme/scoreColor';

const Wrap = styled.View`
  background-color: ${({ theme }) => theme.colors.nightElevated};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing(6)}px;
  overflow: hidden;
`;

const AmberBar = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.amber};
`;

const Highlight = styled(Display)`
  color: ${({ theme }) => theme.colors.amber};
  margin-top: ${({ theme }) => theme.spacing(2)}px;
`;

const QualityPanel = styled.View`
  margin-top: ${({ theme }) => theme.spacing(4)}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing(4)}px;
  gap: ${({ theme }) => theme.spacing(2)}px;
`;

const QualityHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(3)}px;
`;

const MeterTrack = styled.View`
  height: 8px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  overflow: hidden;
`;

const MeterFill = styled.View<{ width: number }>`
  height: 100%;
  width: ${({ width }) => width}%;
  background-color: ${({ theme }) => theme.colors.amber};
  border-radius: ${({ theme }) => theme.radius.pill}px;
`;

export function RecommendationCard({
  recommendation,
  activity,
}: {
  recommendation: DailyRecommendation;
  activity: Activity;
}) {
  const { bestWindow } = recommendation;

  if (!bestWindow) {
    return (
      <Wrap>
        <AmberBar />
        <Eyebrow>Hoje · {activity.emoji} {activity.name}</Eyebrow>
        <Highlight>Sem janela ideal hoje</Highlight>
        <Body style={{ marginTop: 8 }}>
          As condições não ficam confortáveis para {activity.name.toLowerCase()} em
          nenhum horário do dia. Vale tentar outra atividade ou esperar.
        </Body>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <AmberBar />
      <Eyebrow>Melhor horário hoje · {activity.emoji} {activity.name}</Eyebrow>
      <Highlight>{bestWindow.headline}</Highlight>
      <QualityPanel
        accessibilityLabel={`Esse horário combina ${bestWindow.averageScore}% com o perfil. ${scoreLabel(bestWindow.averageScore)}.`}
      >
        <QualityHeader>
          <Caption>Combina com o perfil</Caption>
          <Title>{bestWindow.averageScore}%</Title>
        </QualityHeader>
        <MeterTrack>
          <MeterFill width={bestWindow.averageScore} />
        </MeterTrack>
      </QualityPanel>
      <Body style={{ marginTop: 12 }}>{bestWindow.reason}</Body>
    </Wrap>
  );
}
