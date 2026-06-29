import React from 'react';
import { ActivityIndicator } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { Body, Title } from './Text';
import { PrimaryButton, PrimaryButtonLabel } from './Pressable';
import { AppTheme } from '@presentation/theme/theme';

const Center = styled.View`
  padding: ${({ theme }) => theme.spacing(8)}px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)}px;
`;

export function LoadingView({ label = 'Consultando o céu…' }: { label?: string }) {
  const theme = useTheme() as AppTheme;
  return (
    <Center accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={theme.colors.amber} />
      <Body>{label}</Body>
    </Center>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Center>
      <Title>Não deu certo</Title>
      <Body style={{ textAlign: 'center' }}>{message}</Body>
      {onRetry && (
        <PrimaryButton
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
        >
          <PrimaryButtonLabel>Tentar de novo</PrimaryButtonLabel>
        </PrimaryButton>
      )}
    </Center>
  );
}

export function EmptyView({ title, hint }: { title: string; hint?: string }) {
  return (
    <Center>
      <Title>{title}</Title>
      {hint && <Body style={{ textAlign: 'center' }}>{hint}</Body>}
    </Center>
  );
}
