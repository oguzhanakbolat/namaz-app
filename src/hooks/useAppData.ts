import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { TIMES_CACHE_DAYS } from '@/config';
import { api, ApiError } from '@/lib/api';
import { addDays, cityToday } from '@/lib/prayer';
import { KEYS, storage, type Cached } from '@/lib/storage';
import type { ContentBlock, DayTimes, SavedLocation } from '@/lib/types';

const HOUR = 3600_000;

/** Saniyede bir güncellenen saat */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Uygulama ön plana geldiğinde çalışır */
function useOnForeground(fn: () => void) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') fn();
    });
    return () => sub.remove();
  }, [fn]);
}

/** Seçili konum (cihazda saklanır) */
export function useSavedLocation() {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.get<SavedLocation>(KEYS.location).then((l) => {
      setLocation(l);
      setReady(true);
    });
  }, []);

  const save = useCallback(async (l: SavedLocation) => {
    setLocation(l);
    await storage.set(KEYS.location, l);
  }, []);

  return { location, ready, save };
}

type LoadState<T> = { data: T | null; loading: boolean; error: string | null; updatedAt: number | null };

/**
 * İlçenin vakitleri. Önce cihazdaki önbellek gösterilir, gerekirse sunucudan yenilenir.
 * İnternet yokken de önbellekteki vakitlerle çalışır.
 */
export function usePrayerTimes(cityId: number | null) {
  // Durum hangi ilçeye ait; konum değişince eski ilçenin verisi gösterilmez
  const [state, setState] = useState<LoadState<DayTimes[]> & { cityId: number | null }>({
    cityId: null,
    data: null,
    loading: false,
    error: null,
    updatedAt: null,
  });

  const load = useCallback(
    async (force = false) => {
      if (!cityId) return;
      const cached = await storage.get<Cached<DayTimes[]>>(KEYS.times(cityId));
      setState((s) =>
        s.cityId === cityId
          ? cached
            ? { ...s, data: cached.data, updatedAt: cached.savedAt }
            : s
          : { cityId, data: cached?.data ?? null, updatedAt: cached?.savedAt ?? null, loading: false, error: null }
      );

      const today = cityToday(Date.now(), cached?.data[0]?.gmtOffset ?? 3);
      const last = cached?.data[cached.data.length - 1]?.date;
      const hasToday = cached?.data.some((d) => d.date === today);
      const stale =
        !cached || !hasToday || !last || last < addDays(today, 5) || Date.now() - cached.savedAt > 24 * HOUR;
      if (!force && !stale) return;

      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await api.times(cityId, TIMES_CACHE_DAYS);
        const entry: Cached<DayTimes[]> = { savedAt: Date.now(), data: res.data };
        await storage.set(KEYS.times(cityId), entry);
        setState({ cityId, data: res.data, loading: false, error: null, updatedAt: entry.savedAt });
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e instanceof ApiError ? e.message : 'Vakitler alınamadı' }));
      }
    },
    [cityId]
  );

  useEffect(() => {
    load();
  }, [load]);
  useOnForeground(load);

  const mine = state.cityId === cityId;
  return {
    data: mine ? state.data : null,
    loading: mine ? state.loading : !!cityId,
    error: mine ? state.error : null,
    updatedAt: mine ? state.updatedAt : null,
    refresh: () => load(true),
  };
}

/** Ayet, hadis, esma vb. dönen içerikler */
export function useContents() {
  const [state, setState] = useState<LoadState<ContentBlock[]>>({
    data: null,
    loading: false,
    error: null,
    updatedAt: null,
  });

  const load = useCallback(async (force = false) => {
    const cached = await storage.get<Cached<ContentBlock[]>>(KEYS.contents);
    if (cached) setState((s) => ({ ...s, data: cached.data, updatedAt: cached.savedAt }));

    const today = cityToday(Date.now());
    const periodEnded = cached?.data.some((b) => b.period.nextChange <= today);
    const stale = !cached || periodEnded || Date.now() - cached.savedAt > 6 * HOUR;
    if (!force && !stale) return;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.contents();
      const entry: Cached<ContentBlock[]> = { savedAt: Date.now(), data };
      await storage.set(KEYS.contents, entry);
      setState({ data, loading: false, error: null, updatedAt: entry.savedAt });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e instanceof ApiError ? e.message : 'İçerikler alınamadı' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useOnForeground(load);

  return { ...state, refresh: () => load(true) };
}
