import { Platform } from 'react-native';

export const colors = {
  bg: '#F7F7FB',
  surface: '#FFFFFF',
  ink: '#16161D',
  ink2: '#5E5E6B',
  accent: '#7567B6',
  teal: '#2E9E86',
  rose: '#C05A86',
  gold: '#B8862F',
  hairline: '#EEEEF2',
  danger: '#B23A48',
} as const;

export const radius = { card: 20, pill: 999, field: 14 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const typography = {
  ko: Platform.select({ ios: 'Noto Sans KR', android: 'Noto Sans KR', default: 'sans-serif' }),
  display: Platform.select({ ios: 'Fraunces', android: 'Fraunces', default: 'serif' }),
} as const;
export const shadow = {
  card: {
    shadowColor: '#1A1729',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 2,
  },
  button: {
    shadowColor: '#7567B6',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
  },
} as const;
