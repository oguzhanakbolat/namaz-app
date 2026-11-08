/**
 * Ayarlar ekranındaki "Alarmlar" bölümleri: Vakitten Önce / Vakit Girince.
 * Her satır bir vakit; açılınca kaç dakika önce çalacağı ve (Android'de) sesi seçilir.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  KIND_LABELS,
  PRAYER_ABLATIVE,
  alarmsAvailable,
  ensureNotificationPermission,
  exactAlarmAllowed,
  getChannelSound,
  nextRingTime,
  openChannelSoundSettings,
  requestExactAlarm,
  testAlarm,
  type ChannelSound,
} from '@/lib/alarms';
import { ALARM_KINDS, ALARM_PRAYERS, useSettings, type AlarmKind, type AlarmPrayer } from '@/lib/settings';
import { KEYS, storage, type Cached } from '@/lib/storage';
import type { DayTimes, SavedLocation } from '@/lib/types';
import { radius, space, useTheme } from '@/theme';
import { SettingsRow, SettingsSection } from './SettingsUI';

/** "Vakitten Önce" için dakika seçenekleri */
const MINUTES = [5, 10, 15, 20, 30, 45, 60, 90];

const AT_LABEL: Record<AlarmPrayer, string> = {
  imsak: 'İmsak vakti',
  gunes: 'Güneş doğuşu',
  ogle: 'Öğle vakti',
  ikindi: 'İkindi vakti',
  aksam: 'Akşam vakti',
  yatsi: 'Yatsı vakti',
};

const SOUND_LABEL: Record<ChannelSound, string> = {
  default: 'Telefonun sesi',
  custom: 'Özel ses',
  silent: 'Sessiz',
  unknown: 'Ses',
};

const isAndroid = Platform.OS === 'android';

/** Kayıtlı konumun önbellekteki vakitleri (satırlarda "Bugün 11:52'de çalar" göstermek için) */
function useCachedTimes() {
  const [days, setDays] = useState<DayTimes[] | null>(null);
  useEffect(() => {
    (async () => {
      const loc = await storage.get<SavedLocation>(KEYS.location);
      const t = loc ? await storage.get<Cached<DayTimes[]>>(KEYS.times(loc.cityId)) : null;
      setDays(t?.data ?? null);
    })();
  }, []);
  return days;
}

/** Uygulamaya her dönüşte (ör. sistem ses ayarından) yeniden okunması gereken durumlar */
function useOnForeground(fn: () => void) {
  useEffect(() => {
    fn();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && fn());
    return () => sub.remove();
  }, [fn]);
}

