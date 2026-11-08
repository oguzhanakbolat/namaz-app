/**
 * Vakit alarmları: vakitten önce ve vakit girince yerel bildirimler.
 *
 * Nasıl çalışır:
 *  - Önbellekteki vakitlerden önümüzdeki günlerin alarmları hesaplanır ve tek tek zamanlanır (internet gerekmez).
 *  - iOS en fazla 64 bekleyen bildirime izin verir; bu yüzden en yakın IOS_LIMIT alarm kurulur.
 *    Uygulama her açıldığında ve arka plan görevinde liste yenilenir.
 *  - Android'de her alarmın kendi bildirim kanalı vardır. Ses kanaldan gelir; kullanıcı "Sesi değiştir" ile
 *    sistemin kanal ayarını açar ve telefondaki herhangi bir sistem sesini seçer. Kanal sesini uygulama sonradan
 *    değiştiremez, kullanıcının seçimi korunur.
 *  - Ses: uygulamanın "vakit çanı" (assets/sounds/vakit_cani.wav, expo-notifications `sounds` ile gömülür).
 *    Android'de kanalın varsayılan sesidir, kullanıcı değiştirebilir; iOS'ta her alarm bu sesle çalar.
 *
 * Web ve modülün bulunmadığı ortamlarda (ör. eski bir geliştirme derlemesi) her şey sessizce devre dışıdır.
 */
import { requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { PRAYER_LABELS, toEpoch } from './prayer';
import {
  ALARM_KINDS,
  ALARM_PRAYERS,
  type AlarmKind,
  type AlarmPrayer,
  type AlarmSettings,
} from './settings';
import { storage } from './storage';
import type { DayTimes } from './types';

type NotificationsModule = typeof import('expo-notifications');

const available =
  Platform.OS !== 'web' &&
  !!requireOptionalNativeModule('ExpoNotificationScheduler') &&
  !!requireOptionalNativeModule('ExpoNotificationPermissionsModule');

/* eslint-disable @typescript-eslint/no-require-imports */
const N: NotificationsModule | null = available ? (require('expo-notifications') as NotificationsModule) : null;
/* eslint-enable @typescript-eslint/no-require-imports */

export const alarmsAvailable = () => !!N;

const IOS_LIMIT = 60; // iOS sınırı 64; birkaç yer boş kalsın
const ANDROID_LIMIT = 150;
const PLAN_KEY = 'alarms:plan:v1';

const FIELD: Record<AlarmPrayer, keyof DayTimes> = {
  imsak: 'fajr',
  gunes: 'sunrise',
  ogle: 'dhuhr',
  ikindi: 'asr',
  aksam: 'maghrib',
  yatsi: 'isha',
};

/** "İmsaktan", "Öğleden"... (ayar satırlarında ve bildirimlerde) */
export const PRAYER_ABLATIVE: Record<AlarmPrayer, string> = {
  imsak: 'İmsaktan',
  gunes: 'Güneşten',
  ogle: 'Öğleden',
  ikindi: 'İkindiden',
  aksam: 'Akşamdan',
  yatsi: 'Yatsıdan',
};

/** "İmsak vaktine", "Akşama"... */
const PRAYER_DATIVE: Record<AlarmPrayer, string> = {
  imsak: 'İmsak vaktine',
  gunes: 'Güneşin doğmasına',
  ogle: 'Öğle vaktine',
  ikindi: 'İkindi vaktine',
  aksam: 'Akşam vaktine',
  yatsi: 'Yatsı vaktine',
};

const AT_TITLE: Record<AlarmPrayer, string> = {
  imsak: 'İmsak vakti girdi',
  gunes: 'Güneş doğdu',
  ogle: 'Öğle vakti girdi',
  ikindi: 'İkindi vakti girdi',
  aksam: 'Akşam vakti girdi',
  yatsi: 'Yatsı vakti girdi',
};

export const KIND_LABELS: Record<AlarmKind, string> = {
  before: 'Vakitten Önce',
  at: 'Vakit Girince',
};

/** Android bildirim kanalı: her alarm satırının kendi kanalı (ve kendi sesi) var */
/**
 * Kanal kimliği sürümlü: Android, kanal oluşturulduktan sonra sesini uygulamanın değiştirmesine izin vermez.
 * Kanalın sabit ayarları değişirse sürüm artırılır; eski kanallar ensureAlarmChannels'ta silinir.
 * (v1 kanalları hatalı ses ayarıyla oluşmuştu.)
 */
const CHANNEL_PREFIX = 'alarm3_';
/** Alarm sesi kanalları (sessiz modda da çalar) */
const LOUD_PREFIX = 'alarm3s_';
/** v1: hatalı ses ayarı, v2: telefonun varsayılan sesi (v3'te uygulamanın vakit çanı) */
const LEGACY_PREFIXES = ['alarm_', 'alarm2_', 'alarm2s_'];

/** Alarm sesi: uygulamaya gömülü "vakit çanı" (app.json → expo-notifications → sounds) */
export const ALARM_SOUND = 'vakit_cani.wav';
/** Kaldırılan alarm türleri: kanalları ve grupları telefondan silinir */
const REMOVED_KINDS = ['after'];
/** loud: alarm sesi olarak çal (ayar: "Sessiz modda da çal"). İki ayrı kanal takımı; her birinin sesi ayrı seçilir. */
export const channelId = (kind: AlarmKind, prayer: AlarmPrayer, loud: boolean) =>
  `${loud ? LOUD_PREFIX : CHANNEL_PREFIX}${kind}_${prayer}`;

const channelName = (kind: AlarmKind, prayer: AlarmPrayer) =>
  kind === 'at' ? `${PRAYER_LABELS[prayer]} vakti` : `${PRAYER_ABLATIVE[prayer]} önce`;

/** Alarmın vakte göre kayması (dakika): önce - */
const shiftMinutes = (kind: AlarmKind, minutes: number) => (kind === 'before' ? -minutes : 0);

export type AlarmItem = {
  id: string;
  at: number;
  kind: AlarmKind;
  prayer: AlarmPrayer;
  title: string;
  body: string;
};

function texts(kind: AlarmKind, prayer: AlarmPrayer, minutes: number, time: string, city?: string) {
  const where = city ? ` · ${city}` : '';
  if (kind === 'before')
    return { title: `${PRAYER_DATIVE[prayer]} ${minutes} dk kaldı`, body: `${PRAYER_LABELS[prayer]} ${time}${where}` };
  return { title: AT_TITLE[prayer], body: `${time}${where}` };
}

/** Kurulacak alarmların listesi (zamana göre sıralı, sınırlı) */
export function buildAlarmPlan(
  days: DayTimes[] | null | undefined,
  alarms: AlarmSettings,
  now: number,
  city?: string,
  limit = Platform.OS === 'ios' ? IOS_LIMIT : ANDROID_LIMIT,
): AlarmItem[] {
  if (!days?.length) return [];
  const out: AlarmItem[] = [];
  for (const day of days) {
    const offset = day.gmtOffset != null ? Number(day.gmtOffset) : 3;
    for (const kind of ALARM_KINDS) {
      for (const prayer of ALARM_PRAYERS) {
        const entry = alarms[kind][prayer];
        if (!entry?.enabled) continue;
        const time = day[FIELD[prayer]] as string;
        if (!time) continue;
        const at = toEpoch(day.date, time, offset) + shiftMinutes(kind, entry.minutes) * 60_000;
        if (at <= now + 5_000) continue;
        out.push({ id: `${day.date}_${kind}_${prayer}`, at, kind, prayer, ...texts(kind, prayer, entry.minutes, time, city) });
      }
    }
  }
  return out.sort((a, b) => a.at - b.at).slice(0, limit);
}

/** Bir alarmın bugünkü / sıradaki çalma saati (ayar ekranında gösterilir), "HH:MM" */
export function nextRingTime(days: DayTimes[] | null | undefined, kind: AlarmKind, prayer: AlarmPrayer, minutes: number, now: number) {
  if (!days?.length) return null;
  for (const day of days) {
    const offset = day.gmtOffset != null ? Number(day.gmtOffset) : 3;
    const time = day[FIELD[prayer]] as string;
    if (!time) continue;
    const at = toEpoch(day.date, time, offset) + shiftMinutes(kind, minutes) * 60_000;
    if (at <= now) continue;
    const local = new Date(at + offset * 3600_000);
    const hhmm = local.toISOString().slice(11, 16);
    const today = new Date(now + offset * 3600_000).toISOString().slice(0, 10);
    return { time: hhmm, today: local.toISOString().slice(0, 10) === today };
  }
  return null;
}

// --- Android kanalları -------------------------------------------------------

const channelsReady: Partial<Record<'loud' | 'normal', Promise<void> | null>> = {};

/**
 * Seçili takımın alarm kanallarını oluşturur. Var olan kanalın sesi korunur (yalnızca ad güncellenir).
 * Diğer takım silinmez; kullanıcı ayarı geri değiştirirse oradaki ses seçimleri de geri gelir.
 */
export function ensureAlarmChannels(loud: boolean) {
  if (!N || Platform.OS !== 'android') return Promise.resolve();
  const key = loud ? 'loud' : 'normal';
  if (!channelsReady[key]) {
    const n = N;
    channelsReady[key] = (async () => {
      // Eski sürüm kanallarını kaldır
      const existing = await n.getNotificationChannelsAsync();
      for (const ch of existing) {
        const legacy = LEGACY_PREFIXES.some((p) => ch.id.startsWith(p));
        const removed = REMOVED_KINDS.some((k) => ch.id.startsWith(`${CHANNEL_PREFIX}${k}_`) || ch.id.startsWith(`${LOUD_PREFIX}${k}_`));
        if (legacy || removed) await n.deleteNotificationChannelAsync(ch.id);
      }
      for (const k of REMOVED_KINDS) await n.deleteNotificationChannelGroupAsync(`alarms_${k}`).catch(() => {});

      for (const kind of ALARM_KINDS) {
        await n.setNotificationChannelGroupAsync(`alarms_${kind}`, { name: KIND_LABELS[kind] });
        for (const prayer of ALARM_PRAYERS) {
          await n.setNotificationChannelAsync(channelId(kind, prayer, loud), {
            name: channelName(kind, prayer) + (loud ? '' : ' (sessiz modda susar)'),
            groupId: `alarms_${kind}`,
            importance: n.AndroidImportance.HIGH,
            // Uygulamanın vakit çanı (res/raw/vakit_cani). Kullanıcı "Sesi değiştir" ile başka bir ses seçebilir.
            sound: ALARM_SOUND,
            // Alarm kullanımı: ses alarm ses düzeyinden çalar, sessiz/titreşim modunda da duyulur.
            ...(loud
              ? {
                  audioAttributes: {
                    usage: n.AndroidAudioUsage.ALARM,
                    contentType: n.AndroidAudioContentType.SONIFICATION,
                  },
                }
              : {}),
            vibrationPattern: [0, 400, 200, 400],
            lockscreenVisibility: n.AndroidNotificationVisibility.PUBLIC,
          });
        }
      }
    })().catch((e) => {
      channelsReady[key] = null;
      console.warn('[alarm] kanallar oluşturulamadı', e);
    });
  }
  return channelsReady[key]!;
}

export type ChannelSound = 'default' | 'custom' | 'silent' | 'unknown';

/** Kanalın sesi: varsayılan / kullanıcının seçtiği / sessiz */
export async function getChannelSound(kind: AlarmKind, prayer: AlarmPrayer, loud: boolean): Promise<ChannelSound> {
  if (!N || Platform.OS !== 'android') return 'default';
  try {
    const ch = await N.getNotificationChannelAsync(channelId(kind, prayer, loud));
    if (!ch) return 'default';
    if (ch.importance != null && ch.importance < N.AndroidImportance.DEFAULT) return 'silent';
    return ch.sound === 'custom' ? 'custom' : ch.sound === 'default' ? 'default' : 'silent';
  } catch {
    return 'unknown';
  }
}

/** Android'in kanal ayarını açar: kullanıcı buradan sistem seslerinden birini seçer */
export async function openChannelSoundSettings(kind: AlarmKind, prayer: AlarmPrayer, loud: boolean) {
  if (Platform.OS !== 'android') return;
  await ensureAlarmChannels(loud);
  /* eslint-disable-next-line @typescript-eslint/no-require-imports */
  const IntentLauncher = require('expo-intent-launcher') as typeof import('expo-intent-launcher');
  const pkg = Constants.expoConfig?.android?.package ?? 'net.oguzhan.namazvakti';
  try {
    await IntentLauncher.startActivityAsync('android.settings.CHANNEL_NOTIFICATION_SETTINGS', {
      extra: {
        'android.provider.extra.APP_PACKAGE': pkg,
        'android.provider.extra.CHANNEL_ID': channelId(kind, prayer, loud),
      },
    });
  } catch {
    // Kanal ekranı açılamazsa uygulamanın bildirim ayarlarını aç
    await IntentLauncher.startActivityAsync('android.settings.APP_NOTIFICATION_SETTINGS', {
      extra: { 'android.provider.extra.APP_PACKAGE': pkg },
    }).catch(() => {});
  }
}

// --- İzinler -----------------------------------------------------------------

export type PermissionResult = 'granted' | 'denied' | 'unavailable';

/** Bildirim izni ister (zaten verildiyse hemen döner) */
export async function ensureNotificationPermission(): Promise<PermissionResult> {
  if (!N) return 'unavailable';
  try {
    const cur = await N.getPermissionsAsync();
    if (cur.granted || cur.ios?.status === N.IosAuthorizationStatus.PROVISIONAL) return 'granted';
    if (!cur.canAskAgain) return 'denied';
    const res = await N.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return res.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/** Android 12+: tam zamanlı alarm izni (yoksa alarmlar birkaç dakika gecikebilir) */
export async function exactAlarmAllowed() {
  if (!N || Platform.OS !== 'android') return true;
  try {
    return (await N.getExactAlarmPermissionsAsync()).granted;
  } catch {
    return true;
  }
}

export async function requestExactAlarm() {
  if (!N || Platform.OS !== 'android') return true;
  try {
    return (await N.requestExactAlarmPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

// --- Zamanlama ---------------------------------------------------------------

let handlerSet = false;
/** Uygulama açıkken gelen alarm da ses ve bildirimle gösterilsin */
export function setupAlarmHandler() {
  if (!N || handlerSet) return;
  handlerSet = true;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const signature = (plan: AlarmItem[], alarms: AlarmSettings) =>
  `${CHANNEL_PREFIX}|${alarms.precise ? 1 : 0}|${alarms.ringInSilent ? 1 : 0}|` + plan.map((a) => `${a.id}@${a.at}:${a.title}:${a.body}`).join('|');

let running: Promise<void> = Promise.resolve();

/**
 * Alarmları ayarlara ve vakitlere göre yeniden kurar. Değişiklik yoksa hiçbir şey yapmaz.
 * Sırayla çalışır (art arda çağrılar birbirini bozmaz).
 */
export function syncAlarms(days: DayTimes[] | null | undefined, city: string | undefined, alarms: AlarmSettings) {
  if (!N) return Promise.resolve();
  const n = N;
  running = running
    .then(async () => {
      const plan = buildAlarmPlan(days, alarms, Date.now(), city);
      const sig = signature(plan, alarms);
      const scheduled = await n.getAllScheduledNotificationsAsync();
      const prev = await storage.get<string>(PLAN_KEY);
      if (prev === sig && scheduled.length === plan.length) return;

      await n.cancelAllScheduledNotificationsAsync();
      if (plan.length) {
        // İzin yoksa kurmaya çalışmayalım (izin ayar ekranında istenir)
        const perm = await n.getPermissionsAsync();
        if (!perm.granted && perm.ios?.status !== n.IosAuthorizationStatus.PROVISIONAL) {
          await storage.set(PLAN_KEY, null);
          return;
        }
        await ensureAlarmChannels(alarms.ringInSilent);
        for (const a of plan) {
          await n.scheduleNotificationAsync({
            identifier: a.id,
            content: {
              title: a.title,
              body: a.body,
              sound: ALARM_SOUND,
              data: { kind: a.kind, prayer: a.prayer },
            },
            trigger: {
              type: n.SchedulableTriggerInputTypes.DATE,
              date: a.at,
              channelId: channelId(a.kind, a.prayer, alarms.ringInSilent),
              delivery: alarms.precise ? 'alarmClock' : 'bestEffort',
            },
          });
        }
      }
      await storage.set(PLAN_KEY, sig);
    })
    .catch((e) => console.warn('[alarm] kurulamadı', e));
  return running;
}

/** "Dene": seçili sesi hemen çalar (kanalın sesiyle) */
export async function testAlarm(kind: AlarmKind, prayer: AlarmPrayer, minutes: number, loud: boolean) {
  if (!N) return;
  await ensureAlarmChannels(loud);
  const t = texts(kind, prayer, minutes, '--:--');
  await N.scheduleNotificationAsync({
    content: { title: `Deneme: ${t.title}`, body: 'Alarm böyle görünecek ve bu sesle çalacak.', sound: ALARM_SOUND },
    trigger: Platform.OS === 'android' ? { channelId: channelId(kind, prayer, loud) } : null,
  });
}
