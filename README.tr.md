## 🇬🇧 English

Bu dokümanın İngilizce versiyonu için [README.md](README.md)

> Not: Bu doküman İngilizce versiyondan türetilmiştir ve zaman zaman geride kalabilir.

---

# Orbacle

Orbacle, Expo ve React Native ile geliştirilmiş minimalist bir mobil uygulamadır. Kullanıcı bir soru yazar, animasyonlu kristal küreye dokunur ve yerel, önceden tanımlanmış bir cevap havuzundan rastgele seçilmiş kısa bir cevap alır. Davranış olarak bir "magic 8-ball" deneyimine benzer; koyu mor/menekşe tonlu bir tasarım, animasyonlu görsel efektler, titreşimli geri bildirim, yerel geçmiş kaydı ve tam İngilizce/Türkçe yerelleştirme sunar.

Uygulama tamamen çevrimdışıdır: herhangi bir sunucuyla veya üçüncü taraf API ile iletişim kurmaz. Tüm cevaplar, geçmiş kayıtları ve tercihler cihaz üzerinde saklanır.

## Genel Bakış

- Tek amaçlı uygulama: soru sor, cevabı göster.
- Üç sekmeli yapı: **Ana Sayfa**, **Geçmiş**, **Ayarlar**.
- İki dil: İngilizce ve Türkçe. İlk açılışta cihaz diline göre otomatik algılanır, ayarlardan değiştirilebilir.
- Cevaplar, uygulamayla birlikte paketlenen iki statik JSON havuzundan gelir (`src/data/answers.en.json`, `src/data/answers.tr.json`); her biri 363 girdi içerir.
- Kürenin görseli, `react-native-reanimated` ile yönetilen animasyonlu gradyanlar, sis katmanları, parıltı noktaları ve zemin sisi ile katmanlanmış bir kristal küre görüntüsünden oluşur.
- Geçmiş, yerel olarak `AsyncStorage` üzerinde tutulur ve en son 20 kayıtla sınırlıdır.
- [app.json](app.json) içinde tanımlı platform hedefleri: Android (`com.orbacle.app`) ve iOS (`com.orbacle.app`, tablet desteği kapalı). Çalışma dizinin adı `orbacle_android` ve repoda Expo Application Services (EAS) yapılandırması bulunur; bu, birincil odak noktasının Android derlemeleri olduğuna işaret eder.

## Özellikler

Mevcut koddan doğrulanan, uygulanmış özellikler:

- **Soru akışı**: kullanıcı bir soru yazar (en fazla 200 karakter, tek satır), küreye dokunur ve ~1,4 saniyelik animasyonlu bir açılış sekansının ardından aktif dil havuzundan bir cevap gösterilir.
- **Tekrar etmeyen rastgele seçim**: `getRandomAnswer`, aynı oturum içinde aynı cevabı üst üste döndürmekten kaçınır.
- **Boş giriş koruması**: alan boşken küreye dokunulduğunda satır içi bir uyarı ("Lütfen önce bir soru girin") gösterilir ve uyarı tipi bir titreşim tetiklenir.
- **Animasyonlu küre**: idle nabız (ölçek + aura opaklığı), dokunmayla tetiklenen parıltı, patlama halkası ve ölçek sekansı; buna ek olarak ambiyans sisi katmanları ve parıltı noktaları ([src/components/Orb.tsx](src/components/Orb.tsx) ve [src/hooks/useOrbAnimation.ts](src/hooks/useOrbAnimation.ts) içinde uygulanır).
- **Titreşim geri bildirimi** (`expo-haptics` üzerinden): küreye dokunmada orta şiddette bir etki, cevap açılışında başarı bildirimi, boş girişte uyarı bildirimi. Ayarlar'dan açılıp kapatılabilir.
- **Cevap kartı**: fade-in animasyonu ile görünür; `react-native Share.share` aracılığıyla işletim sistemi paylaşım sayfasını açan bir paylaş eylemi içerir.
- **Geçmiş**:
  - Açılışta her Q&A (soru, cevap, zaman damgası, dil) otomatik olarak kaydedilir.
  - En yeni en üstte olmak üzere 20 öğeyle sınırlı bir yuvarlanan liste.
  - Bozuk girdiler okuma sırasında filtrelenir ve temiz liste yeniden yazılır.
  - Ayarlar'da bir onay modalıyla korunan "Geçmişi Temizle" eylemi.
