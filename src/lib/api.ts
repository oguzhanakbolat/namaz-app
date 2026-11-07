import { API_URL } from '@/config';
import type { ContentBlock, Place, TimesResponse } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
  }
}

/**
 * fresh: telefonun HTTP önbelleğini atla (panelden yeni eklenen ilçe vb. hemen görünsün).
 * Vakitler ve içerikler uygulamanın kendi önbelleğinde tutulduğu için onlarda gerekmez.
 */
async function get<T>(path: string, { timeoutMs = 15000, fresh = false } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const url = fresh ? `${API_URL}${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}` : `${API_URL}${path}`;
  try {
    console.log(url);
    const res = await fetch(url, {
      headers: fresh
        ? { Accept: 'application/json', 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
        : { Accept: 'application/json' },
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(json?.error?.message || `Sunucu hatası (${res.status})`, res.status);
    return json as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  countries: () => get<{ data: Place[] }>('/api/namaz/countries', { fresh: true }).then((r) => r.data),
  states: (countryId: number) =>
    get<{ data: Place[] }>(`/api/namaz/countries/${countryId}/states`, { fresh: true }).then((r) => r.data),
  cities: (stateId: number) =>
    get<{ data: Place[] }>(`/api/namaz/states/${stateId}/cities`, { fresh: true }).then((r) => r.data),
  times: (cityId: number, days: number) =>
    get<TimesResponse>(`/api/namaz/cities/${cityId}/times?days=${days}`, { timeoutMs: 30000 }),
  contents: () => get<{ data: ContentBlock[] }>('/api/namaz/contents').then((r) => r.data),
};
