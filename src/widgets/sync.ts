/**
 * Ana ekran widget'larını günceller.
 *  - iOS: ~10 günlük zaman çizelgesi gönderilir; widget her vakit girişinde kendiliğinden yenilenir,
 *    geri sayımı sistem işletir.
 *  - Android: yerel native modül (modules/namaz-widgets, bkz. ./android.ts). Vakitler bir kez gönderilir;
 *    geri sayımı ve vakit geçişlerini widget kendisi işletir.
 *
 * expo-widgets / native modül Expo Go'da yoktur; bulunmazsa sessizce hiçbir şey yapılmaz.
 */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type { DayTimes } from '@/lib/types';
import type { AppSettings } from '@/lib/settings';
import { androidWidgetsAvailable, syncAndroidWidgets } from './android';
import { buildPalettes, buildTimeline, EMPTY_WIDGET_PROPS, type WidgetProps } from './data';

type AnyWidget = {
  updateTimeline(entries: { date: Date; props: WidgetProps }[]): void;
  updateSnapshot(props: WidgetProps): void;
};

let cached: AnyWidget[] | null = null;

function loadWidgets(): AnyWidget[] {
  if (cached) return cached;
  cached = [];
  // Android widget'ları expo-widgets ile değil, yerel native modülle çalışır
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return cached;
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
  return Platform.OS === 'android' ? androidWidgetsAvailable() : loadWidgets().length > 0;
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
  if (Platform.OS === 'android') {
    syncAndroidWidgets(days, city, buildPalettes(widgetSettings));
    return;
  }

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
    const entries = buildTimeline(days, city, now, palette);
    if (entries.length) widgets.forEach((w) => w.updateTimeline(entries));
    else widgets.forEach((w) => w.updateSnapshot(empty));
  } catch (e) {
    console.warn('[widget] güncellenemedi', e);
  }
}
