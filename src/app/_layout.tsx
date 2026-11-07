import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold, useFonts } from '@expo-google-fonts/scheherazade-new';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Arapça metin yazı tipi (bkz. src/theme/index.ts)
  const [loaded, error] = useFonts({ ScheherazadeNew_400Regular, ScheherazadeNew_700Bold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
