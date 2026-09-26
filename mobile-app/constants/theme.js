// Bảng màu và style dùng chung cho toàn bộ app.
export const COLORS = {
  // Nền
  bg: '#F8FAF8',
  bgCard: '#FFFFFF',

  // Chính
  primary: '#2E7D32',
  primaryDark: '#1B4332',
  primaryLight: '#4CAF50',
  primarySoft: '#E8F5E9',
  accent: '#A5D6A7',

  // Văn bản
  text: '#1B4332',
  textSecondary: '#4B5E52',
  textMuted: '#7A8F82',

  // Trạng thái
  success: '#2E7D32',
  warning: '#EF6C00',
  danger: '#C62828',
  info: '#0288D1',

  // Card cảm biến
  cardEc: '#E8F5E9',
  cardMoisture: '#E1F5FE',
  cardTemp: '#FFF3E0',
  cardN: '#F1F8E9',

  // Chat
  userBubble: '#C8E6C9',
  botBubble: '#F1F8E9',

  // Misc
  white: '#FFFFFF',
  border: '#C8E6C9',
  shadow: '#1B4332',
  overlay: 'rgba(27, 67, 50, 0.08)',
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
  },
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
};
