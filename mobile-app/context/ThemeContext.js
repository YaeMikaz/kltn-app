// mobile-app/context/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { LIGHT_COLORS, DARK_COLORS, RADIUS, SHADOWS, SPACING, TYPE } from '../constants/tokens';

const STORAGE_KEY = '@kltn_theme_mode';

const ThemeContext = createContext({
  themeMode: 'system',
  isDark: false,
  colors: LIGHT_COLORS,
  tokens: {
    colors: LIGHT_COLORS,
    radius: RADIUS,
    shadows: SHADOWS,
    spacing: SPACING,
    type: TYPE,
  },
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system'); // 'system' | 'light' | 'dark'
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch (e) {
        console.warn('Failed to load theme preference', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  useEffect(() => {
    // Update system window background color seamlessly
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);

  const value = {
    themeMode,
    isDark,
    colors,
    tokens: {
      colors,
      radius: RADIUS,
      shadows: isDark
        ? {
            sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 1 },
            md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 2 },
            lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 4 },
          }
        : SHADOWS,
      spacing: SPACING,
      type: TYPE,
    },
    setThemeMode,
    toggleTheme,
    loaded,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
