/**
 * Uygulama güncellemeleri (EAS Update / expo-updates).
 *
 * - Uygulama açılışta güncellemeyi kendisi denetler (app.json → updates.checkAutomatically = ON_LOAD);
 *   inen güncelleme bir sonraki açılışta devreye girer.
 * - Ek olarak uygulama öne geldiğinde (en sık 30 dakikada bir) arka planda denetlenir ve indirilir;
 *   inince ana ekranda "Yeni sürüm hazır" uyarısı çıkar (UpdateBanner), kullanıcı hemen yeniden başlatabilir.
 * - Geliştirme modunda, Expo Go'da ve web'de devre dışıdır (Updates.isEnabled = false).
 */
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState } from 'react-native';

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
let lastCheck = 0;

export const updatesEnabled = () => Updates.isEnabled && !__DEV__;

export type UpdateCheckOutcome = 'downloaded' | 'none' | 'disabled' | 'error';

/** Güncelleme var mı bak; varsa indir */
export async function checkAndFetchUpdate(): Promise<UpdateCheckOutcome> {
  if (!updatesEnabled()) return 'disabled';
  try {
    lastCheck = Date.now();
    const res = await Updates.checkForUpdateAsync();
    if (!res.isAvailable) return 'none';
    const fetched = await Updates.fetchUpdateAsync();
    return fetched.isNew ? 'downloaded' : 'none';
  } catch (e) {
    console.warn('[update] denetlenemedi', e);
    return 'error';
  }
}

/** İndirilen güncellemeyi hemen uygula (uygulama yeniden başlar) */
export function applyUpdate() {
  return Updates.reloadAsync().catch((e) => console.warn('[update] yeniden başlatılamadı', e));
}

/** Uygulama öne geldiğinde arka planda denetle (kök bileşende bir kez kullanılır) */
export function useBackgroundUpdateCheck() {
  useEffect(() => {
    if (!updatesEnabled()) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && Date.now() - lastCheck > CHECK_INTERVAL_MS) checkAndFetchUpdate();
    });
    // Açılıştaki denetimi native taraf yapar; burada yalnızca sayaç başlatılır
    lastCheck = Date.now();
    return () => sub.remove();
  }, []);
}

/** Çalışan sürümün özeti (Ayarlar → Hakkında) */
export function runningUpdateInfo() {
  if (!updatesEnabled()) return null;
  return {
    channel: Updates.channel,
    embedded: Updates.isEmbeddedLaunch,
    updateId: Updates.updateId,
    createdAt: Updates.createdAt,
  };
}

export { useUpdates } from 'expo-updates';
