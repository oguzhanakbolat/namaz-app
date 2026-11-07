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

export type AppSettings = {
  themeMode: ThemeMode;
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
};

/** Kayıtlı (eksik olabilecek) ayarları varsayılanlarla birleştirir */
export function withDefaults(saved: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    widget: { ...DEFAULT_SETTINGS.widget, ...saved?.widget },
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
  update: (patch: Partial<Omit<AppSettings, 'widget'>> & { widget?: Partial<AppSettings['widget']> }) => void;
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

  const value = useMemo(() => ({ settings, loaded, update }), [settings, loaded, update]);
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
