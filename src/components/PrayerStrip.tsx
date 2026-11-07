import { StyleSheet, Text, View } from 'react-native';

import type { PrayerKey, StripItem } from '@/lib/prayer';
import { radius, space, useTheme } from '@/theme';

type Props = { items: StripItem[]; current: PrayerKey | null };

/** Günün vakitleri. Mevcut vakit vurgulanır. */
export function PrayerStrip({ items, current }: Props) {
  const t = useTheme();
  // "Sabah" ayrı bir vakit sınırı değildir; imsak vaktindeyken sabah da vurgulanmaz
  return (
    <View style={[styles.wrap, { backgroundColor: t.surface, borderColor: t.border }]}>
      {items.map((it) => {
        const active = it.key === current;
        return (
          <View
            key={it.key}
            style={[styles.cell, active && { backgroundColor: t.primary }]}
            accessibilityLabel={`${it.label} ${it.time}${active ? ', şu anki vakit' : ''}`}
          >
            <Text style={[styles.label, { color: active ? t.heroMuted : t.textMuted }]} numberOfLines={1}>
              {it.label}
            </Text>
            <Text style={[styles.time, { color: active ? t.heroText : t.text }]}>{it.time}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space(1),
    gap: 0,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space(2.5),
    borderRadius: radius.md,
  },
  label: { fontSize: 11, fontWeight: '600' },
  time: { fontSize: 13.5, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'], letterSpacing: -0.2 },
});
