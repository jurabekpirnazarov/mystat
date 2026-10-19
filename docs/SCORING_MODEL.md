# Hududlar salohiyati: scoring modeli (`/regions` xaritasi uchun)

> **Sana:** 2026-10-15
> **Maqsad:** xaritadagi mavjud ko'rsatkichlar asosida viloyat va tumanlarni salohiyati bo'yicha solishtirish, har hududning kuchli va zaif tomonini ko'rsatish va "bu hudud nimaga e'tibor bersa yaxshi" degan taxminiy tavsiya berish.
> **Asos:** `SIAT_KARTA_TAHLIL.md` (KR-01..KR-14). Bu fayl uning davomi: vazifalar **KR-15..KR-22** (scoring) va **KR-23..KR-28** (prognoz, 10–11-bo'limlar).
> **Qanday ishlatiladi:** Claude Code'ga "SCORING_MODEL.md dagi `KR-16` ni bajar" deyish yetarli. Tartib 8-bo'limda.
> **Muhim:** natija **rasmiy baho emas**, ochiq statistikaga asoslangan taxminiy tahlil. UI'da shu izoh doim ko'rinadi.

---

## 1. Model nimani beradi

Har hudud (viloyat yoki tuman) uchun, tanlangan yil (`p`) bo'yicha:

1. **Salohiyat indeksi** 0–100 va reyting ("14 dan 4-o'rin", ishonch oralig'i bilan "3–6").
2. **Ustunlar bo'yicha baho** (5 ta ustun, radar diagramma): qaysi sohada oldinda, qaysida orqada.
3. **Kuchli / zaif tomonlar:** tengdoshlar orasida yuqori 25% va quyi 25% dagi ko'rsatkichlar.
4. **Ixtisoslashuv:** viloyat sanoati va investitsiyasi qaysi tarmoqlarda respublikadan kuchliroq (lokalizatsiya koeffitsienti, LQ).
5. **Tavsiya etilgan yo'nalishlar** (ko'pi bilan 3 ta), har birida "nega" degan izoh va unga asos bo'lgan raqamlar.
6. **O'xshash hududlar:** ko'rsatkichlari eng yaqin 3 hudud va ular nimada oldinda (bu "boshqa hududlar bilan imkoniyatlarni solishtirish" qismi).
7. **Ma'lumot to'liqligi:** qaysi ko'rsatkich yetishmaydi va baho qanchalik ishonchli.

Hamma narsa deterministik qoidalar bilan hisoblanadi (LLM shart emas), shuning uchun natijani tekshirish va izohlash oson.

---

## 2. Ko'rsatkichlar va ustunlar

Faqat xaritada allaqachon bor yoki KR-01 sinxronlashiga oson qo'shiladigan SIAT ko'rsatkichlari ishlatiladi. "Daraja" ustuni: **T** = tuman darajasida bor, **V** = faqat viloyat darajasida.

| Ustun | Ko'rsatkich | Manba | Daraja | Yo'nalish | Transformatsiya | Rol |
|---|---|---|---|---|---|---|
| **A. Iqtisodiy quvvat** | Aholi jon boshiga hududiy YaIM | 660 | V | + | log | baho |
| | Hududiy YaIM o'sish sur'ati (3 yil o'rtachasi) | 658 | V | + | yo'q | baho |
| | Norasmiy iqtisodiyot ulushi | 3843–3848 | V | — | — | faqat kontekst |
| **B. Mehnat bozori** | O'rtacha oylik ish haqi | 500 | T | + | log | baho |
| | Real ish haqi o'sishi (3 yil o'rtachasi) | hosila (500 + INI) | T | + | yo'q | baho |
| | Ishsizlik darajasi | 1875 | T | **−** | yo'q | baho |
| **C. Demografik salohiyat** | Doimiy aholi (bozor hajmi) | 246 | T | + | log | baho |
| | Aholi o'sishi % (3 yil o'rtachasi) | hosila (246) | T | + | yo'q | baho |
| | Aholi zichligi | hosila (246 / maydon) | T | + | log | baho |
| | Qishloq aholisi ulushi | hosila (247/246) | T | — | — | faqat kontekst va qoidalar |
| | Gender nisbati | hosila (245) | T | — | — | faqat kontekst |
| **D. Sanoat va investitsiya** | Aholi jon boshiga sanoat mahsuloti | Σ 4604–4617 / 246 | V | + | log | baho |
| | Aholi jon boshiga investitsiya | Σ 2599–2612 / 246 | V | + | log | baho |
| | Investitsiya o'sishi (3 yil o'rtachasi, real emas) | Σ 2599–2612 | V | + | yo'q | baho |
| | Dehqon xo'jaliklari mahsuloti o'sishi | 1460 | V | + | yo'q | faqat qoidalar (R1) |
| **E. Ijtimoiy infratuzilma** | 10 000 aholiga maktabgacha ta'lim tashkilotlari | 1409 / 246 | V | + | yo'q | baho |

Izohlar:
- **Qishloq ulushi va gender nisbati bahoga kirmaydi**, chunki "yuqori" yoki "past" bo'lishi o'z-o'zidan yaxshi yoki yomon emas. Ular tavsiya qoidalarida (5-bo'lim) va kartochkada kontekst sifatida ishlatiladi.
- **Aholi zichligi** bahoda "+" (bozor va xizmatlar uchun qulaylik). Yer resursi masalasi qoidalarda alohida hisobga olinadi (R1).
- **log** transformatsiya: ish haqi, YaIM, aholi, zichlik kabi taqsimoti qiyshiq ko'rsatkichlar uchun. Aks holda Toshkent shahri shkalani egallab, qolgan hududlar bir xil ko'rinadi.
- **3 yil o'rtachasi** o'sish ko'rsatkichlarini bir yillik sakrashlardan himoya qiladi.
- Investitsiya hajmi SIAT'da nominal. Real qilish uchun IIN deflyatori kerak; birinchi versiyada nominal o'sish ishlatiladi va metodologiyada shunday yoziladi.
- 2818 (erkaklar ishsizligi) va boshqa yangi ko'rsatkichlar keyin `scoring.yaml` orqali qo'shiladi, kod o'zgarmaydi (KR-15).

### 2.1. Tuman darajasi

