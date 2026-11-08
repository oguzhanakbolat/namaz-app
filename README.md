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

- **iOS:** `expo-widgets` (SwiftUI, `src/widgets/ios/*.tsx`), `app.json` içindeki eklenti ayarından üretilir.
- **Android:** projedeki yerel native modül `modules/namaz-widgets` (Kotlin + Android'in kendi widget sistemi,
  RemoteViews). `expo-widgets`'ın Android sürümü zaman çizelgesi ve canlı geri sayım desteklemediği için Android
  widget'ları buraya taşındı (`app.json`: `enableAndroid: false`). Modül prebuild'de otomatik bağlanır;
  `android/` klasörüne elle dokunulmaz.

| Widget | iOS | Android | İçerik |
|---|---|---|---|
| **Sıradaki Vakit** | Küçük + kilit ekranı | 2x2 | Sıradaki vakte canlı geri sayım ("Akşama 1:12:30") |
| **Sıradaki Vakit (Mini)** | Küçük + kilit ekranı (yuvarlak) | 1x1 | Şeffaf. iOS: "Akşama 17:47"; Android: kalan süre "Akşama 01:12" (ekran açıkken dakikada bir yenilenir) |
| **Günün Vakitleri** | Küçük | 2x2 | Altı vakit, şu anki vakit vurgulu |
| **Vakit Paneli** | Orta | 3x2 | Solda canlı geri sayım ve hicri tarih, sağda günün vakitleri |
| **Vakit Şeridi** | Orta | 4x1 | Üstte konum, hicri tarih ve sıradaki vakte geri sayım; altta altı vakit kutucuklarda |
| **Vakit Şeridi (İnce)** | — | 4x1 | Yalnızca altı vakit yan yana, şu anki vurgulu |

Nasıl güncellenir:
- **iOS:** Uygulama ~10 günlük zaman çizelgesi gönderir; widget her vakit girişinde ve gece yarısında kendiliğinden
  yenilenir. Geri sayımı sistem işletir.
- **Android:** Uygulama vakitleri (önbellekteki ~1 ay), konumu ve renkleri modüle bir kez gönderir
  (`src/widgets/android.ts` → `NamazWidgets.setData`). Gerisini widget kendisi yapar:
  - Kalan süre Android'in `Chronometer` bileşeniyle saniye saniye işler (uygulama kapalıyken de).
  - Her vakit girişinde ve gece yarısında kendini alarmla yeniden çizer (vurgulanan vakit, sıradaki vakit, tarih).
    "Alarm ve hatırlatıcılar" izni varsa tam zamanında, yoksa birkaç dakika gecikmeyle.
  - Telefon yeniden başlayınca, saat/saat dilimi değişince ve uygulama güncellenince kendini yeniler.
  - Açık/koyu tema: Android 12+ iki rengi birlikte alır, tema değişince widget anında uyar.
  - Köşeler: Android 12+ ana ekranın widget köşe ölçüsü kullanılır (`system_app_widget_background_radius`);
    içteki kutular `system_app_widget_inner_radius` ile dış köşeyle aynı merkezlidir.
- Arka plan görevi (`src/widgets/background.ts`) önbellekteki vakitleri ileri taşır; internete çıkmaz.

Dosyalar:

```
src/widgets/ios/*.tsx        iOS widget'ları (@expo/ui/swift-ui)
src/widgets/android.ts       Android: native modüle veri gönderme
src/widgets/data.ts          Renkler, başlıklar, iOS zaman çizelgesi
src/widgets/sync.ts          Platforma göre güncelleme (Expo Go'da sessizce devre dışı)
src/widgets/background.ts    Arka plan görevi

modules/namaz-widgets/android/src/main/
  java/.../WidgetData.kt     Gelen veri, vakit hesabı (şu anki / sıradaki vakit, yenileme anı)
  java/.../WidgetRenderer.kt Çizim, geri sayım, yenileme alarmı
  java/.../Widgets.kt        Widget sağlayıcıları ve yenileme alıcısı
  res/layout/nw_*.xml        Yerleşimler
  res/xml/nw_*_info.xml      Widget boyutları, önizleme görselleri
  res/drawable-nodpi/        Galeri önizlemeleri
```

