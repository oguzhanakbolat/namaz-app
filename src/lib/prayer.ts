import { SABAH_MINUTES_BEFORE_SUNRISE } from '@/config';
import type { DayTimes } from './types';

/**
 * Vakit hesapları ilçenin kendi saat dilimine göre yapılır (API'deki gmtOffset).
 * Böylece telefon başka bir saat diliminde olsa bile geri sayım doğru çalışır.
 */

export type PrayerKey = 'imsak' | 'sabah' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  imsak: 'İmsak',
  sabah: 'Sabah',
  gunes: 'Güneş',
  ogle: 'Öğle',
  ikindi: 'İkindi',
  aksam: 'Akşam',
  yatsi: 'Yatsı',
};

/** Geri sayımda "... vaktinin çıkmasına" cümlesinde kullanılan adlar */
const CURRENT_LABELS: Record<PrayerKey, string> = {
  imsak: 'Sabah namazı',
  sabah: 'Sabah namazı',
  gunes: 'Kuşluk',
  ogle: 'Öğle',
  ikindi: 'İkindi',
  aksam: 'Akşam',
  yatsi: 'Yatsı',
};

/** Vakit sınırları (Sabah gösterim amaçlıdır, sınır değildir) */
const BOUNDARIES: { key: PrayerKey; field: keyof DayTimes }[] = [
  { key: 'imsak', field: 'fajr' },
  { key: 'gunes', field: 'sunrise' },
  { key: 'ogle', field: 'dhuhr' },
  { key: 'ikindi', field: 'asr' },
  { key: 'aksam', field: 'maghrib' },
  { key: 'yatsi', field: 'isha' },
];

const DEFAULT_OFFSET = 3; // Türkiye

const offsetOf = (d?: DayTimes | null) => (d?.gmtOffset != null ? Number(d.gmtOffset) : DEFAULT_OFFSET);

/** İlçenin yerel saatine göre bugünün tarihi (YYYY-MM-DD) */
export function cityToday(now: number, offsetHours = DEFAULT_OFFSET) {
  return new Date(now + offsetHours * 3600_000).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" + "HH:MM" (ilçe saati) -> epoch ms */
export function toEpoch(date: string, hhmm: string, offsetHours: number) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, mi) - offsetHours * 3600_000;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function minusMinutes(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m - minutes + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export type StripItem = { key: PrayerKey; label: string; time: string };

/** Ekrandaki vakit şeridi */
export function stripFor(day: DayTimes): StripItem[] {
  const items: StripItem[] = [{ key: 'imsak', label: PRAYER_LABELS.imsak, time: day.fajr }];
  if (SABAH_MINUTES_BEFORE_SUNRISE != null) {
    items.push({
      key: 'sabah',
      label: PRAYER_LABELS.sabah,
      time: minusMinutes(day.sunrise, SABAH_MINUTES_BEFORE_SUNRISE),
    });
  }
  items.push(
    { key: 'gunes', label: PRAYER_LABELS.gunes, time: day.sunrise },
    { key: 'ogle', label: PRAYER_LABELS.ogle, time: day.dhuhr },
    { key: 'ikindi', label: PRAYER_LABELS.ikindi, time: day.asr },
    { key: 'aksam', label: PRAYER_LABELS.aksam, time: day.maghrib },
    { key: 'yatsi', label: PRAYER_LABELS.yatsi, time: day.isha }
  );
  return items;
}

export type PrayerState = {
  today: DayTimes;
  current: PrayerKey;
  currentLabel: string;
  currentStart: number;
  next: PrayerKey;
  nextLabel: string;
  nextAt: number;
  nextTime: string;
  remainingMs: number;
  progress: number; // 0..1, mevcut vaktin ne kadarı geçti
};

/**
 * Şu anki ve sıradaki vakti bulur. Yatsıdan sonra sıradaki vakit yarının imsakıdır;
 * gece yarısından sonra (imsaktan önce) mevcut vakit dünün yatsısıdır.
 */
export function prayerState(days: DayTimes[], now: number): PrayerState | null {
  if (!days.length) return null;
  const byDate = new Map(days.map((d) => [d.date, d]));
  const todayStr = cityToday(now, offsetOf(days[0]));
  const today = byDate.get(todayStr);
  if (!today) return null;

  const events: { key: PrayerKey; at: number; time: string }[] = [];
  for (const date of [addDays(todayStr, -1), todayStr, addDays(todayStr, 1)]) {
    const d = byDate.get(date);
    if (!d) continue;
    for (const b of BOUNDARIES) {
      const time = String(d[b.field]);
      events.push({ key: b.key, at: toEpoch(date, time, offsetOf(d)), time });
    }
  }
  events.sort((a, b) => a.at - b.at);

  let idx = -1;
  for (let i = 0; i < events.length; i += 1) if (events[i].at <= now) idx = i;
  const cur = events[idx];
  const nxt = events[idx + 1];
  if (!cur || !nxt) return null;

  const span = nxt.at - cur.at;
  return {
    today,
    current: cur.key,
    currentLabel: CURRENT_LABELS[cur.key],
    currentStart: cur.at,
    next: nxt.key,
    nextLabel: PRAYER_LABELS[nxt.key],
    nextAt: nxt.at,
    nextTime: nxt.time,
    remainingMs: Math.max(nxt.at - now, 0),
    progress: span > 0 ? Math.min(Math.max((now - cur.at) / span, 0), 1) : 0,
  };
}

export function splitDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return { h: pad(Math.floor(s / 3600)), m: pad(Math.floor((s % 3600) / 60)), s: pad(s % 60) };
}
