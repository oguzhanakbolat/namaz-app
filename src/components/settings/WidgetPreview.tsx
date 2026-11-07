/**
 * Ayar ekranındaki widget önizlemesi. Gerçek widget'lar uygulama içinde çizilemediği için
 * "Vakit Paneli" ve "Mini" widget, aynı renk paletiyle React Native bileşenleriyle taklit edilir.
 * Şeffaflık görünsün diye bir duvar kâğıdı zemininin üzerinde gösterilir.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, useColorMode } from '@/theme';
import type { WidgetPalette, WidgetProps } from '@/widgets/types';

const SAMPLE = [
  { label: 'İmsak', time: '05:53' },
  { label: 'Güneş', time: '07:18' },
  { label: 'Öğle', time: '12:37' },
  { label: 'İkindi', time: '15:21' },
  { label: 'Akşam', time: '17:47' },
  { label: 'Yatsı', time: '19:07' },
];
const CURRENT = 3;

function Panel({ c }: { c: WidgetPalette }) {
  const Hero = c.transparent ? View : LinearGradient;
  return (
    <View style={[styles.panel, !c.transparent && { backgroundColor: c.bg }]}>
      <Hero
        colors={[c.hero, c.heroDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, c.transparent && styles.heroTransparent]}
      >
        <Text style={[styles.heroCity, { color: c.heroMuted }]}>Çankaya</Text>
        <View>
          <Text style={[styles.heroLabel, { color: c.heroText }]}>Akşama</Text>
          <Text style={[styles.heroTime, { color: c.heroAccent }]}>1:12:30</Text>
        </View>
      </Hero>
      <View style={styles.list}>
        {SAMPLE.map((p, i) => {
          const active = i === CURRENT;
          return (
            <View key={p.label} style={[styles.row, active && { backgroundColor: c.active }]}>
              <Text style={[styles.rowLabel, { color: active ? c.activeText : c.muted }, active && styles.bold]}>
                {p.label}
              </Text>
              <Text style={[styles.rowTime, { color: active ? c.activeText : c.text }]}>{p.time}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Mini({ c }: { c: WidgetPalette }) {
  const shadow = { textShadowColor: c.overlayShadow, textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } };
  return (
    <View style={styles.mini}>
      <Text style={[styles.miniLabel, { color: c.overlayText }, shadow]}>Akşama</Text>
      <Text style={[styles.miniTime, { color: c.overlayText }, shadow]}>17:47</Text>
    </View>
  );
}

export function WidgetPreview({
  palette,
  wallpaper,
}: {
  palette: WidgetProps['palette'];
  wallpaper: 'light' | 'dark';
}) {
  // Widget'lar telefonun temasını izler; önizleme uygulamanın o anki temasıyla gösterilir
  const c = useColorMode() === 'dark' ? palette.dark : palette.light;
  const wall = wallpaper === 'dark' ? ['#2C3E50', '#4B2C5E', '#1B2A3A'] : ['#F6D9B8', '#E8B4C8', '#B8D4F0'];

  return (
    <LinearGradient
      colors={wall as [string, string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wall}
    >
      <Panel c={c} />
      <View style={styles.miniRow}>
        <Mini c={c} />
        <Text style={[styles.caption, { color: wallpaper === 'dark' ? '#FFFFFFB0' : '#1C2421A0' }]}>
          Vakit Paneli ve Mini widget önizlemesi
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wall: { borderRadius: radius.md, padding: space(4), gap: space(3) },
  panel: { flexDirection: 'row', borderRadius: 20, padding: 8, gap: 8, height: 150 },
  hero: { width: 130, borderRadius: 14, padding: 10, justifyContent: 'space-between' },
  heroTransparent: { backgroundColor: 'transparent' },
  heroCity: { fontSize: 11, fontWeight: '500' },
  heroLabel: { fontSize: 13, fontWeight: '600' },
  heroTime: { fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  list: { flex: 1, justifyContent: 'space-evenly' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 7,
  },
  rowLabel: { fontSize: 12 },
  rowTime: { fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bold: { fontWeight: '700' },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  mini: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  miniLabel: { fontSize: 13, fontWeight: '600' },
  miniTime: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  caption: { flex: 1, fontSize: 12 },
});
