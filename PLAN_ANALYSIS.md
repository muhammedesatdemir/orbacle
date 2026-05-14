# Orbacle — Geri Bildirim Analizi ve Yol Haritası

> Bu doküman, ürün geri bildirimini mevcut kod tabanıyla karşılaştırarak hangi önerilerin **gerçekten gerekli**, hangilerinin **opsiyonel**, hangilerinin **gereksiz / erken** olduğunu önceliklendirir. Hiçbir kod değişikliği yapılmamıştır; bu bir karar şablonudur.

---

## 1. Mevcut Durum Özeti (Doğrulandı)

Geri bildirimde tarif edilen yapı, repo ile birebir örtüşüyor:

- **Stack:** Expo SDK 54 managed, RN 0.81, TS strict, Reanimated 4, AsyncStorage. ([package.json](package.json))
- **Ekranlar:** [HomeScreen.tsx](src/screens/HomeScreen.tsx), [HistoryScreen.tsx](src/screens/HistoryScreen.tsx), [SettingsScreen.tsx](src/screens/SettingsScreen.tsx) — 3 sekmeli yapı.
- **Cevap havuzu:** Statik JSON, **365 / 365** giriş (geri bildirimde "363" denmiş — küçük sapma). [answers.tr.json](src/data/answers.tr.json), [answers.en.json](src/data/answers.en.json).
- **Cevap algoritması:** Sadece "son cevap tekrar etmesin" kuralı. [getRandomAnswer.ts:17-22](src/utils/getRandomAnswer.ts#L17-L22) — `lastAnswer` modül-seviyesi tek değişken.
- **Geçmiş limiti:** 20, sabit. [historyStorage.ts:5](src/storage/historyStorage.ts#L5) — `MAX_ITEMS = 20`.
- **Storage:** Doğrudan AsyncStorage, ekranlardan çağrılıyor. Repository katmanı yok.
- **Storage anahtarları:** `@orbacle_history` ve [settingsStorage.ts](src/storage/settingsStorage.ts) içinde dağınık — merkezi `keys.ts` yok.

> Geri bildirimin teknik gözlemleri büyük ölçüde doğru. Tek küçük sapma: cevap sayısı 363 değil 365.

---

## 2. Önceliklendirme Çerçevesi

Her öneriyi 3 eksende değerlendirdim:

- **Etki:** Mağaza dönüşümü / retention / kullanıcı algısı üzerindeki etkisi.
- **Maliyet:** Geliştirme + içerik (cevap yazma) + test maliyeti.
- **Risk:** V1 zamanlamasını veya mevcut sade deneyimi bozma riski.

**Sonuç kategorileri:**

| Etiket | Anlam |
|---|---|
| **P0 — V1'den önce** | Mağaza yayını öncesi yapılmalı. Çıkmaz veya itibar riski. |
| **P1 — V1.1 (yayın sonrası 2-4 hafta)** | İlk gerçek kullanıcı geri bildirimine göre, retention için. |
| **P2 — V1.2+ (orta vade)** | Ürün derinleştikçe değerli, ama şimdi yapmak overengineering. |
| **SKIP / DİKKAT** | Önerilmiyor veya yanlış yorumlanmış. |

---

## 3. P0 — V1 Yayını Öncesi Yapılmalı

Bunlar mağazaya çıkmadan halledilmeli; aksi halde ya store reddi ya da ilk gün kötü algı riski var.

### P0.1 — Mağaza konumlandırması: "kehanet" değil "eğlenceli karar oyunu"
- **Neden gerekli:** Google Play, "fal / kehanet / geleceği görme" iddialarına hassas. Mevcut [README.tr.md](README.tr.md) ve [app.json](app.json) metinleri kontrol edilmeli.
- **Aksiyon:**
  - Store description'da "Magic 8-Ball tarzı eğlence uygulaması" çerçevesi.
  - Uygulama içinde **küçük bir "eğlence amaçlıdır" notu** (Settings ekranında alt bilgi olarak yeterli).
- **Maliyet:** Düşük (sadece metin).
- **Risk:** Yapılmazsa — mağaza politikası uyarısı veya kötü yorumlar.

### P0.2 — Cevap havuzunda dengesizlik kontrolü
- **Neden gerekli:** [getRandomAnswer.ts](src/utils/getRandomAnswer.ts) tamamen rastgele. Eğer 365 cevabın çoğu olumsuzsa, ilk denemede "bu uygulama hep negatif" algısı kalıcı olur.
- **Aksiyon:** İki dilin JSON'larını manuel olarak gözden geçir; olumlu/nötr/olumsuz/mistik dağılımının kabaca dengeli olduğundan emin ol. **Kod değişikliği gerekmez**, sadece içerik denetimi.
- **Maliyet:** ~1 saat içerik okuması.

### P0.3 — Cevap tekrar koruması: 1 değil ~10 cevap
- **Neden gerekli:** [getRandomAnswer.ts:10](src/utils/getRandomAnswer.ts#L10) sadece son **bir** cevabı tutuyor. Kullanıcı 5 kez sorduğunda 2-3 cevabın tekrar etme olasılığı yüksek — "bu uygulama tekrar ediyor" hissi ilk seansta oluşur.
- **Aksiyon:** `lastAnswer: string | null` yerine `recentAnswers: string[]` (son 10). Modül-seviyesi state olarak kalabilir, persist gerekmez.
- **Maliyet:** ~15 dakika. Test: aynı dilde art arda 10 çağrı, hiçbiri tekrarlamasın.
- **Risk yok.**

### P0.4 — Onboarding (3 ekran, kısa)
- **Neden gerekli:** İlk açılışta kullanıcı ne yapacağını bilmeli. Geri bildirimdeki öneri doğru: **3 ekran yeterli, daha fazlası dönüşümü düşürür.**
- **Aksiyon:** "Sorunu yaz → Küreye dokun → Cevabını gör" akışı. Skip butonu zorunlu. AsyncStorage'da `@orbacle_onboarded` flag.
- **Maliyet:** ~3-4 saat (görsel + i18n).

### P0.5 — Geçmiş ekranı boş durum metni
- **Neden gerekli:** Yeni kullanıcı Geçmiş sekmesine girdiğinde boş ekran kötü hissi verir. Düşük maliyetli high-impact.
- **Aksiyon:** [HistoryScreen.tsx](src/screens/HistoryScreen.tsx) içinde, liste boşsa: "Henüz Orbacle'a danışmadın. İlk sorunu sor." + i18n.
- **Maliyet:** ~30 dakika.

---

## 4. P1 — V1.1 (Yayın Sonrası 2-4 Hafta)

İlk gerçek kullanıcı verisi geldikten sonra, **retention'ı artırmak için** sırayla:

### P1.1 — Paylaşım özelliği (cevap kartı)
- **Neden:** Geri bildirimdeki en güçlü organik büyüme önerisi. WhatsApp/Instagram paylaşımı = ücretsiz pazarlama.
- **Aksiyon:** [AnswerCard.tsx](src/components/AnswerCard.tsx) içine Share butonu (`Share` API yeterli, görsel paylaşım için `react-native-view-shot` daha sonra).
- **Önce metin paylaşımı, sonra görsel.** Aşamalı yapılabilir.
- **Maliyet:** Metin için ~1 saat, görsel kart için +3-4 saat.

### P1.2 — Favoriler
- **Neden:** Geçmiş var ama kullanıcı beğendiği cevabı saklayamıyor. Bağlılık özelliği. Ucuz.
- **Aksiyon:** Yeni storage key `@orbacle_favorites`, [AnswerCard.tsx](src/components/AnswerCard.tsx) ve [HistoryScreen.tsx](src/screens/HistoryScreen.tsx) içine yıldız ikonu. Yeni ekran şart değil — Geçmiş'te filtre yeterli.
- **Maliyet:** ~3 saat.

### P1.3 — "Günün cevabı" (basit versiyon)
- **Neden:** Her gün uygulamayı açma sebebi. Push notification olmadan, sadece açıldığında gösterilen banner şeklinde başlasın.
- **Aksiyon:** Date'i seed olarak kullan, deterministik tek cevap üret. AsyncStorage'da bugünün tarihi + cevabı tut, gün değiştiğinde yenile.
- **Maliyet:** ~2-3 saat.
- **Dikkat:** Push notification eklemek **bu aşamada değil**. Kullanıcı izni isteme süreci ayrı bir karar.

### P1.4 — Geçmiş limiti seçeneği (20 / 50 / 100)
- **Neden:** Geri bildirim haklı — 20 düşük algılanıyor. Ama varsayılanı bozmadan opsiyon sunmak doğru çözüm.
- **Aksiyon:** [historyStorage.ts:5](src/storage/historyStorage.ts#L5) sabit yerine settings'ten oku. Settings'e select ekle.
- **Maliyet:** ~1 saat.
- **Alternatif (daha basit):** Sadece varsayılanı 50'ye çıkar, ayar gösterme. Daha az kullanıcı yükü.

### P1.5 — Storage repository katmanı
- **Neden:** Favoriler + günün cevabı + (sonraki) kategoriler eklendiğinde AsyncStorage çağrıları ekranlardan çağrılırsa karmaşık olur. **Şu an** P1 öncesi yapılırsa overengineering, ama P1 özellikleri eklenirken **tek seferde** yapılmalı.
- **Aksiyon:** `src/storage/keys.ts` (anahtar sabitleri) + `historyRepository.ts` / `favoritesRepository.ts` / `dailyRepository.ts`. MMKV'ye geçiş **şimdi gerek değil** — performans sorunu yok.
- **Maliyet:** ~2 saat refactor.

---

## 5. P2 — Orta Vade (V1.2+)

Bunlar değerli ama V1/V1.1'de yapılırsa **kapsam kayması**.

### P2.1 — Kategori sistemi (Aşk / Kariyer / Para / vs.)
- **Neden değerli:** Cevaplar kategorize edilirse mistik hissi artar.
- **Neden P0/P1 değil:**
  - **730 cevabı yeniden etiketlemek büyük içerik işi** (~1-2 gün).
  - Cevap modeli `string` → `Answer` objesine geçer; [answers.\*.json](src/data/) yapısı kırılır.
  - Kullanıcı kategori seçmek zorunda kalırsa **akış uzar** — geri bildirimin "hızlı sonuç" prensibiyle çelişir.
- **Aksiyon (yapılırsa):** Kategori **opsiyonel** olsun, varsayılan "Tümü". UI'a chip seçici eklensin.
- **Karar:** V1.1 sonrası kullanıcı verisi göstersin — gerçekten kategorize cevap isteniyorsa yapılsın.

### P2.2 — Cevap tonu seçimi (Mistik / Komik / Net / Şiirsel)
- **Neden P2:** Kategoriden bile büyük içerik işi. Her ton için ayrı havuz = 4×730 = 2920 cevap. **V1.2 öncesi gereksiz.**
- **Alternatif (ucuz):** Mevcut cevapları tek bir "ton" sayıp, sadece sonradan eklenen havuzları ton ile etiketle.

### P2.3 — Tema seçenekleri
- **Neden P2:** Mevcut mor/menekşe tema güçlü ([colors.ts](src/constants/colors.ts)). Ek tema = ek tasarım + test maliyeti, **retention etkisi belirsiz**.
- **Karar:** Sadece premium model planlanırsa yapılsın. Aksi halde **SKIP**.

### P2.4 — Streak / günlük seri
- **Neden P2:** Ancak "Günün cevabı" (P1.3) belirli bir adoption gösterirse anlamlı. Veri olmadan koymak boş özellik.
- **Aksiyon (yapılırsa):** P1.3'ün üzerine ekle, ayrı altyapı kurma.

### P2.5 — Android widget
- **Neden P2:** Expo managed workflow'da widget desteği sınırlı; **bare workflow'a geçmek gerekebilir**. Bu, V1'in tüm Expo avantajlarını (kolay build, OTA) feda etmek demek. **Kazanç oranına değmez.**
- **Karar:** Uygulama 10K+ DAU'ya ulaşmadan dokunma.

### P2.6 — İş mantığı testleri
- **Neden P2:** Geri bildirim haklı, listelenen 7 test mantıklı. Ama V1'de **test altyapısı yok** ([package.json](package.json) — Jest yok).
- **Aksiyon (P1.5 storage refactor sırasında):** Sadece `getRandomAnswer` ve `historyStorage` için unit test. UI testi **şimdi değil**.
- **Maliyet:** Test setup ~2 saat + testler ~2 saat.

---

## 6. SKIP / Dikkat — Yapılmamalı veya Yanlış Yorumlanmış

### SKIP — Cevap modelinin şimdiden genişletilmesi
Geri bildirimdeki `Answer` tipi (`category`, `polarity`, `tone`) güzel görünüyor ama **şu an eklemek**:
- 730 cevabı yeniden etiketlemeyi gerektirir.
- JSON parse, migration, settings UI, filtre mantığı — hepsi V1'i şişirir.
- **Premature abstraction.** Önce P1.1-P1.4 sonuçları görülsün.

### DİKKAT — "Geçmiş limitini gizle" önerisi
Geri bildirimdeki "limit kullanıcıya gösterilmesin" alternatifi **daha kötü**. Kullanıcı eski sorusunu bulamayınca güveni sarsılır. **P1.4'teki opsiyon-sunma yaklaşımı doğru.**

### DİKKAT — "Geleceği görme" iddialı dil
Geri bildirim bunu zaten uyarıyor. **README, store listing, onboarding metinleri** baştan "eğlence" çerçevesinde yazılmalı. Sonradan değiştirmek mağaza onayını yeniden tetikleyebilir.

### SKIP — Şu an MMKV / SQLite migration
[historyStorage.ts](src/storage/historyStorage.ts) AsyncStorage ile sorunsuz çalışıyor. 20 (veya 100) kayıt için MMKV gereksiz. **P2'de bile gereksiz** — uygulama veri-ağır değil.

---

## 7. Önerilen Çalışma Sırası (Özet Tablo)

| Sıra | Görev | P | Tahmini Süre | Bağımlılık |
|---|---|---|---|---|
| 1 | Mağaza metinlerini "eğlence" çerçevesine çek | P0.1 | 1 sa | — |
| 2 | Cevap havuzu polarite denetimi | P0.2 | 1 sa | — |
| 3 | `recentAnswers` (son 10) | P0.3 | 15 dk | — |
| 4 | Geçmiş boş durum metni | P0.5 | 30 dk | — |
| 5 | Onboarding (3 ekran) | P0.4 | 3-4 sa | — |
| **— V1 YAYINI —** | | | | |
| 6 | Storage repository refactor | P1.5 | 2 sa | V1 sonrası |
| 7 | Paylaşım (önce metin) | P1.1 | 1 sa | — |
| 8 | Favoriler | P1.2 | 3 sa | P1.5 |
| 9 | Günün cevabı | P1.3 | 2-3 sa | P1.5 |
| 10 | Geçmiş limit ayarı | P1.4 | 1 sa | P1.5 |
| 11 | Paylaşım görseli (view-shot) | P1.1 | 3-4 sa | P1.1 metin |
| **— V1.1 YAYINI —** | | | | |
| 12+ | Kategori, ton, streak, widget | P2 | Veri sonrası karar | — |

---

## 8. Karar Notları

1. **V1 yayını ertelenmemeli.** P0 maddelerinin toplamı **~6 saatlik iş** — bir günde tamamlanabilir.
2. **Kategori sistemi P0 değil.** Geri bildirim bunu öne çıkarsa da, içerik maliyeti büyük ve mevcut akışı uzatır. Önce yayın, sonra veri.
3. **Push notification yok.** Hiçbir aşamada otomatik bildirim önerilmedi — izin isteme süreci dönüşümü düşürür ve mağaza onayı için ek dikkat gerektirir.
4. **Tema / widget / streak — veri bekleyen kararlar.** Hiçbir feature, kullanıcı verisi olmadan eklenmemeli; aksi halde kullanılmayan kod birikir.
5. **Test altyapısı P1.5 ile birlikte.** Şu an kurmak, refactor sırasında zaten yeniden yazılacak testlere zaman harcamak demek.