- **Yerelleştirme (i18n)**:
  - İngilizce (`src/i18n/en.json`) ve Türkçe (`src/i18n/tr.json`) için string tabloları.
  - Senkron `t(key)` fonksiyonu olan dil context sağlayıcısı (`I18nProvider`); İngilizceye ve ardından ham anahtara geri düşer.
  - İlk çalıştırmada `NativeModules` üzerinden cihaz dili algılama ve saklama.
  - Ayarlar'da **İngilizce** ile **Türkçe** arasında manuel geçiş.
- **Tarih biçimlendirme**: `formatDate`, aktif dile göre `tr-TR` veya `en-US` ile `toLocaleDateString` kullanır.
- **Ayarlar ekranı**:
  - Dil seçici (EN / TR).
  - Titreşim anahtarı (saklanır).
  - Onay modallı "Geçmişi Temizle" eylemi.
  - Uygulama açıklaması, katkı bilgileri ve sürüm dizgesinin yer aldığı "Hakkında" bölümü.
- **Hata sınırı** ([src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)): tüm uygulamayı sarar ve yakalanan bir render hatası durumunda sıfırlama eylemi içeren bir "Something went wrong" ekranı gösterir.
- **Splash gecikmesi**: i18n sağlayıcısı `ready` duruma geçene kadar Expo'nun native splash ekranı `expo-splash-screen` ile tutulur; böylece çeviri öncesi bir "siyah ekran" yanıp sönmesi önlenir.
- **Güvenli alan duyarlı düzen**: her ekran `useSafeAreaInsets` değerlerini dikkate alır; alt sekme çubuğu yüksekliği alt güvenli alan değeri kadar uzatılır.
- **Duyarlı küre boyutu**: küre boyutu = `min(300, round(pencere_genişliği * 0.7))` px.
- **Erişilebilirlik detayları**: küre `Pressable`'ında `accessibilityRole`/`accessibilityLabel`/`accessibilityState`; dekoratif parçacıklar ve sis katmanları `accessibilityElementsHidden` olarak işaretlenir; başlık/slogan/yardım metinlerinde `maxFontSizeMultiplier` üst sınırı; sekme ikonlarında `allowFontScaling={false}`.

## Proje Yapısı