Tuman darajasida faqat **B** va **C** ustunlari bor. Viloyat ko'rsatkichlarini (A, D, E) tumanga "meros" qilib bahoga qo'shish **taqiqlanadi**: bir viloyatdagi barcha tumanlar bir xil qiymat oladi va reyting soxta ko'rinadi. Shuning uchun:
- Tuman indeksi rasman "**Mehnat va demografiya indeksi**" deb ataladi (UI'da shunday yoziladi).
- Viloyat ustunlari tuman kartochkasida "Viloyat konteksti" bloki sifatida alohida ko'rsatiladi.

---

## 3. Normalizatsiya va hisoblash

### 3.1. Tengdoshlar guruhi

- Viloyatlar: 14 hudud (Qoraqalpog'iston, 12 viloyat, Toshkent shahri). Respublika qatori (`1700`) guruhga kirmaydi (N5), u "respublika o'rtachasi" chizig'i sifatida ishlatiladi.
- Tumanlar: respublikadagi barcha tuman va shaharlar (≈206) bitta guruh. Kartochkada qo'shimcha "viloyat ichida N dan k-o'rin" ham ko'rsatiladi.
- Shahar va tumanlarni (SOATO `4xx` va `2xx`) alohida guruh qilish varianti `scoring.yaml` da bayroq bilan (`split_city_district: false` standart). Birinchi versiyada bitta guruh, chunki foydalanuvchi ularni bir xaritada ko'radi.

### 3.2. Formula

Har ko'rsatkich `i`, hudud `r`, yil `t` uchun:

```
x  = qiymat(r, i, t)                      # 3.4 dagi "eng yaqin yil" qoidasi bilan
x' = log(x)  agar transform == log, aks holda x
z  = (x' − mean_peer(x')) / sd_peer(x')   # faqat qiymati bor hududlar bo'yicha
z  = −z  agar yo'nalish == "−"
z  = clip(z, −2.5, +2.5)                   # Toshkent shahri kabi chetdagi qiymatlarni cheklash
s  = clip(50 + 20·z, 0, 100)               # ko'rsatkich bahosi, 50 = guruh o'rtachasi
```

```
ustun_bahosi(r, P)  = Σ_{i∈P, bor} w_i · s_i  /  Σ_{i∈P, bor} w_i
indeks(r)           = Σ_P W_P · ustun_bahosi(r, P)  /  Σ_{P, bor} W_P
```

- Ustun ichidagi vazn `w_i` standart bo'yicha teng.
- Bahoni "50 = o'rtacha" ko'rinishida berish foydalanuvchiga tushunarli: 70 dan yuqori — kuchli, 30 dan past — zaif.
- Percentil (P, 0–100) ham saqlanadi: kuchli/zaif tomonlar va qoidalar percentil bo'yicha ishlaydi, chunki u chetdagi qiymatlarga sezgir emas.
- Vaqt slayderi uchun **mean va sd tanlangan yilning o'zida** hisoblanadi (nisbiy o'rin). Indeks shuning uchun "shu yili boshqalarga nisbatan qayerda" degan ma'noni beradi, mutlaq o'sishni emas. Bu legendada yoziladi.

### 3.3. Vaznlar va presetlar

| Ustun | Muvozanatli (standart) | Investor nigohi | Ijtimoiy nigoh | Tuman (B+C) |
|---|---|---|---|---|
| A. Iqtisodiy quvvat | 25 | 30 | 15 | — |
| B. Mehnat bozori | 25 | 20 | 30 | 55 |
| C. Demografik salohiyat | 15 | 15 | 20 | 45 |
| D. Sanoat va investitsiya | 25 | 30 | 10 | — |
| E. Ijtimoiy infratuzilma | 10 | 5 | 25 | — |

- Foydalanuvchi presetni tanlaydi yoki "Sozlash" panelida slayderlar bilan o'z vaznini beradi. Vaznlar URL'da: `&sw=25,25,15,25,10` (yoki `&sp=investor`), havola ulashilganda bir xil natija chiqadi.
- Vaznlar ekspert bahosi, statistik "to'g'ri" vazn yo'q. Shuning uchun 3.5 dagi barqarorlik tekshiruvi majburiy.

### 3.4. Yil va kechikish

- Ko'rsatkichlar har xil yilgacha boradi (246 → 2026, 500 → 2025, 1409 → 2024). Tanlangan yil `p` uchun har ko'rsatkichning `p` yoki undan oldingi eng yaqin yili olinadi, **ko'pi bilan 1 yil kechikish**. Kechikkan qiymat kartochkada "2024 ma'lumoti" deb belgilanadi.
- `is_preliminary` (N9) qiymatlar ishlatiladi, lekin kartochkada "dastlabki" belgisi bilan.

### 3.5. Ishonchlilik

1. **To'liqlik** `coverage(r) = Σ (mavjud ko'rsatkichlar vazni) / Σ (barcha vazn)`.
   - `coverage < 0.6` → indeks ko'rsatilmaydi, xaritada shtrixli kulrang, "Ma'lumot yetarli emas".
   - `0.6 ≤ coverage < 0.85` → indeks ko'rsatiladi, "qisman ma'lumot" belgisi bilan.
2. **Reyting oralig'i:** vaznlar 500 marta tasodifan ×U(0.8, 1.2) ga o'zgartiriladi (seed qat'iy), har safar reyting hisoblanadi; 10- va 90-percentil "3–6-o'rin" ko'rinishida beriladi. Oraliq keng bo'lsa (≥ 4 o'rin) "o'rin vaznlarga sezgir" degan izoh chiqadi.

---

## 4. Ma'lumot bo'shliqlari: yangi tumanlar va boshqalar

N2 va N8 (SIAT_KARTA_TAHLIL.md) bilan bog'liq holatlar:

| Holat | Qoida |
|---|---|
| Yangi tuman (Ko'kdala, Bo'zatov, Taxiatosh, Bandixon, Nurafshon, G'ozg'on, Shahrisabz sh. va h.k.), tuzilgandan oldingi yillar `missing` | Tuzilgan yildan oldingi yil uchun indeks hisoblanmaydi, xaritada "Hali tuzilmagan". Ota tuman qiymati bilan to'ldirilmaydi. |
| Yangi tumanda o'sish ko'rsatkichi uchun 3 yil yo'q | 2 yil bo'lsa 1 yillik o'sish, 1 yil bo'lsa o'sish `missing`; vazn shu ustunning qolgan ko'rsatkichlariga o'tadi. Kartochkada "o'sish: ma'lumot qisqa". |
| Ota tuman bo'lingan yil (yangi tuman ajralib chiqqan yil) | Ota tumanning bo'lingan yilgacha va keyingi o'sishi solishtirilmaydi: o'sish ko'rsatkichi shu yil uchun `missing` (aks holda aholi "−40%" bo'lib ko'rinadi). Bo'linish yili `Territory.created_year` dan olinadi. |
| Toshkent shahri qishloq ulushi va dehqon xo'jaligi 0.0 | KR-03 qoidasi bilan `missing`; R1 qoidasi shahar uchun ishlamaydi. |
| Ko'rsatkich bir yilda butunlay yo'q (masalan 500 → 2017 dan oldin) | O'sha yil uchun ustun vazni qayta taqsimlanadi; `coverage` pasayadi va ko'rsatiladi. |
| Tuman maydoni GeoJSON'da yo'q | Zichlik `missing` (KR-04 tekshiruv skripti buni oldindan ushlashi kerak). |

**Imputatsiya (o'rtacha bilan to'ldirish) qilinmaydi.** Yetishmagan qiymat hududni sun'iy ravishda "o'rtacha" qilib ko'rsatadi, bu esa noto'g'ri tavsiyaga olib keladi. Buning o'rniga vazn qayta taqsimlanadi va to'liqlik ochiq ko'rsatiladi.

---

## 5. Kuchli tomonlar va tavsiya etilgan yo'nalishlar

### 5.1. Kuchli / zaif tomonlar

- Ko'rsatkich percentili ≥ 75 → **kuchli**, ≤ 25 → **zaif** (yo'nalish hisobga olingan: ishsizlik past bo'lsa kuchli).
- Kartochkada ko'pi bilan 3 kuchli va 3 zaif, percentil chetga qanchalik yaqinligi bo'yicha tartiblanadi. Har biri: "Ish haqi: 14 dan 3-o'rin, respublika o'rtachasidan +12%".

### 5.2. Tarmoq ixtisoslashuvi (faqat viloyat)

Sanoat mahsuloti (4604–4617) va investitsiya (2599–2612) tarmoqlar kesimida, so'nggi 3 yil yig'indisi bo'yicha:

```
ulush(r, s)   = X(r, s) / Σ_s X(r, s)
LQ(r, s)      = ulush(r, s) / ulush(UZ, s)       # UZ = 14 hudud yig'indisi
o'sish(r, s)  = 3 yillik o'rtacha nominal o'sish
```

| Shart | Belgi | Kartochkadagi matn (namuna) |
|---|---|---|
| LQ ≥ 1.25 va o'sish(r,s) ≥ o'sish(UZ,s) | **Yetakchi tarmoq** | "Qurilish materiallari: respublikadan 1.8 barobar ko'p ixtisoslashgan va tezroq o'smoqda. Eksport va klasterni kengaytirish." |
| LQ ≥ 1.25 va o'sish(r,s) < o'sish(UZ,s) | **Sustlashayotgan ixtisos** | "...an'anaviy tarmoq, lekin respublikadan sekin o'smoqda. Modernizatsiya kerak." |
| 0.8 ≤ LQ < 1.25 va o'sish(r,s) ≥ o'sish(UZ,s) + 5 p.p. | **O'sayotgan tarmoq** | "...hali ixtisos emas, lekin tez o'smoqda." |
| investitsiya LQ ≥ 1.25 va sanoat LQ < 1 | **Investitsiya kelmoqda, natija hali yo'q** | "...investitsiya ulushi yuqori, ishlab chiqarish hali ortda." |

- Ulushi 1% dan kichik tarmoqlar (shovqin) e'tiborga olinmaydi.
- Tarmoq nomlari SIAT klassifikatoridan (IFUT) 4 tilda olinadi; jadval KR-02 dagi "virtual ko'rsatkich" yig'ilishidan keladi.
- Tuman kartochkasida "Viloyatda yetakchi tarmoqlar" deb, ota viloyatning ro'yxati ko'rsatiladi (tumanga tegishli deb aytilmaydi).

### 5.3. Tavsiya qoidalari (arxetiplar)

Qoidalar `scoring.yaml` da saqlanadi, admin tahrirlay oladi. Shartlar tengdoshlar orasidagi **percentil** (P) bo'yicha.

| Kod | Yo'nalish | Shart | Daraja |
|---|---|---|---|
| R1 | Agrosanoat: qayta ishlash, sovutish omborlari, issiqxonalar | qishloq ulushi P ≥ 65 va zichlik P ≤ 50 va (viloyat) dehqon xo'jaligi o'sishi P ≥ 50 | V, T (T da 1460 o'rniga viloyat qiymati, "viloyat ma'lumoti" deb) |
| R2 | Mehnat sig'imli sanoat (to'qimachilik, yig'uv), kasb-hunar markazlari | ishsizlik P ≥ 65 va aholi o'sishi P ≥ 50 va ish haqi P ≤ 40 | V, T |
| R3 | Xizmatlar, savdo, IT/BPO, logistika markazi | zichlik P ≥ 70 va aholi P ≥ 60 va ish haqi P ≥ 50 | V, T |
| R4 | Yuqori qo'shilgan qiymatli sanoat, klaster va eksport | YaIM jon boshiga P ≥ 65 va sanoat jon boshiga P ≥ 65 | V |
| R5 | Investitsiya jalb qilish (sanoat zonalari, imtiyozlar) | investitsiya jon boshiga P ≤ 35 va ishsizlik P ≥ 50 | V |
| R6 | Ijtimoiy infratuzilma: maktabgacha ta'lim va maktab quvvati | MTT 10 000 aholiga P ≤ 30 va aholi o'sishi P ≥ 60 | V |
| R7 | Real daromadni himoya qilish (narx monitoringi, ish haqi siyosati) | real ish haqi o'sishi ketma-ket 2 yil < 0 | V, T |
| R8 | Aholi kamayishi: yangi ish o'rinlari, migratsiyani ushlab qolish | aholi o'sishi P ≤ 20 va qishloq ulushi P ≥ 50 | V, T |
| R9 | Tarmoq bo'yicha (5.2 dan) | "Yetakchi" yoki "O'sayotgan" tarmoq bor | V |

**Tanlash:**
1. Barcha qoidalar tekshiriladi. Har mos kelgan qoidaga **kuch** beriladi: shartlardagi percentillarning chegaradan qancha uzoqligi o'rtachasi (0–1).
2. Kuchi bo'yicha tartiblanadi, ko'pi bilan 3 ta tavsiya. R9 dan ko'pi bilan 1 ta.
3. Hech qaysi qoida mos kelmasa: "Aniq ixtisos ko'rinmaydi, ko'rsatkichlari respublika o'rtachasiga yaqin" va eng zaif ustun bo'yicha bitta umumiy tavsiya.
4. Har tavsiya matni shablondan (4 tilda), qiymatlar bilan: "Ishsizlik 7,9% (14 dan 12-o'rin), aholi yiliga 2,1% o'smoqda, ish haqi o'rtachadan 18% past → mehnat sig'imli ishlab chiqarish uchun ishchi kuchi zaxirasi bor."
5. Har tavsiya ostida "Bu tavsiya qanday chiqdi?" (shart va qiymatlar jadvali). Kuchsiz ma'lumotga (coverage < 0.85) asoslangan tavsiya "taxminiy" belgisi bilan.

Keyinchalik (ixtiyoriy, P2): shu tuzilgan natijani "Stat AI" (ISH_REJASI U-11) ga berib, oddiy tilda xulosa yozdirish mumkin. Lekin raqam va tavsiya qoidadan keladi, LLM faqat matnni silliqlaydi.

### 5.4. O'xshash hududlar va solishtirish

- Har hudud uchun bahoga kiradigan ko'rsatkichlarning `z` vektori olinadi (yetishmaganlar chiqarib tashlanadi, kamida 5 ta umumiy ko'rsatkich bo'lsa). Evklid masofasi bo'yicha eng yaqin **3 hudud**.
- Kartochkada: "Jizzaxga eng o'xshash: X, Y, Z." Har biri uchun "ular nimada oldinda" (o'xshash hududning bahosi ≥ 10 ball yuqori bo'lgan ko'rsatkichlar). Bu "o'xshash sharoitdagi hudud nimaga erishgan bo'lsa, shunga intilish mumkin" degan solishtirishni beradi.
- KR-11 (ikki hududni taqqoslash) rejimida: ikkala hudud radar diagrammasi ustma-ust va ustunlar farqi jadvali.

---

## 6. API

Mavjud KR-05 yo'llari yonida (`/api/common/map/`):

```
GET /api/common/map/score/config/
    → { version, pillars:[{key,name_*,indicators:[...]}], presets:{balanced:[...], investor:[...], social:[...]}, rules:[{code,name_*}] }

