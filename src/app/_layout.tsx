import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold, useFonts } from '@expo-google-fonts/scheherazade-new';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashOverlay } from '@/components/SplashOverlay';
import { UpdateBanner } from '@/components/UpdateBanner';

import { setupAlarmHandler } from '@/lib/alarms';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { useBackgroundUpdateCheck } from '@/lib/updates';
import { useColorMode, useTheme } from '@/theme';
// Widget arka plan görevi global kapsamda tanımlanmalı
import { registerWidgetBackgroundTask } from '@/widgets/background';

SplashScreen.preventAutoHideAsync().catch(() => {});
// Uygulama açıkken gelen vakit alarmları da sesli gösterilsin
setupAlarmHandler();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function App() {
  const t = useTheme();
  const mode = useColorMode();
  const { loaded: settingsLoaded } = useSettings();
  // Arapça metin yazı tipi (bkz. src/theme/index.ts)
  const [fontsLoaded, fontError] = useFonts({ ScheherazadeNew_400Regular, ScheherazadeNew_700Bold });
  const fontsReady = fontsLoaded || !!fontError;
  // Ayarlar (tema) yüklenmeden açılış ekranı kapanmasın; yoksa bir an yanlış tema görünür
  const ready = fontsReady && settingsLoaded;

  // Sistem açılış ekranını SplashOverlay kapatır (görsel çizilince); uygulama hazır olunca görsel kaybolur

  useEffect(() => {
    registerWidgetBackgroundTask();
  }, []);

  // Uygulama öne geldiğinde güncelleme denetimi (EAS Update)
  useBackgroundUpdateCheck();

  return (
    <>
      {ready && (
        <>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.background } }} />
          <UpdateBanner />
        </>
      )}
      <SplashOverlay ready={ready} />
    </>
  );
}
