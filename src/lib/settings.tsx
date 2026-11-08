/**
 * Uygulama ayarları: cihazda saklanır, uygulamanın her yerinden useSettings() ile okunur.
 *
 * Yeni bir ayar eklemek için:
 *  1. AppSettings tipine alanı ekleyin
 *  2. DEFAULT_SETTINGS içine varsayılan değerini yazın
 *  3. src/app/settings.tsx ekranına satırını ekleyin
 * Eski kayıtlarda olmayan alanlar varsayılanla tamamlanır.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { KEYS, storage } from './storage';

export type ThemeMode = 'system' | 'light' | 'dark';
/** auto: telefonun açık/koyu temasını izler */
export type WidgetTheme = 'auto' | 'light' | 'dark' | 'transparent';
export type WidgetAccent = 'green' | 'gold' | 'blue' | 'rose' | 'purple';
export type WidgetTextColor = 'white' | 'black';

/** Alarm kurulabilen vakitler */
export type AlarmPrayer = 'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';
export const ALARM_PRAYERS: AlarmPrayer[] = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
/** before: vakitten X dk önce, at: vakit girince */
export type AlarmKind = 'before' | 'at';
export const ALARM_KINDS: AlarmKind[] = ['before', 'at'];
/** minutes: 'at' için kullanılmaz */
export type AlarmEntry = { enabled: boolean; minutes: number };
export type AlarmSettings = Record<AlarmKind, Record<AlarmPrayer, AlarmEntry>> & {
  /** Android: alarm saati modu (setAlarmClock). Pil tasarrufu ertelemez; durum çubuğunda alarm simgesi görünür. */
  precise: boolean;
  /** Android: alarm sesi olarak çal (telefon sessiz/titreşimdeyken de duyulur) */
  ringInSilent: boolean;
};

const alarmGroup = (minutes: number) =>
  Object.fromEntries(ALARM_PRAYERS.map((p) => [p, { enabled: false, minutes }])) as Record<AlarmPrayer, AlarmEntry>;

export type AppSettings = {
  themeMode: ThemeMode;
  alarms: AlarmSettings;
  widget: {
    theme: WidgetTheme;
    accent: WidgetAccent;
    /** Şeffaf widget'larda yazı rengi (duvar kâğıdına göre) */
    textColor: WidgetTextColor;
  };
};

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  widget: { theme: 'auto', accent: 'green', textColor: 'white' },
  alarms: { before: alarmGroup(15), at: alarmGroup(0), precise: false, ringInSilent: true },
};

function alarmsWithDefaults(saved?: Partial<AlarmSettings>): AlarmSettings {
  const d = DEFAULT_SETTINGS.alarms;
  const out = {
    ...d,
    precise: saved?.precise ?? d.precise,
    ringInSilent: saved?.ringInSilent ?? d.ringInSilent,
  } as AlarmSettings;
  for (const k of ALARM_KINDS) {
    out[k] = { ...d[k] };
    for (const p of ALARM_PRAYERS) out[k][p] = { ...d[k][p], ...saved?.[k]?.[p] };
  }
  return out;
}

/** Kayıtlı (eksik olabilecek) ayarları varsayılanlarla birleştirir */
export function withDefaults(saved: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    widget: { ...DEFAULT_SETTINGS.widget, ...saved?.widget },
    alarms: alarmsWithDefaults(saved?.alarms),
  };
}

export async function loadSettings(): Promise<AppSettings> {
  return withDefaults(await storage.get<Partial<AppSettings>>(KEYS.settings));
}

/** Sistem öğelerinin (durum çubuğu, klavye, uyarılar) de seçilen temaya uyması için (web'de yok) */
function applyThemeMode(mode: ThemeMode) {
  if (typeof Appearance.setColorScheme !== 'function') return;
  try {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  } catch {
    // desteklenmiyorsa yalnızca uygulama renkleri değişir
  }
}

type Ctx = {
  settings: AppSettings;
  loaded: boolean;
  update: (
    patch: Partial<Omit<AppSettings, 'widget' | 'alarms'>> & { widget?: Partial<AppSettings['widget']> },
  ) => void;
  /** Tek bir alarmı değiştirir (ör. setAlarm('before', 'ogle', { enabled: true })) */
  setAlarm: (kind: AlarmKind, prayer: AlarmPrayer, patch: Partial<AlarmEntry>) => void;
  /** Genel alarm seçenekleri (precise, ringInSilent) */
  setAlarmOptions: (patch: Partial<Pick<AlarmSettings, 'precise' | 'ringInSilent'>>) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      applyThemeMode(s.themeMode);
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const update = useCallback<Ctx['update']>((patch) => {
    setSettings((prev) => {
      const next: AppSettings = {
        ...prev,
        ...patch,
        widget: { ...prev.widget, ...patch.widget },
      };
      if (next.themeMode !== prev.themeMode) applyThemeMode(next.themeMode);
      storage.set(KEYS.settings, next);
      return next;
    });
  }, []);

  const commit = useCallback((fn: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => {
      const next = fn(prev);
      storage.set(KEYS.settings, next);
      return next;
    });
  }, []);

  const setAlarm = useCallback<Ctx['setAlarm']>(
    (kind, prayer, patch) =>
      commit((prev) => ({
        ...prev,
        alarms: {
          ...prev.alarms,
          [kind]: { ...prev.alarms[kind], [prayer]: { ...prev.alarms[kind][prayer], ...patch } },
        },
      })),
    [commit],
  );

  const setAlarmOptions = useCallback<Ctx['setAlarmOptions']>(
    (patch) => commit((prev) => ({ ...prev, alarms: { ...prev.alarms, ...patch } })),
    [commit],
  );

  const value = useMemo(
    () => ({ settings, loaded, update, setAlarm, setAlarmOptions }),
    [settings, loaded, update, setAlarm, setAlarmOptions],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/** Provider dışında da çağrılabilir (null döner) */
export function useOptionalSettings() {
  return useContext(SettingsContext);
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings, SettingsProvider içinde kullanılmalı');
  return ctx;
}