export function AlarmSettings() {
  const t = useTheme();
  const { settings, setAlarm, setAlarmOptions } = useSettings();
  const alarms = settings.alarms;
  const days = useCachedTimes();
  const [now] = useState(() => Date.now());
  const [sounds, setSounds] = useState<Partial<Record<string, ChannelSound>>>({});
  const [exactOk, setExactOk] = useState(true);

  const anyEnabled = ALARM_KINDS.some((k) =>
    ALARM_PRAYERS.some((p) => alarms[k][p].enabled),
  );

  const refresh = useCallback(async () => {
    setExactOk(await exactAlarmAllowed());
    if (!isAndroid) return;
    const next: Record<string, ChannelSound> = {};
    for (const k of ALARM_KINDS)
      for (const p of ALARM_PRAYERS) if (alarms[k][p].enabled) next[`${k}_${p}`] = await getChannelSound(k, p, alarms.ringInSilent);
    setSounds(next);
  }, [alarms]);
  useOnForeground(refresh);

  if (!alarmsAvailable()) {
    return (
      <SettingsSection title="Alarmlar">
        <SettingsRow
          label="Bu sürümde kullanılamıyor"
          description="Alarmlar için uygulamanın telefona kurulu sürümü gerekir (Expo Go / web değil)."
          first
        />
      </SettingsSection>
    );
  }

  const toggle = async (kind: AlarmKind, prayer: AlarmPrayer, on: boolean) => {
    if (!on) return setAlarm(kind, prayer, { enabled: false });
    const perm = await ensureNotificationPermission();
    if (perm !== 'granted') {
      Alert.alert(
        'Bildirim izni gerekli',
        'Alarmların çalabilmesi için Namaz Vakti uygulamasına bildirim izni verin.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    setAlarm(kind, prayer, { enabled: true });
  };

  return (
    <>
      {ALARM_KINDS.map((kind, i) => (
        <SettingsSection
          key={kind}
          title={i === 0 ? `Alarmlar · ${KIND_LABELS[kind]}` : KIND_LABELS[kind]}
          footer={
            i === ALARM_KINDS.length - 1
              ? isAndroid
                ? 'Alarmlar uygulamanın vakit çanıyla çalar. Her alarmın sesi ayrı değiştirilebilir: "Sesi değiştir" telefonun ses listesini açar. Alarmlar internet olmadan da çalar.'
                : 'Alarmlar uygulamanın vakit çanıyla çalar; telefon sessizdeyse yalnızca titrer. Alarmlar internet olmadan da çalar.'
              : undefined
          }
        >
          {i === 0 && isAndroid && anyEnabled && !exactOk && (
            <Pressable
              onPress={async () => setExactOk(await requestExactAlarm())}
              style={[styles.warn, { backgroundColor: t.primarySoft }]}
              accessibilityRole="button"
            >
              <Ionicons name="alarm-outline" size={20} color={t.primary} />
              <View style={styles.flex}>
                <Text style={[styles.warnTitle, { color: t.text }]}>Alarmlar gecikebilir</Text>
                <Text style={[styles.warnText, { color: t.textMuted }]}>
                  Tam zamanında çalması için “Alarm ve hatırlatıcılar” iznini verin.
                </Text>
              </View>
              <Text style={[styles.link, { color: t.primary }]}>İzin ver</Text>
            </Pressable>
          )}
          {ALARM_PRAYERS.map((prayer, j) => (
            <AlarmRow
              key={prayer}
              kind={kind}
              prayer={prayer}
              first={j === 0 && !(i === 0 && isAndroid && anyEnabled && !exactOk)}
              enabled={alarms[kind][prayer].enabled}
              minutes={alarms[kind][prayer].minutes}
              ring={nextRingTime(days, kind, prayer, alarms[kind][prayer].minutes, now)}
              sound={sounds[`${kind}_${prayer}`]}
              loud={alarms.ringInSilent}
              onToggle={(on) => toggle(kind, prayer, on)}
              onMinutes={(m) => setAlarm(kind, prayer, { minutes: m })}
            />
          ))}
        </SettingsSection>
      ))}

      {isAndroid && (
        <SettingsSection title="Alarm seçenekleri">
          <SettingsRow
            label="Sessiz modda da çal"
            description={
              alarms.ringInSilent
                ? 'Alarm sesi düzeyinden çalar; telefon sessiz ya da titreşimdeyken de duyulur.'
                : 'Bildirim sesi gibi çalar; telefon sessizdeyse duyulmaz.'
            }
            stacked={false}
            first
          >
            <Switch
              value={alarms.ringInSilent}
              onValueChange={(v) => setAlarmOptions({ ringInSilent: v })}
              trackColor={{ true: t.primary, false: t.border }}
              thumbColor="#FFFFFF"
            />
          </SettingsRow>
          <SettingsRow
            label="Tam zamanında çal"
            description="Alarm saati gibi kurar; pil tasarrufu hiç geciktirmez. Durum çubuğunda saat simgesi görünür."
            stacked={false}
          >
            <Switch
              value={alarms.precise}
              onValueChange={(v) => setAlarmOptions({ precise: v })}
              trackColor={{ true: t.primary, false: t.border }}
              thumbColor="#FFFFFF"
            />
          </SettingsRow>
        </SettingsSection>
      )}
    </>
  );
}

function AlarmRow({
  kind,
  prayer,
  first,
  enabled,
  minutes,
  ring,
  sound,
  loud,
  onToggle,
  onMinutes,
}: {
  kind: AlarmKind;
  prayer: AlarmPrayer;
  first: boolean;
  enabled: boolean;
  minutes: number;
  ring: { time: string; today: boolean } | null;
  sound?: ChannelSound;
  loud: boolean;
  onToggle: (on: boolean) => void;
  onMinutes: (m: number) => void;
}) {
  const t = useTheme();
  const label = kind === 'at' ? AT_LABEL[prayer] : PRAYER_ABLATIVE[prayer];
  const suffix = 'önce';

  const status = enabled
    ? [
        kind === 'at' ? null : `${minutes} dk ${suffix}`,
        ring ? `${ring.today ? 'Bugün' : 'Yarın'} ${ring.time}` : null,
        isAndroid && sound ? SOUND_LABEL[sound] : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Kapalı';

  return (
    <View style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }]}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text style={[styles.label, { color: t.text }]}>{label}</Text>
          <Text style={[styles.status, { color: enabled ? t.textMuted : t.textSoft }]} numberOfLines={1}>
            {status}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ true: t.primary, false: t.border }}
          thumbColor="#FFFFFF"
          accessibilityLabel={`${kind === 'at' ? label : `${label} ${suffix}`} alarmı`}
        />
      </View>

      {enabled && (
        <View style={styles.body}>
          {kind !== 'at' && (
            <View style={styles.chips} accessibilityRole="radiogroup">
              {MINUTES.map((m) => {
                const sel = m === minutes;
                return (
                  <Pressable
                    key={m}
                    onPress={() => onMinutes(m)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`${m} dakika ${suffix}`}
                    style={[
                      styles.chip,
                      { borderColor: sel ? t.primary : t.border, backgroundColor: sel ? t.primarySoft : 'transparent' },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: sel ? t.primary : t.textMuted }, sel && styles.chipSel]}>
                      {m} dk
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <View style={styles.actions}>
            {isAndroid && (
              <Pressable
                onPress={() => openChannelSoundSettings(kind, prayer, loud)}
                style={styles.action}
                hitSlop={6}
                accessibilityRole="button"
              >
                <Ionicons name="musical-notes-outline" size={16} color={t.primary} />
                <Text style={[styles.link, { color: t.primary }]}>Sesi değiştir</Text>
              </Pressable>
            )}
            <Pressable onPress={() => testAlarm(kind, prayer, minutes, loud)} style={styles.action} hitSlop={6} accessibilityRole="button">
              <Ionicons name="play-circle-outline" size={16} color={t.primary} />
              <Text style={[styles.link, { color: t.primary }]}>Dene</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { paddingHorizontal: space(4), paddingVertical: space(3) },
  head: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  label: { fontSize: 15.5, fontWeight: '600' },
  status: { fontSize: 13, marginTop: 2 },
  body: { marginTop: space(3), gap: space(3) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  chip: {
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
    borderRadius: radius.md,
    borderWidth: 1,
  },
  chipText: { fontSize: 13.5, fontWeight: '500' },
  chipSel: { fontWeight: '700' },
  actions: { flexDirection: 'row', gap: space(5) },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  link: { fontSize: 14, fontWeight: '600' },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    padding: space(3.5),
    paddingHorizontal: space(4),
  },
  warnTitle: { fontSize: 14.5, fontWeight: '700' },
  warnText: { fontSize: 12.5, marginTop: 2, lineHeight: 17 },
});