GET /api/common/map/score/?level=region|district&parent=1708&period=2025&preset=balanced
GET /api/common/map/score/?level=region&period=2025&weights=25,25,15,25,10
    → { period, preset, weights, national:{pillars:{A:50,...}},
        items:[{ soato, score, rank, rank_range:[3,6], rank_in_parent, pillars:{A:..,B:..}, coverage, partial, missing:true|false }] }

GET /api/common/map/score/<soato>/?period=2025&preset=balanced
    → { soato, level, score, rank, rank_range, coverage, partial,
        pillars:[{key, score, indicators:[{id, name, value, unit, year, lagged, preliminary, s, percentile, rank}]}],
        strengths:[...], weaknesses:[...],
        sectors:[{code, name, lq, growth, national_growth, label}],     # faqat viloyat
        recommendations:[{rule, strength, title, text, evidence:[{indicator, value, percentile}], tentative}],
        peers:[{soato, name, distance, ahead_in:[indicator...]}],
        parent_context:{...},                                          # faqat tuman
        gaps:[{indicator, reason}], methodology_version }
```

- `period` yo'q bo'lsa — eng so'nggi yil, unda kamida 60% to'liqlik bor.
- Standart presetlar (3 ta × barcha yillar × 2 daraja) `TerritoryScore` jadvaliga oldindan hisoblanadi; `weights=` bilan kelgan so'rov joyida hisoblanadi (≈220 qator, millisekundlar).
- Kesh: KR-05 bilan bir xil, `sync_siat` tugagach tozalanadi va qayta hisoblanadi.

---

## 7. Xaritadagi UI

Hozirgi URL: `/regions?ind=500&ind2=d-density&p=2025&t=1708`. Qo'shiladi:

1. **Ko'rsatkich ro'yxatida "Salohiyat" guruhi** (hosila ko'rsatkichlar `d-*` kabi psevdo-ko'rsatkich):
   - `ind=score` — umumiy indeks; `ind=score-A` … `score-E` — ustunlar.
   - Rang shkalasi: 0–100 qat'iy (yillar bo'yicha bir xil, KR-08 talabi), 50 da markazlashgan ikki tomonlama palitra, "Ma'lumot yetarli emas" alohida shtrix.
   - Vaqt slayderi, drill-down (viloyat → tuman, tumanda "Mehnat va demografiya indeksi" nomi bilan) va `ind2` bivariate rejimi (masalan `ind=score&ind2=500`) ishlaydi.
2. **Hudud kartochkasida (KR-09) yangi "Salohiyat" yorlig'i:**
   - Katta raqam (masalan 62/100), "14 dan 4-o'rin (3–6)", to'liqlik belgisi.
   - Radar: 5 ustun, hudud vs respublika o'rtachasi (50), solishtirish rejimida ikkinchi hudud ham.
   - "Kuchli tomonlar" va "Zaif tomonlar" chiplari.
   - "Tavsiya etilgan yo'nalishlar" (ko'pi bilan 3), har birida "Nega?" ochiladigan blok.
   - "Ixtisoslashgan tarmoqlar" (viloyat; tumanda "Viloyatda").
   - "O'xshash hududlar" — bosilsa o'sha hududga o'tadi yoki solishtirishga qo'shiladi.
   - Pastida doimiy izoh: "Taxminiy tahlil, rasmiy baho emas. Manba: SIAT, Milliy statistika qo'mitasi, CC BY 4.0. Metodologiya →".
3. **"Vaznlarni sozlash" paneli:** preset tanlovi va 5 ta slayder; o'zgarganda xarita va reyting yangilanadi, URL'ga `sp=` yoki `sw=` yoziladi.
4. **Reyting jadvali** (xarita yonida yig'iladigan): hudud, indeks, ustunlar, o'rin oralig'i; ustun bo'yicha saralash; CSV/XLSX eksport (KR-12 formati).
5. **Metodologiya sahifasi/modal:** 2–4 bo'limlarning qisqa varianti, ko'rsatkichlar ro'yxati havolalari bilan (`https://siat.stat.uz/data/{ID}/`).

