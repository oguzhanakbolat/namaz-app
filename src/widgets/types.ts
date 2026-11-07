/**
 * Widget içerik tipi, renk paleti ve varsayılan içerik.
 * Bu dosya widget'ların kendi derleme ortamında da yüklenir: uygulamanın başka modüllerini içe aktarmamalı.
 */
export type WidgetPrayer = { label: string; time: string };

/** Widget renkleri. Uygulamadaki "Widget Ayarları"ndan üretilir (src/widgets/data.ts → buildPalettes). */
export type WidgetPalette = {
  /** Arka plan çizilmez; widget duvar kâğıdının üzerinde durur */
  transparent: boolean;
  bg: string;
  /** Hücre zemini (Vakit Şeridi) */
  surface: string;
  text: string;
  muted: string;
  /** Vurgulu blok (Sıradaki Vakit, Vakit Paneli sol blok) */
  hero: string;
  heroDeep: string;
  heroText: string;
  heroMuted: string;
  heroAccent: string;
  /** Zemin üzerindeki vurgu yazısı (geri sayım) */
  accent: string;
  /** Şu anki vakit vurgusu */
  active: string;
  activeText: string;
  activeMuted: string;
  /** Şeffaf mini widget yazısı ve gölgesi */
  overlayText: string;
  overlayShadow: string;
};

export type WidgetProps = {
  /** Konum seçilmiş ve vakit verisi var mı */
  ready: boolean;
  city: string;
  /** "8 Kasım Pazar" */
  dateLabel: string;
  /** "28 Cemaziyelevvel 1448" */
  hijri: string;
  /** Günün 6 vakti: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı */
  prayers: WidgetPrayer[];
  /** Şu anki vaktin prayers içindeki sırası (-1: yok) */
  current: number;
  /** Sıradaki vaktin adı ve yönelme hâli: "İkindi", "İkindiye" */
  nextLabel: string;
  nextDative: string;
  nextTime: string;
  /** Epoch ms — iOS geri sayımı için */
  currentStart: number;
  nextAt: number;
  /** Telefon açık temadayken ve koyu temadayken kullanılacak renkler */
  palette: { light: WidgetPalette; dark: WidgetPalette };
};

/** Varsayılan: yeşil vurgu, telefonun temasını izler */
export const DEFAULT_PALETTES: WidgetProps['palette'] = {
  light: {
    transparent: false,
    bg: '#FFFFFF',
    surface: '#F4F2EC',
    text: '#1C2421',
    muted: '#6B736F',
    hero: '#0F6B5C',
    heroDeep: '#0A4A40',
    heroText: '#FFFFFF',
    heroMuted: '#B9D7CF',
    heroAccent: '#F2C66D',
    accent: '#0F6B5C',
    active: '#0F6B5C',
    activeText: '#FFFFFF',
    activeMuted: '#D7EEE8',
    overlayText: '#FFFFFF',
    overlayShadow: '#000000',
  },
  dark: {
    transparent: false,
    bg: '#111917',
    surface: '#1C2622',
    text: '#ECF0EE',
    muted: '#93A09B',
    hero: '#145C50',
    heroDeep: '#0B3029',
    heroText: '#FFFFFF',
    heroMuted: '#B9D7CF',
    heroAccent: '#F2C66D',
    accent: '#4FC3A8',
    active: '#2B8C77',
    activeText: '#FFFFFF',
    activeMuted: '#D7EEE8',
    overlayText: '#FFFFFF',
    overlayShadow: '#000000',
  },
};

/** Konum seçilmemişken / veri yokken gösterilecek içerik */
export const EMPTY_WIDGET_PROPS: WidgetProps = {
  ready: false,
  city: 'Namaz Vakti',
  dateLabel: '',
  hijri: '',
  prayers: [
    { label: 'İmsak', time: '--:--' },
    { label: 'Güneş', time: '--:--' },
    { label: 'Öğle', time: '--:--' },
    { label: 'İkindi', time: '--:--' },
    { label: 'Akşam', time: '--:--' },
    { label: 'Yatsı', time: '--:--' },
  ],
  current: -1,
  nextLabel: '',
  nextDative: '',
  nextTime: '--:--',
  currentStart: 0,
  nextAt: 0,
  palette: DEFAULT_PALETTES,
};
