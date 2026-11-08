/**
 * "Yeni sürüm hazır" uyarısı: arka planda indirilen güncelleme varsa ekranın altında görünür.
 * "Yeniden başlat" güncellemeyi hemen uygular; kapatılırsa güncelleme bir sonraki açılışta devreye girer.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { applyUpdate, updatesEnabled, useUpdates } from '@/lib/updates';
import { radius, space, useTheme } from '@/theme';

export function UpdateBanner() {
  if (!updatesEnabled()) return null;
  return <Banner />;
}

function Banner() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { isUpdatePending } = useUpdates();
  const [dismissed, setDismissed] = useState(false);
  if (!isUpdatePending || dismissed) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + space(3) }]}>
      <View style={[styles.card, { backgroundColor: t.heroFrom, shadowColor: t.shadow }]} accessibilityRole="alert">
        <Ionicons name="sparkles-outline" size={20} color={t.heroText} />
        <View style={styles.flex}>
          <Text style={[styles.title, { color: t.heroText }]}>Yeni sürüm hazır</Text>
          <Text style={[styles.text, { color: t.heroMuted }]}>Uygulamayı yeniden başlatarak güncelleyin.</Text>
        </View>
        <Pressable onPress={applyUpdate} style={styles.btn} hitSlop={6} accessibilityRole="button">
          <Text style={[styles.btnText, { color: t.heroFrom }]}>Yeniden başlat</Text>
        </Pressable>
        <Pressable onPress={() => setDismissed(true)} hitSlop={10} accessibilityLabel="Kapat" accessibilityRole="button">
          <Ionicons name="close" size={18} color={t.heroMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space(4), right: space(4), zIndex: 500 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    padding: space(3),
    paddingLeft: space(4),
    borderRadius: radius.md,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  flex: { flex: 1 },
  title: { fontSize: 14.5, fontWeight: '700' },
  text: { fontSize: 12.5, marginTop: 1 },
  btn: { backgroundColor: '#FFFFFF', paddingHorizontal: space(3), paddingVertical: space(2), borderRadius: radius.pill },
  btnText: { fontSize: 13, fontWeight: '700' },
});
