import { useColorScheme } from 'react-native';

/** Açık ve koyu tema renkleri */
const light = {
  background: '#F4F2EC',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F5F0',
  border: '#E8E4DA',
  text: '#1C2421',
  textMuted: '#6B736F',
  textSoft: '#959C98',
  primary: '#0F6B5C',
  primarySoft: '#E3F1EC',
  accent: '#C79A3B',
  accentSoft: '#F7EDD6',
  heroFrom: '#0F6B5C',
  heroTo: '#0A4A40',
  heroText: '#FFFFFF',
  heroMuted: 'rgba(255,255,255,0.72)',
  danger: '#B42318',
  shadow: '#1C2421',
  // Arapça metin/görsel kutusu: hat görselleri genelde siyah olduğu için iki temada da açık zemin
  paper: '#FAF7F0',
  paperText: '#1C2421',
};

const dark: typeof light = {
  background: '#0D1311',
  surface: '#161E1B',
  surfaceMuted: '#1C2622',
  border: '#24302B',
  text: '#ECF0EE',
  textMuted: '#A3ADA9',
  textSoft: '#78837E',
  primary: '#4FC3A8',
  primarySoft: '#173A32',
  accent: '#E0B65A',
  accentSoft: '#3A3020',
  heroFrom: '#145C50',
  heroTo: '#0B3029',
  heroText: '#FFFFFF',
  heroMuted: 'rgba(255,255,255,0.7)',
  danger: '#F97066',
  shadow: '#000000',
  paper: '#EFE9DC',
  paperText: '#1C2421',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = (n: number) => n * 4;

export const fonts = {
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
};
