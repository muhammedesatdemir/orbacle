import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, StyleSheet, View } from 'react-native';
import { I18nProvider, useI18n } from './src/i18n';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { getOnboarded, saveOnboarded } from './src/storage/settingsStorage';
import { colors } from './src/constants/colors';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Safe to ignore — splash may already be hidden.
});

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🔮',
    History: '📜',
    Settings: '⚙️',
  };
  return (
    <Text
      style={[styles.icon, focused && styles.iconFocused]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      allowFontScaling={false}
    >
      {icons[label] ?? '•'}
    </Text>
  );
}

function AppNavigator() {
  const { t, ready } = useI18n();
  const insets = useSafeAreaInsets();
  // null = still loading the flag; true/false = resolved.
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboarded().then(setOnboarded);
  }, []);

  const bootReady = ready && onboarded !== null;

  const onLayoutRootView = useCallback(async () => {
    if (bootReady) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [bootReady]);

  useEffect(() => {
    if (bootReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [bootReady]);

  if (!bootReady) {
    // Splash screen still visible; render nothing to avoid black flash.
    return null;
  }

  if (!onboarded) {
    return (
      <View style={styles.root} onLayout={onLayoutRootView}>
        <OnboardingScreen
          onDone={() => {
            setOnboarded(true);
            saveOnboarded();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: [
            styles.tabBar,
            { height: 56 + insets.bottom, paddingBottom: insets.bottom },
          ],
          tabBarActiveTintColor: colors.primaryLight,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
          tabBarAccessibilityLabel: t(route.name.toLowerCase()),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('home') }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: t('history') }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('settings') }} />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <I18nProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </I18nProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  icon: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
  },
});
