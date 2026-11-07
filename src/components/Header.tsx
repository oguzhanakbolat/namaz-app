import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { gregorianParts } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

type Props = {
  date: string | null;
  hijri: string | null;
  locationLabel: string;
  onPressLocation: () => void;
};

export function Header({ date, hijri, locationLabel, onPressLocation }: Props) {
  const t = useTheme();
  const g = date ? gregorianParts(date) : null;

  return (
    <View>
      <View style={styles.topRow}>
        <Text style={[styles.weekday, { color: t.primary }]}>{g?.weekday ?? ' '}</Text>
        <Pressable
          onPress={onPressLocation}
          accessibilityRole="button"
          accessibilityLabel={`Konum: ${locationLabel}. Değiştirmek için dokunun`}
          hitSlop={6}
          style={({ pressed }) => [
            styles.location,
            { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="location" size={15} color={t.primary} />
          <Text style={[styles.locationText, { color: t.text }]} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={t.textMuted} />
        </Pressable>
      </View>
      <Text style={[styles.date, { color: t.text }]}>{g ? `${g.day} ${g.month} ${g.year}` : ' '}</Text>
      <Text style={[styles.hijri, { color: t.textMuted }]}>{hijri || ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(3) },
  weekday: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  date: { fontSize: 26, fontWeight: '800', marginTop: space(1), letterSpacing: -0.3 },
  hijri: { fontSize: 15, marginTop: 2 },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
  },
  locationText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
});