Kartochka maketi (raqamlar faqat namuna, haqiqiy qiymat emas):

```
Jizzax viloyati · 2025                       [Muvozanatli ▾]
Salohiyat indeksi  XX/100   14 dan X-o'rin (X–X)   ● to'liq
[radar: A B C D E  vs respublika]
Kuchli:  Aholi o'sishi · Investitsiya o'sishi
Zaif:    Ish haqi · MTT bilan qamrov
Tavsiya etilgan yo'nalishlar
 1. Mehnat sig'imli sanoat ......................... [Nega?]
 2. Agrosanoat va qayta ishlash .................... [Nega?]
 3. Yetakchi tarmoq: ... ........................... [Nega?]
O'xshash hududlar: ... · ... · ...
Taxminiy tahlil, rasmiy baho emas · Manba: SIAT · Metodologiya
```

---

## 8. Vazifalar (KR-15..KR-22)

Ustuvorlik ISH_REJASI.md dagi kabi. Old shartlar: KR-01, KR-03, KR-05, KR-10 (hosila ko'rsatkichlar) tayyor; KR-09 kartochkasi bor.

### KR-15 · Scoring konfiguratsiyasi va ko'rsatkichlar ro'yxati · **P1**

1. `scoring.yaml` (backend, versiyalangan): ustunlar, ko'rsatkichlar (SIAT ID yoki hosila kaliti, yo'nalish, transformatsiya, rol, vazn), presetlar, 5.3 qoidalari, chegaralar (0.6/0.85, ±2.5, LQ 1.25/0.8).
2. Tekshiruv: 2-bo'limdagi barcha SIAT ID'lari (658, 660, 1409, 1460, 2599–2612, 4604–4617, 3843–3848) KR-01 sinxronlash ro'yxatida borligi; yo'q bo'lsa qo'shish. 2599–2612 va 4604–4617 KR-02 "virtual ko'rsatkich"iga yig'ilgan bo'lishi kerak.
3. Hosila ko'rsatkichlar qo'shish: jon boshiga sanoat va investitsiya, 10 000 aholiga MTT, 3 yillik o'rtacha o'sishlar.

