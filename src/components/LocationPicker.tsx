import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, ApiError } from '@/lib/api';
import { normalize, titleCase } from '@/lib/format';
import type { Place, SavedLocation } from '@/lib/types';
import { radius, space, useTheme } from '@/theme';

type Step = 'country' | 'state' | 'city';

type Props = {
  visible: boolean;
  canClose: boolean;
  onClose: () => void;
  onSelect: (l: SavedLocation) => void;
};

const isTurkey = (p: Place) => p.code === 'TURKIYE' || normalize(p.name) === 'turkiye';

export function LocationPicker({ visible, canClose, onClose, onSelect }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={canClose ? onClose : undefined}
    >
      {/* İçerik her açılışta sıfırdan kurulur */}
      {visible && <PickerBody canClose={canClose} onClose={onClose} onSelect={onSelect} />}
    </Modal>
  );
}

function PickerBody({ canClose, onClose, onSelect }: Omit<Props, 'visible'>) {
  const t = useTheme();
  const [step, setStep] = useState<Step>('state');
  const [country, setCountry] = useState<Place | null>(null);
  const [state, setState] = useState<Place | null>(null);
  const [items, setItems] = useState<Place[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<Place[]>) => {
    setLoading(true);
    setError(null);
    setItems([]);
    setQuery('');
    try {
      setItems(await fn());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Liste alınamadı');
    } finally {
      setLoading(false);
    }
  }, []);

  const showCountries = useCallback(() => {
    setStep('country');
    run(() => api.countries());
  }, [run]);

  const showStates = useCallback(
    (c: Place) => {
      setCountry(c);
      setStep('state');
      run(() => api.states(c.id));
    },
    [run]
  );

  const showCities = useCallback(
    (s: Place) => {
      setState(s);
      setStep('city');
      run(() => api.cities(s.id));
    },
    [run]
  );

  // Açılışta Türkiye'nin illerini göster
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const countries = await api.countries();
        const tr = countries.find(isTurkey) || countries[0];
        const states = tr ? await api.states(tr.id) : [];
        if (cancelled) return;
        setCountry(tr ?? null);
        setItems(states);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Liste alınamadı');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Türkçe alfabeye göre sırala (sunucunun veritabanı sıralaması Ç, Ş, İ gibi harfleri sona atabilir)
  const filtered = useMemo(() => {
    const q = normalize(query);
    const list = q ? items.filter((i) => normalize(i.name).includes(q)) : items;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [items, query]);

  const choose = (p: Place) => {
    if (step === 'country') return showStates(p);
    if (step === 'state') return showCities(p);
    if (country && state) {
      onSelect({
        cityId: p.id,
        cityName: titleCase(p.name),
        stateId: state.id,
        stateName: titleCase(state.name),
        countryId: country.id,
        countryName: titleCase(country.name),
      });
    }
  };

  const back = () => {
    if (step === 'city' && country) showStates(country);
    else if (step === 'state') showCountries();
  };

  const title = step === 'country' ? 'Ülke seçin' : step === 'state' ? 'İl seçin' : 'İlçe seçin';
  const crumb =
    step === 'state' && country ? titleCase(country.name) : step === 'city' && state ? titleCase(state.name) : null;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: t.background }]} edges={['top', 'bottom']}>
      <View style={styles.top}>
        {step === 'city' ? (
          <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={24} color={t.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconSpace} />
        )}

        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: t.text }]}>{title}</Text>
          {crumb && <Text style={[styles.crumb, { color: t.textMuted }]}>{crumb}</Text>}
        </View>

        {canClose ? (
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Kapat">
            <Ionicons name="close" size={24} color={t.textMuted} />
          </Pressable>
        ) : (
          <View style={styles.iconSpace} />
        )}
      </View>

      <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name="search" size={18} color={t.textSoft} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ara"
          placeholderTextColor={t.textSoft}
          style={[styles.input, { color: t.text }]}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {step === 'state' && (
        <Pressable onPress={showCountries} style={styles.otherCountry} accessibilityRole="button">
          <Ionicons name="globe-outline" size={16} color={t.primary} />
          <Text style={[styles.otherCountryText, { color: t.primary }]}>Başka bir ülke seç</Text>
        </Pressable>
      )}

      {loading ? (
        <ActivityIndicator style={styles.center} color={t.primary} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: t.danger }]}>{error}</Text>
          <Pressable
            onPress={() =>
              step === 'country' || !country
                ? showCountries()
                : step === 'state'
                  ? showStates(country)
                  : state && showCities(state)
            }
          >
            <Text style={[styles.retry, { color: t.primary }]}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.placeId ?? i.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: t.border }]} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => choose(item)}
              style={({ pressed }) => [styles.row, { backgroundColor: pressed ? t.surfaceMuted : 'transparent' }]}
            >
              <Text style={[styles.rowText, { color: t.text }]}>{titleCase(item.name)}</Text>
              <Ionicons name="chevron-forward" size={18} color={t.textSoft} />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: t.textMuted }]}>Sonuç bulunamadı</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space(4), paddingVertical: space(3) },
  iconSpace: { width: 24 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  crumb: { fontSize: 13, marginTop: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    marginHorizontal: space(4),
    paddingHorizontal: space(3),
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: space(3) },
  otherCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space(5),
    paddingTop: space(3),
  },
  otherCountryText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: space(2), paddingVertical: space(2) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(3),
    paddingVertical: space(3.5),
    borderRadius: radius.sm,
  },
  rowText: { fontSize: 16 },
  sep: { height: StyleSheet.hairlineWidth, marginHorizontal: space(3) },
  center: { marginTop: space(10), alignItems: 'center', gap: space(3) },
  error: { fontSize: 15, textAlign: 'center', paddingHorizontal: space(6) },
  retry: { fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: space(8), fontSize: 15 },
});