iOS widget kodu yazarken kurallar (`'widget'` yönergeli fonksiyonlar ayrı bir ortamda çalışır):
- Yalnızca Expo UI bileşenleri ve değiştiricileri kullanılabilir; hook, state, async, import yok.
- Fonksiyonun dışındaki hiçbir şeye erişilemez; widget dosyaları yalnızca `../types` dosyasını içe aktarmalı.

`src/widgets/android/*.tsx`, `plugins/withWidgetPreviews.js` ve `assets/widget-previews/` artık kullanılmıyor;
silinebilir.

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
- Android'de widget sağlayıcıları değiştiği için, önceki sürümden kalan widget'lar ana ekrandan kaybolur;
  galeriden yeniden ekleyin.

## Uygulama güncellemeleri (EAS Update)

JavaScript, görsel ve metin değişiklikleri mağazaya yeni sürüm göndermeden `eas update` ile yayınlanır.
Native değişiklikler (yeni native paket, `app.json`'daki native ayarlar, `modules/namaz-widgets`, ikon, açılış ekranı,
ses dosyası) yeni bir derleme (`eas build`) gerektirir.

**Bir kerelik kurulum** (Expo hesabıyla):

```bash
npx expo install expo-updates
npx eas-cli@latest login
npx eas-cli@latest init               # EAS projesi oluşturur, app.json'a projectId ve owner yazar
npx eas-cli@latest update:configure   # app.json'a updates.url ekler
```

Ardından güncelleme alabilecek bir derleme alınır (güncellemeler yalnızca `eas build` ile alınmış derlemelere gider):

```bash
npx eas-cli@latest build --profile preview --platform android   # test (APK)
npx eas-cli@latest build --profile production --platform all    # mağaza
```

**Güncelleme yayınlamak:**

```bash
npm run update:preview -- --message "Widget düzeltmeleri"
npm run update:production -- --message "Widget düzeltmeleri"
```

Nasıl çalışır:
- `runtimeVersion` politikası **fingerprint**: native taraf (paketler, native ayarlar, yerel modül) değişince parmak izi
  değişir ve güncelleme yalnızca native tarafı birebir aynı derlemelere gider. Uyumsuz güncelleme uygulamayı
  bozamaz; native değişiklikten sonra yeni `eas build` gerekir (`npx expo-updates fingerprint:generate` ile
  parmak izi görülebilir).
- Kanallar (`eas.json`): `development`, `preview` (test, APK), `production` (mağaza). Her derleme kendi kanalındaki
  güncellemeleri alır.