**Qabul:** YAML sxema bo'yicha validatsiya (noto'g'ri ID yoki yo'nalish bo'lsa ishga tushishda xato); `scoring.yaml` ga yangi ko'rsatkich qo'shish kod o'zgartirmasdan bahoga kiradi (test).

### KR-16 · Hisoblash dvigateli (backend) · **P1**

1. `scoring/engine.py`: sof funksiyalar (Django'siz test qilinadi): `normalize()`, `pillar_scores()`, `composite()`, `percentiles()`, `rank_range()` (seed qat'iy, 500 iteratsiya).
2. Model `TerritoryScore` (`soato`, `period`, `preset`, `score`, `rank`, `rank_low`, `rank_high`, `rank_in_parent`, `pillars` JSON, `details` JSON, `coverage`, `methodology_version`, unique(soato, period, preset, version)).
3. `compute_scores` management komandasi va Celery vazifasi, `sync_siat` tugagach avtomatik ishga tushadi.

**Qabul:** qo'lda hisoblangan 4 hududlik fixture bilan unit testlar (formula 3.2); ishsizlik oshsa baho pasayadi; Toshkent shahri log + clip tufayli boshqalarni 0 ga tushirmaydi (kamida 3 hudud 30–70 oralig'ida); bir xil kirishda natija bitta (deterministik).

### KR-17 · Ma'lumot bo'shliqlari va ishonchlilik · **P1**

4-bo'lim jadvalini to'liq amalga oshirish: yangi tumanlar, bo'linish yili, 1 yillik kechikish, vaznni qayta taqsimlash, `coverage` chegaralari, `gaps[]` ro'yxati. Imputatsiya yo'q.

**Qabul:** Ko'kdala tuzilgandan oldingi yillarda indeks yo'q ("Hali tuzilmagan"); ota tuman bo'linish yilida aholi o'sishi `missing`; 500 yo'q yil (2016) uchun B ustuni faqat ishsizlikdan va `coverage` < 1; `coverage < 0.6` hudud API'da `missing: true`.

### KR-18 · Kuchli tomonlar, tarmoq ixtisosi va tavsiya qoidalari · **P1**

1. 5.1 kuchli/zaif; 5.2 LQ va tarmoq belgilari; 5.3 qoidalar, kuch, tanlash, shablonlar (uz, uzc, ru, en).
2. Qoidalar YAML'dan o'qiladi; admin panelda faqat o'qish ko'rinishi (tahrirlash keyin).
3. Har tavsiyada `evidence[]` (qaysi ko'rsatkich, qiymat, percentil).

**Qabul:** sun'iy fixture'larda har qoida (R1–R9) kamida bitta musbat va bitta manfiy test; ko'pi bilan 3 tavsiya; R1 Toshkent shahri uchun hech qachon chiqmaydi; tavsiya matnida raqamlar API qiymatlari bilan bir xil.

### KR-19 · Scoring API · **P1**

6-bo'limdagi uch endpoint, KR-05 keshlash qoidasi bilan. `weights` validatsiyasi (5 ta manfiy bo'lmagan son, yig'indisi > 0), `preset` noma'lum bo'lsa 400.

**Qabul:** javob < 300 ms (kesh bilan), maxsus vazn bilan < 500 ms; OpenAPI sxemasi; `missing` hudud `score: null`, 0 emas.

### KR-20 · Xarita UI: salohiyat qatlami, kartochka, vaznlar · **P1**

7-bo'limdagi 1–3 va 5-bandlar. Radar uchun loyihadagi mavjud grafik kutubxonasi ishlatiladi (yangisini qo'shmaslik). URL parametrlari `ind=score[-X]`, `sp`, `sw` havola orqali ulashiladi va qayta ochilganda bir xil holat. Mobil (KR-13): kartochka pastdan chiqadigan panel.

**Qabul:** `/regions?ind=score&p=2025&t=1708` ochilganda Jizzax kartochkasida "Salohiyat" yorlig'i, reyting oralig'i va izoh; preset almashganda xarita qayta bo'yaladi; tuman darajasida indeks nomi "Mehnat va demografiya indeksi"; e2e test.

### KR-21 · O'xshash hududlar, reyting jadvali va solishtirish · **P2**

5.4 va 7-bo'lim 4-bandi: o'xshashlar (API `peers[]`), reyting jadvali + eksport, KR-11 solishtirish rejimida radar ustma-ust va farqlar jadvali.

**Qabul:** hudud o'ziga o'xshash bo'lib chiqmaydi; umumiy ko'rsatkichlar < 5 bo'lsa `peers` bo'sh va izoh; eksport faylida metodologiya versiyasi va manba qatori.

### KR-22 · Metodologiya va tekshiruv · **P2**

1. Metodologiya sahifasi (4 tilda), `methodology_version` bilan.
2. Tekshiruv hisoboti (`compute_scores --report`): ustunlar o'rtasidagi korrelyatsiya (|r| > 0.9 bo'lsa ogohlantirish: ikki ustun bir narsani o'lchayapti); reyting barqarorligi (o'rin oralig'i ≥ 4 bo'lgan hududlar ro'yxati); orqaga sinov: 2019 indeksi bilan 2020–2024 YaIM o'sishi o'rtasidagi Spearman korrelyatsiyasi (faqat ma'lumot uchun, model sozlanmaydi).
3. Natija admin panelda (KR-14 monitoringi yonida).

**Qabul:** hisobot har `compute_scores` dan keyin yangilanadi; metodologiya sahifasidagi formula `scoring.yaml` dagi qiymatlar bilan avtomatik to'ldiriladi (qo'lda yozilgan raqam yo'q).

