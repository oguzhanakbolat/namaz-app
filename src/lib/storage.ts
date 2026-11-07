import AsyncStorage from '@react-native-async-storage/async-storage';

/** JSON olarak saklayan küçük AsyncStorage yardımcıları */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // depolama dolu / erişilemiyor: önbelleksiz devam et
    }
  },
};

export const KEYS = {
  location: 'location:v1',
  times: (cityId: number) => `times:v1:${cityId}`,
  contents: 'contents:v1',
  settings: 'settings:v1',
};

/** Önbellek kaydı: veri + kaydedilme zamanı */
export type Cached<T> = { savedAt: number; data: T };