- Uygulama açılışta güncellemeyi denetler ve indirir; inen güncelleme bir sonraki açılışta devreye girer.
  Ayrıca uygulama öne geldiğinde (en sık 30 dk'da bir) arka planda denetler; inince ana ekranın altında
  "Yeni sürüm hazır · Yeniden başlat" uyarısı çıkar (`src/lib/updates.ts`, `src/components/UpdateBanner.tsx`).
- Ayarlar → Hakkında → Güncelleme: çalışan sürümün bilgisi ve elle "Denetle".
- Geri almak: `npx eas-cli@latest update:rollback` veya önceki güncellemeyi yeniden yayınlama (`update:republish`).
- Geliştirme modunda (`expo start`) ve Expo Go'da güncelleme sistemi kapalıdır.

## Uygulama ikonu

Saat + cami çizimi `assets/icon-source/*.svg` (vektör kaynak). Üretilen dosyalar:

| Dosya | Kullanım |
|---|---|
| `assets/icon.png` | iOS ikonu (1024px, açık) ve genel ikon |
| `assets/icon-dark.png`, `assets/icon-tinted.png` | iOS 18 koyu ve renklendirilmiş ikon görünümleri |
| `assets/android-icon-foreground.png` + `-background.png` | Android uyarlanabilir ikon (çizim güvenli alanın içinde) |
| `assets/android-icon-monochrome.png` | Android 13+ temalı (tek renk) ikon |
| `assets/splash.jpg` | Açılış görseli (tam ekran) |
| `assets/favicon.png` | Web |

İkon değişince native klasörler yeniden üretilmeli: `npx expo prebuild --clean`.

Açılış ekranı: Android 12+ sistem açılış ekranı yalnızca ortada simge gösterebildiği için tam ekran görsel
uygulama içinde bir katman olarak çizilir (`src/components/SplashOverlay.tsx`). Sistem açılış ekranı Android'de
görselin gece mavisi renginde (#011226, `assets/splash-blank.png` boş simge), iOS'ta aynı görsel tam ekran;
uygulama hazır olunca görsel en az 1 sn görünüp yumuşakça kaybolur.

## Vakit alarmları

Ayarlar → Alarmlar. Her vakit için iki ayrı alarm kurulabilir:

| Bölüm | Ne zaman çalar | Seçenekler |
|---|---|---|
| Vakitten Önce | Vakitten X dk önce ("Öğle vaktine 45 dk kaldı") | 5–90 dk |
| Vakit Girince | Vakit girdiğinde ("Akşam vakti girdi") | — |

- Alarmlar `expo-notifications` ile yerel bildirim olarak kurulur (`src/lib/alarms.ts`); internet gerekmez.
  Uygulama her açıldığında, her vakit girişinde ve arka plan görevinde önbellekteki vakitlerden yeniden hesaplanır.
  Değişiklik yoksa dokunulmaz.
- **Ses:** Alarmlar uygulamanın "vakit çanı" ile çalar (`assets/sounds/vakit_cani.wav`, 3 sn, üç notalı yumuşak çan;
  uygulamada sentezlendi, lisans gerektirmez). `app.json` → `expo-notifications` → `sounds` ile iki platforma gömülür.
  - Android: çan, her alarm kanalının varsayılan sesidir (`alarm3_<tür>_<vakit>`; kanal ayarı değişirse önek sürümü
    artırılır, eskiler silinir). "Sesi değiştir" Android'in kanal ayarını açar; kullanıcı başka bir sistem sesi seçebilir.
    "Dene" o kanalın sesiyle hemen bir deneme bildirimi gösterir.
  - iOS: her alarm çanla çalar (iOS sistem seslerinin seçilmesine izin vermez).
- **Sessiz modda da çal (Android, varsayılan açık):** Kanallar alarm ses türüyle kurulur (`alarm3s_...`); telefon
  sessiz/titreşimdeyken de alarm ses düzeyinden çalar. Kapatılırsa bildirim sesi gibi çalan ayrı kanal takımı
  (`alarm3_...`) kullanılır. İki takımın sesleri ayrı seçilir.
- **Zamanında çalma (Android):** Android 12+ "Alarm ve hatırlatıcılar" izni olmadan alarmları birkaç dakika
  geciktirebilir; izin yoksa Alarmlar bölümünün başında "İzin ver" uyarısı çıkar (`SCHEDULE_EXACT_ALARM`).
  "Tam zamanında çal" açılırsa alarmlar alarm saati gibi (`setAlarmClock`) kurulur; pil tasarrufu hiç ertelemez,
  durum çubuğunda saat simgesi görünür.
- **Sınırlar:** iOS aynı anda en fazla 64 bildirim bekletebildiği için en yakın 60 alarm kurulur (günde 6 alarmla
  ~10 gün). Android'de 150. Uygulama uzun süre açılmazsa arka plan görevi listeyi ileri taşır.
- Alarmlar Expo Go'da ve web'de kapalıdır; uygulamanın kendi derlemesi gerekir.

## Yayın (EAS)

```bash
npx eas-cli@latest build --platform android    # veya ios
```

Paket adı: `net.akbolat.namazvakti` (`app.json`). Uygulama simgesi ve açılış ekranı henüz Expo'nun varsayılanları.
