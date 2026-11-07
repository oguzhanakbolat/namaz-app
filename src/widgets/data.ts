/**
 * Widget verisi. Vakit hesapları uygulamada yapılır; widget'lar yalnızca hazır değerleri çizer
 * (widget kodu ayrı bir ortamda çalışır ve hesap/hook/import kullanamaz).
 */
import { gregorianParts } from '@/lib/format';
import { addDays, cityToday, PRAYER_LABELS, prayerState, toEpoch, type PrayerKey } from '@/lib/prayer';
import type { DayTimes } from '@/lib/types';
import type { AppSettings } from '@/lib/settings';
import { DEFAULT_PALETTES, EMPTY_WIDGET_PROPS, type WidgetPalette, type WidgetProps } from './types';

export { EMPTY_WIDGET_PROPS, type WidgetProps };

// ---------------------------------------------------------------- renkler

type AccentSet = {
  light: { active: string; accent: string; hero: string; heroDeep: string; heroAccent: string };
  dark: { active: string; accent: string; hero: string; heroDeep: string; heroAccent: string };
};

/** Vurgu renkleri (açık / koyu tema sürümleri) */
export const ACCENTS: Record<AppSettings['widget']['accent'], AccentSet & { label: string; swatch: string }> = {
  green: {
    label: 'Yeşil',
    swatch: '#0F6B5C',
    light: { active: '#0F6B5C', accent: '#0F6B5C', hero: '#0F6B5C', heroDeep: '#0A4A40', heroAccent: '#F2C66D' },
    dark: { active: '#2B8C77', accent: '#4FC3A8', hero: '#145C50', heroDeep: '#0B3029', heroAccent: '#F2C66D' },
  },
  gold: {
    label: 'Altın',
    swatch: '#B7832A',
    light: { active: '#A8761F', accent: '#A8761F', hero: '#8A6420', heroDeep: '#5C4416', heroAccent: '#FFE3A3' },
    dark: { active: '#B88A34', accent: '#F2C66D', hero: '#6E5019', heroDeep: '#3D2C0D', heroAccent: '#FFE3A3' },
  },
  blue: {
    label: 'Mavi',
    swatch: '#1F5FA8',
    light: { active: '#1F5FA8', accent: '#1F5FA8', hero: '#1F5FA8', heroDeep: '#143E6E', heroAccent: '#FFD27A' },
    dark: { active: '#2F6FC0', accent: '#7FB2F0', hero: '#1A4C86', heroDeep: '#0E2A4C', heroAccent: '#FFD27A' },
  },
  rose: {
    label: 'Gül',
    swatch: '#B4475E',
    light: { active: '#B4475E', accent: '#B4475E', hero: '#A33D54', heroDeep: '#6E2838', heroAccent: '#FFD6A0' },
    dark: { active: '#B9536A', accent: '#F097A8', hero: '#8A3448', heroDeep: '#4E1C28', heroAccent: '#FFD6A0' },
  },
  purple: {
    label: 'Mor',
    swatch: '#6A4CB4',
    light: { active: '#6A4CB4', accent: '#6A4CB4', hero: '#5E43A3', heroDeep: '#3D2B6E', heroAccent: '#FFD27A' },
    dark: { active: '#7559C2', accent: '#B9A3F0', hero: '#4E388C', heroDeep: '#2B1F4E', heroAccent: '#FFD27A' },
  },
};

const BASE = {
  light: { bg: '#FFFFFF', surface: '#F4F2EC', text: '#1C2421', muted: '#6B736F' },
  dark: { bg: '#111917', surface: '#1C2622', text: '#ECF0EE', muted: '#93A09B' },
};

