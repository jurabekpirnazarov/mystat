# SIAT (siat.stat.uz) tadqiqoti va my.stat.uz kartasini yaxshilash rejasi

> **Sana:** 2026-10-15
> **Maqsad:** "Boshqa xizmatlar" bo'limidagi SIAT ma'lumotiga tayangan kartaning ayrim holatlarda noto'g'ri ishlashini tuzatish va kartani to'liq ma'lumot bilan boyitish.
> **Cheklov:** ilova kodi foydalanuvchi qurilmasida, bu yerdan ko'rinmaydi. Shuning uchun "kartadagi xatolar" bo'limi SIAT ma'lumotlarida **tekshirib topilgan** nuqsonlarga asoslangan: kartada shu nuqsonlar qayerda chiqishini Claude Code kodni o'qib tasdiqlashi kerak.
> **Qanday ishlatiladi:** `ISH_REJASI.md` uslubida: "SIAT_KARTA_TAHLIL.md dagi `KR-03` ni bajar" deyish yetarli.

---

## 1. SIAT nima

- **Statistika integrallashgan axborot-tahlil tizimi**, Milliy statistika qo'mitasining rasmiy ko'rsatkichlar portali. 2023-yil yanvarda ishga tushgan, SDMX standartiga asoslangan.
- Hozir saytda **3 236 ta ko'rsatkich** (`https://siat.stat.uz/data/` sarlavhasida). Har ko'rsatkichning o'z sahifasi bor: `https://siat.stat.uz/data/{ID}/` (`?lang=uz|ru|en|uzc`).
- Litsenziya: **CC BY 4.0** (har ko'rsatkich metadata'sida yozilgan). Ya'ni ma'lumotni o'z bazamizga olib, manbani ko'rsatgan holda ishlatish mumkin.
- Har ko'rsatkichda pasport bor: kod, davriylik, o'lchov birligi, klassifikator, metodologiya havolasi, mas'ul bo'lim va xodim, izohlar (masalan "2025 yil dastlabki ma'lumot"), birinchi e'lon va oxirgi yangilanish sanasi.

### 1.1. Ko'rsatkich kodlari va bo'limlar

Kod formati `B.BB.BB.NNNN`. Tekshirilgan bo'limlar:

| Kod prefiksi | Mavzu |
|---|---|
| 1.01 | Milliy hisoblar: YaIM, hududiy YaIM (1.01.03), turizm, norasmiy iqtisodiyot |
| 1.02 | Sanoat va energetika (hududlar bo'yicha sanoat 1.02.01.0077–0108) |
| 1.03 | Qishloq, o'rmon va baliq xo'jaligi |
| 1.04 | Investitsiyalar va qurilish (uy-joy, maktab, shifoxona quvvatlari) |
| 1.06 | Xizmatlar (aloqa, teleradio va h.k.) |
| 1.07 | Savdo (ulgurji, chakana) |
| 1.09 | Korxonalar (ro'yxatga olingan, faoliyat yuritayotgan) |
| 1.11 | Narxlar: Iste'mol narxlari indeksi (1.11.01), ishlab chiqaruvchi narxlari (1.11.02) |
| 2.01 | Demografiya: doimiy aholi (2.01.02, **tumanlar kesimida**) |
| 2.02 | Mehnat: bandlik, ishsizlik (2.02.01), ish haqi (2.02.02), **tumanlar kesimida** |
| 2.04 | Ta'lim (maktabgacha ta'lim tashkilotlari va h.k.) |

---

## 2. Ma'lumotni qanday olish (API)

SIAT'ning hujjatlashtirilgan ochiq API'si yo'q, lekin har ko'rsatkich sahifasidagi "yuklab olish" tugmalari barqaror URL'larga tayanadi. Tekshirildi:

### 2.1. Yuklab olish endpoint'i

```
GET http://api.siat.stat.uz/sdmx/{ID}/table/download/?download_format={csv|json|xml|xlsx|pdf}
```

U **faylning o'zini emas, fayl haqidagi yozuvni** qaytaradi:

```json
{
  "id": 304503,
  "updated_at": "2026-03-30T17:48:46.261033+05:00",
  "file":   "https://api.siat.stat.uz/media/uploads/sdmx/sdmx_data_660.json",
  "file_2": "https://api.siat.stat.uz/media/uploads/sdmx/import/v2/sdmx_data_660_iLSDYpD.json",
  "file_type": "json",
  "size": "15.8 KB"
}
```

- `updated_at` — yangilanishni aniqlash uchun qulay: sinxronlashda faqat o'zgargan ko'rsatkichlarni qayta yuklash mumkin.
- `file` nomi barqaror (`sdmx_data_{ID}.{format}`), `file_2` nomida tasodifiy qo'shimcha bor (har yangilanishda o'zgaradi).

