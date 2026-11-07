import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { splitDuration, type PrayerState } from '@/lib/prayer';
import { radius, space, useTheme } from '@/theme';

export function CountdownCard({ state }: { state: PrayerState | null }) {
  const t = useTheme();
  const d = splitDuration(state?.remainingMs ?? 0);

  return (
    <LinearGradient colors={[t.heroFrom, t.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      {/* Dekoratif hilal */}
      <View style={[styles.moon, { borderColor: 'rgba(255,255,255,0.08)' }]} />

      <Text style={[styles.label, { color: t.heroMuted }]}>
        {state ? `${state.currentLabel} vaktinin çıkmasına kalan süre` : 'Vakitler yükleniyor'}
      </Text>

      <View
        style={styles.timeRow}
        accessibilityRole="timer"
        accessibilityLabel={`${d.h} saat ${d.m} dakika ${d.s} saniye`}
      >
        <Text style={[styles.big, { color: t.heroText }]}>
          {d.h}:{d.m}
        </Text>
        <Text style={[styles.sec, { color: t.heroMuted }]}>:{d.s}</Text>
      </View>

      <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
        <View
          style={[styles.fill, { width: `${Math.round((state?.progress ?? 0) * 100)}%`, backgroundColor: t.accent }]}
        />
      </View>

      {state && (
        <View style={styles.nextRow}>
          <Text style={[styles.next, { color: t.heroMuted }]}>Sonraki vakit</Text>
          <Text style={[styles.nextValue, { color: t.heroText }]}>
            {state.nextLabel} · {state.nextTime}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    paddingHorizontal: space(5),
    paddingVertical: space(5),
    overflow: 'hidden',
  },
  moon: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 28,
    right: -70,
    top: -90,
  },
  label: { fontSize: 14, fontWeight: '500' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: space(1) },
  big: { fontSize: 60, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  sec: { fontSize: 26, fontWeight: '700', marginBottom: 10, marginLeft: 2, fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, marginTop: space(3), overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  nextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space(3) },
  next: { fontSize: 13 },
  nextValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
