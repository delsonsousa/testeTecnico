export const theme = {
  colors: {
    night: '#101417',
    nightElevated: '#171D21',
    surface: '#1D2529',
    surfaceMuted: '#293337',
    border: '#344247',
    textPrimary: '#F4F6FB',
    textSecondary: '#B5C0C2',
    textMuted: '#819092',
    amber: '#F5B544',
    amberDeep: '#E08A2B',
    dawn: '#E86D4A',
    good: '#5BD6A6',
    fair: '#F5B544',
    poor: '#E26D6D',
    overlay: 'rgba(8, 12, 22, 0.7)',
  },
  spacing: (n: number) => n * 4,
  radius: { sm: 6, md: 8, lg: 8, pill: 999 },
  font: {
    display: 'System',
    body: 'System',
  },
  fontSize: {
    xs: 12, sm: 14, md: 16, lg: 20, xl: 26, xxl: 32, hero: 40,
  },
} as const;

export type AppTheme = typeof theme;