### 2.2. JSON format 1 (`file`, "tekis")

```json
[{
  "metadata": [ { "name_uz": "...", "name_ru": "...", "name_en": "...", "name_uzc": "...",
                  "value_uz": "...", "value_ru": "...", "value_en": "...", "value_uzc": "..." } ],
  "data": [
    { "Code": "1700", "Klassifikator": "O‘zbekiston Respublikasi",
      "Klassifikator_ru": "...", "Klassifikator_en": "...", "Klassifikator_uzc": "...",
      "2010": 3084.6, "2011": 3712.9, "...": "..." }
  ]
}]
```

Davrlar ustun nomi sifatida keladi: yillik `"2010"`, oylik `"2024-M01"`.

### 2.3. JSON format 2 (`file_2`, "v2")

```json
{
  "success": true, "status": 200, "title": "...", "total_counts": 15,
  "description": { "klass_id": "...", "...": "..." },
  "data": [
    { "klass_id": "1726", "klassifikator": "Toshkent shahri",
      "values": [ { "year": "2010", "value": 3084.6 } ],
      "point_code": 660, "unit": "...", "periodicity": "...", "change_date": "...", "...": "..." }
  ]
}
```

**Tavsiya:** asosiy manba sifatida **format 1** (`file`) ishlatilsin: nomi barqaror va ko'p tilli nomlar bor. Format 2 faqat zaxira.

### 2.4. Hudud kodlari (MHOBT/SOATO)

| Daraja | Kod uzunligi | Misol |
|---|---|---|
| Respublika | 4 | `1700` |
| Viloyat / Qoraqalpog'iston / Toshkent sh. | 4 | `1735` Qoraqalpog'iston, `1726` Toshkent shahri |
| Tuman | 7, oxirgi 3 ta raqam `2xx` | `1735204` Amudaryo tumani |
| Shahar | 7, oxirgi 3 ta raqam `4xx` | `1735401` Nukus shahri |

Ota hudud = kodning birinchi 4 raqami. Alohida "daraja" maydoni yo'q.

### 2.5. Kirish va cheklovlar

