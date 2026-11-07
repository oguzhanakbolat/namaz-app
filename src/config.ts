/**
 * Uygulama ayarları.
 * API adresi derleme sırasında EXPO_PUBLIC_API_URL ile değiştirilebilir (örn. yerel test için).
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://namazapi.akbolat.net').replace(/\/$/, '');

/**
 * "Sabah" namazı vakti Diyanet API'sinde ayrı bir alan olarak gelmez.
 * Ekranda güneşin doğuşundan bu kadar dakika önce gösterilir. İstemezseniz null yapın.
 */
export const SABAH_MINUTES_BEFORE_SUNRISE: number | null = 60;

/** Vakitler kaç günlük çekilip cihazda saklansın */
export const TIMES_CACHE_DAYS = 30;
