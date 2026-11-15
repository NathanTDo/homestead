import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { Button } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
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

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { route, refreshProfile, signOut } = useAuth();

  useEffect(() => {
    if (route !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [route]);

  if (route === 'loading') {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {route === 'error' ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Your account could not be loaded. Check your connection.
          </Text>
          <Button title="Try again" onPress={refreshProfile} />
          <Button title="Sign out" variant="link" onPress={signOut} />
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
  errorContainer: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
});
