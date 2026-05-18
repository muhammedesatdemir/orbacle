## 🇬🇧 English

Bu dokümanın İngilizce versiyonu için [README.md](README.md)

---

# Orbacle

Orbacle, Expo ve React Native ile geliştirilmiş minimalist bir mobil uygulamadır. Kullanıcı bir soru yazar, animasyonlu kristal küreye dokunur ve yerel, önceden tanımlanmış bir cevap havuzundan rastgele seçilmiş kısa bir cevap alır. Davranış olarak bir "magic 8-ball" deneyimine benzer; koyu mor/menekşe tonlu bir tasarım, animasyonlu görsel efektler, titreşimli geri bildirim, yerel geçmiş kaydı, favoriler, "günün cevabı" bandı, ilk açılış tanıtımı (onboarding) ve tam İngilizce/Türkçe yerelleştirme sunar.

Uygulama tamamen çevrimdışıdır: herhangi bir sunucuyla veya üçüncü taraf API ile iletişim kurmaz. Tüm cevaplar, geçmiş kayıtları, favoriler ve tercihler cihaz üzerinde saklanır. Orbacle yalnızca bir eğlence uygulaması olarak sunulur — cevaplar rastgele üretilir, gerçek bir öngörü veya tavsiye değildir.

**Demrivo** markası altında yayımlanmıştır. Geliştirici: **Muhammed Esat Demir**.

## Genel Bakış

- Tek amaçlı uygulama: soru sor, cevabı göster.
- İlk açılışta **onboarding** (3 kaydırmalı sayfa, atlanabilir), kullanıcı ana uygulamaya geçmeden önce akışı anlatır.
- Üç sekmeli yapı: **Ana Sayfa**, **Geçmiş**, **Ayarlar**.
- İki dil: İngilizce ve Türkçe. İlk açılışta cihaz diline göre otomatik algılanır, ayarlardan değiştirilebilir.
- Cevaplar, uygulamayla birlikte paketlenen iki statik JSON havuzundan gelir (`src/data/answers.en.json`, `src/data/answers.tr.json`); her biri 364 girdi içerir.
- Kürenin görseli, `react-native-reanimated` ile yönetilen animasyonlu gradyanlar, sis katmanları, parıltı noktaları ve zemin sisi ile katmanlanmış bir kristal küre görüntüsünden oluşur.
- Geçmiş, yerel olarak `AsyncStorage` üzerinde tutulur ve en son 50 kayıtla sınırlıdır; favoriler ayrı olarak tutulur ve 100 kayıtla sınırlıdır.
- "Günün cevabı", geçerli takvim tarihi + dilden deterministik olarak türetilir ve Ana Sayfa'da bir bant şeklinde gösterilir.
- [app.json](app.json) içinde tanımlı platform hedefleri: Android (`com.demrivo.orbacle`) ve iOS (`com.demrivo.orbacle`, tablet desteği kapalı). Repoda Expo Application Services (EAS) yapılandırması ve bir `android/` dizini bulunur; bu, birincil odak noktasının Android derlemeleri olduğuna işaret eder.

## Özellikler

Mevcut koddan doğrulanan, uygulanmış özellikler:

- **Onboarding akışı** ([src/screens/OnboardingScreen.tsx](src/screens/OnboardingScreen.tsx)): yalnızca ilk açılışta gösterilen 3 sayfalı yatay bir pager — "Sorunu yaz → Küreye dokun → Cevabını sakla". Atla (Skip) düğmesi, sayfa noktaları ve bir İleri/Başla düğmesi içerir. Tamamlanma `@orbacle_onboarded` bayrağıyla saklanır; böylece bir daha gösterilmez.
- **Soru akışı**: kullanıcı bir soru yazar (en fazla 200 karakter, tek satır), küreye dokunur ve ~1,4 saniyelik animasyonlu bir açılış sekansının ardından aktif dil havuzundan bir cevap gösterilir.
- **Tekrar etmeyen rastgele seçim**: `getRandomAnswer`, döndürülen son 10 cevabı (modül-seviyesi state) takip eder ve bir oturum içinde bunlardan herhangi birini tekrar etmekten kaçınır.
- **Günün cevabı**: `getDailyAnswer` / `getDeterministicAnswer`, yerel tarih + dili hashleyerek günde bir adet sabit cevap seçer. Ana Sayfa'da bir `DailyBanner` içinde gösterilir (klavye açıkken gizlenir) ve saklama gerektirmez — yerel gece yarısında otomatik olarak değişir.
- **Boş giriş koruması**: alan boşken küreye dokunulduğunda satır içi bir uyarı ("Lütfen önce bir soru girin") gösterilir ve uyarı tipi bir titreşim tetiklenir.
- **Animasyonlu küre**: idle nabız (ölçek + aura opaklığı), dokunmayla tetiklenen parıltı, patlama halkası ve ölçek sekansı; buna ek olarak ambiyans sisi katmanları ve parıltı noktaları ([src/components/Orb.tsx](src/components/Orb.tsx) ve [src/hooks/useOrbAnimation.ts](src/hooks/useOrbAnimation.ts) içinde uygulanır). Klavye açıldığında küre bölümü küçülüp yukarı kayar.
- **Titreşim geri bildirimi** (`expo-haptics` üzerinden): küreye dokunmada orta şiddette etki, cevap açılışında başarı bildirimi, boş girişte uyarı bildirimi, favori değiştirmede hafif etki. Ayarlar'dan açılıp kapatılabilir.
- **Cevap kartı**: fade-in animasyonu; `react-native Share.share` aracılığıyla işletim sistemi paylaşım sayfasını açan bir paylaş eylemi ve cevabı favorilere ekleyip çıkaran bir yıldız düğmesi içerir.
- **Geçmiş**:
  - Açılışta her Q&A (soru, cevap, zaman damgası, dil) otomatik olarak kaydedilir.
  - En yeni en üstte olmak üzere 50 öğeyle sınırlı bir yuvarlanan liste.
  - Bozuk girdiler okuma sırasında filtrelenir ve temiz liste yeniden yazılır.
  - Ayarlar'da bir onay modalıyla korunan "Geçmişi Temizle" eylemi.
- **Favoriler**:
  - Herhangi bir cevap, Ana Sayfa'daki cevap kartından veya bir geçmiş satırından yıldızlanabilir.
  - Ayrı bir `@orbacle_favorites` anahtarı altında, 100 öğeyle sınırlı olarak saklanır.
  - Geçmiş ekranında, yalnızca yıldızlanmış girdileri görmek için bir **Tümü / Favoriler** filtresi vardır.
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
  - Uygulama açıklaması, "yalnızca eğlence amaçlıdır" notu ve sürüm dizgesinin yer aldığı "Hakkında" bölümü.
- **Hata sınırı** ([src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)): tüm uygulamayı sarar ve yakalanan bir render hatası durumunda sıfırlama eylemi içeren bir "Something went wrong" ekranı gösterir.
- **Splash gecikmesi**: native splash, i18n sağlayıcısı `ready` durumuna geçene *ve* onboarding bayrağı çözülene kadar `expo-splash-screen` ile tutulur; böylece çeviri öncesi bir yanıp sönme önlenir.
- **Güvenli alan duyarlı düzen**: her ekran `useSafeAreaInsets` değerlerini dikkate alır; alt sekme çubuğu yüksekliği alt güvenli alan değeri kadar uzatılır.
- **Erişilebilirlik detayları**: küre `Pressable`'ında, favori yıldızlarında ve geçmiş filtre çiplerinde `accessibilityRole`/`accessibilityLabel`/`accessibilityState`; dekoratif parçacıklar ve sis katmanları `accessibilityElementsHidden` olarak işaretlenir; başlık/slogan/yardım metinlerinde `maxFontSizeMultiplier` üst sınırı; sekme ikonlarında `allowFontScaling={false}`.

## Proje Yapısı

