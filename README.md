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
- **Tema:** Ayarlar'dan seçilir (varsayılan: telefonun temasını izler). Arapça kutusu, siyah hat görselleri okunsun diye her iki temada açık zeminlidir.

## Ayarlar

Ana ekrandaki dişli simgesi `src/app/settings.tsx` ekranını açar. Ayarlar cihazda saklanır (`src/lib/settings.tsx`).

- **Görünüm → Tema:** Sistem / Açık / Koyu.
- **Widget'lar:** tema (Otomatik / Açık / Koyu / Şeffaf), vurgu rengi (Yeşil, Altın, Mavi, Gül, Mor),
  şeffaf widget yazı rengi (Beyaz / Siyah). Canlı önizleme gösterilir; değişiklik anında widget'lara gönderilir.
  Ayarlar tüm widget'lara birlikte uygulanır. Mini widget her zaman şeffaftır, yazı rengini bu ayardan alır.

Yeni ayar eklemek:
1. `src/lib/settings.tsx` → `AppSettings` tipine ve `DEFAULT_SETTINGS` içine ekleyin (eski kayıtlar varsayılanla tamamlanır).
2. `src/app/settings.tsx` ekranına `<SettingsSection>` / `<SettingsRow>` ile satırını ekleyin
   (`Segmented`, `Swatches` gibi hazır kontroller `src/components/settings/SettingsUI.tsx` içinde).
3. Değeri `const { settings, update } = useSettings()` ile okuyup yazın.

## Ana ekran widget'ları

`expo-widgets` (Expo SDK 58) ile yazıldı; `ios/` ve `android/` klasörlerine elle dokunulmaz, her şey
`app.json` içindeki eklenti ayarından üretilir. Widget kodu `src/widgets/` altında:

| Widget | iOS | Android | İçerik |
|---|---|---|---|
| **Sıradaki Vakit** (`NextPrayer`) | Küçük + kilit ekranı (dikdörtgen, satır içi) | 2x2 | Sıradaki vakte geri sayım (iOS) / sıradaki vaktin saati (Android) |
| **Günün Vakitleri** (`DailyTimes`) | Küçük | 2x2 | Altı vakit, şu anki vakit vurgulu |
| **Vakit Paneli** (`PrayerPanel`) | Orta | 4x2 | Solda sıradaki vakit, sağda günün vakitleri |
| **Vakit Şeridi** (`PrayerStrip`) | Orta | 4x1 | Altı vakit yan yana, şu anki vurgulu (iOS'ta 4x1 boyut olmadığı için orta boy) |

Nasıl güncellenir:
- **iOS:** Uygulama ~10 günlük zaman çizelgesi gönderir; widget her vakit girişinde ve gece yarısında kendiliğinden
  yenilenir. Geri sayımı sistem işletir (saniye saniye, pil harcamadan).
- **Android:** `expo-widgets` Android'de zaman çizelgesini desteklemiyor (widget kendi kendine yenilenemiyor). Bu yüzden
  widget'lar canlı geri sayım yerine **sıradaki vaktin saatini** gösterir; içerik uygulama açıkken her vakit
  değişiminde ve arka plan göreviyle (sistem en sık ~15 dakikada bir çalıştırır) güncellenir. Vurgulanan vakit bu
  yüzden birkaç dakika gecikebilir; saatler her zaman doğrudur.
- Arka plan görevi (`src/widgets/background.ts`) cihazdaki önbellekten çalışır, internete çıkmaz.

Dosyalar:

```
src/widgets/ios/*.tsx        SwiftUI widget'ları (@expo/ui/swift-ui)
src/widgets/android/*.tsx    Android widget'ları (@expo/ui/jetpack-compose)
src/widgets/types.ts         Widget içerik tipi ve boş içerik
src/widgets/data.ts          Vakitlerden widget içeriği / iOS zaman çizelgesi üretimi
src/widgets/sync.ts          Widget'ları güncelleme (Expo Go'da sessizce devre dışı)
src/widgets/background.ts    Arka plan görevi
```

Widget kodu yazarken kurallar (`'widget'` yönergeli fonksiyonlar ayrı bir ortamda çalışır):
- Yalnızca Expo UI bileşenleri ve değiştiricileri kullanılabilir; hook, state, async, import yok.
- Fonksiyonun dışındaki hiçbir şeye (dosyadaki sabitler dahil) erişilemez; renkler bu yüzden fonksiyonun içinde.
- Widget dosyaları yalnızca `../types` dosyasını içe aktarmalı (`@/...` modülleri widget derlemesinde çözülemez).
- **Android yerleşim sınırı:** Android widget'larında (Glance) `Row`/`Column` yalnızca `start` / `center` / `end` hizalamasını
  destekler; `spaceBetween`, `spaceEvenly` ve `weight` yok sayılır. "Solda ad, sağda saat" gibi düzenler için
  tam genişlikte bir `Box` içinde iki katman kullanın (biri `contentAlignment="centerStart"`, diğeri `"centerEnd"`).
  iOS'ta (SwiftUI) `Spacer` normal çalışır.

### Widget galerisi önizlemeleri

- **iOS:** Galeride widget'ın kendisi canlı olarak çizilir; ek bir şey gerekmez.
- **Android:** `expo-widgets` önizleme görseli ayarı sunmadığı için galeride varsayılan olarak uygulama ikonu görünür.
  `plugins/withWidgetPreviews.js` eklentisi her prebuild'de `assets/widget-previews/<widget_adi>.png` dosyalarını
  `res/drawable-nodpi/` altına kopyalar ve widget'ın `*_info.xml` dosyasına `android:previewImage` ekler.
  Görsel adı widget adının Android karşılığıdır: `NextPrayer` → `next_prayer.png`, `NextPrayerMini` → `next_prayer_mini.png`,
  `DailyTimes` → `daily_times.png`, `PrayerPanel` → `prayer_panel.png`, `PrayerStrip` → `prayer_strip.png`.
  Yeni widget eklerseniz aynı adla bir PNG koyun; görsel yoksa eklenti uyarı verip o widget'ı atlar.
  Görseli değiştirdikten sonra `npx expo prebuild --clean --platform android` çalıştırın.

### Widget'ları denemek (geliştirme sürümü gerekir)

Widget'lar **Expo Go'da çalışmaz**; uygulamanın kendi derlemesi gerekir. Uygulamanın geri kalanı Expo Go'da çalışmaya devam eder.

```bash
# Mac'te (Xcode / Android Studio kurulu)
npx expo run:ios --device       # iPhone kabloyla bağlı
npx expo run:android            # Android cihaz / emülatör

# veya EAS ile bulutta
npx eas-cli@latest build --profile development --platform ios
```

- `run:ios` / `run:android` geçici `ios/` ve `android/` klasörleri üretir; bunlar `.gitignore` içinde, depoya eklenmez.
- iOS'ta widget, App Group (`group.net.akbolat.namazvakti`) üzerinden veri alır. EAS derlemesinde App Group
  ve widget eklentisinin (`net.akbolat.namazvakti.widgets`) kimlikleri Apple hesabınızda otomatik oluşturulur;
  Xcode ile yerel derlemede "Signing & Capabilities" bölümünde takımınızı seçmeniz gerekir.
- Widget'ı ana ekrana ekledikten sonra uygulamayı bir kez açın; konum seçilince widget dolar.

## Yayın (EAS)

```bash
npx eas-cli@latest build --platform android    # veya ios
```

Paket adı: `net.akbolat.namazvakti` (`app.json`). Uygulama simgesi ve açılış ekranı henüz Expo'nun varsayılanları.
