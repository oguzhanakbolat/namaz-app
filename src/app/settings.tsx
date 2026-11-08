/**
 * Ayarlar ekranı. Yeni ayar eklemek için:
 *  1. src/lib/settings.tsx → AppSettings tipine ve DEFAULT_SETTINGS'e ekleyin
 *  2. Bu ekrana bir <SettingsSection> / <SettingsRow> ekleyin
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlarmSettings } from '@/components/settings/AlarmSettings';
import { Segmented, SettingsRow, SettingsSection, Swatches } from '@/components/settings/SettingsUI';
import { UpdateRow } from '@/components/settings/UpdateRow';
import { WidgetPreview } from '@/components/settings/WidgetPreview';
import { useSettings, type ThemeMode, type WidgetAccent, type WidgetTextColor, type WidgetTheme } from '@/lib/settings';
import { space, useTheme } from '@/theme';
import { ACCENTS, buildPalettes } from '@/widgets/data';

const THEME_MODES: {
  value: ThemeMode;
  label: string;
  icon: 'phone-portrait-outline' | 'sunny-outline' | 'moon-outline';
}[] = [
  { value: 'system', label: 'Sistem', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Açık', icon: 'sunny-outline' },
  { value: 'dark', label: 'Koyu', icon: 'moon-outline' },
];

const WIDGET_THEMES: { value: WidgetTheme; label: string }[] = [
  { value: 'auto', label: 'Otomatik' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
  { value: 'transparent', label: 'Şeffaf' },
];

const TEXT_COLORS: { value: WidgetTextColor; label: string }[] = [
  { value: 'white', label: 'Beyaz' },
  { value: 'black', label: 'Siyah' },
];

export default function SettingsScreen() {
  const t = useTheme();
  const { settings, update } = useSettings();
  const w = settings.widget;
  const palette = useMemo(() => buildPalettes(w), [w]);
  const [wallpaper, setWallpaper] = useState<'light' | 'dark'>('dark');

  const accentOptions = (Object.keys(ACCENTS) as WidgetAccent[]).map((k) => ({
    value: k,
    label: ACCENTS[k].label,
    color: ACCENTS[k].swatch,
  }));

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.background }]} edges={['top']}>
      <View style={styles.top}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={26} color={t.primary} />
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>Ayarlar</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Görünüm">
          <SettingsRow label="Tema" description="Uygulamanın açık veya koyu görünümü" first>
            <Segmented options={THEME_MODES} value={settings.themeMode} onChange={(v) => update({ themeMode: v })} />
          </SettingsRow>
        </SettingsSection>

        <AlarmSettings />

        <SettingsSection
          title="Widget'lar"
          footer={
            Platform.OS === 'android'
              ? "Widget eklemek için ana ekranda boş bir yere basılı tutup \"Widget'lar\"dan Namaz Vakti'ni seçin. Android'de widget'lar en sık ~15 dakikada bir güncellenir."
              : "Widget eklemek için ana ekranda boş bir yere basılı tutun, sol üstteki + düğmesine dokunup Namaz Vakti'ni seçin."
          }
        >
          <View style={styles.previewWrap}>
            <WidgetPreview palette={palette} wallpaper={wallpaper} />
            <Pressable
              onPress={() => setWallpaper((x) => (x === 'dark' ? 'light' : 'dark'))}
              style={styles.wallToggle}
              accessibilityRole="button"
              accessibilityLabel="Önizleme duvar kâğıdını değiştir"
            >
              <Ionicons name="image-outline" size={14} color={t.primary} />
              <Text style={[styles.wallToggleText, { color: t.primary }]}>
                {wallpaper === 'dark' ? 'Açık duvar kâğıdında gör' : 'Koyu duvar kâğıdında gör'}
              </Text>
            </Pressable>
          </View>

          <SettingsRow
            label="Widget teması"
            description={
              w.theme === 'auto'
                ? 'Telefonun açık/koyu temasını izler'
                : w.theme === 'transparent'
                  ? 'Arka plan yok; widget duvar kâğıdının üzerinde durur'
                  : undefined
            }
          >
            <Segmented options={WIDGET_THEMES} value={w.theme} onChange={(v) => update({ widget: { theme: v } })} />
          </SettingsRow>

          <SettingsRow label="Vurgu rengi" description="Şu anki vakit ve geri sayım rengi">
            <Swatches options={accentOptions} value={w.accent} onChange={(v) => update({ widget: { accent: v } })} />
          </SettingsRow>

          <SettingsRow
            label="Şeffaf widget yazı rengi"
            description="Mini widget ve şeffaf tema için. Koyu duvar kâğıdında beyaz, açıkta siyah okunur."
          >
            <Segmented
              options={TEXT_COLORS}
              value={w.textColor}
              onChange={(v) => update({ widget: { textColor: v } })}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Hakkında">
          <SettingsRow label="Sürüm" stacked={false} first>
            <Text style={[styles.value, { color: t.textMuted }]}>
              {Constants.expoConfig?.version ? Constants.expoConfig?.version + '-01' : '01'}
            </Text>
          </SettingsRow>
          <UpdateRow />
          <SettingsRow label="Vakitler" stacked={false}>
            <Text style={[styles.value, { color: t.textMuted }]}>
              Diyanet İşleri Başkanlığı Namaz Vakitlerinden Alınmıştır.
            </Text>
          </SettingsRow>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space(3), paddingVertical: space(2) },
  back: { width: 36, alignItems: 'flex-start' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  content: { padding: space(5), paddingTop: space(2), paddingBottom: space(12), gap: space(6) },
  previewWrap: { padding: space(3), gap: space(2) },
  wallToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', padding: space(1) },
  wallToggleText: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 14.5 },
});