/** Widget ayarlarından açık/koyu paletleri üretir */
export function buildPalettes(w: AppSettings['widget'] | undefined): WidgetProps['palette'] {
  if (!w) return DEFAULT_PALETTES;
  const acc = ACCENTS[w.accent] ?? ACCENTS.green;
  const overlay =
    w.textColor === 'black'
      ? { overlayText: '#111111', overlayShadow: '#FFFFFF' }
      : { overlayText: '#FFFFFF', overlayShadow: '#000000' };

  const solid = (mode: 'light' | 'dark'): WidgetPalette => ({
    transparent: false,
    ...BASE[mode],
    ...acc[mode],
    heroText: '#FFFFFF',
    heroMuted: '#D5E4E0',
    activeText: '#FFFFFF',
    activeMuted: '#E4EEEB',
    ...overlay,
  });

  if (w.theme === 'transparent') {
    const white = w.textColor !== 'black';
    const tone = acc[white ? 'dark' : 'light'];
    const p: WidgetPalette = {
      transparent: true,
      bg: '#000000',
      surface: '#000000',
      text: white ? '#FFFFFF' : '#111111',
      muted: white ? '#E2E2E2' : '#3A3A3A',
      hero: tone.hero,
      heroDeep: tone.heroDeep,
      heroText: white ? '#FFFFFF' : '#111111',
      heroMuted: white ? '#E2E2E2' : '#3A3A3A',
      heroAccent: white ? tone.heroAccent : tone.active,
      accent: white ? tone.heroAccent : tone.active,
      active: tone.active,
      activeText: '#FFFFFF',
      activeMuted: '#E4EEEB',
      ...overlay,
    };
    return { light: p, dark: p };
  }
  if (w.theme === 'light') return { light: solid('light'), dark: solid('light') };
  if (w.theme === 'dark') return { light: solid('dark'), dark: solid('dark') };
  return { light: solid('light'), dark: solid('dark') };
}

const KEYS: PrayerKey[] = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
const FIELDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

const DATIVE: Record<PrayerKey, string> = {
  imsak: 'İmsaka',
  sabah: 'Sabaha',
  gunes: 'Güneşe',
  ogle: 'Öğleye',
  ikindi: 'İkindiye',
  aksam: 'Akşama',
  yatsi: 'Yatsıya',
};

const offsetOf = (days: DayTimes[]) => (days[0]?.gmtOffset != null ? Number(days[0].gmtOffset) : 3);

/** Verilen andaki widget içeriği */
export function propsAt(
  days: DayTimes[],
  city: string,
  at: number,
  palette: WidgetProps['palette'] = DEFAULT_PALETTES
): WidgetProps | null {
  const state = prayerState(days, at);
  if (!state) return null;
  const today = cityToday(at, offsetOf(days));
  const day = days.find((d) => d.date === today) ?? state.today;
  const g = gregorianParts(day.date);

  return {
    ready: true,
    city,
    dateLabel: `${Number(g.day)} ${g.month} ${g.weekday}`,
    hijri: day.hijriDateLong ?? '',
    prayers: KEYS.map((k, i) => ({ label: PRAYER_LABELS[k], time: String(day[FIELDS[i]]) })),
    current: KEYS.indexOf(state.current),
    nextLabel: state.nextLabel,
    nextDative: DATIVE[state.next],
    nextTime: state.nextTime,
    currentStart: state.currentStart,
    nextAt: state.nextAt,
    palette,
  };
}

/**
 * iOS zaman çizelgesi: şimdi + her vakit girişi + her gece yarısı (tarih değişimi).
 * Widget bu anlarda kendiliğinden yeni içeriğe geçer; geri sayımı sistem işletir.
 */
export function buildTimeline(
  days: DayTimes[],
  city: string,
  now: number,
  palette: WidgetProps['palette'] = DEFAULT_PALETTES,
  horizonDays = 10
) {
  const offset = offsetOf(days);
  const until = now + horizonDays * 86_400_000;
  const moments = new Set<number>([now]);

  for (const d of days) {
    // Gece yarısı (ilçe saatiyle)
    const midnight = toEpoch(d.date, '00:00', offset);
    if (midnight > now && midnight < until) moments.add(midnight);
    for (const f of FIELDS) {
      const at = toEpoch(d.date, String(d[f]), offset);
      if (at > now && at < until) moments.add(at);
    }
  }
  // Son günün ertesi gece yarısını da ekleme: o gün için veri yok
  const lastDate = days[days.length - 1]?.date;
  const lastMidnight = lastDate ? toEpoch(addDays(lastDate, 1), '00:00', offset) : Infinity;

  const entries: { date: Date; props: WidgetProps }[] = [];
  for (const at of [...moments].sort((a, b) => a - b)) {
    if (at >= lastMidnight) break;
    const props = propsAt(days, city, at, palette);
    if (!props) continue;
    entries.push({ date: new Date(at), props });
  }
  return entries;
}
