/**
 * Android widget'ları: yerel native modül (modules/namaz-widgets).
 *
 * expo-widgets'ın Android sürümü zaman çizelgesi ve canlı geri sayım desteklemediği için Android widget'ları
 * Android'in kendi widget sistemiyle (RemoteViews) yazıldı:
 *  - Uygulama vakitleri, konumu ve renkleri bir kez gönderir (setData); widget'lar uygulama kapalıyken de
 *    bu veriden çizilir ve sıradaki vakti kendileri hesaplar.
 *  - Kalan süre Android'in Chronometer bileşeniyle saniye saniye işler.
 *  - Her vakit girişinde ve gece yarısında widget kendini alarmla yeniden çizer (şu anki vakit vurgusu değişir).
 *
 * Modül yoksa (Expo Go, web, iOS) hiçbir şey yapılmaz.
 */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type { DayTimes } from '@/lib/types';
import { PRAYER_LABELS } from '@/lib/prayer';
import { DATIVES, type WidgetProps } from './data';

type NamazWidgetsModule = { setData(json: string): void; reload(): void };

const native = Platform.OS === 'android' ? requireOptionalNativeModule<NamazWidgetsModule>('NamazWidgets') : null;

export const androidWidgetsAvailable = () => !!native;

/** Native modüle gönderilen veri (biçim: modules/namaz-widgets/.../WidgetData.kt) */
export function buildAndroidPayload(
  days: DayTimes[] | null | undefined,
  city: string | null | undefined,
  palette: WidgetProps['palette'],
) {
  return {
    city: days?.length && city ? city : '',
    labels: [
      PRAYER_LABELS.imsak,
      PRAYER_LABELS.gunes,
      PRAYER_LABELS.ogle,
      PRAYER_LABELS.ikindi,
      PRAYER_LABELS.aksam,
      PRAYER_LABELS.yatsi,
    ],
    datives: [DATIVES.imsak, DATIVES.gunes, DATIVES.ogle, DATIVES.ikindi, DATIVES.aksam, DATIVES.yatsi],
    days: (days ?? []).map((d) => ({
      date: d.date,
      times: [d.fajr, d.sunrise, d.dhuhr, d.asr, d.maghrib, d.isha],
      hijri: d.hijriDateLong ?? '',
      offset: d.gmtOffset != null ? Number(d.gmtOffset) : 3,
    })),
    palette,
  };
}

let lastJson = '';

export function syncAndroidWidgets(
  days: DayTimes[] | null | undefined,
  city: string | null | undefined,
  palette: WidgetProps['palette'],
) {
  if (!native) return;
  const json = JSON.stringify(buildAndroidPayload(days, city, palette));
  if (json === lastJson) return; // değişiklik yok: widget'lar kendi kendine işliyor
  lastJson = json;
  try {
    native.setData(json);
  } catch (e) {
    console.warn('[widget] Android widget verisi gönderilemedi', e);
  }
}