```
orbacle/
├── App.tsx                         Kök bileşen: sağlayıcılar, splash geciktirme, onboarding kapısı, alt sekme navigatörü
├── app.json                        Expo uygulama manifestosu (ad, ikonlar, splash, android/ios yapılandırması, eklentiler)
├── eas.json                        EAS Build profilleri (development, preview, production) ve submit yapılandırması
├── babel.config.js                 babel-preset-expo + react-native-reanimated/plugin
├── tsconfig.json                   expo/tsconfig.base'i genişletir; strict mode açık
├── package.json                    Komut dosyaları ve bağımlılıklar
├── android/                        Üretilmiş native Android projesi (Gradle/EAS derleme çıktısı)
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
    │   ├── AnswerCard.tsx          Açılan cevabı gösteren fade-in kart + favori yıldızı
    │   ├── DailyBanner.tsx         Günün deterministik cevabını gösteren bant
    │   ├── PrimaryButton.tsx       Ghost / filled düğme varyantları (filled LinearGradient kullanır)
    │   ├── LanguageSwitcher.tsx    İki seçenekli EN/TR segmented control
    │   ├── ConfirmModal.tsx        Yıkıcı işlemleri onaylamak için kullanılan saydam modal
    │   └── ErrorBoundary.tsx       Sıfırlama eylemli class component hata sınırı
    ├── constants/
    │   ├── colors.ts               Palet (arka plan, primary/mor, gradyanlar, küre tonları vb.)
    │   ├── spacing.ts              Boşluk skalası ve borderRadius skalası
    │   └── typography.ts           Metin stili ön ayarları (hero, title, subtitle, body, caption, answer)
    ├── data/
    │   ├── answers.en.json         364 İngilizce cevap dizgesi
    │   └── answers.tr.json         364 Türkçe cevap dizgesi
    ├── hooks/
    │   └── useOrbAnimation.ts      Reanimated shared value'ları + açılış sekansı + temizleme referansları
    ├── i18n/
    │   ├── index.ts                I18nProvider, useI18n hook'u, ready bayrağı
    │   ├── en.json                 İngilizce UI dizgeleri
    │   └── tr.json                 Türkçe UI dizgeleri
    ├── screens/
    │   ├── OnboardingScreen.tsx    İlk açılış 3 sayfalı tanıtım pager'ı (atlanabilir)
    │   ├── HomeScreen.tsx          Başlık, slogan, küre, günün cevabı bandı, giriş → cevap → paylaş / favori / yeni soru
    │   ├── HistoryScreen.tsx       Saklanan Q&A girdilerinin FlatList'i; Tümü/Favoriler filtresi (boş durum dahil)
    │   └── SettingsScreen.tsx      Dil, titreşim anahtarı, geçmişi temizle, hakkında
    ├── storage/
    │   ├── keys.ts                 Tüm AsyncStorage anahtar dizgelerinin merkezi kaydı
    │   ├── historyStorage.ts       Geçmiş için AsyncStorage CRUD (doğrulama ve 50 öğe üst sınırı ile)
    │   ├── favoritesRepository.ts  Favoriler için AsyncStorage CRUD (doğrulama, 100 öğe üst sınırı, toggle yardımcısı)
    │   ├── dailyRepository.ts      Günün deterministik cevabını yerel tarihten hesaplar
    │   └── settingsStorage.ts      Dil, titreşim bayrağı ve onboarded bayrağı için AsyncStorage okuma/yazma
    ├── types/
    │   ├── history.ts              HistoryItem tipi
    │   ├── favorite.ts             FavoriteItem tipi
    │   └── language.ts             Language = 'en' | 'tr'
    └── utils/
        ├── formatDate.ts           Yerel ayara duyarlı tarih/saat biçimlendirici
        ├── getDeviceLanguage.ts    NativeModules üzerinden cihaz dilini algılar; 'en' | 'tr' ile eşler
        └── getRandomAnswer.ts      Rastgele seçici (son 10'da tekrar yok) + deterministik günlük seçici
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
- Expo ile uyumlu güncel bir araç zinciri (Expo SDK 54).
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

# Bağlı bir Android cihaz/emülatörde çalıştır
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

## Yapılandırma

Yapılandırma tamamen beyanname dosyaları üzerinden ifade edilir; kaynak ağacında çalışma zamanı `.env` kullanımı yoktur.

- [app.json](app.json):
  - `name: "Orbacle"`, `slug: "orbacle"`, `version: "1.1.0"`.
  - `orientation: portrait`, `userInterfaceStyle: dark`, `jsEngine: hermes`.
  - Splash: `./assets/splash.png`, `resizeMode: contain`, arka plan `#0a0a1a`.
  - Android: paket `com.demrivo.orbacle`, adaptive icon ön planı `./assets/adaptive-foreground.png`, adaptive arka plan `#0a0a1a`, `permissions: []`, `softwareKeyboardLayoutMode: resize`.
  - iOS: bundle id `com.demrivo.orbacle`, `supportsTablet: false`.
  - Eklentiler: `expo-asset`, `expo-splash-screen`.
  - EAS entegrasyonu için `extra.eas.projectId` tanımlıdır.
