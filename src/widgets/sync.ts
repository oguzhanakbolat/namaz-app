/**
 * Ana ekran widget'larını günceller.
 *  - iOS: ~10 günlük zaman çizelgesi gönderilir; widget her vakit girişinde kendiliğinden yenilenir,
 *    geri sayımı sistem işletir.
 *  - Android: zaman çizelgesi desteklenmediği için o anki içerik gönderilir (uygulama açıkken her vakit
 *    değişiminde ve arka plan göreviyle).
 *
 * expo-widgets Expo Go'da yoktur; modül bulunmazsa sessizce hiçbir şey yapılmaz.
 */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type { DayTimes } from '@/lib/types';
import type { AppSettings } from '@/lib/settings';
import { buildPalettes, buildTimeline, EMPTY_WIDGET_PROPS, propsAt, type WidgetProps } from './data';

type AnyWidget = {
  updateTimeline(entries: { date: Date; props: WidgetProps }[]): void;
  updateSnapshot(props: WidgetProps): void;
};

let cached: AnyWidget[] | null = null;

function loadWidgets(): AnyWidget[] {
  if (cached) return cached;
  cached = [];
  if (Platform.OS === 'web' || !requireOptionalNativeModule('ExpoWidgets')) return cached;
  try {
    // Platforma göre ./registry.ios.ts veya ./registry.android.ts yüklenir
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('./registry').widgets as AnyWidget[];
  } catch (e) {
    console.warn('[widget] yüklenemedi', e);
  }
  return cached;
}

export function widgetsAvailable() {
  return loadWidgets().length > 0;
}

/**
 * Widget'ları verilen vakitlerle ve widget ayarlarıyla (renkler) günceller.
 * days boşsa "konum seçin" içeriği gösterilir.
 */
export function syncWidgets(
  days: DayTimes[] | null | undefined,
  city: string | null | undefined,
  widgetSettings?: AppSettings['widget']
) {
  const widgets = loadWidgets();
  if (!widgets.length) return;

  try {
    const now = Date.now();
    const palette = buildPalettes(widgetSettings);
    const empty: WidgetProps = { ...EMPTY_WIDGET_PROPS, palette };
    if (!days?.length || !city) {
      widgets.forEach((w) => w.updateSnapshot(empty));
      return;
    }
    if (Platform.OS === 'ios') {
      const entries = buildTimeline(days, city, now, palette);
      if (entries.length) widgets.forEach((w) => w.updateTimeline(entries));
      else widgets.forEach((w) => w.updateSnapshot(empty));
    } else {
      const props = propsAt(days, city, now, palette) ?? empty;
      widgets.forEach((w) => w.updateSnapshot(props));
    }
  } catch (e) {
    console.warn('[widget] güncellenemedi', e);
  }
}
