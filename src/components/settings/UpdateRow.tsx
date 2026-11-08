/**
 * Ayarlar → Hakkında: güncelleme durumu ve "Denetle" / "Yeniden başlat" düğmesi (EAS Update).
 * Geliştirme modunda ve Expo Go'da görünmez.
 */
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { applyUpdate, checkAndFetchUpdate, runningUpdateInfo, updatesEnabled, useUpdates } from '@/lib/updates';
import { useTheme } from '@/theme';
import { SettingsRow } from './SettingsUI';

export function UpdateRow() {
  if (!updatesEnabled()) return null;
  return <Row />;
}

function Row() {
  const t = useTheme();
  const { isUpdatePending } = useUpdates();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const info = runningUpdateInfo();

  const current = info?.embedded
    ? 'Uygulamayla gelen sürüm'
    : info?.createdAt
      ? `Güncelleme: ${info.createdAt.toLocaleDateString('tr-TR')} ${info.createdAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
      : 'Güncelleme yüklü';

  const onPress = async () => {
    if (isUpdatePending) return applyUpdate();
    setBusy(true);
    setResult(null);
    const r = await checkAndFetchUpdate();
    setBusy(false);
    setResult(
      r === 'none'
        ? 'Uygulama güncel'
        : r === 'error'
          ? 'Denetlenemedi, internet bağlantınızı kontrol edin'
          : r === 'downloaded'
            ? 'Yeni sürüm indirildi'
            : null,
    );
  };

  return (
    <SettingsRow label="Güncelleme" description={isUpdatePending ? 'Yeni sürüm hazır' : (result ?? current)} stacked={false}>
      {busy ? (
        <ActivityIndicator color={t.primary} />
      ) : (
        <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.link, { color: t.primary }]}>{isUpdatePending ? 'Yeniden başlat' : 'Denetle'}</Text>
        </Pressable>
      )}
    </SettingsRow>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: 14.5, fontWeight: '700' },
});