```
orbacle_android/
├── App.tsx                         Kök bileşen: sağlayıcılar, splash geciktirme, alt sekme navigatörü
├── app.json                        Expo uygulama manifestosu (ad, ikonlar, splash, android/ios yapılandırması, eklentiler)
├── eas.json                        EAS Build profilleri (development, preview, production) ve submit yapılandırması
├── babel.config.js                 babel-preset-expo + react-native-reanimated/plugin
├── tsconfig.json                   expo/tsconfig.base'i genişletir; strict mode açık
├── package.json                    Komut dosyaları ve bağımlılıklar
├── assets/
│   ├── icon.png                    iOS / genel uygulama ikonu
│   ├── android-icon.png            Android eski ikon
│   ├── adaptive-foreground.png     Android adaptive icon ön planı
│   ├── splash.png                  Splash görseli (arka plan #0a0a1a)
│   └── orb.webp                    Orb bileşeninin kullandığı kristal küre görseli
└── src/
    ├── components/
    │   ├── Orb.tsx                 Aura/parıltı/patlama/sis/parıltı katmanlı kristal küre görseli
    │   ├── QuestionInput.tsx       Stil verilmiş, 200 karakterle sınırlı tek satır metin girişi
    │   ├── AnswerCard.tsx          Açılan cevabı gösteren fade-in kart
    │   ├── PrimaryButton.tsx       Ghost / filled düğme varyantları (filled LinearGradient kullanır)
    │   ├── LanguageSwitcher.tsx    İki seçenekli EN/TR segmented control
    │   ├── ConfirmModal.tsx        Yıkıcı işlemleri onaylamak için kullanılan saydam modal
    │   └── ErrorBoundary.tsx       Sıfırlama eylemli class component hata sınırı
    ├── constants/
    │   ├── colors.ts               Palet (arka plan, primary/mor, gradyanlar, küre tonları vb.)
    │   ├── spacing.ts              Boşluk skalası ve borderRadius skalası
    │   └── typography.ts           Metin stili ön ayarları (hero, title, subtitle, body, caption, answer)
    ├── data/
    │   ├── answers.en.json         363 İngilizce cevap dizgesi
    │   └── answers.tr.json         363 Türkçe cevap dizgesi
    ├── hooks/
    │   └── useOrbAnimation.ts      Reanimated shared value'ları + açılış sekansı + temizleme referansları
    ├── i18n/
    │   ├── index.ts                I18nProvider, useI18n hook'u, ready bayrağı
    │   ├── en.json                 İngilizce UI dizgeleri
    │   └── tr.json                 Türkçe UI dizgeleri
    ├── screens/
    │   ├── HomeScreen.tsx          Başlık, slogan, küre, giriş → cevap → paylaş / yeni soru
    │   ├── HistoryScreen.tsx       Saklanan Q&A girdilerinin FlatList'i (boş durum dahil)
    │   └── SettingsScreen.tsx      Dil, titreşim anahtarı, geçmişi temizle, hakkında
    ├── storage/
    │   ├── historyStorage.ts       Geçmiş için AsyncStorage CRUD (doğrulama ve 20 öğe üst sınırı ile)
    │   └── settingsStorage.ts      Dil ve titreşim bayrağı için AsyncStorage okuma/yazma
    ├── types/
    │   ├── history.ts              HistoryItem tipi
    │   └── language.ts             Language = 'en' | 'tr'
    └── utils/
        ├── formatDate.ts           Yerel ayara duyarlı tarih/saat biçimlendirici
        ├── getDeviceLanguage.ts    NativeModules üzerinden cihaz dilini algılar; 'en' | 'tr' ile eşler
        └── getRandomAnswer.ts      Ardışık tekrar olmadan rastgele seçim yapan yardımcı
```

## Kullanılan Teknolojiler

[package.json](package.json) üzerinden:

