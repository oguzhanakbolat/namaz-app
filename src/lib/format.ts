const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/** "2026-11-06" -> { day: "06", month: "Kasım", year: "2026", weekday: "Cuma" } */
export function gregorianParts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { day: String(d).padStart(2, '0'), month: MONTHS[m - 1], year: String(y), weekday: WEEKDAYS[wd] };
}

export function gregorianLong(date: string) {
  const p = gregorianParts(date);
  return `${p.day} ${p.month} ${p.year}`;
}

/** Türkçe karakterleri sadeleştirerek arama için normalleştirir */
export function normalize(s: string) {
  return s
    .replace(/[İIı]/g, 'i')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** "İSTANBUL" -> "İstanbul" (Türkçe büyük/küçük harf kurallarıyla) */
export function titleCase(s: string) {
  return s
    .toLocaleLowerCase('tr-TR')
    .split(/(\s+|-|\/)/)
    .map((w) => (w.trim() && !/^(\s+|-|\/)$/.test(w) ? w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1) : w))
    .join('');
}