### Bajarish tartibi

1. KR-15 → KR-16 → KR-17 (backend, xaritaga tegilmaydi).
2. KR-18 → KR-19.
3. KR-20.
4. KR-21, KR-22.

---

## 9. Cheklovlar va ochiq savollar

1. **Iqtisodiy ko'rsatkichlar faqat viloyat darajasida**, shuning uchun tuman tavsiyalari asosan mehnat va demografiyaga tayanadi. Tumanlar uchun korxonalar soni (KTUT, 1.09 bo'limi) tuman kesimida topilsa, D ustunining tuman varianti qo'shiladi (KR-15 ga yangi ko'rsatkich).
2. **14 hudud kichik guruh:** percentil qadami ≈7%, bitta hudud o'zgarishi reytingni siljitadi. Reyting oralig'i (3.5) buni ochiq ko'rsatish uchun.
3. **Vaznlar subyektiv.** Presetlar va slayderlar shuning uchun bor; standart preset qo'mita mutaxassislari bilan kelishilsa yaxshi.
4. Kodni o'qib aniqlanadi: `d-density` kabi hosila ko'rsatkichlar qayerda hisoblanadi (backend yoki frontend). Scoring backend'da bo'lishi kerak, hosilalar ham backend'da bo'lmasa, avval ko'chiriladi.
5. Kodni o'qib aniqlanadi: hozirgi kartochka va solishtirish qaysi grafik kutubxonasida, radar shu kutubxonada bormi.

---

## 10. Prognoz modeli: kelgusi yillar uchun o'sish

> Maqsad: har ko'rsatkich va har hudud uchun keyingi 1–3 yilga taxminiy qiymat, ishonch oralig'i bilan, va shundan kelib chiqadigan kelajakdagi salohiyat indeksi. Vazifalar **KR-23..KR-28**.

### 10.1. Ma'lumot hajmi haqida ochiq gap

- SIAT qatorlari **yillik va qisqa**: 246 → 17 yil (2010–2026), 1875 → 16 yil, 500 → atigi 9 yil (2017–2025), viloyat ko'rsatkichlari ≈15 yil, 14 ta hudud.
- Bitta qatorga (masalan "Jizzax ish haqi") alohida XGBoost o'rgatish **ma'nosiz**: 9–16 nuqtada daraxt modeli faqat yodlab oladi va oddiy trenddan yomonroq bashorat qiladi.
- XGBoost faqat **panel (global) model** sifatida foydali: barcha tumanlar bir jadvalda o'rgatiladi. Tuman ko'rsatkichlari uchun bu ≈206 tuman × 7–14 yil = 1 500–3 000 qator, bu daraxt modeli uchun yetarli chegarada. Viloyat ko'rsatkichlari uchun esa 14 × 15 ≈ 200 qator, bu XGBoost uchun kam.
- 2020 (COVID) va ma'muriy bo'linishlar qatorlarni buzadi; ular alohida belgilanadi (10.3).
- Shuning uchun asosiy qoida: **har ko'rsatkich uchun model orqaga sinov (backtest) bilan tanlanadi**, XGBoost oddiy bazaviy modeldan aniq yaxshiroq bo'lgandagina ishlatiladi. Aks holda bazaviy model qoladi. Bu UI'da "model: trend / XGBoost" deb ko'rsatiladi.

### 10.2. Modellar

