# Namaz Vakti (Expo / React Native)

Namaz API'sinden (`https://namazapi.akbolat.net`) vakitleri, hicri tarihi ve dönen içerikleri
(ayet, hadis, esma, veciz söz) gösteren mobil uygulama. Şimdilik tek ekran.

## Çalıştırma

```bash
yarn install            # veya npm install
npx expo start          # QR kodu Expo Go ile okutun
```

- **iOS / Android:** Expo Go ile çalışır (kullanılan tüm modüller Expo Go içinde var).
- **Web:** `npx expo start --web`
- Farklı bir API adresiyle denemek için: `EXPO_PUBLIC_API_URL=http://192.168.1.10:1337 npx expo start`

Kontroller:

```bash
npx tsc --noEmit        # tip kontrolü
npx expo lint           # lint
```

## Yapı

```
src/app/_layout.tsx          Kök düzen (font yükleme, Stack)
src/app/index.tsx            Ana ekran
src/components/              Header, CountdownCard, PrayerStrip, ContentCard, AudioButton, LocationPicker, RichText
src/hooks/useAppData.ts      Veri hook'ları (konum, vakitler, içerikler) + cihaz önbelleği
src/lib/prayer.ts            Vakit hesapları (mevcut/sıradaki vakit, geri sayım)
src/lib/api.ts               API istemcisi
src/theme/index.ts           Açık / koyu tema renkleri
src/config.ts                API adresi ve "Sabah" vakti ayarı
```

Yeni ekranlar `src/app/` altına dosya olarak eklenir (Expo Router).

## Davranış

- **Konum:** İlk açılışta il ve ilçe seçilir, cihazda saklanır. Başlıktaki konuma dokunarak değiştirilir.
- **Önbellek:** 30 günlük vakit cihazda tutulur; internet yokken de çalışır. Günde bir kez ya da elde
  5 günden az vakit kaldığında yenilenir. Ekranı aşağı çekmek de yeniler.
- **Geri sayım:** İlçenin saat dilimine göre (API'deki `gmtOffset`) hesaplanır; telefon başka bir saat
  diliminde olsa da doğru çalışır. Yatsıdan sonra sıradaki vakit yarının imsakıdır.
- **Sabah vakti:** Diyanet API'sinde ayrı bir alan yok. Ekranda güneşin doğuşundan 60 dakika önce
  gösterilir; `src/config.ts` içindeki `SABAH_MINUTES_BEFORE_SUNRISE` ile değiştirin ya da `null` yapıp gizleyin.
- **İçerikler:** `/api/namaz/contents` yanıtındaki her bölüm bir kart olarak gösterilir. Arapça görsel
  (SVG/PNG) varsa o, yoksa Arapça metin Amiri yazı tipiyle gösterilir. Ses dosyası varsa "Dinle" düğmesi çıkar.
  Metinde `**kalın**` ve `*italik*` kullanılabilir. `esma` bölümü görsel solda, metin sağda düzenlenir.
- **Tema:** Telefonun açık/koyu temasına uyar. Arapça kutusu, siyah hat görselleri okunsun diye her iki temada açık zeminlidir.

## Yayın (EAS)

```bash
npx eas-cli@latest build --platform android    # veya ios
```

Paket adı: `net.akbolat.namazvakti` (`app.json`). Uygulama simgesi ve açılış ekranı henüz Expo'nun varsayılanları.
