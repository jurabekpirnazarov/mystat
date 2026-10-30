# Bosh sahifa vidjetlari: O'zbekiston kartasi, ob-havo va asosiy ko'rsatkichlar

> **Sana:** 2026-10-22 · **Versiya:** 1
> **Talab (jurabek, 2026-10-22):** bosh sahifada O'zbekiston kartasi, ob-havo va asosiy statistik ma'lumotlardan **kamida 4 tasi** ko'rinib tursin, ularni **boshqarish** (sozlash) mumkin bo'lsin.
> **Talqin:** "boshqarish" ikki darajada: (1) **foydalanuvchi** vidjetlarni yoqib-o'chiradi, tartibini o'zgartiradi, hududni tanlaydi; (2) **admin** standart to'plamni va qaysi vidjetlar umuman mavjudligini belgilaydi. Faqat bittasi kerak bo'lsa, 10-bo'limdagi OS-BV-01 ga qarang.
> **Qaysi hujjatga bo'ysunadi:** [`HIBRID_DIZAYN.md`](HIBRID_DIZAYN.md) (tokenlar `--ds-*`, komponentlar 4-bo'lim, bosh sahifa 6.2, qadamlar H0..H13). Karta ma'lumoti [`SIAT_KARTA_TAHLIL.md`](SIAT_KARTA_TAHLIL.md) (KR-01..KR-06) dan. Ziddiyat bo'lsa HIBRID_DIZAYN ustun.
> **Kim bajaradi:** foydalanuvchi kompyuteridagi Claude Code, `mystat` repo'sida. Repo bu muhitda yo'q edi, "(aniqlash kerak)" joylar koddan topiladi.

---

## 0. Qisqacha

