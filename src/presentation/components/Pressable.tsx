import styled from 'styled-components/native';

export const Card = styled.Pressable`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing(4)}px;
  min-height: 64px;
`;

export const PrimaryButton = styled.Pressable<{ disabled?: boolean }>`
  background-color: ${({ theme, disabled }) =>
    disabled ? theme.colors.surfaceMuted : theme.colors.amber};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  padding-vertical: ${({ theme }) => theme.spacing(3.5)}px;
  padding-horizontal: ${({ theme }) => theme.spacing(6)}px;
  align-items: center;
  min-height: 48px;
  justify-content: center;
`;

export const PrimaryButtonLabel = styled.Text<{ disabled?: boolean }>`
  color: ${({ theme, disabled }) =>
    disabled ? theme.colors.textMuted : theme.colors.night};
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSize.md}px;
`;
