// Namaz API (Strapi) yanıt tipleri

/**
 * id: Diyanet ID (vakitler bu ID ile istenir).
 * placeId: kaydın kendi ID'si. Elle eklenen merkez ilçeler (Çankaya, Keçiören...) Diyanet ID'sini paylaşır,
 * bu yüzden listelerde anahtar olarak placeId kullanılır.
 */
export type Place = { id: number; placeId?: number; name: string; nameEn: string | null; code: string | null };

export type Hijri = {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthLength: number | null;
  short: string;
  long: string;
  corrected: boolean;
};

export type DayTimes = {
  date: string; // YYYY-MM-DD
  fajr: string; // İmsak
  sunrise: string; // Güneş
  dhuhr: string; // Öğle
  asr: string; // İkindi
  maghrib: string; // Akşam
  isha: string; // Yatsı
  hijriDateShort: string | null;
  hijriDateLong: string | null;
  hijri: Hijri | null;
  gmtOffset: number | null;
};

export type TimesResponse = {
  data: DayTimes[];
  meta: { cityId: number; city: string; from: string; to: string; count: number; hijriCalendarVersion: string | null };
};

export type Media = {
  url: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number;
  alternativeText: string | null;
};

export type ContentItem = {
  id: number;
  title: string | null;
  text: string | null;
  arabicText: string | null;
  transliteration: string | null;
  source: string | null;
  explanation: string | null;
  arabicImage: Media | null;
  audio: Media | null;
  order: number;
};

export type ContentBlock = {
  section: { key: string; name: string; description: string | null; rotation: 'daily' | 'weekly' | 'monthly' };
  item: ContentItem | null;
  period: { start: string; end: string; nextChange: string };
  position: { index: number; total: number } | null;
};

/** Kullanıcının seçtiği konum */
export type SavedLocation = {
  cityId: number;
  cityName: string;
  stateId: number;
  stateName: string;
  countryId: number;
  countryName: string;
};
