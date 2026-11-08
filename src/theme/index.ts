import { useColorScheme } from 'react-native';

import { useOptionalSettings } from '@/lib/settings';

/** Açık ve koyu tema renkleri */
const light = {
  background: '#F4F2EC',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F5F0',
  border: '#E8E4DA',
  text: '#1C2421',
  textMuted: '#6B736F',
  textSoft: '#959C98',
  primary: '#0D7A9A',
  primarySoft: '#E6F2F6',
  accent: '#C79A3B',
  accentSoft: '#F7EDD6',
  heroFrom: '#0D7A9A',
  heroTo: '#08546B',
  heroText: '#FFFFFF',
  heroMuted: 'rgba(255,255,255,0.72)',
  danger: '#B42318',
  shadow: '#1C2421',
  // Arapça metin/görsel kutusu: hat görselleri genelde siyah olduğu için iki temada da açık zemin
  paper: '#FAF7F0',
  paperText: '#1C2421',
};

const dark: typeof light = {
  background: '#0B1114',
  surface: '#121A1E',
  surfaceMuted: '#182328',
  border: '#223039',
  text: '#ECF0EE',
  textMuted: '#A3AEB2',
  textSoft: '#788488',
  primary: '#5BBAD5',
  primarySoft: '#12313B',
  accent: '#E0B65A',
  accentSoft: '#3A3020',
  heroFrom: '#0E5F78',
  heroTo: '#08303D',
  heroText: '#FFFFFF',
  heroMuted: 'rgba(255,255,255,0.7)',
  danger: '#F97066',
  shadow: '#000000',
  paper: '#EFE9DC',
  paperText: '#1C2421',
};

export type Theme = typeof light;

/** Uygulamanın o anki teması: Ayarlar'daki seçim, "Sistem" ise telefonun teması */
export function useColorMode(): 'light' | 'dark' {
  const system = useColorScheme();
  const mode = useOptionalSettings()?.settings.themeMode ?? 'system';
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): Theme {
  return useColorMode() === 'dark' ? dark : light;
}

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = (n: number) => n * 4;

/** Arapça metin yazı tipi: Scheherazade New (SIL, Google Fonts) — _layout.tsx içinde yüklenir */
export const fonts = {
  arabic: 'ScheherazadeNew_400Regular',
  arabicBold: 'ScheherazadeNew_700Bold',
};

/**
 * Arapça metin boyutları.
 * size / lineHeight: ayet, hadis   ·   compactSize / compactLineHeight: esma (yan yana düzen)
 */
export const arabicText = {
  size: 26,
  lineHeight: 56,
  compactSize: 38,
  compactLineHeight: 78,
};