- **React 19.1.0** ve **React Native 0.81.5**.
- **Expo SDK 54** (`expo ^54.0.0`), managed workflow. Hermes JS motoru etkin (`"jsEngine": "hermes"`, bkz. `app.json`).
- **Expo modülleri**: `expo-splash-screen`, `expo-status-bar`, `expo-haptics`, `expo-linear-gradient`, `expo-asset`.
- **Navigasyon**: `@react-navigation/native` ve `@react-navigation/bottom-tabs` (v7); `react-native-screens` ve `react-native-safe-area-context` ile birlikte.
- **Animasyonlar**: `react-native-reanimated ~4.1.1` ve `react-native-worklets 0.5.1` (Reanimated babel eklentisi [babel.config.js](babel.config.js) içinde yapılandırılmıştır).
- **Yerel depolama**: `@react-native-async-storage/async-storage 2.2.0`.
- **TypeScript 5.9.2** (strict, `expo/tsconfig.base`'i genişletir).
- **Derleme hattı**: Expo Application Services (EAS) — bkz. [eas.json](eas.json). CLI ≥ 18.3.0 gerekli, `appVersionSource: remote`, üç derleme profili (`development`, `preview`, `production`; production'da `autoIncrement: true`).

## Kurulum

Önkoşullar:

- Node.js ve npm.
- Expo ile uyumlu güncel bir araç zinciri (Expo SDK 54 managed'dır; lokal bir Android/iOS native projesi gerekmez).
- EAS derlemeleri için: EAS CLI (`npm install -g eas-cli`) ve bir Expo hesabı.

Bağımlılıkları kurun:

```bash
npm install
```

## Kullanım

Kullanılabilir komutlar [package.json](package.json) içinde tanımlanmıştır:

```bash
# Expo geliştirme sunucusunu başlat (Metro bundler + geliştirici menüsü)
npm run start

# Bağlı bir Android cihaz/emülatörde çalıştır (Expo managed)
npm run android

# iOS'ta çalıştır (macOS gerekir)
npm run ios

# Expo web hedefini başlat
npm run web
```

Üretim / önizleme derlemeleri, [eas.json](eas.json) içinde tanımlanan profillerle EAS aracılığıyla üretilir:

```bash
eas build --profile development
eas build --profile preview
eas build --profile production
```

Son git geçmişi, projenin native Android derleme klasöründen Expo managed splash/derleme akışına geçtiğini gösterir:

- `remove android native build, switch to expo managed splash, update splash design`

## Yapılandırma

Yapılandırma tamamen beyanname dosyaları üzerinden ifade edilir; kaynak ağacında çalışma zamanı `.env` kullanımı yoktur.

- [app.json](app.json):
  - `name: "Orbacle"`, `slug: "orbacle"`, `version: "1.0.0"`.
  - `orientation: portrait`, `userInterfaceStyle: dark`, `jsEngine: hermes`.
  - Splash: `./assets/splash.png`, `resizeMode: contain`, arka plan `#0a0a1a`.
  - Android: paket `com.orbacle.app`, adaptive icon ön planı `./assets/adaptive-foreground.png`, adaptive arka plan `#0a0a1a`, `permissions: []`.
  - iOS: bundle id `com.orbacle.app`, `supportsTablet: false`.
  - Eklentiler: `expo-asset`, `expo-splash-screen`.
  - EAS entegrasyonu için `extra.eas.projectId` tanımlıdır.
- [eas.json](eas.json): üç derleme profili (`development`, `preview`, `production`) ve boş bir `submit.production` yer tutucusu.
- [babel.config.js](babel.config.js): `babel-preset-expo` + `react-native-reanimated/plugin`.
- [tsconfig.json](tsconfig.json): `expo/tsconfig.base`'i genişletir; `strict: true`.
- Kullanıcıya yönelik ayarlar (AsyncStorage üzerinde saklanır):
  - `@orbacle_language`: `"en" | "tr"`.
  - `@orbacle_haptics`: `"true" | "false"` (öntanımlı olarak açık; `"false"` dizgesi dışındaki her değer açık kabul edilir).
  - `@orbacle_history`: en fazla 20 `HistoryItem` girdisi içeren JSON dizisi.

## Mimari / Temel Bileşenler

[App.tsx](App.tsx) içindeki en üst düzey kompozisyon:

```
ErrorBoundary
└── SafeAreaProvider
    └── I18nProvider
        └── NavigationContainer
            ├── StatusBar (style="light")
            └── AppNavigator
                └── Tab.Navigator (alt sekmeler: Home / History / Settings)
```

- **ErrorBoundary**: en dış katmanda class component hata sınırı; render hatası yakalandığında "Try again" sıfırlama düğmeli bir yedek ekran gösterir.
- **I18nProvider** ([src/i18n/index.ts](src/i18n/index.ts)):
  - AsyncStorage'dan saklı dili okur; yoksa cihaz dilini algılayıp yazar.
  - Context üzerinden `{ language, t, setLanguage, ready }` sunar.
  - `ready`, ilk render'ı kapılar; kök bileşen, `ready === true` olana kadar Expo splash'in kapatılmasını erteler.
- **AppNavigator**: alt sekme navigatörü. Sekme ikonları `allowFontScaling={false}` ile render edilen emoji glifleridir (`🔮`, `📜`, `⚙️`); aktif/pasif ton renkleri `colors.primaryLight` ve `colors.textMuted`'ten gelir; sekme yüksekliği `56 + altGüvenliAlan`.
- **HomeScreen** ([src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx)):
  - Etkileşim durumunu tutar (`question`, `answer`, `isAnimating`, `emptyHint`).
  - Animasyon kontrolü için `useOrbAnimation`, cevap seçimi için `getRandomAnswer(language)` kullanır.
  - Açığa çıkan her cevabı `addHistoryItem` aracılığıyla geçmişe yazar.
  - `KeyboardAvoidingView` (iOS `padding`, Android varsayılan) ve bir `LinearGradient` arka plan kullanır.
- **HistoryScreen** ([src/screens/HistoryScreen.tsx](src/screens/HistoryScreen.tsx)): odaklanıldığında (`useFocusEffect` ile) geçmişi tekrar okur ve bir `FlatList` render eder; liste boşsa boş durum görünümünü gösterir.
- **SettingsScreen** ([src/screens/SettingsScreen.tsx](src/screens/SettingsScreen.tsx)): dil seçici, titreşim anahtarı, `ConfirmModal`'lı geçmişi temizle düğmesi ve statik hakkında/katkı/sürüm bloğu.
- **Orb** ([src/components/Orb.tsx](src/components/Orb.tsx)) şu öğeleri birleştirir:
  - Dört adet sürüklenen `Mist` katmanı (asimetrik ölçekleme, sinüs easing, opaklık interpolasyonu).
  - Kademeli gecikmelerle yedi `Sparkle` noktası ve sequence tabanlı opaklık/ölçek.
  - İki eş merkezli aura katmanı (dış + iç) ve radyal benzeri gradyanlar.
  - Bir parıltı güçlendirici, dokunma patlaması katmanı ve bir zemin sisi elipsi.
  - Ortada, erişilebilirlik öznitelikleri olan bir `Pressable` içine sarılmış bir `Image` (`assets/orb.webp`).
- **useOrbAnimation** ([src/hooks/useOrbAnimation.ts](src/hooks/useOrbAnimation.ts)):
  - Beş Reanimated shared value (`idlePulse`, `glowIntensity`, `burstScale`, `orbScale`, `isRevealing`).
  - Sinüs ile interpolasyona uğrayan sonsuz bir idle nabız döngüsü.
  - `triggerReveal(onComplete)`, 1400 ms süren sıralı bir açılış sekansı (parıltı atışları, ölçek yaylanmaları, patlama halkası) çalıştırır ve ardından `onComplete`'i bir `setTimeout` ile çağırır; bu zamanlayıcının referansı sökümde veya sıfırlamada temizlenir.
  - `resetAnimation`, bekleyen zamanlayıcıyı temizler ve parıltı/açılış durumunu sönümler.
- **PrimaryButton**: iki varyant — `filled` (gradyan) ve `ghost` (kenarlıklı yarı saydam). Öntanımlı varyant `ghost`.
- **LanguageSwitcher**: aktif/pasif stillere sahip iki bölmeli EN/TR kontrolü.
- **QuestionInput**: tek satır `TextInput` (en fazla 200 karakter), paletteki yer tutucu ve seçim rengi, Android'e özel dikey padding ayarı.
- **AnswerCard**: etiket + tırnak içinde cevabı gösteren fade-in kart.
- **ConfirmModal**: arka plana dokunarak iptal eden, iptal/onayla düğmeli, tam ekran saydam modal.

## Veri Akışı / Çalışma Zamanı Akışı

Soğuk başlatma:

1. Modül yüklemesi sırasında (React mount olmadan önce) `SplashScreen.preventAutoHideAsync()` çağrılır ve native splash ekranı tutulur.
2. `App`, `ErrorBoundary → SafeAreaProvider → I18nProvider → NavigationContainer → AppNavigator` ağacını render eder.
3. `I18nProvider`'ın effect'i `@orbacle_language`'i okur. Set edilmişse o dili benimser; aksi halde cihaz yerel ayarını `en` veya `tr` olarak eşleyip saklar. Her iki durumda da `ready` `true` olur.
4. `AppNavigator`, `!ready` iken `null` döndürür; sonra sekme navigatörünü render eder ve `SplashScreen.hideAsync()` ile splash'i gizler.

Soru etkileşimi (`HomeScreen` üzerinde):

1. Kullanıcı, `QuestionInput`'a bir soru yazar ve küreye dokunur.
2. Trimlenmiş soru boşsa → `enter_question` ipucunu göster, (açıksa) uyarı titreşimi tetikle, çık.
3. Değilse: klavyeyi kapat, `isAnimating = true` yap, önceki animasyonu/cevabı sıfırla.
4. `@orbacle_haptics`'i oku; açıksa orta şiddette bir titreşim gönder.
5. `triggerReveal` açılış animasyonunu başlatır ve geri çağrısını 1400 ms sonrasına planlar.
6. Tamamlandığında: aktif dil havuzundan tekrarsız rastgele bir cevap seç, state'e yaz, (açıksa) başarı titreşimi gönder ve `addHistoryItem` AsyncStorage'a yeni bir `HistoryItem` yazar.
7. `HomeScreen`, yardım metni + girişi `AnswerCard` + eylemler (`share`, `ask_another`) ile değiştirir.
8. `share`, yerelleştirilmiş bir önekle `Share.share`'i kullanır; `ask_another`, `answer`/`question`'ı temizler ve animasyonu sıfırlar.

Geçmiş etkileşimi:

- Odaklanıldığında `HistoryScreen`, `getHistory()`'i çağırır; bu da `@orbacle_history`'i okur, her girdiyi doğrular (`id`, `question`, `answer` dizge; `timestamp` sayı; `language` `{en, tr}`'den biri), bozuk girdileri atar (ve temizlenmiş listeyi tekrar yazar) ve tipli bir dizi döndürür.
- Her satır; soruyu, tırnaklı cevabı ve yerel ayara göre biçimlendirilmiş tarihi render eder.
- Ayarlar'daki "Geçmişi Temizle", `ConfirmModal`'ı açar; onaylandığında `clearHistory()` anahtarı siler.

Ayarlar etkileşimi:

- `getHapticsEnabled()`, mount sırasında anahtara ilk değerini verir (anahtar yoksa veya okunamıyorsa öntanımlı `true`).
- Anahtar değişince `saveHapticsEnabled(value)` tetiklenir.
- `LanguageSwitcher`, `setLanguage(lang)`'i çağırır; bu da context state'ini günceller ve AsyncStorage'a yazar.

## Sınırlamalar / Mevcut Durum

Doğrudan koddan ve repo durumundan çıkarılan gözlemler:

- **Tasarım olarak tamamen çevrimdışı**: ağ çağrısı, uzak yapılandırma, analitik veya kilitlenme raporlama entegrasyonu yoktur. `ErrorBoundary`, ileride Sentry/Crashlytics eklenebileceğine dair bir yorum içerir ancak şu anda böyle bir entegrasyon bulunmamaktadır.
- **Yalnızca Expo managed workflow**: repoda `android/` veya `ios/` native proje dizini yoktur; derlemeler `expo run:*` veya EAS ile üretilir. Son commit'lerden biri, native Android derleme dizininin açıkça kaldırıldığını gösterir.
- **Geçmiş üst sınırı**: 20 öğe olarak sabit kodlanmıştır; taşma durumunda eski girdiler sessizce düşer.
- **Cevap havuzları**: dil başına 363 girdiyle sabittir ve JS bundle'ıyla birlikte paketlenir. Çalışma zamanında cevapları genişletme, güncelleme veya sunucudan çekme mekanizması yoktur.
- **Dil kapsamı**: tam olarak iki dil (`en`, `tr`). Türkçe dışındaki cihaz yerel ayarları İngilizceye geri düşer.
- **Tek satırlık giriş**: sorular 200 karakterle sınırlıdır ve birden fazla satıra yayılamaz.
- **Otomatik test yoktur**: repo herhangi bir test dosyası, test çalıştırıcı yapılandırması veya CI iş akışı içermez.
- **Web hedefi**: bir `web` komutu mevcuttur (`expo start --web`), ancak uygulama mobil için ayarlıdır (sekme çubuğu, güvenli alanlar, titreşim, native paylaşım sayfası). Web davranışı kodda açıkça doğrulanmamıştır.
- **iOS cihaz dili algılama**: doğrudan `NativeModules.SettingsManager` kullanılır; bu tek dil algılama yoludur ve `expo-localization`'a dayanmaz.
- **Global rastgele durum**: `getRandomAnswer`, `lastAnswer`'ı modül düzeyinde bir değişkende tutar; bu nedenle "ardışık tekrar yok" koruması tek bir uygulama oturumundaki tüm çağrılar arasında paylaşılır ve süreç yeniden başlatıldığında sıfırlanır.