- [eas.json](eas.json): üç derleme profili (`development`, `preview`, `production`) ve boş bir `submit.production` yer tutucusu.
- [babel.config.js](babel.config.js): `babel-preset-expo` + `react-native-reanimated/plugin`.
- [tsconfig.json](tsconfig.json): `expo/tsconfig.base`'i genişletir; `strict: true`.
- **AsyncStorage anahtarları** — tüm anahtar dizgeleri [src/storage/keys.ts](src/storage/keys.ts) içinde merkezileştirilmiştir:
  - `@orbacle_language`: `"en" | "tr"`.
  - `@orbacle_haptics`: `"true" | "false"` (öntanımlı olarak açık; `"false"` dizgesi dışındaki her değer açık kabul edilir).
  - `@orbacle_onboarded`: onboarding tamamlanınca veya atlanınca `"true"` (yoksa/okunamazsa onboarding tekrar gösterilir; ancak okuma hatası, kullanıcıyı onboarding'de hapsetmemek için onboarded kabul edilir).
  - `@orbacle_history`: en fazla 50 `HistoryItem` girdisi içeren JSON dizisi.
  - `@orbacle_favorites`: en fazla 100 `FavoriteItem` girdisi içeren JSON dizisi.

## Mimari / Temel Bileşenler

[App.tsx](App.tsx) içindeki en üst düzey kompozisyon:

```
ErrorBoundary
└── SafeAreaProvider
    └── I18nProvider
        └── NavigationContainer
            ├── StatusBar (style="light")
            └── AppNavigator
                ├── OnboardingScreen        (yalnızca ilk açılış)
                └── Tab.Navigator (alt sekmeler: Home / History / Settings)
```

- **ErrorBoundary**: en dış katmanda class component hata sınırı; render hatası yakalandığında "Try again" sıfırlama düğmeli bir yedek ekran gösterir.
- **I18nProvider** ([src/i18n/index.ts](src/i18n/index.ts)):
  - AsyncStorage'dan saklı dili okur; yoksa cihaz dilini algılayıp yazar.
  - Context üzerinden `{ language, t, setLanguage, ready }` sunar.
  - `ready`, splash ekranının gizlenmesi için iki kapıdan biridir.
- **AppNavigator**:
  - Mount sırasında `@orbacle_onboarded` bayrağını çözer. `bootReady = i18n ready && onboarded !== null` — ikisi de çözülene kadar `null` render eder ve native splash görünür kalır.
  - Onboarding yapılmamışsa `OnboardingScreen` render edilir; tamamlanınca state set edilir ve bayrak saklanır.
  - Aksi halde alt sekme navigatörü render edilir. Sekme ikonları `allowFontScaling={false}` ile render edilen emoji glifleridir (`🔮`, `📜`, `⚙️`); aktif/pasif ton renkleri `colors.primaryLight` ve `colors.textMuted`'ten gelir; sekme yüksekliği `56 + altGüvenliAlan`; sekme çubuğu klavyede gizlenir.
- **OnboardingScreen** ([src/screens/OnboardingScreen.tsx](src/screens/OnboardingScreen.tsx)): 3 sayfalı yatay bir `ScrollView` pager; sayfa noktaları, bir Skip düğmesi ve bir İleri/Başla `PrimaryButton`'ı içerir. Başla'ya basıldığında veya Skip'e dokunulduğunda `onDone` çağrılır.
- **HomeScreen** ([src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx)):
  - Etkileşim durumunu tutar (`question`, `answer`, `answerId`, `isFavorited`, `isAnimating`, `emptyHint`, `keyboardOpen`).
  - Günün cevabını dil başına bir kez `useMemo(getDailyAnswer)` ile hesaplar.
  - Animasyon kontrolü için `useOrbAnimation`, cevap seçimi için `getRandomAnswer(language)` kullanır.
  - Açığa çıkan her cevabı `addHistoryItem` ile geçmişe yazar; aynı cevap `toggleFavorite` ile yıldızlanabilir.
  - Klavye açıkken küre bölümünü, klavye olaylarıyla sürülen bir Reanimated shared value aracılığıyla küçültüp yukarı kaydırır.
- **HistoryScreen** ([src/screens/HistoryScreen.tsx](src/screens/HistoryScreen.tsx)): odaklanıldığında (`useFocusEffect` ile) geçmişi ve favorileri paralel olarak tekrar okur; Tümü/Favoriler filtreli ve satır başına yıldız düğmeli bir `FlatList` render eder; ayrıca bir boş durum görünümü gösterir (boş-geçmiş ile boş-favoriler durumu için ayrı metinler).
- **SettingsScreen** ([src/screens/SettingsScreen.tsx](src/screens/SettingsScreen.tsx)): dil seçici, titreşim anahtarı, `ConfirmModal`'lı geçmişi temizle düğmesi ve statik hakkında/eğlence-notu/sürüm bloğu.
- **Orb** ([src/components/Orb.tsx](src/components/Orb.tsx)): sürüklenen `Mist` katmanları, kademeli `Sparkle` noktaları, eş merkezli aura katmanları, bir parıltı güçlendirici, bir dokunma patlaması katmanı, bir zemin sisi elipsi ve erişilebilir bir `Pressable` içine sarılmış merkezi bir `Image`'i (`assets/orb.webp`) birleştirir.
- **useOrbAnimation** ([src/hooks/useOrbAnimation.ts](src/hooks/useOrbAnimation.ts)):
  - Idle nabız, parıltı, patlama, küre ölçeği ve açılış durumu için Reanimated shared value'ları.
  - Sinüs ile interpolasyona uğrayan sonsuz bir idle nabız döngüsü.
  - `triggerReveal(onComplete)`, 1400 ms süren sıralı bir açılış sekansı çalıştırır ve ardından `onComplete`'i bir `setTimeout` ile çağırır; bu zamanlayıcının referansı sökümde veya sıfırlamada temizlenir.
  - `resetAnimation`, bekleyen zamanlayıcıyı temizler ve parıltı/açılış durumunu sönümler.
- **getRandomAnswer / getDeterministicAnswer** ([src/utils/getRandomAnswer.ts](src/utils/getRandomAnswer.ts)):
  - `getRandomAnswer`, modül-seviyesi bir `recentAnswers` listesi (son 10) tutar ve bu listede olmayan bir cevap seçene kadar yeniden çeker; küçük havuzlarda döngünün her zaman sonlanması için engelleme sayısını sınırlar.
  - `getDeterministicAnswer`, bir `dateKey:language` tohumunu sabit bir havuz indeksine hashler — günün cevabının temeli budur.
- **Depolama katmanı** ([src/storage/](src/storage/)): `AsyncStorage` üzerine ince bir repository katmanı. `keys.ts` her anahtar dizgesini tutar; `historyStorage.ts` ve `favoritesRepository.ts` kendi dizilerini doğrular, bozuk girdileri ayıklar, sınırlar ve saklar; `dailyRepository.ts` günün cevabını yerel takvim gününden türetir; `settingsStorage.ts` dil, titreşim ve onboarded bayrağını yönetir. Tüm okuma/yazmalar hata durumunda çökmek yerine sessizce zarif şekilde başarısız olur.
- **PrimaryButton / LanguageSwitcher / QuestionInput / AnswerCard / DailyBanner / ConfirmModal**: sunum bileşenleri — tek satırlık açıklamalar için Proje Yapısı tablosuna bakın.

## Veri Akışı / Çalışma Zamanı Akışı

Soğuk başlatma:

1. Modül yüklemesi sırasında (React mount olmadan önce) `SplashScreen.preventAutoHideAsync()` çağrılır ve native splash ekranı tutulur.
2. `App`, `ErrorBoundary → SafeAreaProvider → I18nProvider → NavigationContainer → AppNavigator` ağacını render eder.
3. `I18nProvider`'ın effect'i `@orbacle_language`'i okur (veya cihaz yerel ayarını algılayıp saklar) ve `ready`'i set eder. `AppNavigator`'ın effect'i `@orbacle_onboarded`'i okur.
4. `AppNavigator`, `!bootReady` iken (i18n hazır değil *veya* onboarded bayrağı çözülmemiş) `null` döndürür ve splash görünür kalır.
5. `bootReady` olduğunda: splash `SplashScreen.hideAsync()` ile gizlenir. Onboarding yapılmamışsa → `OnboardingScreen`; aksi halde → sekme navigatörü.

Onboarding (ilk açılış):

1. Kullanıcı 3 tanıtım sayfasında kaydırır veya Skip'e dokunur.
2. Başla'da (son sayfa) veya Skip'te `onDone` çalışır: `onboarded` state'i `true` yapılır ve `saveOnboarded()` bayrağı saklar — onboarding bir daha görünmez.

Soru etkileşimi (`HomeScreen` üzerinde):

1. Kullanıcı, `QuestionInput`'a bir soru yazar ve küreye dokunur.
2. Trimlenmiş soru boşsa → `enter_question` ipucunu göster, (açıksa) uyarı titreşimi tetikle, çık.
3. Değilse: klavyeyi kapat, `isAnimating = true` yap, önceki animasyonu/cevabı sıfırla.
4. `@orbacle_haptics`'i oku; açıksa orta şiddette bir titreşim gönder.
5. `triggerReveal` açılış animasyonunu başlatır ve geri çağrısını 1400 ms sonrasına planlar.
6. Tamamlandığında: `getRandomAnswer` ile tekrarsız rastgele bir cevap seç, (üretilmiş bir `answerId` ile) state'e yaz, (açıksa) başarı titreşimi gönder ve `addHistoryItem` AsyncStorage'a yeni bir `HistoryItem` yazar.
7. `HomeScreen`, yardım metni + giriş + günün cevabı bandını `AnswerCard` + eylemlerle değiştirir. Kartın yıldızı `toggleFavorite`'i çağırır; `share`, yerelleştirilmiş bir önekle `Share.share`'i kullanır; `ask_another`, cevap/soru state'ini temizler ve animasyonu sıfırlar.

Geçmiş / favoriler etkileşimi:

- Odaklanıldığında `HistoryScreen`, `getHistory()` ve `getFavorites()`'i paralel olarak okur; her ikisi de girdileri doğrular, bozuk olanları atar/yeniden yazar.
- Tümü/Favoriler filtresi görünür listeyi daraltır; her satır soru + tırnaklı cevap + yerel ayara göre biçimlendirilmiş tarih + bir yıldız düğmesi gösterir.
- Bir satırdan veya Ana Sayfa cevap kartından yıldızlama `toggleFavorite`'i çağırır; bu, öğeyi `@orbacle_favorites`'e ekler veya ondan çıkarır ve sonuç durumunu döndürür.
- Ayarlar'daki "Geçmişi Temizle", `ConfirmModal`'ı açar; onaylandığında `clearHistory()` geçmiş anahtarını siler (favoriler etkilenmez).

Günün cevabı:

- `getDailyAnswer(language)`, yerel tarihten bir `YYYY-MM-DD` anahtarı oluşturur ve onu `getDeterministicAnswer`'a verir. Sonuç aynı gün içinde tekrar açılışlarda sabittir ve yerel gece yarısında değişir. Saklama söz konusu değildir.

## Sınırlamalar / Mevcut Durum

Doğrudan koddan ve repo durumundan çıkarılan gözlemler:

- **Tasarım olarak tamamen çevrimdışı**: ağ çağrısı, uzak yapılandırma, analitik veya kilitlenme raporlama entegrasyonu yoktur.
- **Expo SDK 54**: derlemeler `expo run:*` veya EAS ile üretilir; repoda üretilmiş bir `android/` dizini bulunur.
- **Geçmiş üst sınırı**: 50 öğe olarak sabit kodlanmıştır; favoriler üst sınırı 100'dür. Taşma durumunda eski girdiler sessizce düşer.
- **Cevap havuzları**: dil başına 364 girdiyle sabittir ve JS bundle'ıyla birlikte paketlenir. Çalışma zamanında cevapları genişletme, güncelleme veya sunucudan çekme mekanizması yoktur.
- **Dil kapsamı**: tam olarak iki dil (`en`, `tr`). Türkçe dışındaki cihaz yerel ayarları İngilizceye geri düşer.
- **Tek satırlık giriş**: sorular 200 karakterle sınırlıdır ve birden fazla satıra yayılamaz.
- **Otomatik test yoktur**: repo herhangi bir test dosyası, test çalıştırıcı yapılandırması veya CI iş akışı içermez.
- **Web hedefi**: bir `web` komutu mevcuttur, ancak uygulama mobil için ayarlıdır (sekme çubuğu, güvenli alanlar, titreşim, native paylaşım sayfası). Web davranışı kodda açıkça doğrulanmamıştır.
- **Modül-seviyesi rastgele/günlük durum**: `getRandomAnswer`'ın `recentAnswers` listesi ve tekrarsızlık koruması modül kapsamında yaşar — tek bir uygulama oturumu boyunca paylaşılır ve süreç yeniden başlatıldığında sıfırlanır. Günün cevabı (saklanmadan) yeniden hesaplanır ve cihaz saatine bağlıdır.
- **Favoriler id tabanlıdır**: bir favori, geçmiş girdisinin `id`'siyle anahtarlanır. Ana Sayfa'dan yıldızlama, cevabın üretilmiş id'sini kullanır; bir geçmiş satırı ile favori durumu arasındaki bağ bu id üzerindendir.
