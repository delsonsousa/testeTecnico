import React from 'react';
import styled from 'styled-components/native';
import { Activity } from '@domain/entities/Activity';
import { ScalePressable } from './ScalePressable';

const Row = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})``;

const Chip = styled(ScalePressable)<{ active: boolean }>`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${({ theme }) => theme.spacing(2.5)}px;
  padding-horizontal: ${({ theme }) => theme.spacing(4)}px;
  margin-right: ${({ theme }) => theme.spacing(2)}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  border-width: 1px;
  border-color: ${({ theme, active }) =>
    active ? theme.colors.amber : theme.colors.border};
  background-color: ${({ theme, active }) =>
    active ? theme.colors.amber : theme.colors.surface};
`;

const ChipLabel = styled.Text<{ active: boolean }>`
  color: ${({ theme, active }) =>
    active ? theme.colors.night : theme.colors.textSecondary};
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export function ActivityChips({
  activities,
  selectedId,
  onSelect,
}: {
  activities: readonly Activity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Row contentContainerStyle={{ paddingRight: 16 }}>
      {activities.map((a) => {
        const active = a.id === selectedId;
        return (
          <Chip
            key={a.id}
            active={active}
            onPress={() => onSelect(a.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Selecionar atividade ${a.name}`}
            hitSlop={8}
          >
            <ChipLabel active={active}>
              {a.emoji}  {a.name}
            </ChipLabel>
          </Chip>
        );
      })}
    </Row>
  );
}
