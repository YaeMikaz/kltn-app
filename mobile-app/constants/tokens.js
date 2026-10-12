// mobile-app/constants/tokens.js

export const LIGHT_COLORS = {
  isDark: false,
  bg: '#F6F5EE',
  bgCard: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0EDE2',
  surfaceTint: '#EAE6D8',

  primary: '#1B4332',
  primaryDark: '#0F241B',
  primaryLight: '#2D6A4F',
  primarySoft: '#E2ECE5',
  accent: '#B87B22',
  accentSoft: '#F7ECD8',

  text: '#121714',
  textSecondary: '#4E5A53',
  textMuted: '#808D86',

  success: '#2E7D32',
  successSoft: '#E8F5E9',
  warning: '#B25E09',
  warningSoft: '#FFF3E0',
  danger: '#C62828',
  dangerSoft: '#FFEBEE',
  info: '#1565A9',
  infoSoft: '#E3F2FD',

  cardEc: '#FFFFFF',
  cardMoisture: '#FFFFFF',
  cardTemp: '#FFFFFF',
  cardN: '#FFFFFF',

  userBubble: '#1B4332',
  userBubbleText: '#FFFFFF',
  botBubble: '#FFFFFF',
  botBubbleText: '#121714',

  white: '#FFFFFF',
  border: '#DFDACB',
  hairline: '#EAE6D8',
  shadow: '#141A16',
  overlay: 'rgba(20,26,22,0.4)',
};

export const DARK_COLORS = {
  isDark: true,
  bg: '#0F1512',
  bgCard: '#17201B',
  surface: '#17201B',
  surfaceSecondary: '#212D26',
  surfaceTint: '#27362E',

  primary: '#52B788',
  primaryDark: '#2D6A4F',
  primaryLight: '#74C69D',
  primarySoft: '#1A3326',
  accent: '#E6A84D',
  accentSoft: '#382B14',

  text: '#F2F6F3',
  textSecondary: '#A9B8AF',
  textMuted: '#6E7F75',

  success: '#66BB6A',
  successSoft: '#183321',
  warning: '#FFA726',
  warningSoft: '#382914',
  danger: '#EF5350',
  dangerSoft: '#3A1E1E',
  info: '#42A5F5',
  infoSoft: '#17293D',

  cardEc: '#17201B',
  cardMoisture: '#17201B',
  cardTemp: '#17201B',
  cardN: '#17201B',

  userBubble: '#2D6A4F',
  userBubbleText: '#FFFFFF',
  botBubble: '#212D26',
  botBubbleText: '#F2F6F3',

  white: '#FFFFFF',
  border: '#2A3A30',
  hairline: '#202D25',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
};

// Default backwards compatibility
export const COLORS = LIGHT_COLORS;

export const SHADOWS = {
  sm: {
    shadowColor: '#141A16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#141A16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#141A16',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 26,
  full: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const TYPE = {
  hero: 32,
  display: 28,
  title: 20,
  headline: 17,
  body: 15,
  caption: 13,
  micro: 11,
};
