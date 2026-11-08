/**
 * Açılış görseli (gece, hilal ve cami silüeti).
 *
 * Sistem açılış ekranı Android 12+'da yalnızca ortada küçük bir simge gösterebildiği için tam ekran görsel
 * uygulama içinde bir katman olarak çizilir:
 *  - Android: sistem açılış ekranı görselin gece mavisi renginde (#011226) → bu katman görseli gösterir.
 *  - iOS: sistem açılış ekranı aynı görseli tam ekran gösterir → geçiş fark edilmez.
 * Uygulama hazır olunca (yazı tipleri, ayarlar) ve görsel en az MIN_VISIBLE_MS göründükten sonra yumuşakça kaybolur.
 */
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

const SPLASH = require('../../assets/splash.jpg');
export const SPLASH_BACKGROUND = '#011226';
const MIN_VISIBLE_MS = 1000;
const FADE_MS = 450;

export function SplashOverlay({ ready }: { ready: boolean }) {
  const [imageShown, setImageShown] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [opacity] = useState(() => new Animated.Value(1));
  const shownAt = useRef<number | null>(null);

  // Görsel çizilince sistem açılış ekranını kapat (görsel yüklenemezse kısa bir süre sonra yine kapat)
  useEffect(() => {
    const fallback = setTimeout(() => setImageShown(true), 800);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (!imageShown) return;
    shownAt.current ??= Date.now();
    SplashScreen.hideAsync().catch(() => {});
  }, [imageShown]);

  useEffect(() => {
    if (!ready || !imageShown) return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - (shownAt.current ?? Date.now())));
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => setHidden(true));
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, imageShown, opacity]);

  if (hidden) return null;

  return (
    <Animated.View
      pointerEvents={ready ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, styles.wrap, { opacity }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <StatusBar style="light" />
      <Image
        source={SPLASH}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        transition={0}
        onDisplay={() => setImageShown(true)}
        onError={() => setImageShown(true)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: SPLASH_BACKGROUND, zIndex: 1000, elevation: 1000 },
});
