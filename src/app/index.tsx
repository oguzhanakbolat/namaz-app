import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContentCard } from '@/components/ContentCard';
import { CountdownCard } from '@/components/CountdownCard';
import { Header } from '@/components/Header';
import { LocationPicker } from '@/components/LocationPicker';
import { PrayerStrip } from '@/components/PrayerStrip';
import { useContents, useNow, usePrayerTimes, useSavedLocation } from '@/hooks/useAppData';
import { gregorianLong } from '@/lib/format';
import { cityToday, prayerState, stripFor } from '@/lib/prayer';
import { radius, space, useTheme } from '@/theme';

export default function HomeScreen() {
  const t = useTheme();
  const { location, ready, save } = useSavedLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const times = usePrayerTimes(location?.cityId ?? null);
  const contents = useContents();
  const now = useNow();

  const state = useMemo(() => prayerState(times.data ?? [], now), [times.data, now]);
  const todayStr = cityToday(now, times.data?.[0]?.gmtOffset ?? 3);
  const today = state?.today ?? times.data?.find((d) => d.date === todayStr) ?? null;
  const strip = useMemo(() => (today ? stripFor(today) : []), [today]);

  const locationLabel = location ? `${location.stateName} / ${location.cityName}` : 'Konum seçin';
  const refreshing = times.loading || contents.loading;
  const onRefresh = () => {
    times.refresh();
    contents.refresh();
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing && !!times.data} onRefresh={onRefresh} tintColor={t.primary} />
        }
      >
        <Header
          date={today?.date ?? todayStr}
          hijri={today?.hijriDateLong ?? null}
          locationLabel={locationLabel}
          onPressLocation={() => setPickerOpen(true)}
        />

        {!location && ready ? (
          <EmptyLocation onPress={() => setPickerOpen(true)} />
        ) : !times.data && times.loading ? (
          <ActivityIndicator style={styles.loader} color={t.primary} size="large" />
        ) : (
          <>
            <CountdownCard state={state} />
            {strip.length > 0 && <PrayerStrip items={strip} current={state?.current ?? null} />}
            {times.error && (
              <Notice text={times.data ? `${times.error} Kayıtlı vakitler gösteriliyor.` : times.error} />
            )}
          </>
        )}

        {contents.data?.map((b) => (
          <ContentCard key={b.section.key} block={b} />
        ))}

        {contents.error && !contents.data && <Notice text={contents.error} />}

        {times.updatedAt && (
          <Text style={[styles.footer, { color: t.textSoft }]}>
            Kaynak: Diyanet İşleri Başkanlığı · Güncelleme: {gregorianLong(cityToday(times.updatedAt))}
          </Text>
        )}
      </ScrollView>

      <LocationPicker
        visible={pickerOpen || (ready && !location)}
        canClose={!!location}
        onClose={() => setPickerOpen(false)}
        onSelect={async (l) => {
          await save(l);
          setPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function EmptyLocation({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.empty, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Ionicons name="location-outline" size={28} color={t.primary} />
      <Text style={[styles.emptyText, { color: t.text }]}>Vakitleri görmek için il ve ilçenizi seçin</Text>
    </Pressable>
  );
}

function Notice({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: t.accentSoft }]}>
      <Ionicons name="cloud-offline-outline" size={16} color={t.text} />
      <Text style={[styles.noticeText, { color: t.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space(5), paddingBottom: space(10), gap: space(4) },
  loader: { marginVertical: space(12) },
  footer: { fontSize: 12, textAlign: 'center', marginTop: space(2) },
  empty: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space(6),
    alignItems: 'center',
    gap: space(3),
  },
  emptyText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: space(2), padding: space(3), borderRadius: radius.md },
  noticeText: { flex: 1, fontSize: 13 },
});
