import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { Icon } from '../components/Icon';

function ThemedTabs() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 12 : 8);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.bg,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.hairline,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 17,
            color: colors.text,
            letterSpacing: -0.3,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
            elevation: 8,
            shadowColor: colors.shadow,
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: -2 },
            height: 58 + bottomInset,
            paddingBottom: bottomInset + 4,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: -0.1,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tổng quan',
            headerShown: false, // We render a custom rich header with settings button in index.js
            tabBarIcon: ({ color, focused }) => (
              <Icon
                name="sprout"
                size={22}
                color={color}
                strokeWidth={focused ? 2.4 : 1.8}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Lịch sử',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Icon
                name="activity"
                size={22}
                color={color}
                strokeWidth={focused ? 2.4 : 1.8}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: 'Trợ lý AI',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Icon
                name="bot"
                size={22}
                color={color}
                strokeWidth={focused ? 2.4 : 1.8}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="diagnosis"
          options={{
            title: 'Chẩn đoán',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Icon
                name="scan"
                size={22}
                color={color}
                strokeWidth={focused ? 2.4 : 1.8}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedTabs />
    </ThemeProvider>
  );
}
