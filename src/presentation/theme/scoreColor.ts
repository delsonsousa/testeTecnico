import { AppTheme } from './theme';

export function scoreColor(score: number, theme: AppTheme): string {
  if (score >= 70) return theme.colors.good;
  if (score >= 50) return theme.colors.fair;
  return theme.colors.poor;
}

export function scoreLabel(score: number): string {
  if (score >= 70) return 'Muito bom';
  if (score >= 50) return 'Ok';
  if (score >= 30) return 'Atenção';
  return 'Evite';
}