1. Bosh sahifaga bitta yangi blok qo'shiladi: **"O'zbekiston bugun"** (`HomeDashboard`). Joyi: hero'dan keyin, HIBRID_DIZAYN 6.2 dagi **1a-blok**.
2. Blok ichida uch xil vidjet: **karta** (14 hudud, tanlangan ko'rsatkich bo'yicha bo'yalgan), **ob-havo** (tanlangan hudud markazi, 3 kunlik), **ko'rsatkich kartochkalari** (standart 4 ta, jami 8 tadan tanlanadi).
3. Tepada bitta **hudud tanlovi** (Respublika yoki 14 hududdan biri). U uchala vidjetni bir vaqtda o'zgartiradi. Kartada hududni bosish ham shu tanlovni o'zgartiradi.
4. **"Sozlash"** tugmasi yon panel (`Drawer`) ochadi: vidjetni yoqish/o'chirish, tartib (sudrash va ↑/↓ tugmalari), karta ko'rsatkichi, "Standartga qaytarish". Kamida **4 ta ko'rsatkich kartochkasi** doim yoqilgan qoladi (talab shu).
5. Sozlamalar mehmonda brauzerda (`localStorage`), kirgan foydalanuvchida akkauntda saqlanadi. Admin standart to'plamni Django admin'da o'zgartiradi.
6. Hamma raqam backend'dan keladi, brauzer SIAT yoki ob-havo xizmatiga to'g'ridan-to'g'ri so'rov yubormaydi (SIAT_KARTA_TAHLIL 2.5 qoidasi). Har raqam ostida `SourceNote`.
7. Kod 7 qadamda (BV-1..BV-7), H10 ni kutmaydi: blok hozirgi bosh sahifaga qo'shiladi, H10 da 6.2 tartibidagi joyiga o'tadi.

---

## 1. Bosh sahifadagi joyi

HIBRID_DIZAYN 6.2 jadvaliga qo'shiladigan qator:

| # | Blok | Komponent | Hozirgi komponent (qayta ishlatiladi) |
|---|---|---|---|
| **1a** | **"O'zbekiston bugun":** hudud tanlovi · karta · ob-havo · 4–8 ko'rsatkich kartochkasi · "Sozlash" | `HomeDashboard` (`components/home/`) | `ChoroplethMap` (compact rejim), `StatCard`, `HomeHighlights.tsx` ma'lumoti (`fetchDashboards`) |

Hero'dagi jonli aholi soni (1-blok) qoladi. 1a-blokdagi "Aholi soni" kartochkasi yillik rasmiy qiymat (SIAT 246), hero'dagisi esa aholi soati. Ikkalasining farqi kartochka izohida yoziladi ("2026 yil boshiga, rasmiy"), raqamlar bir-biriga zid ko'rinmasin.

4-blok (trend `IndicatorCard` lar) o'zgarmaydi: 1a qisqa "bugungi holat", 4-blok esa batafsil grafiklar. Bir xil ko'rsatkich ikkalasida bo'lsa ham, 1a dan "Ko'rsatkichni ochish →" xuddi shu `/indicators/:key` ga olib boradi.

---

## 2. Maket

### 2.1. Desktop (≥ 1280 px, kontent 1200 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ O'zbekiston bugun                    Hudud: [ Respublika        ▾ ]  ⚙ Sozlash │
├──────────────────────────────────────────────┬───────────────────────────────┤
│  KARTA (7/12 ustun)                          │  OB-HAVO (5/12 ustun)         │
│  Ko'rsatkich: [ Aholi soni ▾ ]  2026         │  Toshkent shahri              │
│   ┌──────────────────────────────────┐       │   ☀  +18°   his: +16°         │
│   │   14 hudud, kvantil 5 sinf       │       │   Ochiq · shamol 3 m/s · 41%  │
│   │   tanlangan hudud qalin chegara  │       │  ─────────────────────────    │
│   └──────────────────────────────────┘       │  Pay  ⛅ +17° / +8°           │
│  ▭▭▭▭▭ legenda · ▨ Ma'lumot yo'q             │  Shan 🌧 +12° / +6°           │
│  Manba: SIAT 246 · 2026 · Yangilangan: …     │  Yak  ☀ +15° / +5°           │
│  Kartani to'liq ochish →                     │  Manba: … · 10:40 holatiga    │
├──────────────┬──────────────┬──────────────┬─┴─────────────┬─────────────────┤
│ Aholi soni   │ YaIM o'sishi │ Inflyatsiya  │ Ishsizlik     │  (5–8-kartochka │
│ 38,2 mln     │ 6,5 %        │ 8,9 %        │ 5,5 %         │   yoqilgan      │
│ ▲ 2,1 % yil  │ ▼ 0,3 p.p.   │ ▼ 1,1 p.p.   │ ▼ 0,3 p.p.    │   bo'lsa shu    │
│ ~~~~ mini    │ ~~~~         │ ~~~~         │ ~~~~          │   qatorda davom │
│ 2026 · SIAT  │ 2025 · SIAT  │ 2025-09 · …  │ 2025 · SIAT   │   etadi)        │
└──────────────┴──────────────┴──────────────┴───────────────┴─────────────────┘
```

Raqamlar maketdagi **namuna**, haqiqiy qiymat API'dan. Kartochkalar to'ri: `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`, 1200 px da bir qatorda 4 ta (5–8 tasi ikkinchi qatorga).

### 2.2. Planshet (768–1279 px)

Karta va ob-havo **ustma-ust** emas, yonma-yon 1:1 (karta kichikroq). Kartochkalar 2 ustun.

### 2.3. Mobil (< 768 px)

```
┌─────────────────────────────┐
│ O'zbekiston bugun     ⚙     │
│ [ Respublika            ▾ ] │
├─────────────────────────────┤
│ ┌───────────┐┌───────────┐  │   ← kartochkalar birinchi (2 ustun),
│ │Aholi soni ││YaIM o'sish│  │     chunki mobilda raqam muhimroq
│ └───────────┘└───────────┘  │
│ ┌───────────┐┌───────────┐  │
│ │Inflyatsiya││Ishsizlik  │  │
│ └───────────┘└───────────┘  │
├─────────────────────────────┤
│ ☀ +18° Toshkent sh.  ›      │   ← ob-havo bitta qator, bosilsa
├─────────────────────────────┤     3 kunlik ochiladi (accordion)
│ KARTA (balandligi 260 px)   │
│ bosilsa pastdan hudud       │
│ kartochkasi chiqadi         │
└─────────────────────────────┘
```

Mobilda tartib sozlamadan qat'i nazar: kartochkalar → ob-havo → karta (OS-BV-05). Gorizontal skroll yo'q (HIBRID 1-bo'lim qoidasi).

---

## 3. Vidjetlar

### 3.1. Karta vidjeti (`HomeMap`)

| Narsa | Qaror |
|---|---|
| Asos | Mavjud `ChoroplethMap`, yangi `variant="compact"` prop: zoom tugmalari yo'q, viloyat nomlari faqat ≥ 1024 px da, balandlik 360 px (mobil 260) |
| Daraja | Faqat **14 hudud** (`regions.geojson`, KR-04). Tumanlar bosh sahifada yo'q, "Kartani to'liq ochish →" `/regions?ind=246&p=2026&r=1735` ga (KR-07, KR-08 URL formati) |
| Ko'rsatkich tanlovi | Ochiluvchi ro'yxat, faqat `geo_level` = `region` yoki `district` bo'lgan ko'rsatkichlar (KR-02). Standart: **Aholi soni (246)**. Ro'yxat 3.3 dagi kartochkalar katalogidan + admin qo'shganlari |
| Moslashtirish | Faqat SOATO kodi bo'yicha (`feature.properties.soato`), nom bo'yicha emas (KR-03, N1) |
| Rang | Kvantil 5 sinf, ma'lumot palitrasi tokenga o'tkazilmaydi (HIBRID 3.1). Respublika qiymati shkalaga kirmaydi, legendada alohida chiziq (N5). `null` = shtrixli kulrang, legendada "Ma'lumot yo'q" (N2) |
| Tanlangan hudud | Qalin chegara `--ds-text`, qolganlari 70 % shaffoflik emas, o'zgarishsiz (rang ma'nosi buzilmasin) |
| Bosish | Hudud tanlovini o'zgartiradi (4-bo'lim). Qayta bosish "Respublika" ga qaytaradi |
| Tooltip | Hudud nomi, qiymat, birlik, davr, "14 dan N-o'rin", dastlabki bo'lsa "dastlabki" (N9) |
| Ixtiyoriy qatlam | **"Ob-havo qatlami"** tumblari: har hudud markazida harorat yorlig'i (`+18°`), choropleth o'rniga neytral fon. OS-BV-04, standart o'chiq |
| Klaviatura | Karta `role="img"` + `aria-label` (ko'rsatkich va eng yuqori/past hudud). Klaviatura bilan hudud tanlash tepadagi hudud tanlovi orqali, SVG ichida tab to'xtashi yo'q |
| Eksport | Bosh sahifada yo'q, to'liq karta sahifasida (KR-12) |

### 3.2. Ob-havo vidjeti (`WeatherWidget`)

| Narsa | Qaror |
|---|---|
| Joy | Tanlangan hududning markaziy shahri (5.3 jadvali). "Respublika" tanlanganda **Toshkent shahri** |
| Hozirgi holat | Harorat (`--ds-font-kpi`), "his qilinadi", holat matni ("Ochiq", "Bulutli", "Yomg'ir"…), shamol m/s, namlik %. Belgisi o'zimizning SVG to'plam (`components/home/weatherIcons.tsx`, 8 ta: ochiq, oz bulutli, bulutli, tuman, yomg'ir, qor, momaqaldiroq, shamol). Boshqa saytdan ikonka ko'chirilmaydi |
| Prognoz | 3 kun: kun nomi, belgi, maks / min. Ixtiyoriy (sozlamada "Prognozni ko'rsatish") |
| Birlik | °C, m/s, % (sozlanmaydi) |
| Manba va vaqt | `SourceNote`: "Manba: [provayder] · 10:40 holatiga". Ma'lumot 2 soatdan eski bo'lsa matn `--ds-warning` rangida "Yangilanmagan" belgisi bilan |
| Xato | Vidjet ichida qisqa `ErrorState` ("Ob-havo hozircha mavjud emas"), qolgan vidjetlar ishlayveradi. Bo'sh joy qolmasin: ob-havo xato bo'lsa karta 12 ustunga kengayadi |
| Rang | Harorat raqami oddiy `--ds-text` (issiq/sovuq rangga bo'yalmaydi, kontrast va rang ko'rmaslik uchun) |
| A11y | `aria-live="polite"` faqat hudud almashganda yangi qiymatni o'qiydi; belgi `aria-hidden`, holat matn bilan yozilgan |

### 3.3. Ko'rsatkich kartochkalari (`HomeStatCard`, ichida ds `StatCard`)

Har kartochka: sarlavha · katta raqam (`--ds-font-kpi`, `tabular-nums`) · birlik · o'zgarish (▲/▼ + matn, "o'tgan yilga nisbatan") · mini grafik (oxirgi 10 davr, Recharts `Sparkline`, oxirgi nuqta `--ds-series-highlight`) · `SourceNote` (manba, davr) · butun kartochka havola → `/indicators/:key`.

**Katalog** (`config/homeWidgets.ts`). Standart yoqilganlar ★:

| Kalit | Ko'rsatkich | Manba | Hudud kesimi | O'zgarish | Izoh |
|---|---|---|---|---|---|
| ★ `population` | Doimiy aholi soni | SIAT 246 | hudud, tuman | % yilga | "yil boshiga, rasmiy" |
| ★ `gdp_growth` | YaIM o'sish sur'ati | SIAT 658 (hududiy) + respublika YaIM o'sishi (ID aniqlash kerak, 1.01) | hudud | p.p. | |
| ★ `inflation` | Inflyatsiya (ISN, yillik) | SIAT 1.11.01 respublika qatori (ID aniqlash kerak) yoki mavjud `/cpi-calculator` manbasi | faqat respublika* | p.p. | oylik |
| ★ `unemployment` | Ishsizlik darajasi | SIAT 1875 | hudud, tuman | p.p. | |
| `wage` | O'rtacha oylik ish haqi | SIAT 500 | hudud, tuman | % yilga | so'm, to'liq raqam |
| `gdp_per_capita` | Aholi jon boshiga YaIM | SIAT 660 | hudud | % yilga | ming so'm |
| `trade_turnover` | Tashqi savdo aylanmasi | mavjud `external-trade/summary/` (H6) | faqat respublika* | % yilga | mlrd AQSh dollari |
| `enterprises` | Faoliyat yuritayotgan korxonalar | SIAT 1.09 (ID aniqlash kerak) | hudud | % yilga | |

\* **Faqat respublika kesimida** bo'lgan kartochka hudud tanlanganda ham respublika qiymatini ko'rsatadi, sarlavha ostida kichik belgi: "Respublika bo'yicha" (`--ds-text-muted`). Kartochka yashirilmaydi, shunda 4 ta minimum hudud tanlanganda ham buzilmaydi.

**Qoidalar:**
- Ma'lumot yo'q kartochka ko'rsatilmaydi (HIBRID 4.1 `StatCard` qoidasi). Agar shu sababli yoqilganlar 4 tadan kamaysa, katalogdagi navbatdagi ma'lumoti bor kartochka avtomatik qo'shiladi (sozlamaga yozilmaydi, faqat ko'rinishda).
- Raqam formati HIBRID 3.5: `38 214 700` yoki qisqartma `38,2 mln` (kartochkada qisqartma, tooltip'da to'liq).
- Dastlabki qiymat: raqam yonida "dastlabki" belgisi (N9).
- `DEBUG=True` dagi namuna qiymatlar `SampleBadge` bilan, production'da namuna ko'rsatilmaydi.

---

## 4. Hudud tanlovi (`RegionSelect`)

- Ro'yxat: **Respublika** + 14 hudud (`Territory` jadvalidan, KR-01; jadval hali yo'q bo'lsa `config/regions.ts`, 5.3 dagi kodlar bilan). Uch tilda nom.
- Holat bitta joyda: `useHomeLayout()` ichidagi `region` (SOATO, `1700` = Respublika). URL'da ham: `/?r=1735` (havola bilan ulashish, sahifa yangilansa saqlanadi). URL > foydalanuvchi sozlamasi > admin standarti.
- O'zgarganda: kartada hudud ajratiladi, kartochkalar shu hudud qiymatiga o'tadi (bo'lmasa respublika, belgi bilan), ob-havo markaziy shaharga o'tadi. Bitta API so'rovi (5.1).
- Komponent: ds `Select` (UI kutubxonadagi), qidiruvli (14 band uchun ham yozib topish qulay), `aria-label="Hudud"`.
- ✱ Ixtiyoriy: "Mening hududim" (geolokatsiya ruxsati bilan, KR-13 bilan bir xil mantiq). Rad etilsa hech narsa o'zgarmaydi. Standart o'chiq.

---

## 5. Ma'lumot manbalari va API

### 5.1. `GET /api/common/home/widgets/?region=1735&cards=population,gdp_growth,inflation,unemployment`

Bitta so'rov bilan barcha kartochkalar (tarmoq so'rovlari soni kam, CLS kam).

```json
{
  "region": { "soato": "1735", "name": "Qoraqalpog'iston Respublikasi" },
  "cards": [
    {
      "key": "population",
      "indicator_key": "population-total",
      "title": "Doimiy aholi soni",
      "value": 2058.3, "unit": "ming kishi", "period": "2026",
      "change": { "value": 1.6, "kind": "percent", "direction": "up", "base_period": "2025" },
      "sparkline": [[2017, 1848.1], "…", [2026, 2058.3]],
      "scope": "region",
      "preliminary": false,
      "source": { "name": "SIAT", "id": 246, "url": "https://siat.stat.uz/data/246/" },
      "updated_at": "2026-03-30T17:48:46+05:00"
    }
  ]
}
```

- `scope`: `region` yoki `country` (hudud kesimi yo'q, respublika qiymati qaytdi).
- Ma'lumot `SiatValue` dan (KR-01). KR-01 hali tayyor bo'lmasa: mavjud `fetchDashboards` manbasidan (`HomeHighlights.tsx` ishlatadigan), faqat respublika, hammasi `scope: "country"`. Yangi sintetik ma'lumot yaratilmaydi.
- Kesh: 1 soat, kalit `region + cards`; `sync_siat` tugaganda tozalanadi.
- `cards` bo'sh bo'lsa admin standart to'plami.
- Ruxsat: ochiq (mehmon ham), throttle mavjud `AnonRateThrottle`.

### 5.2. `GET /api/common/weather/?region=1735`

```json
{
  "city": "Nukus", "soato": "1735",
  "observed_at": "2026-10-22T10:40:00+05:00",
  "current": { "temp": 14.2, "feels_like": 12.8, "code": "partly_cloudy", "wind_ms": 4.1, "humidity": 48 },
  "daily": [ { "date": "2026-10-23", "code": "rain", "t_max": 12, "t_min": 5 } ],
  "source": { "name": "…", "url": "…", "license": "…" },
  "stale": false
}
```

- Backend provayderga **hudud markazlari koordinatasi** bilan so'rov yuboradi (5.3), javobni o'z `code` lug'atiga moslaydi (frontend provayderni bilmaydi, almashtirish oson).
- Kesh: 30 daqiqa, 14 shahar uchun Celery Beat vazifasi har 30 daqiqada hammasini oldindan oladi (foydalanuvchi so'rovi provayderga bormaydi). Celery Beat yo'q bo'lsa, birinchi so'rovda olinadi va keshlanadi.
- Provayder ishlamasa: oxirgi keshdagi qiymat `stale: true` bilan; umuman yo'q bo'lsa `503`, frontend vidjet ichida xato ko'rsatadi.
- Timeout 5 s, 2 marta qayta urinish, `https` only.

**Provayder (OS-BV-02):**

| Variant | Afzallik | Kamchilik |
|---|---|---|
| **O'zgidromet** (rasmiy, meteo.uz) | Davlat manbasi, davlat portali uchun eng to'g'ri | Ochiq hujjatlashtirilgan API topilmadi, kelishuv kerak |
| **Open-Meteo** | Kalitsiz, ochiq ma'lumot (CC BY 4.0), tez ulanadi | Bepul API notijorat foydalanish uchun; portalda pullik tariflar bor, shuning uchun tijorat rejasi yoki o'z serverida (open-source) ishga tushirish kerak bo'lishi mumkin |

**Default:** kod provayderdan mustaqil (`weather/providers/{base,open_meteo,uzhydromet}.py`), birinchi bo'lib Open-Meteo ulanadi, `SourceNote` da atribusiya bilan. Production'dan oldin litsenziya masalasi hal qilinadi; O'zgidromet bilan kelishuv bo'lsa sozlamadagi bitta qiymat (`WEATHER_PROVIDER`) bilan almashadi.

### 5.3. Hudud markazlari (`config/regions.ts` va backend `weather/regions.py`)

SOATO kodlari va koordinatalar `Territory` jadvali bilan solishtirilsin (aniqlash kerak).

| SOATO | Hudud | Markaz | Kenglik, uzunlik |
|---|---|---|---|
| 1700 | Respublika | Toshkent | 41.31, 69.28 |
| 1735 | Qoraqalpog'iston Respublikasi | Nukus | 42.46, 59.60 |
| 1703 | Andijon | Andijon | 40.78, 72.34 |
| 1706 | Buxoro | Buxoro | 39.77, 64.42 |
| 1708 | Jizzax | Jizzax | 40.12, 67.84 |
| 1710 | Qashqadaryo | Qarshi | 38.86, 65.79 |
| 1712 | Navoiy | Navoiy | 40.10, 65.38 |
| 1714 | Namangan | Namangan | 41.00, 71.67 |
| 1718 | Samarqand | Samarqand | 39.65, 66.96 |
| 1722 | Surxondaryo | Termiz | 37.22, 67.28 |
| 1724 | Sirdaryo | Guliston | 40.49, 68.78 |
| 1726 | Toshkent shahri | Toshkent | 41.31, 69.28 |
| 1727 | Toshkent viloyati | Nurafshon | 41.04, 69.36 |
| 1730 | Farg'ona | Farg'ona | 40.39, 71.78 |
| 1733 | Xorazm | Urganch | 41.55, 60.63 |

### 5.4. Karta ma'lumoti

Yangi endpoint yo'q: KR-05 dagi `GET /api/common/map/values/?indicator=246&period=latest&level=region`. KR-05 hali tayyor bo'lmasa, karta hozirgi `/regions` sahifasi qanday ma'lumot olsa, shundan oladi (aniqlash kerak, SIAT_KARTA_TAHLIL 7.1-savol) va KR-06 tuzatishlari (`null` rangi, respublika shkaladan tashqari) shu yerda ham qo'llanadi.

---

## 6. Boshqarish

### 6.1. Foydalanuvchi: "Sozlash" paneli (`HomeSettingsDrawer`)

O'ng tomondan chiquvchi `Drawer` (mobilda pastdan, to'liq balandlik). Sarlavha "Bosh sahifani sozlash".

```
┌ Bosh sahifani sozlash ─────────── ✕ ┐
│ Hudud           [ Respublika     ▾ ] │
│                                       │
│ Vidjetlar                             │
│  ⠿ Karta                    [● on ]  │
│     Ko'rsatkich [ Aholi soni ▾ ]      │
│  ⠿ Ob-havo                  [● on ]  │
│     ☐ 3 kunlik prognoz                │
│                                       │
│ Ko'rsatkichlar (kamida 4 ta)  4 / 8  │
│  ⠿ Aholi soni        ↑ ↓   [● on ]   │
│  ⠿ YaIM o'sishi      ↑ ↓   [● on ]   │
│  ⠿ Inflyatsiya       ↑ ↓   [● on ]   │
│  ⠿ Ishsizlik         ↑ ↓   [● on ]   │
│  ⠿ O'rtacha ish haqi ↑ ↓   [○ off]   │
│  ⠿ …                                  │
│                                       │
│ ⓘ Sozlamalar shu brauzerda saqlanadi. │
│   Kirsangiz, akkauntingizda saqlanadi │
│                                       │
│ [ Standartga qaytarish ]   [ Tayyor ] │
└───────────────────────────────────────┘
```

| Qoida | Tafsilot |
|---|---|
| Yoqish/o'chirish | `role="switch"`, `aria-checked`. O'zgarish **darhol** sahifada ko'rinadi (oldindan ko'rish), "Tayyor" faqat panelni yopadi |
| Minimum 4 | 4 ta kartochka yoqilgan bo'lsa, ularning tumblari o'chirilmaydi (`aria-disabled`), yonida izoh: "Kamida 4 ta ko'rsatkich ko'rinib turadi. Boshqasini almashtirish uchun avval yangisini yoqing". Maksimum 8 (katalog hajmi) |
| Karta va ob-havo | O'chirsa bo'ladi. Ikkalasi o'chsa, kartochkalar to'ri butun kenglikda |
| Tartib | Sudrash (`@dnd-kit/sortable`, loyihada boshqa DnD kutubxona bo'lsa o'sha; yangi paket uchun ruxsat so'raladi) **va** ↑/↓ tugmalari (klaviatura va ekran o'quvchi uchun majburiy). Ko'chirilganda `aria-live`: "Inflyatsiya 2-o'ringa ko'chirildi". Tartib ikki guruh ichida: vidjetlar (karta, ob-havo) va kartochkalar alohida |
| Standartga qaytarish | Tasdiq so'ramaydi, lekin 5 s davomida "Bekor qilish" `Snackbar`i |
| `Escape` | Panelni yopadi, fokus "Sozlash" tugmasiga qaytadi |

### 6.2. Saqlash

```ts
// frontend/src/config/homeWidgets.ts
export type HomeLayout = {
  version: 1;
  region: string;              // SOATO, '1700' = Respublika
  widgets: { key: 'map' | 'weather'; enabled: boolean }[];   // tartib = massiv tartibi
  cards: { key: HomeCardKey; enabled: boolean }[];
  map: { indicator: HomeCardKey };
  weather: { forecast: boolean };
};
```

| Kim | Qayerda | Qachon |
|---|---|---|
| Mehmon | `localStorage['mystat.home.layout']`, har o'qish va yozish `try/catch` ichida; buzilgan yoki eski `version` → admin standarti | Har o'zgarishda (300 ms debounce) |
| Kirgan foydalanuvchi | `GET/PUT /api/accounts/me/preferences/home/` (JSON, server tomonda sxema tekshiruvi: noma'lum kalit tashlanadi, minimum 4 qoidasi serverda ham) | Har o'zgarishda (1 s debounce) |
| Kirish paytida | `localStorage` dagi sozlama bor va akkauntda yo'q bo'lsa, akkauntga ko'chiriladi (bir marta) | Login'dan keyin |

Backend: `UserPreference` modeli (`user` OneToOne, `home_layout` JSONField, `updated_at`), mavjud `accounts` ilovasida. Bunday model allaqachon bo'lsa, unga maydon qo'shiladi. Bu HIBRID 8.0-2 qoidasidan **aniq yozilgan istisno** (yangi model va endpoint shu hujjatda belgilangan).

### 6.3. Admin: standart to'plam

Django admin'da `HomeWidgetSettings` (singleton, `apps/common`):

| Maydon | Nima |
|---|---|
| `available_cards` | Katalogdan qaysi kartochkalar foydalanuvchiga taklif qilinadi (masalan `enterprises` ma'lumoti tayyor bo'lmaguncha o'chiq) |
| `default_cards` | Standart yoqilganlar va tartibi (kamida 4, admin formasi tekshiradi) |
| `default_map_indicator` | Standart karta ko'rsatkichi |
| `weather_enabled` | Ob-havo vidjeti umuman bormi (provayder masalasi hal bo'lmaguncha o'chirish mumkin) |
| `map_enabled` | Karta vidjeti umuman bormi |

Frontend buni `GET /api/common/home/settings/` dan oladi (kesh 10 daqiqa). Foydalanuvchi sozlamasida admin o'chirgan kartochka bo'lsa, u e'tiborsiz qoldiriladi va minimum 4 navbatdagisi bilan to'ldiriladi. Yangi kartochka turini qo'shish **kod** bilan (`homeWidgets.ts` + backend resolver), admin faqat mavjudlarini boshqaradi (OS-H-19 dagi "statik konfiguratsiya" yondashuviga mos).

---

## 7. Holatlar, tezlik, a11y

- **Yuklanish:** har vidjet o'z `Skeleton`ida, balandliklar oldindan band qilinadi (karta 360 px, ob-havo 360 px, kartochka 168 px). Maqsad CLS ≤ 0,1 (HIBRID 6.2).
- **Tartib:** kartochkalar va ob-havo birinchi ekranda so'raladi; karta GeoJSON va qiymatlari `IntersectionObserver` bilan (ko'rinish zonasiga kirganda), `React.lazy`.
- **Hudud almashganda:** oldingi so'rov `AbortController` bilan bekor (KR-06.4), eski qiymat yangi kelguncha xira emas, ustida kichik yuklanish belgisi.
- **Xato:** vidjet darajasida, sahifa darajasida emas. Bitta vidjet xatosi boshqalarini to'xtatmaydi (`ErrorBoundary` har vidjetda).
- **Tema:** kunduzgi/tungi rejim faqat `--ds-*` tokenlari bilan; ob-havo belgilari `currentColor`.
- **Til:** uz / cry / ru, barcha matnlar i18n kalitlarida (`home.dashboard.*`), hudud va shahar nomlari `Territory` dan. Ob-havo holat matnlari o'z lug'atimizdan (`weather.code.*`), provayder matni ishlatilmaydi.
- **A11y:** blok `section aria-labelledby`, H2 "O'zbekiston bugun"; kartochka butunligicha bitta havola (`a`, ichida sarlavha va qiymat o'qiladi); o'zgarish ▲/▼ va matn bilan, faqat rang emas; Lighthouse a11y ≥ 95 saqlanadi.

---

## 8. Fayllar

| Fayl | Nima |
|---|---|
| ✚ `frontend/src/config/homeWidgets.ts` | Katalog (3.3), `HomeLayout` turi, standart, `normalizeLayout()` (minimum 4, noma'lum kalitlar) |
| ✚ `frontend/src/config/regions.ts` | 5.3 jadvali (`Territory` API tayyor bo'lguncha) |
| ✚ `frontend/src/hooks/useHomeLayout.ts` | Holat: URL `?r=`, `localStorage`, server sozlamasi, admin standarti; `setRegion`, `toggle`, `move`, `reset` |
| ✚ `frontend/src/components/home/HomeDashboard.tsx` | 1a-blok, to'r, tartib |
| ✚ `frontend/src/components/home/HomeMap.tsx` | `ChoroplethMap variant="compact"` o'rami, ko'rsatkich tanlovi, legenda |
| ✚ `frontend/src/components/home/WeatherWidget.tsx`, `weatherIcons.tsx` | 3.2 |
| ✚ `frontend/src/components/home/HomeStatCard.tsx` | ds `StatCard` + sparkline + `SourceNote` |
| ✚ `frontend/src/components/home/HomeSettingsDrawer.tsx` | 6.1 |
| ✚ `frontend/src/components/home/RegionSelect.tsx` | 4-bo'lim |
| ✎ `ChoroplethMap` (aniqlash kerak) | `variant="compact"`, `selected`, `onRegionClick` prop'lari; mavjud sahifalardagi xatti-harakat o'zgarmaydi |
| ✎ bosh sahifa fayli (aniqlash kerak) | `Banner` dan keyin `<HomeDashboard />` |
| ✚ `backend/apps/common/home/{views,serializers,resolvers,urls}.py` | 5.1, 6.3 endpoint'lari; har kartochka kaliti uchun resolver (SIAT yoki mavjud manba) |
| ✚ `backend/apps/common/weather/{providers/,regions.py,service.py,tasks.py,views.py}` | 5.2 |
| ✚ `backend/apps/common/models.py` → `HomeWidgetSettings` + admin + migratsiya | 6.3 |
| ✚/✎ `backend/apps/accounts/models.py` → `UserPreference` + endpoint + migratsiya | 6.2 |
| ✎ `settings` | `WEATHER_PROVIDER`, `WEATHER_CACHE_SECONDS=1800`, Celery Beat jadvali (bor bo'lsa) |

`backend/apps/payment/` va xavfsizlik sozlamalariga tegilmaydi (HIBRID 1-bo'lim).

---

## 9. Kod qadamlari (BV-1..BV-7)

Qoidalar HIBRID 8.0 dagidek: har qadam alohida branch `task/BV<raqam>-<nom>` va PR, 9.1 buyruqlari, 360/768/1280 skrinshotlari, `CLAUDE_HISOBOT.md` jurnaliga yozuv. Butun blok `VITE_HOME_WIDGETS` bayrog'i ostida (standart `false`, BV-6 qabul qilingach `true`).

**HIBRID tartibidagi o'rni:** BV-1 va BV-2 H1 dan keyin istalgan payt (H2 dagi `StatCard`, `SourceNote`, `Skeleton` kerak, H2 hali bo'lmasa shu PR'da faqat kerakli uchtasi H2 4.1 spetsifikatsiyasi bo'yicha yoziladi, keyin H2 ularni qayta ishlatadi). Karta qismi (BV-4) KR-04..KR-06 dan keyin to'liq ishlaydi, undan oldin hozirgi karta manbasi bilan. H10 da blok 6.2 dagi 1a joyiga ko'chadi, qayta yozilmaydi.

| Qadam | Nima | Bog'liq | Ko'rinadimi |
|---|---|---|---|
| **BV-1** | Backend: kartochkalar API (5.1), admin standarti (6.3) | KR-01 bo'lsa SIAT, bo'lmasa mavjud manba | Yo'q |
| **BV-2** | Frontend: `homeWidgets.ts`, `regions.ts`, `useHomeLayout`, `HomeStatCard`, `HomeDashboard` (faqat kartochkalar) | BV-1, H1 | Ha (bayroq bilan) |
| **BV-3** | Ob-havo: backend provayder + kesh (5.2), `WeatherWidget` | BV-2 | Ha |
| **BV-4** | Karta: `ChoroplethMap` compact, `HomeMap`, hudud bosish | BV-2, (KR-05/06) | Ha |
| **BV-5** | Sozlash paneli, `localStorage`, URL `?r=` | BV-2..BV-4 | Ha |
| **BV-6** | Akkauntda saqlash (`UserPreference`), login'da ko'chirish; bayroqni yoqish | BV-5 | Ha |
| **BV-7** | Testlar va a11y yakuni, ixtiyoriy: ob-havo qatlami, "Mening hududim" | BV-6 | Ha |

### BV-1 · Kartochkalar API va admin standarti

- **Qadamlar:** `resolvers.py` da har kalit uchun funksiya `(region_soato) -> CardData | None` (SIAT `SiatValue` yoki mavjud manba). `HomeWidgetSettings` singleton + admin forma (kamida 4 tekshiruvi). `GET /api/common/home/widgets/`, `GET /api/common/home/settings/`, kesh 1 soat, `sync_siat` signali keshni tozalaydi.
- **Tekshiruv:** 9.1; testlar: `region=1735` uchun `inflation` → `scope: "country"`; ma'lumoti yo'q kalit javobda yo'q; respublika qatori (1700) hudud qiymati sifatida qaytmaydi (N5); `missing` → kartochka yo'q, 0 emas.

```text
mystat repo'sida mystat/BOSH_SAHIFA_VIDJETLAR.md dagi BV-1 ni bajar (5.1 va 6.3).
Avval KR-01 (SiatValue) bormi va HomeHighlights.tsx / fetchDashboards qaysi endpoint'dan
olishini top, hisobot ber. Sintetik ma'lumot yaratma. payment/ ga tegma. Branch task/BV1-home-api.
```

### BV-2 · Kartochkalar va blok karkasi

- **Qadamlar:** 3.3, 4, 7-bo'limlar. `useHomeLayout` hozircha faqat admin standarti va URL `?r=`. `HomeDashboard` bosh sahifada `Banner` dan keyin, `VITE_HOME_WIDGETS=true` bo'lsa. Mobil tartib 2.3.
- **Tekshiruv:** 9.1; Vitest: `normalizeLayout` (3 ta yoqilgan → 4 ga to'ldiriladi; noma'lum kalit tashlanadi; eski `version` → standart); 360 px da gorizontal skroll yo'q; CLS ≤ 0,1.

```text
mystat repo'sida mystat/BOSH_SAHIFA_VIDJETLAR.md dagi BV-2 ni bajar (3.3, 4, 7).
StatCard/SourceNote/Skeleton components/ds da bormi tekshir, bo'lmasa HIBRID_DIZAYN 4.1 bo'yicha
faqat shu uchtasini yoz. Ranglar faqat --ds-* tokenlaridan. VITE_HOME_WIDGETS bayrog'i bilan.
```

### BV-3 · Ob-havo

- **Qadamlar:** 3.2, 5.2, 5.3. `providers/base.py` interfeysi, `open_meteo.py` birinchi provayder, `code` lug'ati, kesh va Beat vazifasi. Frontend `WeatherWidget`, 8 ta o'z SVG belgisi.
- **Tekshiruv:** 9.1; provayder mock bilan: ishlamasa `stale: true` keshdan; kesh yo'q va ishlamasa `503` va vidjetda xato, boshqa vidjetlar ishlaydi; javobda provayder xom maydonlari yo'q.

```text
mystat repo'sida mystat/BOSH_SAHIFA_VIDJETLAR.md dagi BV-3 ni bajar (3.2, 5.2, 5.3).
Provayderni almashtiriladigan qil (WEATHER_PROVIDER). Brauzer provayderga to'g'ridan-to'g'ri
murojaat qilmasin. Boshqa saytdan ikonka ko'chirma. Branch task/BV3-weather.
```

### BV-4 · Karta

- **Qadamlar:** 3.1, 5.4. `ChoroplethMap` ga `variant`, `selected`, `onRegionClick` prop'lari, mavjud chaqiriqlar o'zgarishsiz. Ko'rsatkich ro'yxati faqat hudud kesimi borlaridan. Lazy yuklash.
- **Tekshiruv:** 9.1; `/regions` va `/dashboards/*` dagi kartalar oldingidek (skrinshot oldin/keyin); hudud bosilganda kartochkalar va ob-havo o'zgaradi; `null` hudud shtrixli kulrang.

```text
mystat repo'sida mystat/BOSH_SAHIFA_VIDJETLAR.md dagi BV-4 ni bajar (3.1, 5.4).
ChoroplethMap'ni topib, faqat yangi ixtiyoriy prop'lar qo'sh, mavjud sahifalar o'zgarmasin.
Moslashtirish faqat SOATO bo'yicha (SIAT_KARTA_TAHLIL KR-03, KR-06). Ma'lumot ranglarini tokenga o'tkazma.
```

### BV-5 · Sozlash paneli

- **Qadamlar:** 6.1, 6.2 (mehmon qismi). DnD kutubxona loyihada bormi tekshiriladi; yo'q bo'lsa `@dnd-kit/sortable` uchun ruxsat so'raladi, ruxsat bo'lmasa faqat ↑/↓ tugmalari.
- **Tekshiruv:** 9.1; e2e: kartochkani o'chirish, tartibni o'zgartirish, sahifani yangilash → saqlangan; 4 ta qolganda tumbler o'chmaydi; `localStorage` bloklangan (Playwright'da `storageState` siz, `localStorage` xato tashlaydi) holatda sahifa standart bilan ochiladi; klaviatura bilan butun panel boshqariladi, `Escape` fokusni qaytaradi.

```text
mystat repo'sida mystat/BOSH_SAHIFA_VIDJETLAR.md dagi BV-5 ni bajar (6.1, 6.2 mehmon qismi).
Yangi npm paket qo'shishdan oldin ruxsat so'ra. localStorage har chaqiriqda try/catch ichida.
↑/↓ tugmalari majburiy, sudrash qo'shimcha. Branch task/BV5-settings.
```

### BV-6 · Akkauntda saqlash

- **Qadamlar:** 6.2. `UserPreference` (yoki mavjud model), `GET/PUT /api/accounts/me/preferences/home/`, server sxema tekshiruvi, login'dan keyin bir martalik ko'chirish. Staging'da egasiga ko'rsatilgach `VITE_HOME_WIDGETS=true`.
- **Tekshiruv:** 9.1; testlar: boshqa foydalanuvchi sozlamasini o'qib/yozib bo'lmaydi; 3 ta kartochkali `PUT` → 400; noma'lum kalit tashlanadi; `makemigrations --check` toza.

```text
mystat repo'sida mystat/BOSH_SAHIFA_VIDJETLAR.md dagi BV-6 ni bajar (6.2).
Avval accounts ilovasida foydalanuvchi sozlamalari modeli bormi tekshir, bor bo'lsa unga maydon qo'sh.
Autentifikatsiya mantiqiga tegma. Bayroqni yoqishdan oldin egasining ko'rishini kut.
```

### BV-7 · Yakuniy tekshiruv va ixtiyoriy qismlar

- **Qadamlar:** axe (bosh sahifa, panel ochiq va yopiq, ikkala tema), Lighthouse raqamlari PR'da. Ixtiyoriy (OS-BV-04, OS-BV-06 "ha" bo'lsa): kartada ob-havo qatlami, "Mening hududim".
- **Tekshiruv:** 10-bo'limdagi qabul ro'yxati to'liq.

---

## 10. Qabul mezonlari (butun blok)

- [ ] Mehmon bosh sahifani ochganda: karta, ob-havo va **4 ta** ko'rsatkich kartochkasi ko'rinadi, har raqam ostida manba va davr.
- [ ] Hudud tanlansa (ro'yxatdan yoki kartadan) uchala vidjet shu hududga o'tadi, URL `?r=` bilan ulashiladi.
- [ ] Sozlash panelida vidjet yoqiladi/o'chiriladi, tartib o'zgaradi, karta ko'rsatkichi tanlanadi; 4 tadan kam kartochka qoldirib bo'lmaydi.
- [ ] Sahifa yangilansa (mehmon) va boshqa qurilmadan kirsa (kirgan foydalanuvchi) sozlama saqlanadi.
- [ ] Admin standartni o'zgartirsa, sozlamasi yo'q foydalanuvchilarda 10 daqiqa ichida yangi standart.
- [ ] Ob-havo xizmati ishlamasa ham bosh sahifa ochiladi, qolgan vidjetlar ishlaydi.
- [ ] 360 / 768 / 1280 px da gorizontal skroll yo'q, CLS ≤ 0,1, Lighthouse a11y ≥ 95, axe `serious`/`critical` yo'q.
- [ ] uz / cry / ru va kunduzgi/tungi rejimda to'g'ri.

---

## 11. Ochiq savollar

Javob bo'lmasa **default** bilan ishlanadi, hech biri BV-1..BV-3 ni to'xtatmaydi.

| # | Savol | Default | To'xtatadi |
|---|---|---|---|
| **OS-BV-01** | "Boshqarish" kimga kerak: foydalanuvchiga, adminga yoki ikkalasiga? | Ikkalasi (6.1 va 6.3) | — |
| **OS-BV-02** | Ob-havo manbasi: O'zgidromet bilan kelishuv bormi? Open-Meteo bo'lsa, tijorat rejasi yoki o'z serverimiz? | Open-Meteo, production'dan oldin litsenziya hal qilinadi | BV-3 ning production'ga chiqishi |
| **OS-BV-03** | Standart 4 kartochka: aholi, YaIM o'sishi, inflyatsiya, ishsizlik ma'qulmi? | Ha | — |
| **OS-BV-04** | Kartada "ob-havo qatlami" (har hududda harorat) kerakmi? | Ixtiyoriy, BV-7 da, standart o'chiq | — |
| **OS-BV-05** | Mobilda tartib foydalanuvchi sozlamasiga bo'ysunsinmi? | Yo'q, doim kartochkalar → ob-havo → karta | — |
| **OS-BV-06** | "Mening hududim" (geolokatsiya) kerakmi? | Ixtiyoriy, BV-7 da | — |
| **OS-BV-07** | Inflyatsiya va korxonalar soni uchun SIAT ID'lari (1.11.01, 1.09) | BV-1 da `sitemap.xml` va katalogdan aniqlanadi; topilmasa kartochka admin'da o'chiq | `inflation`, `enterprises` kartochkalari |
| **OS-BV-08** | Hero'dagi jonli aholi soni va 1a dagi "Aholi soni" kartochkasi ikkalasi qolsinmi? | Ha, izohda farqi yozilgan (1-bo'lim) | — |