| Kod | Model | Qachon | Izoh |
|---|---|---|---|
| M0 | Naive: oxirgi qiymat | har doim, solishtirish uchun | Har qanday model shundan yaxshi bo'lishi shart |
| M1 | Drift: oxirgi 3–5 yillik o'rtacha o'sish (CAGR) | har doim | Qisqa qatorlarda ko'pincha eng yaxshisi |
| M2 | Damped trend (ETS, Holt, so'nuvchi trend) | qatorda ≥ 8 nuqta | `statsmodels`; trend uzoq horizontda sekinlashadi |
| M3 | Panel XGBoost (global), maqsad: **keyingi yil o'sish sur'ati** (daraja emas) | tuman ko'rsatkichlari (246, 247, 500, 1875 va hosilalar) | 10.3 dagi featurelar bilan |
| M4 | Ansambl: M2 va M3 o'rtachasi (vazn backtest xatosiga teskari) | M3 va M2 ikkalasi ham M1 dan yaxshi bo'lsa | Odatda eng barqaror natija |

- Viloyat ko'rsatkichlari (660, 658, 1299, investitsiya, sanoat, 1409): **M1/M2**. Ixtiyoriy: XGBoost'ga viloyat qatorlarini tumanlar bilan birga emas, alohida kichik panel sifatida berib sinash, lekin standartda o'chirilgan.
- XGBoost **o'sish sur'atini** bashorat qiladi, keyin daraja `y(t+1) = y(t)·(1+ĝ)`. Daraja bo'yicha o'rgatilgan daraxt modeli o'rgatishda ko'rmagan qiymatdan (masalan rekord ish haqi) yuqoriga chiqa olmaydi, o'sish sur'atida bu muammo yo'q.
- Ko'p yillik horizont: rekursiv (1 yil oldinga, natijani lag sifatida qaytarish) yoki to'g'ridan-to'g'ri (h=1,2,3 uchun alohida model). Standart: **to'g'ridan-to'g'ri**, xato yig'ilmaydi.
- Maksimal horizont: **3 yil**. 4–5 yil faqat "ssenariy" sifatida (10.5), nuqtali prognoz sifatida emas.

### 10.3. XGBoost featurelari (bir qator = hudud × yil)

| Guruh | Featurelar |
|---|---|
| O'z tarixi | maqsad ko'rsatkich o'sishining lag 1, 2, 3; 3 yillik o'rtacha o'sish; o'sish volatilligi (3 yil sd); daraja (log) |
| Boshqa ko'rsatkichlar (o'sha hudud) | aholi o'sishi, ishsizlik va uning o'zgarishi, log ish haqi, real ish haqi o'sishi, qishloq ulushi, log zichlik, gender nisbati (lag 1) |
| Nisbiy holat | ko'rsatkichning respublika o'rtachasiga nisbati (log); viloyat ichidagi percentil (konvergensiya effekti: orqadagilar tezroq o'sadi) |
| Viloyat konteksti | ota viloyatning YaIM o'sishi, jon boshiga investitsiya o'sishi, sanoat jon boshiga (lag 1, chunki joriy yil hali e'lon qilinmagan) |
| Salohiyat indeksi | o'tgan yilgi ustun baholari A–E (8-bo'lim natijasi) |
| Respublika | respublika bo'yicha o'sha ko'rsatkich o'sishi (lag 1), INI (inflyatsiya) |
| Maxsus belgilar | `covid` (2020=1), `is_city` (SOATO 4xx), `years_since_created` (yangi tumanlar), `post_split` (ota tuman bo'lingandan keyingi 1-yil) |

Qoidalar:
- Faqat **t yilgacha ma'lum bo'lgan** ma'lumot ishlatiladi (oqish yo'q): viloyat ko'rsatkichlari va INI 1 yil lag bilan.
- Hudud ID'si feature sifatida **berilmaydi** (yodlab olishning oldini olish uchun).
- Yetishmagan qiymatlar XGBoost'ning o'z `missing` mexanizmi bilan; `missing` deb belgilangan (KR-03) yillar maqsad sifatida o'rgatishga kirmaydi.
- Ko'rsatkich o'sishlari ±p1/p99 da winsorize qilinadi (bo'linish sakrashlari modelni buzmasligi uchun).
- Giperparametrlar kichik va konservativ: `max_depth` 3–4, `n_estimators` ≤ 300, `learning_rate` 0.05, `min_child_weight` ≥ 5, `subsample` 0.8. Grid faqat backtest ichida.

### 10.4. Orqaga sinov va model tanlash

- **Rolling-origin backtest:** o'rgatish 2010..T, sinov T+1..T+3, T = 2018…2022 (500 uchun 2020…2022). Barcha modellar bir xil bo'laklarda.
- Metrika: **MASE** (M0 ga nisbatan; < 1 bo'lsa naive'dan yaxshi), qo'shimcha MAPE va o'sish yo'nalishi to'g'riligi (%).
- Tanlash qoidasi (har ko'rsatkich × horizont uchun): eng past MASE; lekin M3/M4 tanlanishi uchun M1 dan **kamida 10% yaxshi** bo'lishi shart, aks holda oddiyroq model. Tanlangan model va backtest natijalari `ForecastModelRun` da saqlanadi va metodologiya sahifasida ko'rsatiladi.
- 2020 yil sinov bo'lagida alohida hisobot (COVID shoki modellar uchun adolatsiz).
- Feature ahamiyati (SHAP) faqat **izohlash uchun**: "bu prognozga eng ko'p ta'sir qilganlar: ishsizlik pasayishi, aholi o'sishi". Bu sabab-oqibat emas, UI'da shunday yoziladi.

### 10.5. Noaniqlik va ssenariylar

- **Ishonch oralig'i:** backtest qoldiqlaridan empirik (konformal) oraliq, har ko'rsatkich × horizont uchun alohida: 80% oraliq = qoldiqlarning 10- va 90-percentili, prognozga qo'shiladi. Bu har qanday model uchun ishlaydi va qisqa qatorlarda XGBoost kvantil regressiyasidan ishonchliroq. (Kvantil XGBoost `reg:quantileerror` ixtiyoriy, solishtirish uchun.)
- Oraliq horizont bilan kengayadi; agar 3-yil oralig'i o'sish yo'nalishini ham qamrab olsa (pastki chegara pasayish, yuqorisi o'sish), UI "yo'nalish noaniq" deydi.
- **Ssenariylar** ("eng yaxshi yo'l" savoli uchun):
  - *Bazaviy* — tanlangan model prognozi.
  - *Ijobiy* — hudud o'xshash hududlari (5.4) ichidagi yuqori chorak o'sish sur'atiga erishsa.
  - *Salbiy* — pastki chorak o'sish sur'ati.
  - *Maqsadli* — "agar ishsizlik X p.p. kamaysa": foydalanuvchi bitta feature'ni o'zgartiradi, M3 orqali boshqa ko'rsatkichlar qanday o'zgarishi ko'rsatiladi. Bu **assotsiatsiya, sabab-oqibat emas** degan izoh bilan; P2.
- Ssenariylar 5 yilgacha chiziladi, lekin faqat oraliq (lenta) ko'rinishida, nuqtali raqam sifatida emas.

### 10.6. Kelajakdagi salohiyat indeksi

- Prognoz qilingan ko'rsatkichlardan 3-bo'lim formulasi bilan **2027–2028 indeksi** hisoblanadi (tengdoshlar ham prognoz qiymatlari bilan).
- Natija: "2025: 14 dan 6-o'rin → 2028 (prognoz): 4-o'rin (3–7)". Oraliq ishonch oralig'idagi qiymatlardan Monte Carlo bilan (har ko'rsatkich oraliqdan tasodifiy, 500 marta).
- Tavsiya qoidalari (5.3) prognoz yili uchun ham ishlaydi: "2028 ga kelib R6 (MTT bo'shlig'i) kuchayadi, chunki aholi o'sishi davom etadi".
- Eng ko'p ko'tarilishi/tushishi kutilgan hududlar ro'yxati (reyting jadvalida alohida ustun).

### 10.7. Saqlash, qayta o'rgatish, API

- Modellar: `ForecastModelRun` (`indicator`, `level`, `horizon`, `model_kind`, `params` JSON, `backtest` JSON [MASE, MAPE, yo'nalish %], `trained_at`, `data_until`, `version`, `artifact_path`), `ForecastValue` (`indicator`, `soato`, `period`, `horizon`, `scenario` [base|optimistic|pessimistic], `value`, `lo80`, `hi80`, `model_run`), unique(indicator, soato, period, scenario, model_run).
- `train_forecasts` komandasi va Celery vazifasi: `sync_siat` yangi yil ma'lumotini olib kelganda (ko'rsatkichning `data_until` o'zgarganda) qayta o'rgatadi. Kunlik emas, chunki ma'lumot yiliga 1–2 marta yangilanadi. Model fayllari `media/forecast/` da, versiya bilan; eski versiyalar 3 ta saqlanadi.
- Bog'liqliklar: `xgboost`, `statsmodels`, `shap` (backend `requirements`). Hisoblash Celery worker'da, so'rov vaqtida emas.
- API (KR-05 yonida):

```
GET /api/common/map/forecast/?indicator=500&level=district&parent=1708&period=2027&scenario=base
    → { indicator, period, horizon, model_kind, items:[{ soato, value, lo80, hi80, growth_pct, direction_uncertain }] }

GET /api/common/map/forecast/<soato>/?indicator=500
    → { history:[{period, value}], forecast:[{period, value, lo80, hi80}], scenarios:{optimistic:[...], pessimistic:[...]},
        model:{kind, mase, mape, direction_acc, trained_at, data_until}, drivers:[{feature, contribution}] }

GET /api/common/map/score/?level=region&period=2028&forecast=1        # 10.6 prognoz indeksi
```

### 10.8. UI

1. **Vaqt slayderi kelajakka cho'ziladi** (masalan 2026–2028), prognoz yillari boshqa rangda va "P" belgisi bilan. Prognoz yili tanlanganda xarita ustida banner: "Prognoz, 2028. Taxminiy qiymat, 80% ishonch oralig'i kartochkada." Hududlar biroz shaffof yoki shtrixli, haqiqiy ma'lumot bilan adashtirilmasligi uchun. URL: `p=2028` (prognoz yili avtomatik aniqlanadi), `sc=base|opt|pes`.
2. **"O'sish" rejimi:** `ind=500&view=growth&p=2028` — xarita kutilayotgan yillik o'sish % bo'yicha bo'yaladi (respublika o'rtachasi markazida ikki tomonlama palitra). Bu "qayerda kelajakda qanday o'sish bo'ladi" degan savolga bevosita javob.
3. **Hudud kartochkasi:** har ko'rsatkich mini grafigida tarixiy chiziq + prognoz uzuq chiziq + 80% lenta (fan chart). Ostida: "2026–2028 kutilayotgan o'sish: yiliga +X% (oraliq Y–Z%), respublikada +W%". Model nomi va aniqligi ("o'tgan yillarda o'rtacha xato 4%") kichik matnda.
4. **"Salohiyat" yorlig'ida** (KR-20) yangi blok "Kelajak": prognoz indeks va o'rin o'zgarishi, uch ssenariy lentasi, prognoz yili uchun tavsiyalar.
5. **"Nega shunday prognoz?"** ochiladigan blok: 3–5 ta asosiy omil (SHAP), "bu sabab-oqibat emas" izohi bilan.
6. **Reyting jadvalida** "Kutilayotgan o'sish" va "O'rin o'zgarishi (2028)" ustunlari, saralash bilan.
7. Eksport (KR-12): prognoz qatorlari alohida ustun `is_forecast`, `lo80`, `hi80`, model versiyasi bilan.
8. Doimiy izoh: "Prognoz rasmiy emas, SIAT ma'lumotiga asoslangan statistik model. Ma'lumot qatorlari qisqa, natijani ehtiyotkorlik bilan talqin qiling."

---

## 11. Prognoz vazifalari (KR-23..KR-28)

Old shartlar: KR-01, KR-03, KR-10 (toza va hosila ko'rsatkichlar bazada), KR-16 (ustun baholari feature sifatida).

### KR-23 · Prognoz ma'lumot to'plami va bazaviy modellar · **P1**

1. `forecast/dataset.py`: hudud × yil panel jadvali, 10.3 featurelari, oqishni oldini olish qoidalari, `covid`/`post_split`/`years_since_created` belgilari.
2. M0, M1, M2 bazaviy modellar.
3. Rolling-origin backtest karkasi va metrikalar (MASE, MAPE, yo'nalish %).

**Qabul:** feature jadvalida t yil qatori t+1 ma'lumotini o'z ichiga olmasligi testi (sun'iy "kelajak" ustuni bilan); Ko'kdala tuzilgandan oldingi yillar jadvalda yo'q; backtest natijasi barcha tuman ko'rsatkichlari uchun jadval ko'rinishida chiqadi.

### KR-24 · Panel XGBoost va model tanlash · **P1**

1. M3: o'sish sur'ati maqsadi, to'g'ridan-to'g'ri h=1..3, konservativ giperparametrlar, backtest ichida kichik grid.
2. M4 ansambl.
3. 10.4 tanlash qoidasi (M1 dan ≥10% yaxshi bo'lsagina murakkab model).
4. SHAP bo'yicha har prognoz uchun top-5 omil.

**Qabul:** backtest hisoboti (`train_forecasts --report`): har ko'rsatkich × horizont uchun barcha modellarning MASE'si va tanlangan model; bir xil seed bilan natija takrorlanadi; tanlangan model har doim M0 dan yomon emas (MASE ≤ 1), aks holda M0/M1 tanlanadi.

### KR-25 · Ishonch oralig'i va ssenariylar · **P1**

10.5: konformal 80% oraliq (ko'rsatkich × horizont), "yo'nalish noaniq" belgisi, ijobiy/salbiy ssenariylar (o'xshash hududlar choraklari). "Maqsadli ssenariy" P2, alohida bayroq ostida.

**Qabul:** backtest'da 80% oraliq haqiqiy qiymatni 70–90% hollarda qamraydi (kalibrovka testi, hisobotda); ssenariylar tartibi har doim salbiy ≤ bazaviy ≤ ijobiy.

### KR-26 · Saqlash, qayta o'rgatish va prognoz API · **P1**

10.7: modellar, `train_forecasts` komandasi va Celery vazifasi (`data_until` o'zgarganda), model fayllari versiyasi, uch endpoint, kesh. Qayta o'rgatish xato bersa eski prognoz qoladi va admin xabar oladi (KR-14).

**Qabul:** API javobi < 300 ms (oldindan hisoblangan); `period` tarixiy yil bo'lsa forecast endpoint 400 emas, bo'sh `items` va izoh qaytaradi; model versiyasi har javobda.

### KR-27 · Xarita UI: kelajak yillari, o'sish rejimi, fan chart · **P1**

10.8 dagi 1–3, 5–8 bandlar. Mavjud grafik kutubxonasi ishlatiladi.

**Qabul:** `/regions?ind=500&p=2028&t=1708` ochilganda prognoz banneri va shtrixli hududlar; `view=growth` rejimi ishlaydi; kartochkada tarix + prognoz + lenta; prognoz va haqiqiy yil vizual jihatdan adashtirilmaydi (e2e skrinshot testi).

### KR-28 · Kelajakdagi salohiyat indeksi va prognoz monitoringi · **P2**

1. 10.6: prognoz indeksi, o'rin oralig'i (Monte Carlo), prognoz yili uchun tavsiyalar, "Kelajak" bloki (10.8.4).
2. Monitoring: yangi haqiqiy ma'lumot kelganda o'tgan yilgi prognoz bilan solishtirish ("2025 prognozi: +6,1%, haqiqiy: +5,4%"), xatolar tarixi admin panelda va metodologiya sahifasida. Xato oraliqdan tashqarida bo'lgan ko'rsatkichlar ro'yxati.

**Qabul:** prognoz indeksi faqat 3-bo'lim formulasi orqali (alohida logika yo'q); monitoring hisoboti har `sync_siat` dan keyin yangilanadi.

### Bajarish tartibi (prognoz)

1. KR-23 → KR-24 → KR-25 (backend, modellar va hisobot; avval backtest natijasiga qarab XGBoost qaysi ko'rsatkichlarda foyda berishi aniqlanadi).
2. KR-26 → KR-27.
3. KR-28.
