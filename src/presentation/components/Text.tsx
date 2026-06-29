import styled from 'styled-components/native';

export const Display = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSize.xxl}px;
  font-weight: 700;
  letter-spacing: 0px;
`;

export const Title = styled.Text`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  font-weight: 700;
`;

export const Body = styled.Text`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  line-height: 22px;
`;

export const Caption = styled.Text`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
`;

export const Eyebrow = styled.Text`
  color: ${({ theme }) => theme.colors.amber};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  font-weight: 700;
  letter-spacing: 0px;
  text-transform: uppercase;
`;
