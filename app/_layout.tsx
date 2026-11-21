import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { Button, ErrorState } from '@/components/common';
import { View } from '@/components/Themed';
import { palette } from '@/constants/Colors';
import { AuthProvider, useAuth } from '@/features/auth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding until fonts and the auth state are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

// Colors for screen backgrounds, headers and the tab bar.
const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.accent,
    background: palette.background,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    notification: palette.accent,
  },
};

function RootLayoutNav() {
  const { route, refreshProfile, signOut, profileOffline: offline } = useAuth();

  useEffect(() => {
    if (route !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [route]);

  if (route === 'loading') {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      {route === 'error' ? (
        <View style={[styles.errorContainer, { backgroundColor: palette.background }]}>
          <ErrorState
            safeArea
            message="Your account could not be loaded."
            offline={offline}
            onRetry={refreshProfile}
          >
            <Button title="Sign out" variant="link" onPress={signOut} />
          </ErrorState>
        </View>
      ) : (
        // Stack.Protected redirects automatically when a guard changes, for example
        // after sign-in, sign-out, or finishing onboarding.
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={route === 'auth'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={route === 'onboarding'}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Protected guard={route === 'app'}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1 },
});