- Bu muhitdan `siat.stat.uz` va `api.siat.stat.uz` ga to'g'ridan-to'g'ri ulanish proksi tomonidan yopiq edi; ma'lumot veb-o'qish vositasi orqali tekshirildi. **Production serverdan ulanish alohida tekshirilsin** (B-bo'lim, KR-01).
- Yuklab olish havolasi sahifada `http://` bilan berilgan; `https://` ham ishlaydi (fayllar `https://api.siat.stat.uz/media/...`). Kodda faqat `https` ishlatilsin, aks holda brauzerda "mixed content" bloklanadi.
- Brauzerdan to'g'ridan-to'g'ri SIAT'ga so'rov yuborish (CORS, sekinlik, sayt ishlamay qolsa karta ham ishlamaydi) tavsiya etilmaydi. Ma'lumot **backend orqali bazaga sinxronlanadi** (KR-01).

---

## 3. Kartaga yaroqli ko'rsatkichlar (tekshirilgan)

"Satrlar" ustunida 221 = respublika + 14 hudud + 206 tuman/shahar.

| ID | Kod | Ko'rsatkich | Daraja | Davr | Birlik |
|---|---|---|---|---|---|
| 246 | 2.01.02.0001 | Doimiy aholi soni (jami) | **tuman** (221) | 2010–2026, yil boshiga | ming kishi |
| 245 | 2.01.02.0002 | Doimiy aholi soni (erkak) | **tuman** (221) | 2010–2026 | ming kishi |
| 247 | 2.01.02.0005 | Doimiy aholi soni (qishloq) | **tuman** (221) | 2010–2026 | ming kishi |
| 500 | 2.02.02.1300 | O'rtacha hisoblangan oylik ish haqi | **tuman** (221) | 2017–2025 | so'm |
| 1875 | 2.02.01.2200 | Ishsizlik darajasi | **tuman** (221) | 2010–2025 | % |
| 2818 | — | Ishsizlik darajasi (erkaklar) | aniqlash kerak | — | % |
| 1299 | 1.01.03.0001 | Hududiy YaIM hajmi | viloyat (15) | 2010–2025 | mlrd so'm |
| 658 | 1.01.03.0002 | Hududiy YaIM o'sish sur'ati | viloyat | yillik | % |
| 660 | 1.01.03.0003 | Aholi jon boshiga hududiy YaIM | viloyat (15) | 2010–2025 | ming so'm |
| 4604–4617 | 1.02.01.0095–0108 | Sanoat mahsuloti, har hudud alohida (tarmoqlar bo'yicha) | 1 hudud × tarmoq | yillik | — |
| 2599–2612 | 1.04.01.0071–0084 | Investitsiyalar, har hudud alohida (tarmoqlar bo'yicha) | 1 hudud × tarmoq | 2010–2025 | mlrd so'm |
| 3843–3848 | 1.01.08.0007–0012 | Norasmiy iqtisodiyot hududlar bo'yicha | viloyat | yillik | — |
| 1409 | 2.04.01.0001 | Maktabgacha ta'lim tashkilotlari soni | viloyat (15) | 1991–2024 | birlik |
| 1460 | 1.03.02.0004 | Dehqon xo'jaliklari mahsuloti o'sishi | viloyat (15) | 2010–2024 | % |
| 4598 | 1.11.01.0039 | Xorazm viloyati Iste'mol narxlari indeksi (mahsulotlar kesimida) | 1 hudud × mahsulot | oylik 2024-M01… | indeks |

**Xulosa:** demografiya va mehnat bo'limlari tuman darajasigacha boradi, iqtisodiy ko'rsatkichlarning ko'pi faqat viloyat darajasida. Ba'zi ko'rsatkichlar "har hudud uchun alohida jadval" ko'rinishida (4604–4617, 2599–2612, 4598): ularni kartaga chiqarish uchun 14 jadvalni bitta "hudud × ko'rsatkich" jadvaliga yig'ish kerak (KR-02).

To'liq katalog `https://siat.stat.uz/sitemap.xml` dan olinadi (`/data/{ID}/` ro'yxati). Kartaga yaroqli ko'rsatkichlarni avtomatik aniqlash qoidasi KR-02 da.

---

## 4. SIAT ma'lumotidagi nuqsonlar (kartadagi "ayrim holatlar"ning ehtimoliy sababi)

Quyidagilar haqiqiy SIAT fayllarida topildi. Har biri kartada "rang noto'g'ri", "hudud bo'sh", "grafik buzuq" ko'rinishida chiqishi mumkin.

| # | Nuqson | Qayerda topildi | Kartadagi oqibat |
|---|---|---|---|
| N1 | **Nom bo'yicha moslashtirish ishlamaydi.** Nomlarda lotin va kirill harflari aralash ("Aмударё" lotin A bilan, "Улугноpский" lotin p), apostrof turlari har xil (‘ ' ʻ `), qo'sh bo'shliq ("Qarshi  shahri"), "shahar"/"shahri" farqi, "Khanabadcity" | 1875, 660 (Andijon kirill nomida lotin "A") | GeoJSON nomi bilan mos kelmagan hudud kulrang/bo'sh qoladi |
| N2 | **0.0 "ma'lumot yo'q" ma'nosida.** Yangi tuzilgan tumanlar (Bo'zatov, Taxiatosh, Ko'kdala, Bandixon, Nurafshon, G'ozg'on, Shahrisabz sh.) uchun oldingi yillar 0.0; Toshkent shahri qishloq aholisi va dehqon xo'jaligi 0.0 | 1875, 247, 1460 | Hudud "eng past qiymat" rangida chiqadi, shkala buziladi, o'rtacha noto'g'ri |
| N3 | **Oylik davr kalitida kirill "М".** `2010-М01` (kirill) va `2025-M12` (lotin) bir faylda aralash | 1285, 4598 | Oylar saralanmaydi, ayrim oylar "yo'qoladi" yoki takrorlanadi |
| N4 | **Takror yoki tartibsiz ustunlar.** `"2023.1"` ustuni `"2024"` bilan bir xil, ustunlar xronologik tartibda emas | 2599 | Vaqt slayderida noto'g'ri yil, "oxirgi yil" noto'g'ri tanlanadi |
| N5 | **Respublika qatori ham "data" ichida** (`1700`), jami qatorga "hududlarga taqsimlanmagan" summa kiradi | 660, 1299 | Respublika qiymati shkala maksimumini egallaydi, hududlar bir xil rangda ko'rinadi |
| N6 | **Klassifikator hudud emas.** Ba'zi jadvallarda `Klassifikator` = tarmoq (IFUT) yoki mahsulot ("Kesim"), hudud emas | 2599, 712, 2959, 4598 | Karta hech narsa ko'rsatmaydi yoki "undefined" |
| N7 | **Faqat respublika darajasidagi ko'rsatkich** (1 satr) | 582, 1264, 3076 | Kartada butun mamlakat bir rangda |
| N8 | **Ma'muriy o'zgarishlar.** SIAT'da 206–207 tuman/shahar; ochiq chegaralar fayllari (geoBoundaries ADM2 va h.k.) eskirgan bo'lishi mumkin, yangi tumanlar yo'q | 1875, 246 | Yangi tuman kartada yo'q yoki ota tumani bilan qo'shilib qoladi |
| N9 | **Dastlabki ma'lumot belgisi** faqat izoh matnida ("2025 yil dastlabki"), tillar bo'yicha bir-biriga zid (uz: 2024, ru: 2025) | 1875, 660 | Foydalanuvchi dastlabki raqamni yakuniy deb o'qiydi |
| N10 | **`http://` havola** yuklab olish endpoint'ida | barcha sahifalar | https sahifada so'rov bloklanadi (mixed content) |
| N11 | **Yangilanish to'xtagan ko'rsatkichlar** (masalan 1285 oxirgi yangilanish 2024-02-06), o'rniga yangi ID chiqarilgan | 1285 | Karta eski ma'lumotni "oxirgi" deb ko'rsatadi |

---

## 5. Vazifalar

Ustuvorlik `ISH_REJASI.md` dagi kabi: **P0** birinchi navbatda, **P1** muhim, **P2** keyin.

### KR-01 · SIAT sinxronlash xizmati (backend) · **P0**

**Nima:** SIAT ma'lumoti brauzerdan emas, o'z bazamizdan beriladi. Bu "ayrim holatlarda ishlamaydi" muammosining asosiy davosi: SIAT sekin yoki ishlamay qolsa ham karta ochiladi.

**Qadamlar:**
1. Modellar:
   - `SiatIndicator` (`siat_id`, `code`, `name_uz/ru/en/uzc`, `unit_*`, `periodicity`, `geo_level` [`country|region|district|none`], `dimension` [`territory|activity|product|other`], `source_updated_at`, `last_synced_at`, `is_active`, `notes_*`, `methodology_url`, `is_preliminary_last`).
   - `SiatValue` (`indicator`, `territory_code` [SOATO], `period` [normalizatsiya qilingan: `2025` yoki `2025-01` yoki `2025-Q1`], `value` [null bo'lishi mumkin], `is_missing`, unique(indicator, territory_code, period)).
   - `Territory` (`soato` PK, `parent_soato`, `level`, `kind` [tuman/shahar], `name_uz/ru/en/uzc`, `created_year` ixtiyoriy). Mavjud `Region`/`District` modellariga SOATO maydoni orqali bog'lanadi (aniqlash kerak: ularda SOATO bormi).
2. `sync_siat` management komandasi va Celery vazifasi (B-06 dagi Celery Beat'ga kunlik, kechasi): ro'yxatdagi har ID uchun `.../table/download/?download_format=json` → `updated_at` o'zgargan bo'lsa `file` ni yuklab, normalizatsiya (KR-03) va upsert.
3. Tarmoq: `https`, timeout 20 s, 3 marta qayta urinish, xato bo'lsa eski ma'lumot qoladi va logga yoziladi. Production serverdan `api.siat.stat.uz` ga ulanish borligini tekshirish (yo'q bo'lsa: admin panelda JSON faylni qo'lda yuklash rejimi).
4. Admin: ko'rsatkichlar ro'yxati, oxirgi sinxronlash holati, "hozir yangilash" tugmasi.

**Qabul mezonlari:** SIAT o'chirilgan holatda (mock bilan) karta bazadagi ma'lumot bilan ochiladi; ikkinchi `sync_siat` yugurishida o'zgarmagan ko'rsatkichlar qayta yuklanmaydi (test).

### KR-02 · Ko'rsatkichlar katalogi va avtomatik tasnif · **P0**

**Nima:** qaysi ko'rsatkich kartaga chiqishi mumkinligini qo'lda emas, ma'lumotga qarab aniqlash.

**Qadamlar:**
1. `sitemap.xml` dan barcha ID'larni olish (`sync_siat --catalog`), har biri uchun metadata.
2. `geo_level` qoidasi: `data[].Code` lar orasida 7 xonali kodlar ≥ 150 ta → `district`; 4 xonali `17xx` kodlar ≥ 14 ta → `region`; faqat `1700` → `country`; kodlar SOATO'ga o'xshamasa → `dimension = activity/product`, kartaga chiqmaydi (N6, N7).
3. "Har hudud uchun alohida jadval" guruhlari (bir xil nom, faqat hudud nomi farq qiladi, masalan 4604–4617, 2599–2612): bitta "virtual" ko'rsatkichga yig'iladi, foydalanuvchi tarmoqni tanlaydi.
4. Admin kartaga chiqadigan ko'rsatkichlarni belgilaydi va mavzuga biriktiradi (Aholi, Mehnat, Iqtisodiyot, Ijtimoiy soha, Narxlar).

**Qabul mezonlari:** 246, 500, 1875 → `district`; 660, 1299 → `region`; 582 → `country`; 2599, 712 → kartaga chiqmaydi.

### KR-03 · Ma'lumotni tozalash (normalizatsiya) · **P0**

**Nima:** 4-bo'limdagi N1–N5, N9 ni bir joyda hal qilish.

**Qadamlar:**
1. **Moslashtirish faqat SOATO kodi bo'yicha** (`Code`/`klass_id`), hech qachon nom bo'yicha emas (N1). Nomlar faqat ko'rsatish uchun va `Territory` jadvalidan olinadi.
2. Nomlarni tozalash (ko'rsatish uchun): kirill so'z ichidagi lotin harflarni kirillga va aksincha, apostroflarni `ʻ`/`’` ga, qo'sh bo'shliqni bittaga.
3. Davr kaliti: kirill `М` → lotin `M`, `2023.1` kabi takrorlar tashlanadi (qiymati boshqa ustun bilan bir xil bo'lsa), `YYYY-Mnn` → `YYYY-MM`, natija tartiblanadi (N3, N4).
4. 0.0 qoidasi (N2): agar hudud uchun 0.0 dan keyin musbat qiymatlar boshlansa, oldingi 0.0 lar `is_missing=True`; foiz/stavka ko'rsatkichlarida 0.0 ham `missing`; admin ko'rsatkich bo'yicha "0 — haqiqiy qiymat" belgisini qo'ya oladi.
5. Respublika qatori (`1700`) alohida saqlanadi, kartadagi rang shkalasiga kirmaydi (N5).
6. "Dastlabki" belgisi: izoh matnida `dastlabki|предварительн|preliminary` va yil topilsa, o'sha yil `is_preliminary` (N9).

**Qabul mezonlari:** 1875 uchun Ko'kdala 2010–2022 `missing`; 1285 da `2010-М01` va `2010-M01` bitta davr; 2599 da `2023.1` yo'q (unit testlar, real fayllar fixture sifatida).

### KR-04 · Chegaralar fayli (GeoJSON) SOATO bilan · **P0**

**Nima:** N8 ni hal qilish va karta nom bo'yicha emas, kod bo'yicha ishlashi uchun.

**Qadamlar:**
1. Ikki qatlam: `regions.geojson` (14 hudud) va `districts.geojson` (SIAT'dagi barcha 7 xonali kodlar). Har feature'da `properties.soato`, `name_uz/ru/en`.
2. Manba: mavjud loyiha chegaralari (aniqlash kerak: hozir qaysi fayl ishlatilmoqda) yoki ochiq ADM2 (geoBoundaries / HDX). Yangi tumanlar (Ko'kdala, Bo'zatov, Taxiatosh va boshqalar) chegarasi tekshiriladi va qo'lda qo'shiladi.
3. `mapshaper` bilan soddalashtirish: tumanlar fayli ≤ 1 MB (gzip ≤ 300 KB), `static/` da kesh bilan.
4. Tekshiruv skripti: SIAT'dagi har 7 xonali kod uchun polygon bor, ortiqcha polygon yo'q. Yetishmasa, ro'yxatni chiqaradi.

**Qabul mezonlari:** 246-ko'rsatkichdagi barcha tuman/shaharlar kartada rangli; tekshiruv skripti 0 ta yetishmovchilik.

### KR-05 · Karta API'si · **P1**

**Fayllar:** `GET /api/common/map/indicators/` (katalog: mavzu, nom, birlik, `geo_level`, mavjud davrlar, oxirgi yangilanish, manba havolasi), `GET /api/common/map/values/?indicator=246&period=2026&level=district&parent=1735` (SOATO → qiymat, `missing`, `preliminary`), `GET /api/common/map/territory/<soato>/` (hudud bo'yicha barcha ko'rsatkichlarning oxirgi qiymati va dinamikasi). Javob keshlanadi (sinxronlashda kesh tozalanadi).

**Qabul mezonlari:** javob < 300 ms (kesh bilan); `missing` qiymat `null` bo'lib keladi, 0 emas.

### KR-06 · Kartani tuzatish (frontend) · **P0**

**Qadamlar:**
1. Moslashtirish `feature.properties.soato` ↔ API kaliti (N1).
2. `null` qiymat alohida rang (shtrixli kulrang) va legendada "Ma'lumot yo'q" (N2).
3. Rang shkalasi: kvantil (5 sinf) standart, chiziqli ixtiyoriy; respublika qiymati legendada alohida chiziq, shkalaga kirmaydi (N5). Foiz o'zgarishi kabi ko'rsatkichlar uchun 100 (yoki 0) markazli ikki tomonlama shkala.
4. Ko'rsatkich almashganda eski so'rov bekor qilinadi (`AbortController`), yuklanish holati va xato holati ko'rsatiladi (bo'sh ekran emas).
5. Ko'rsatkichning `geo_level` i `district` bo'lmasa "Tumanlar" tugmasi o'chiriladi; `country` ko'rsatkichlar karta ro'yxatida umuman ko'rinmaydi (N7).
6. Dastlabki ma'lumot yili tooltip va legendada "dastlabki" belgisi bilan (N9).
7. Barcha havolalar `https` (N10).

**Qabul mezonlari:** N1–N10 har biri uchun bitta e2e yoki unit test (masalan "1875, 2015 yil: Ko'kdala kulrang, legendada 'Ma'lumot yo'q'").

### KR-07 · Tumanlar darajasi (drill-down) · **P1**

Viloyatni bosganda unga zoom qilinadi va o'sha viloyat tumanlari shu ko'rsatkich bo'yicha bo'yaladi (aholi, ish haqi, ishsizlik — tuman darajasida mavjud). "Orqaga" tugmasi va breadcrumb: O'zbekiston › Viloyat › Tuman. Toshkent shahri tumanlari SIAT'da bormi, aniqlash kerak.

### KR-08 · Vaqt slayderi va animatsiya · **P1**

Yil (yoki oy) slayderi, "▶" bilan 2010 → 2026 animatsiyasi. Rang shkalasi chegaralari barcha yillar bo'yicha bir xil qilinadi (aks holda animatsiya ma'nosiz). Tanlangan holat URL'da (`?ind=246&p=2026&lvl=district&r=1735`), havola orqali ulashiladi.

### KR-09 · Hudud kartochkasi (yon panel) · **P1**

Hududni bosganda: ko'rsatkich qiymati, respublikadagi o'rni (reyting "14 dan 3-o'rin"), respublika o'rtachasidan farqi, mini dinamika grafigi, shu hudud bo'yicha boshqa 5–6 ta asosiy ko'rsatkich (aholi, aholi jon boshiga YaIM, ish haqi, ishsizlik), "To'liq profil" tugmasi → `FQ-02` hududiy profil sahifasi. Bu karta va FQ-02 ni bitta ma'lumot manbasiga (KR-01) birlashtiradi.

### KR-10 · Hosila ko'rsatkichlar · **P1**

SIAT'da yo'q, lekin mavjud ma'lumotdan hisoblanadi (har birida "hisoblangan, manba: SIAT 246 va …" belgisi):
- Aholi zichligi (aholi / maydon; maydon GeoJSON'dan).
- Qishloq aholisi ulushi (247 / 246).
- Aholi o'sishi % (246, yildan yilga).
- Real ish haqi o'sishi (500 va Iste'mol narxlari indeksi).
- Gender nisbati (245 / (246 − 245)).

### KR-11 · Ikki hududni yoki ikki ko'rsatkichni taqqoslash · **P2**

- Hududlar: ikki hudud tanlanadi → yonma-yon kartochkalar va bir grafikda ikki chiziq.
- Ko'rsatkichlar: "bivariate" rejim (masalan ish haqi × ishsizlik), 3×3 rang matritsasi va tarqalish diagrammasi (har nuqta — hudud).

### KR-12 · Eksport va manba · **P1**

- Kartani PNG sifatida yuklab olish (html2canvas allaqachon bor), pastida ko'rsatkich nomi, davr, "Manba: SIAT, Milliy statistika qo'mitasi, CC BY 4.0" va sana.
- Joriy ko'rinish jadvalini CSV/XLSX (FQ-01 bilan bir xil format).
- Har ko'rsatkichda "SIAT'da ochish" havolasi (`https://siat.stat.uz/data/{ID}/`) va metodologiya havolasi.

### KR-13 · Qidiruv va mobil · **P2**

- Kartada hudud/tuman qidiruvi (avtoto'ldirish, 4 tilda nom).
- Mobil: legenda pastki panelda yig'iladigan, tooltip o'rniga bosganda pastdan chiqadigan kartochka, ikki barmoq bilan zoom.
- "Mening hududim" (geolokatsiya ruxsati bilan, rad etilsa karta odatdagidek ishlaydi).

### KR-14 · Ma'lumot sifati monitoringi · **P2**

Sinxronlashdan keyin avtomatik tekshiruv: kartaga chiqadigan ko'rsatkich uchun yetishmayotgan hududlar, kutilmagan sakrashlar (yildan yilga ±50% dan ko'p), 12 oydan beri yangilanmagan ko'rsatkichlar (N11). Natija admin panelda va A-02 dagi xabarnoma orqali adminga.

---

## 6. Bajarish tartibi

1. **KR-01, KR-02, KR-03** — ma'lumot bazaga tushadi va tozalanadi (kartaga hali tegilmaydi).
2. **KR-04, KR-05, KR-06** — karta kod bo'yicha ishlaydi, mavjud "ayrim holatlar" tuzaladi.
3. **KR-07, KR-08, KR-09, KR-12** — tumanlar, vaqt, hudud kartochkasi, eksport.
4. **KR-10, KR-11, KR-13, KR-14** — qo'shimcha imkoniyatlar.

`ISH_REJASI.md` bilan bog'liqlik: B-06 (Celery Beat) KR-01 dan oldin kerak; S-11 (hududiy sintetik ko'rsatkichlar) SIAT'da real ma'lumot bo'lgan joyda **ishlatilmaydi**, faqat SIAT'da yo'q ko'rsatkichlar uchun qoladi; FQ-02 xaritasi KR-05 API'siga quriladi; FQ-01 ochiq API'ga SIAT ko'rsatkichlarini qo'shish mumkin (litsenziya CC BY 4.0, manba ko'rsatilsa).

---

## 7. Ochiq savollar (kodni o'qib aniqlanadi)

1. Hozirgi karta SIAT'ga qanday ulanadi: brauzerdan to'g'ridan-to'g'rimi, backend proksi orqalimi yoki ma'lumot statik faylda?
2. Hozir qaysi chegaralar fayli ishlatiladi va unda SOATO kodi bormi?
3. Hozirgi kartada qaysi SIAT ko'rsatkichlari (ID) bor va foydalanuvchi aynan qaysi holatlarda xato ko'rgan? (Skrinshot yoki ko'rsatkich nomi bo'lsa, 4-bo'limdagi N1–N11 dan qaysi biri ekanini darhol aytish mumkin.)
4. Mavjud `Region`/`District` modellarida SOATO kodi saqlanadimi?

---

## Manbalar

- SIAT ko'rsatkichlar katalogi: https://siat.stat.uz/data/ , sitemap: https://siat.stat.uz/sitemap.xml
- Tekshirilgan ko'rsatkich sahifalari: https://siat.stat.uz/data/246/ , /245/ , /247/ , /500/ , /1875/ , /660/ , /1299/ , /582/ , /2599/ , /1285/ , /4598/ , /1409/ , /1460/ , /712/ , /2959/ , /1264/ , /3076/
- Fayl misollari: https://api.siat.stat.uz/media/uploads/sdmx/sdmx_data_660.json , https://api.siat.stat.uz/media/uploads/sdmx/sdmx_data_247.json , https://api.siat.stat.uz/media/uploads/sdmx/sdmx_data_1875.json
- Tizim tavsifi: https://dgov.uz/en/solution/detail/25/ , https://kun.uz/news/2023/01/07/ozbekiston-statistika-portali-ciat-ishga-tushdi , https://buxgalter.uz/publish/doc/text186906_komu_ponadobitsya_novaya_integrirovannaya_sistema_goskomstata_statistika
