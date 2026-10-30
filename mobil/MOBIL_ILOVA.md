# my.stat.uz mobil ilovasi: offline namuna ma'lumot bilan (Claude Code uchun topshiriq)

> **Sana:** 2026-10-27 · **Versiya:** 1
> **Egasining talabi (2026-10-27):** mobil ilova qo'shilsin; ma'lumot ilovaning o'zida bo'lsin (internetsiz ishlaydi), loyihadagi ma'lumotlardan olingan test (namuna) ma'lumot bo'lsin.
> **Asos:** [`HIBRID_DIZAYN.md`](HIBRID_DIZAYN.md) (tokenlar `--ds-*`, zonalar, komponentlar), [`BOSH_SAHIFA_VIDJETLAR.md`](BOSH_SAHIFA_VIDJETLAR.md) (hudud, kartochkalar, ob-havo, API shakli), [`HISOBOT_TOPSHIRISH_VA_YANGI_FUNKSIYALAR.md`](HISOBOT_TOPSHIRISH_VA_YANGI_FUNKSIYALAR.md) (HT-01..03: muddat qoidasi, davr qatorlari, holat lug'ati), [`KORXONA_SCORING.md`](KORXONA_SCORING.md) va `korxona_scoring/*.csv` (korxonalar va ball), [`MYGOV_JORIY_ETISH.md`](MYGOV_JORIY_ETISH.md) 4-bo'lim (xizmatlar katalogi), [`stat-hisobot/ANALIZ.md`](../stat-hisobot/ANALIZ.md) (demo shakllar).
> **Namuna ma'lumotlar tayyor:** [`mobil_namuna/`](mobil_namuna/) papkasi (12 ta JSON + `mystat_demo.db` + generator skript). 6-bo'limga qarang.
> **Kim bajaradi:** foydalanuvchi kompyuteridagi Claude Code, `mystat` repo'sida. Repo bu hujjat yozilgan muhitda yo'q edi, shuning uchun frontend fayl yo'llari eski hujjatlardan olingan, "(aniqlash kerak)" joylar koddan topiladi.

---

## 0. Qisqacha

1. **Nima:** my.stat.uz ning Android va iOS ilovasi. Birinchi versiya **to'liq offline**: barcha ma'lumot ilova ichidagi SQLite bazada (`mystat_demo.db`, ~3 MB), tarmoq so'rovi yo'q.
2. **Texnologiya:** **React Native + Expo (TypeScript)**. Sabab: veb frontend allaqachon React + TypeScript, shuning uchun tokenlar, tiplar, i18n kalitlari, formatlash funksiyalari va API mijozining tuzilmasi qayta ishlatiladi (2-bo'lim).
3. **Ekranlar:** 5 ta pastki tab: Bosh · Ko'rsatkichlar · Korxonalar · Xizmatlar · Kabinet. Har ekran veb saytdagi zonasining uslubini oladi (S, G, M), tokenlar bitta `--ds-*` to'plamidan (4-5-bo'lim).
4. **Ma'lumot:** 3000 sintetik korxona va ularning bali (`korxona_scoring/` CSV'laridan), 15 hudud × 8 ko'rsatkich × 2017–2026 (sintetik, seed=42), ob-havo, 50 xizmat, 12 mavzu, 4 demo hisobot shakli va 3 demo korxonaning 126 ta "majburiyat × davr" qatori. Hammasida `is_sample: true`, ekranda doim "Namuna" belgisi.
5. **Keyin API:** ma'lumot qatlami bitta `DataSource` interfeysi orqali. `EXPO_PUBLIC_DATA_MODE=local` bugun, `hybrid` (API + offline kesh) keyin, `api` oxirida. Ekran kodi o'zgarmaydi (8-bo'lim).
6. **Kod tartibi:** 10 qadam (MOB-0..MOB-9), har biri alohida PR, Claude Code uchun tayyor buyruq bilan (9-bo'lim).
7. **Muhim cheklov:** namuna ma'lumotli ilova **do'konga (Play Market / App Store) rasmiy ilova sifatida chiqarilmaydi**. Faqat ichki test (APK, TestFlight) uchun. Sababi HIBRID 1-bo'lim qoidasi: "Demo ma'lumot faqat Namuna belgisi bilan va faqat sinov rejimida".

---

## Mundarija

1. [Maqsad va chegaralar](#1-maqsad-va-chegaralar)
2. [Texnologiya qarori](#2-texnologiya-qarori)
3. [Repo va papka tuzilmasi](#3-repo-va-papka-tuzilmasi)
4. [Dizayn tizimiga moslik](#4-dizayn-tizimiga-moslik)
5. [Ekranlar xaritasi](#5-ekranlar-xaritasi)
6. [Ilova ichidagi namuna ma'lumotlar](#6-ilova-ichidagi-namuna-malumotlar)
7. [Ma'lumot qatlami](#7-malumot-qatlami)
8. [Haqiqiy API ga o'tish rejasi](#8-haqiqiy-api-ga-otish-rejasi)
9. [Kod qadamlari MOB-0..MOB-9](#9-kod-qadamlari)
10. [Tekshiruv](#10-tekshiruv)
11. [Ochiq savollar](#11-ochiq-savollar)

---

## 1. Maqsad va chegaralar

### 1.1. Kim uchun va nima uchun

| Foydalanuvchi | Ilovada nima qiladi | Veb saytdagi joyi |
|---|---|---|
| **Mehmon** (raqam izlaydi) | Hudud tanlab asosiy ko'rsatkichlarni ko'radi, ko'rsatkich grafigini ochadi, mavzular bo'yicha yuradi | S zona: `/`, `/indicators/:key`, `/topics` |
| **Biznes** (kontragent tekshiradi) | STIR yoki nom bo'yicha korxona topadi, ball va ustunlarni ko'radi, hudud/OKED/sinf bo'yicha filtrlaydi | `/check`, `/partners`, `/company/:stir` |
| **Hisobot topshiruvchi** | O'z korxonasining hisobotlari muddatini, holatini va eslatmalarni ko'radi | M zona: `/cabinet`, "Hisobotlarim", `/report-calendar` |
| **Hamma** | Xizmatlar katalogi, xizmat pasporti, veb saytga o'tish havolasi | G zona: `/spheres`, `/service/:number` |

Mobil ilovaning qiymati: tez ochiladi, internet yomon joyda ham ishlaydi, hisobot muddatini telefonga eslatadi.

### 1.2. Ilovada nima yo'q (birinchi versiyada)

- **Shakl to'ldirish yo'q.** Qaror OS-H-14 / OS-MS-07 o'zgarmaydi: my.stat.uz da faqat muddat va holat.
- **To'lov yo'q.** `backend/apps/payment/` ga tegilmaydi. Tariflar, StatCoin, kitob do'koni "Veb saytda ochish" havolasi bilan.
- **Haqiqiy kirish (OneID, ERI) yo'q.** Kabinet demo foydalanuvchi bilan (`demo_user.json`), "Demo rejim" belgisi bilan.
- **Shaxsiy ma'lumot yo'q.** Ilova ichida PINFL, haqiqiy STIR, haqiqiy ism yo'q. Korxonalar `[DEMO]` nomli, STIR `9xxxxxxxx` demo diapazonida (generator shunday yaratgan).
- **Real raqam deb ko'rsatilmaydi.** Ko'rsatkichlar sintetik. Har kartochkada `SampleBadge`, sozlamalarda ma'lumot versiyasi.

### 1.3. Umumiy qoidalar (HIBRID 1-bo'limdan meros)

- 3 til: uz / cry / ru. Kunduzgi va tungi rejim (qurilma sozlamasidan, qo'lda almashtirish bilan).
- 360 px kenglikda gorizontal skroll yo'q (jadval va plitkalar qatoridan tashqari).
- Accessibility: har bosiladigan element ≥ 48×48 dp, `accessibilityLabel`, ekran o'quvchida (TalkBack, VoiceOver) raqamlar to'liq o'qiladi ("38 million 214 ming"), faqat rangga tayanilmaydi.
- Statista, my.gov.uz, my.soliq, my.mehnat logolari, ikonkalari, matnlari ko'chirilmaydi.

---

## 2. Texnologiya qarori

**Tavsiya: React Native + Expo (managed workflow, TypeScript, Expo Router).**

| Mezon | React Native + Expo | Flutter |
|---|---|---|
| Jamoaning mavjud bilimi | Veb frontend React + TS. Bir xil til, bir xil hook'lar | Dart, yangi til |
| Kodni qayta ishlatish | `tokens.ts`, API tiplari, `formatNumber`, holat lug'ati, i18n JSON to'g'ridan-to'g'ri | Hammasi qayta yoziladi |
| Offline SQLite | `expo-sqlite`: tayyor `.db` faylni asset sifatida ochadi | `sqflite` bilan ham mumkin |
| Build va test tarqatish | `eas build` (bulutda) yoki `expo run:android` (lokal), Expo Go'da tez sinash | `flutter build`, yaxshi |
| Grafik va xarita | `react-native-svg` ustida o'z kichik grafiklari | `fl_chart`, yaxshi |

Flutter'ning ustunligi (ishlash tezligi, bitta rendering) bu ilova uchun hal qiluvchi emas: ekranlar asosan ro'yxat, kartochka va kichik grafik. Hal qiluvchi narsa veb kod bilan umumiylik.

### 2.1. Kutubxonalar (minimal)

| Vazifa | Paket | Izoh |
|---|---|---|
| Navigatsiya | `expo-router` | Fayl asosidagi marshrutlar, deep link `mystat://indicators/population` |
| Offline baza | `expo-sqlite` | `SQLiteProvider` + `assetSource` bilan tayyor `mystat_demo.db` |
| So'rov holati | `@tanstack/react-query` | Local va API manbasi uchun bir xil kesh va yuklanish holati |
| Grafik | `react-native-svg` | `Sparkline`, `LineChart`, `BarList` o'zimiz yozamiz (3 ta kichik komponent), og'ir grafik kutubxona olinmaydi |
| Shrift | `@expo-google-fonts/inter`, `expo-font` | HIBRID Z-02: Inter |
| Til | `i18next`, `react-i18next`, `expo-localization` | Veb'dagi kalitlar bilan bir xil nomlar |
| Sozlamani saqlash | `@react-native-async-storage/async-storage` | Faqat til, tema, hudud, kartochkalar tartibi |
| Eslatma | `expo-notifications` (faqat lokal) | Hisobot muddatidan 5 va 1 kun oldin (MOB-7) |
| Test | `jest-expo`, `@testing-library/react-native` | |

Yangi paket qo'shishdan oldin Claude Code ruxsat so'raydi (HIBRID 8.0 qoidasi bilan bir xil). Versiyalar MOB-0 da o'sha kungi barqaror Expo SDK bilan qotiriladi (`npx expo install` mos versiyani tanlaydi).

---

## 3. Repo va papka tuzilmasi

Ilova **shu `mystat` repo'si ichida**, `mobile/` papkasida. Alohida repo shart emas: tokenlar va tiplarni nusxalash skripti bir repo ichida oddiy.

```text
mystat/                         # repo ildizi
  backend/                      # o'zgarmaydi
  frontend/                     # o'zgarmaydi (faqat tokens.ts dan o'qiladi)
  mystat/MOBIL_ILOVA.md         # shu hujjat
  mystat/mobil_namuna/          # namuna ma'lumot manbasi va generator (6-bo'lim)
  mobile/
    app/                        # expo-router ekranlari (5-bo'lim)
      _layout.tsx               # provayderlar: SQLite, Query, Theme, i18n
      (tabs)/_layout.tsx        # 5 tab
      (tabs)/index.tsx          # Bosh
      (tabs)/indicators/index.tsx, [key].tsx
      (tabs)/companies/index.tsx, [stir].tsx
      (tabs)/services/index.tsx, sphere/[id].tsx, [number].tsx
      (tabs)/cabinet/index.tsx, reports.tsx, calendar.tsx, notifications.tsx
      topics/[slug].tsx
      settings.tsx
      about-data.tsx            # "Ma'lumot haqida": versiya, manbalar, namuna izohi
    assets/data/mystat_demo.db  # generator chiqargan baza (git'da, ~3 MB)
    src/
      theme/tokens.ts           # veb tokens.ts dan avtomatik nusxa (sync-tokens)
      theme/ThemeProvider.tsx
      components/ds/            # StatCard, SourceNote, SampleBadge, StatusBadge, ServiceCard, EmptyState, Chip, Select, ListRow
      components/charts/        # Sparkline, LineChart, BarList
      data/types.ts             # Region, Indicator, IndicatorValue, Company, ReportRow ...
      data/DataSource.ts        # interfeys (7-bo'lim)
      data/local/LocalDataSource.ts
      data/api/ApiDataSource.ts # MOB-9 gacha bo'sh qoliq
      data/hooks.ts             # useHomeWidgets, useIndicator, useCompanies ...
      domain/deadlines.ts       # HT-01 qoidalari: deadlineFor(rule, periodEnd)
      domain/status.ts          # HT-03: due_soon / overdue hisoblash
      format/number.ts          # "38 214 700", "2,85", "38,2 mln"
      i18n/{uz,cry,ru}.json
    scripts/sync-tokens.mjs     # frontend/src/theme/tokens.ts -> mobile/src/theme/tokens.ts
    scripts/build-data.sh       # generator -> assets/data/mystat_demo.db
    app.config.ts, metro.config.js, eas.json, package.json, tsconfig.json
```

---

## 4. Dizayn tizimiga moslik

### 4.1. Tokenlar

React Native CSS o'zgaruvchilarini bilmaydi, shuning uchun `--ds-*` ning **TS obyekt** shakli (`frontend/src/theme/tokens.ts`, HIBRID 3-bo'lim) ishlatiladi. Qoida vebdagidek: komponentda `#hex` yozilmaydi.

- `scripts/sync-tokens.mjs` veb `tokens.ts` ni o'qiydi va `mobile/src/theme/tokens.ts` ga yozadi (faqat rang, shrift, o'lcham, radius; `px` qiymatlar raqamga aylanadi). CI'da `--check` rejimi: ikki fayl farq qilsa xato.
- Agar H1 hali bajarilmagan va veb `tokens.ts` yo'q bo'lsa: MOB-1 HIBRID 3.1–3.3 jadvallaridan `mobile/src/theme/tokens.ts` ni qo'lda yaratadi va PR'da "H1 dan keyin sync-tokens ga o'tkaziladi" deb yozadi.

| Veb token | Mobil kalit | Mobilda qayerda |
|---|---|---|
| `--ds-brand`, `--ds-on-brand` | `color.brand`, `color.onBrand` | Bosh ekran sarlavha bloki, ekran header'i (S zona ekranlarida) |
| `--ds-primary`, `-hover`, `-soft` | `color.primary`, `color.primaryPressed`, `color.primarySoft` | Asosiy tugma, havola, faol tab ikonkasi, tanlangan chip |
| `--ds-accent`, `--ds-accent-strong` | `color.accent`, `color.accentStrong` | CTA ("Veb saytda ochish"), grafikdagi oxirgi nuqta |
| `--ds-bg`, `--ds-surface`, `--ds-border` | `color.bg`, `color.surface`, `color.border` | Ekran foni, kartochka, ajratgich |
| `--ds-text`, `--ds-text-muted` | `color.text`, `color.textMuted` | Matn, `SourceNote` |
| `--ds-success/warning/danger/info` (+ `-bg`) | `color.status.*` | `StatusBadge` (HT-03 lug'ati) |
| `--ds-series-*`, `--ds-chart-*` | `color.series.*`, `color.chart.*` | Grafiklar |
| `--ds-font-kpi` 28/32/700 | `font.kpi` + `fontVariant: ['tabular-nums']` | `StatCard` raqami |
| `--ds-font-h1` (mobil 24/32) | `font.h1` | Ekran sarlavhasi |
| `--ds-font-body` 14/22 | `font.body` | Ro'yxat qatori |
| `--ds-space-1..9` | `space[1..9]` | Hamma bo'sh joylar |
| Radius 6 / 10 / 999 | `radius.sm/md/pill` | Tugma, kartochka, chip |
| Tugma 48 (mobil asosiy) | `size.touch = 48` | Hamma bosiladigan elementlar |

Tungi rejim: `useColorScheme()` + sozlamadagi qo'lda tanlov ("Tizim / Kunduzgi / Tungi"). Tungi qiymatlar HIBRID 3.1 dagi "Tungi" ustunidan.

### 4.2. Zona uslubi mobilda

| Zona | Mobil ekranlar | Uslub |
|---|---|---|
| **S · Statistika** | Bosh, Ko'rsatkichlar, Mavzu, Korxonalar | `comfortable` zichlik: kartochka ichida 16 dp, katta raqam, mini grafik, har raqam ostida `SourceNote` |
| **G · Katalog** | Xizmatlar, soha, xizmat pasporti | `ServiceCard` `tile` (2 ustun) va `row` ko'rinishi, pasportda "Veb saytda ochish" CTA |
| **M · Kabinet** | Kabinet, Hisobotlarim, kalendar, xabarnomalar | `compact` zichlik: ro'yxat qatori 56 dp, `StatusBadge`, filtr chiplari tepada |

### 4.3. Komponentlar (veb `components/ds/` nomlari bilan)

| Komponent | Vazifa | Veb manbasi |
|---|---|---|
| `StatCard` | sarlavha, raqam, birlik, ▲/▼ + matn, `Sparkline`, `SourceNote` | HIBRID 4.1, BOSH_SAHIFA 3.3 |
| `SourceNote` | "Manba: SIAT 246 · 2026 · dastlabki" | HIBRID 4.1 |
| `SampleBadge` | "Namuna" belgisi, `--ds-warning-bg` fonida | BOSH_SAHIFA 3.3 qoidalari |
| `StatusBadge` | HT-03 lug'ati: matn + rang + ikonka (faqat rang emas) | HT-03 |
| `ServiceCard` | `tile` / `row`, raqam `#101`, "Ilovada" yoki "Veb saytda" belgisi | HIBRID Z-12 |
| `ScoreBadge` | sinf harfi (A..E, —) va ball, "rasmiy baho emas" izohi pasportda | KORXONA_SCORING 6 |
| `PillarBars` | 6 ustun (M, O, T, X, I, S), `null` ustun "ma'lumot yo'q" | KORXONA_SCORING 4.4 |
| `RegionSelect` | Respublika + 14 hudud, qidiruvli pastdan ochiluvchi ro'yxat (bottom sheet) | BOSH_SAHIFA 4 |
| `EmptyState`, `ErrorState`, `Skeleton` | bo'sh natija, xato, yuklanish | HIBRID 4.5 |
| `DemoBanner` | Ilova tepasida ingichka qator: "Demo versiya: namuna ma'lumot" (yopib bo'lmaydi) | — (yangi) |

Matn uslubi HIBRID 3.5: raqam `7 525 717`, o'nlik vergul bilan (`2,85`), kartochkada qisqartma (`38,2 mln`), uzoq bosilganda to'liq raqam.

---

## 5. Ekranlar xaritasi

### 5.1. Navigatsiya

```text
Ilova
├── [Tab] Bosh  /                       (S)
│     ├── RegionSelect (bottom sheet)
│     ├── → Ko'rsatkich  /indicators/:key
│     ├── → Mavzu  /topics/:slug
│     └── → Xizmat pasporti  /services/:number
├── [Tab] Ko'rsatkichlar  /indicators    (S)
│     ├── Mavzu chiplari (12)
│     └── Ko'rsatkich  /indicators/:key  (grafik, jadval, hududlar reytingi)
├── [Tab] Korxonalar  /companies         (S)
│     ├── Qidiruv (STIR / nom), filtrlar: hudud, OKED bo'limi, sinf
│     └── Korxona  /companies/:stir      (ball, ustunlar, asosiy raqamlar)
├── [Tab] Xizmatlar  /services           (G)
│     ├── Ommabop (12 plitka) + 14 soha
│     ├── Soha  /services/sphere/:id
│     └── Xizmat pasporti  /services/:number  → ilova ichidagi ekran yoki veb sayt
├── [Tab] Kabinet  /cabinet              (M, demo kirish)
│     ├── Tashkilot almashtirgich (3 demo korxona)
│     ├── Hisobotlarim  /cabinet/reports
│     ├── Hisobot kalendari  /cabinet/calendar
│     └── Xabarnomalar  /cabinet/notifications
└── Header'dan: Sozlamalar /settings · Ma'lumot haqida /about-data
```

### 5.2. Ekranlar

| Ekran | Bloklar (tartib bilan) | Ma'lumot (6-bo'lim) | Veb hamkori |
|---|---|---|---|
| **Bosh** | `DemoBanner` · "O'zbekiston bugun" + `RegionSelect` · 4 `StatCard` (2 ustun, standart: aholi, YaIM o'sishi, inflyatsiya, ishsizlik) · ob-havo qatori (bosilsa 3 kunlik) · hududlar reytingi (`BarList`, xarita o'rniga, 5.3) · 12 mavzu plitkasi · 6 ommabop xizmat · "Kabinetingiz" qatori (demo kirgan bo'lsa) | `indicators`, `indicator_value`, `weather`, `topics`, `services` | `/` 6.2, BOSH_SAHIFA 2.3 (mobil maket) |
| **Ko'rsatkichlar** | qidiruv · mavzu chiplari · ro'yxat (nom, oxirgi qiymat, ▲/▼, `Sparkline`) | `indicators`, `indicator_value` (soato=1700) | `/indicators` |
| **Ko'rsatkich** | sarlavha "nima, qayerda, qachon" · `RegionSelect` · katta raqam · `LineChart` 2017–2026 (oxirgi nuqta `accentStrong`) · yillar jadvali · hududlar reytingi (faqat `scope=region`) · `SourceNote` · "Ulashish" (veb havola) | `indicator_value` | `/indicators/:key` |
| **Mavzu** | sarlavha · shu mavzudagi ko'rsatkichlar · "Shu mavzudagi xizmatlar" (`sphere_id` bo'yicha) | `topics`, `indicators.topic`, `services` | `/topics/:slug` 6.4 |
| **Korxonalar** | qidiruv (STIR yoki nom, SQLite FTS) · filtr chiplari (hudud, OKED bo'limi, sinf) · ro'yxat: nom, OKED, hudud, `ScoreBadge` · 50 tadan sahifalash | `company`, `company_fts` | `/check`, `/partners` |
| **Korxona** | nom, STIR, OKED, hudud, tashkil yili · `ScoreBadge` + to'liqlik · `PillarBars` · bayroqlar · asosiy raqamlar (xodimlar, tushum, eksport bor/yo'q, hisobot intizomi "4 dan 3") · "rasmiy baho emas" izohi · "Metodologiya" (`#1103`) | `company.json`, `scoring_meta` | `/company/:stir` |
| **Xizmatlar** | qidiruv (`#302` yoki `302` → to'g'ridan pasport, HIBRID Z-13) · Ommabop 12 plitka · 14 soha ro'yxati | `services` | `/spheres` |
| **Soha** | soha nomi · xizmatlar (`ServiceCard row`) · "Shu mavzudagi ko'rsatkichlar →" (6.4 bog'lanish bo'lsa) | `services`, `topics` | `/spheres/:id` |
| **Xizmat pasporti** | `#raqam` va nom · holat (ilovada bor / veb saytda) · qisqa tavsif · CTA: `mobile=offline` → ilova ekraniga, aks holda "Veb saytda ochish" (tashqi brauzer, `https://my.stat.uz` + `web_route`) | `services` | `/service/:number` |
| **Kabinet** | "Demo rejim" belgisi · tashkilot almashtirgich · 4 `StatCard`: muddati yaqin, muddati o'tgan, faol paket limiti, StatCoin balansi · "Yaqin hisobotlar" (5 qator) · o'qilmagan xabarnomalar | `demo_user`, `report_obligation`, `notifications` | `/cabinet` 6.3 |
| **Hisobotlarim** | filtr chiplari: holat, shakl, yil · qatorlar: shakl kodi va nomi, davr (`2026 Q3`), muddat, qolgan kun, `StatusBadge`, topshirilgan sana · qator bosilsa tafsilot (HT-07 "Qayerda va qanday topshiriladi" matni) | `report_obligation`, `report_forms` | "Hisobotlarim" HT-02 |
| **Hisobot kalendari** | oy ko'rinishi, muddat kunlarida nuqta · kun bosilsa shu kungi shakllar · "Eslatma yoqish" (MOB-7) | `report_obligation` | `/report-calendar` |
| **Xabarnomalar** | ro'yxat, o'qilgan/o'qilmagan · bosilsa o'qilgan bo'ladi (faqat lokal holat) | `notifications` | `NotificationPanel` |
| **Sozlamalar** | til (uz/cry/ru) · tema · standart hudud · bosh ekran kartochkalari (yoqish/o'chirish, tartib, kamida 4 ta, BOSH_SAHIFA 6.1) · eslatmalar | AsyncStorage | `HomeSettingsDrawer` |
| **Ma'lumot haqida** | `dataset_version`, `reference_date`, "Namuna ma'lumot. Rasmiy statistika emas" · har fayl manbasi (6.2 jadvali) · rejim (`local`/`hybrid`/`api`) | `meta` | — |

### 5.3. Xarita haqida

Vebdagi `ChoroplethMap` GeoJSON'i loyiha hujjatlarida yo'q (repo ichida, aniqlash kerak). Shuning uchun:

- **MOB-3 da:** xarita o'rniga `BarList` (14 hudud reytingi, tanlangan hudud ajratilgan). Bu offline va a11y uchun ham yaxshiroq.
- **MOB-8 da (ixtiyoriy):** veb'dagi hududlar GeoJSON'i topilsa, soddalashtirilib (≤ 150 KB) `assets/data/regions.geo.json` ga qo'shiladi va `react-native-svg` bilan chiziladi. Soddalashtirish vositasi (masalan `mapshaper`) faqat dev-paket sifatida, ruxsat bilan.

---

## 6. Ilova ichidagi namuna ma'lumotlar

### 6.1. Qayerda

Hammasi tayyor: [`mystat/mobil_namuna/`](mobil_namuna/). Qayta yaratish:

```bash
python3 mystat/mobil_namuna/generate_mobile_data.py --sqlite
# natija: mystat/mobil_namuna/*.json va mystat/mobil_namuna/mystat_demo.db
```

Generator deterministik (`seed=42`): bir xil kirish bir xil chiqish beradi, shuning uchun test va skrinshotlar barqaror.

### 6.2. Fayllar va manbalar

| Fayl | Nima | Hajm | Qayerdan olingan | Real yoki sintetik |
|---|---|---|---|---|
| `meta.json` | `dataset_version` (`2026.10.27-namuna.1`), `reference_date`, fayllar ro'yxati | 0,5 KB | — | — |
| `regions.json` | Respublika + 14 hudud: SOATO, 3 tilda nom, markaz, koordinata | 4 KB | BOSH_SAHIFA_VIDJETLAR 5.3 | Kodlar va koordinatalar hujjatdan ("Territory bilan solishtirilsin" izohi saqlanadi), kirill va rus nomlari qo'lda |
| `indicators.json` | 8 kartochka katalogi: kalit, nom (3 til), birlik, SIAT ID, `scope`, o'zgarish turi, mavzu; `default_cards` | 3 KB | BOSH_SAHIFA_VIDJETLAR 3.3 | Katalog hujjatdan |
| `indicator_values.json` | 920 qator: ko'rsatkich × SOATO × yil (2017–2026), `preliminary` (2026) | 110 KB | Generator | **Sintetik.** Tartibi realga yaqin (aholi ~37 mln, Toshkent sh. ish haqi yuqori), lekin rasmiy emas. `inflation` va `trade_turnover` faqat respublika (`scope: country`) |
| `weather.json` | 15 shahar: hozirgi holat + 3 kun, `stale: true` | 8 KB | BOSH_SAHIFA 5.2 javob shakli | **Sintetik** |
| `topics.json` | 12 mavzu, `slug`, bog'langan soha | 1 KB | HIBRID 6.4, OS-H-09 | Ro'yxat hujjatdan |
| `services.json` | 14 soha, 50 xizmat: raqam, nom, veb route, prod holati, `mobile` (`offline` / `web` / `cabinet`), `popular` | 10 KB | MYGOV_JORIY_ETISH 4.1, 4.2 | Katalog hujjatdan; `mobile` ustuni shu hujjatda qo'shildi |
| `report_forms.json` | 4 demo shakl (`1-KB`, `MEHNAT`, `INVEST`, `1-KORXONA`), davriylik, `deadline_rule` (`Q+25d`, `M+10d` ...); HT-03 holat lug'ati | 1 KB | ANALIZ (demo shakllar), HT-01, HT-03 | **Namuna** ("soddalashtirilgan namuna" yozuvi bilan), qoidalar rasmiy muddat emas |
| `report_obligations.json` | 3 demo korxona × 4 shakl × davrlar = 126 qator: davr, muddat, `submitted` / `unknown`, topshirilgan sana | 21 KB | Generator, HT-02 qoidasi (joriy + o'tgan yil, kelajakdan bitta davr) | **Sintetik** |
| `companies.json` | 3 000 korxona: STIR, nom, OKED, hudud, xodimlar, tushum, foyda, ish haqi, eksport/import, ayollar ulushi, hisobot intizomi, soliq qarzi + `score` (umumiy ball, sinf, to'liqlik, tengdoshlar guruhi, 6 ustun, bayroqlar) | 2 MB | `korxona_scoring/namuna_korxonalar.csv` + `namuna_scoring.csv` | **Sintetik** (`[DEMO]` nomlar, STIR 9xxxxxxxx), ball `muvozanatli` preset |
| `scoring_meta.json` | sinflar chegarasi, 6 ustun nomi, 5 preset vaznlari, bayroqlar matni, to'liqlik chegaralari, izoh | 1,5 KB | KORXONA_SCORING 4.5, 4.6, 4.8 | Metodologiya hujjatdan |
| `demo_user.json` | demo foydalanuvchi, 3 tashkilot, StatCoin balansi, paket limiti | 0,5 KB | — | **Namuna** |
| `notifications.json` | 3 xabarnoma (hisobot muddati, yangi e'lon, savolga javob) | 0,7 KB | — | **Namuna** |
| `mystat_demo.db` | Yuqoridagilarning SQLite shakli (6.3) | 2,9 MB | Generator `--sqlite` | — |

Ma'lum cheklov: namuna CSV'larida ball faqat `muvozanatli` preset uchun. Preset tanlash ilovada MOB-5 da yashirin bo'ladi, real API kelganda ochiladi (KORXONA_SCORING 4.8).

### 6.3. SQLite tuzilmasi (`mystat_demo.db`)

```sql
meta(key PK, value)                                -- dataset_version, reference_date, is_sample
region(soato PK, name_uz, name_cry, name_ru, center, lat, lon)
indicator(key PK, json)                            -- indicators.json dagi bitta element
indicator_value(indicator, soato, period, value, preliminary,  PK(indicator, soato, period))
company(stir PK, name, oked_section, soato, employees, overall, klass, json)
  INDEX company_filter(soato, oked_section, klass)
company_fts  USING fts5(stir, name)                -- qidiruv: "Savdo", "9746"
report_obligation(stir, form_code, period, deadline, status, submitted_at)
  INDEX ro_stir(stir, deadline)
doc(name PK, json)                                 -- kichik ro'yxatlar butun JSON holida:
                                                   -- services, topics, weather, scoring_meta,
                                                   -- report_forms, demo_user, notifications
```

Nima uchun JSON'ning o'zi emas, SQLite: 3 000 korxonani qidirish, filtrlash va sahifalash JS'da 2 MB JSON'ni har safar o'qishdan ko'ra tez va xotiraga yengil. Kichik ro'yxatlar (`doc` jadvali) baribir bir marta o'qiladi.

### 6.4. Qoidalar

1. **Holat saqlanmaydi, hisoblanadi.** Bazada faqat `submitted` yoki `unknown`. `due_soon` (0–5 kun) va `overdue` ilovada qurilma sanasidan hisoblanadi (`domain/status.ts`, HT-03). `unknown` "Topshirilmagan" deb yozilmaydi.
2. **Muddat qoidadan.** `deadline` bazada bor, lekin kalendar keyingi davrlarni `deadline_rule` dan hisoblaydi (`domain/deadlines.ts`, HT-01). Bu funksiya stat-hisobot va backend bilan bir xil sintaksisda (`<P>+<N>d`).
3. **Har ekranda namuna belgisi.** `meta.is_sample = 1` bo'lsa `DemoBanner` va har `StatCard`/`ScoreBadge` da `SampleBadge`. Bu shart kodda bitta joyda (`useDataMeta()`), ekranlarda emas.
4. **Ma'lumot versiyasi.** Ilova ichida `BUNDLED_DATASET_VERSION` konstantasi. Ishga tushganda bazadagi `meta.dataset_version` undan farq qilsa, baza asset'dan qayta yoziladi (`expo-sqlite` `assetSource` ning `forceOverwrite` imkoniyati; aniq nomi Expo hujjatidan tekshirilsin). Foydalanuvchi sozlamalari (AsyncStorage) bunga tegmaydi.
5. **Yangilash tartibi:** generator → `mobile/scripts/build-data.sh` (bazani `mobile/assets/data/` ga nusxalaydi va versiyani `src/data/version.ts` ga yozadi) → PR.

---

## 7. Ma'lumot qatlami

### 7.1. Interfeys

Ekranlar faqat `src/data/hooks.ts` dagi hook'larni chaqiradi. Hook'lar `DataSource` ni ishlatadi. Manba almashganda ekran kodi o'zgarmaydi.

```ts
// mobile/src/data/DataSource.ts
export interface DataSource {
  meta(): Promise<DataMeta>;                                   // version, isSample, mode
  regions(): Promise<Region[]>;
  homeWidgets(soato: string, cards: string[]): Promise<HomeWidgets>;   // BOSH_SAHIFA 5.1 javobi bilan bir xil shakl
  indicator(key: string, soato: string): Promise<IndicatorDetail>;
  indicatorRanking(key: string, period?: string): Promise<RegionValue[]>;
  weather(soato: string): Promise<Weather>;                    // BOSH_SAHIFA 5.2 shakli
  topics(): Promise<Topic[]>;
  services(): Promise<ServiceCatalog>;
  searchCompanies(q: CompanyQuery): Promise<Page<CompanyListItem>>;
  company(stir: string): Promise<CompanyCard>;
  scoringMeta(): Promise<ScoringMeta>;
  me(): Promise<CabinetUser | null>;                           // local: demo_user
  myReports(stir: string, f: ReportFilter): Promise<ReportRow[]>;
  notifications(): Promise<Notification[]>;
}
```

**Asosiy qoida:** `LocalDataSource` javoblarni **veb API qaytaradigan shaklda** quradi (masalan `homeWidgets` BOSH_SAHIFA 5.1 dagi `cards[]`: `value`, `unit`, `period`, `change`, `sparkline`, `scope`, `preliminary`, `source`). Shunda `ApiDataSource` faqat `fetch` qiladi, o'zgartirish deyarli yo'q.

### 7.2. Endpoint moslamasi

| `DataSource` metodi | Local (SQLite) | Veb API (keyin) | API holati |
|---|---|---|---|
| `homeWidgets` | `indicator` + `indicator_value` (oxirgi 10 yil) | `GET /api/common/home/widgets/?region=&cards=` | BV-1 da rejada |
| `weather` | `doc:weather` | `GET /api/common/weather/?region=` | BV-3 da rejada |
| `indicator`, `indicatorRanking` | `indicator_value` | `/indicators/:key` API (H5) va `GET /api/common/map/values/?indicator=&period=latest&level=region` (KR-05) | H5, KR-05 |
| `topics` | `doc:topics` | `config/topics.ts` (statik, H8) | statik |
| `services` | `doc:services` | katalog konfiguratsiyasi (MG-04, statik) | statik |
| `searchCompanies` | `company`, `company_fts` | KTUT ro'yxat / `ktut/search` + `score` obyekti | mavjud + KR-35 |
| `company` | `company.json` | `GET /api/analytics/company-scores/<stir>/` | KR-33 |
| `scoringMeta` | `doc:scoring_meta` | `GET /api/analytics/company-scores/methodology/` | KR-33 |
| `me` | `doc:demo_user` | `me/summary` (aniqlash kerak) | mavjud |
| `myReports` | `report_obligation` | "Hisobotlarim" API (HT-02) | HT-02 |
| `notifications` | `doc:notifications` | `notifications/me` | mavjud |

### 7.3. Rejim bayrog'i

`EXPO_PUBLIC_DATA_MODE` (`app.config.ts` orqali):

- `local` (MOB-0..MOB-8 da yagona rejim): faqat SQLite.
- `hybrid` (MOB-9): avval API, javob kelmasa yoki tarmoq yo'q bo'lsa SQLite keshidan, `stale` belgisi bilan.
- `api`: faqat API, offline bo'lsa oxirgi kesh. Namuna baza build'ga qo'shilmaydi.

---

## 8. Haqiqiy API ga o'tish rejasi

| Bosqich | Rejim | Nima o'zgaradi | Shart |
|---|---|---|---|
| **A · Demo** (hozir) | `local` | Hamma narsa namuna bazadan. Ichki test APK / TestFlight | — |
| **B · Ochiq ma'lumot API'dan** | `hybrid` | Ochiq (mehmon) metodlar `ApiDataSource` ga o'tadi: `homeWidgets`, `weather`, `indicator`, `searchCompanies`, `company`. Javob SQLite'ga kesh sifatida yoziladi (`api_cache(key, json, fetched_at)` jadvali). Bu metodlarda `SampleBadge` yo'qoladi, chunki `data_source: real` keladi. Kabinet hali demo | BV-1, BV-3, H5, KR-33 production'da; CORS emas (mobil), lekin throttle limiti mobil uchun tekshiriladi |
| **C · Kirish** | `hybrid` | Haqiqiy kirish: login/parol (mavjud) va OneID (brauzer orqali, `mystat://auth/callback` deep link, OS-MOB-03). Token `expo-secure-store` da. Kabinet metodlari API'ga | OneID'da mobil redirect URI ro'yxatdan o'tgan; HT-02, HT-04 bajarilgan |
| **D · Do'kon versiyasi** | `api` | Namuna baza build'dan olib tashlanadi (`EXPO_PUBLIC_DATA_MODE=api` da `assets/data/mystat_demo.db` bundle'ga kirmaydi). `DemoBanner` faqat test build'da | B va C to'liq; huquqiy sahifalar (`/privacy`, `/terms`) tayyor (H9) |

**Kesh qoidalari (ISH_REJASI FQ-11 bilan bir xil ruh):**

- Ochiq ma'lumot: diskka keshlanadi, ko'rsatkichlar 1 soat, ob-havo 30 daqiqa, korxona kartochkasi 24 soat (backend kesh vaqtlari bilan mos).
- Kabinet ma'lumoti (hisobotlar, xabarnomalar, profil): **diskka yozilmaydi**, faqat React Query xotirasida. Offline bo'lsa "Internet kerak" holati.
- Lokal eslatmalar (MOB-7) faqat shakl kodi va muddatni saqlaydi, korxona ma'lumotini emas.

**Backend o'zgarishi kerakmi?** A bosqichida yo'q. B va C da yangi endpoint yozilmaydi, faqat mavjud/rejadagilar ishlatiladi. Agar mobil uchun alohida kerak bo'lsa (masalan, refresh token muddati), bu alohida vazifa sifatida PR'da yoziladi, shu hujjat doirasida qilinmaydi.

---

## 9. Kod qadamlari

### 9.0. Hamma qadam uchun qoidalar

1. Sessiya boshida `CLAUDE_HISOBOT.md` va shu hujjatni o'qing. Branch: `task/MOB-<raqam>-<qisqa-nom>` (masalan `task/MOB-1-tokens`). Har qadam alohida PR.
2. `backend/` va `frontend/` ga tegilmaydi (istisno: MOB-1 da `frontend/src/theme/tokens.ts` faqat o'qiladi). `backend/apps/payment/` ga hech qachon.
3. Yangi npm paket faqat 2.1 jadvalidagilar. Boshqasi kerak bo'lsa ruxsat so'raladi.
4. Har qadam oxirida 10.1 dagi buyruqlar, PR'da Android emulyatoridan 360 dp kenglikda kunduzgi va tungi skrinshot, `CLAUDE_HISOBOT.md` jurnaliga yozuv.
5. Ekranlarda to'g'ridan-to'g'ri SQL yoki `fetch` yo'q, faqat `src/data/hooks.ts`.

### 9.1. Tartib

| Qadam | Nima | Natija | Bog'liq |
|---|---|---|---|
| **MOB-0** | Expo loyiha, `mobile/` papka, lint, test, CI | Bo'sh ilova ochiladi | — |
| **MOB-1** | Tokenlar, shrift, tema, `components/ds/` asoslari | UiKit ekrani (faqat dev) | MOB-0 (H1 bo'lsa sync) |
| **MOB-2** | Namuna baza, `DataSource`, `LocalDataSource`, hook'lar | Testlar bazadan o'qiydi | MOB-0 |
| **MOB-3** | Tab navigatsiya + Bosh ekran | Bosh ekran to'liq | MOB-1, MOB-2 |
| **MOB-4** | Ko'rsatkichlar, ko'rsatkich, mavzu ekranlari, grafiklar | S zona tayyor | MOB-3 |
| **MOB-5** | Korxonalar qidiruvi va korxona kartochkasi | Scoring ekranlari | MOB-3 |
| **MOB-6** | Xizmatlar katalogi, soha, pasport | G zona tayyor | MOB-3 |
| **MOB-7** | Kabinet (demo): bosh panel, Hisobotlarim, kalendar, xabarnomalar, lokal eslatmalar | M zona tayyor | MOB-3 |
| **MOB-8** | Sozlamalar, 3 til, a11y, "Ma'lumot haqida", (ixtiyoriy) SVG xarita, test build | Ichki test APK | MOB-4..7 |
| **MOB-9** | `ApiDataSource` va `hybrid` rejim (faqat ochiq metodlar) | B bosqich | MOB-8 + backend API'lari |

MOB-4..MOB-7 o'zaro parallel bo'lishi mumkin, lekin bitta PR'da birlashtirilmaydi.

### MOB-0 · Loyiha karkasi

- **Fayllar:** ✚ `mobile/` (Expo shabloni), ✚ `mobile/eas.json`, ✎ ildiz `.gitignore` (`mobile/.expo`, `mobile/android`, `mobile/ios`), ✎ CI (mavjud CI faylida `mobile` uchun alohida job: `npm ci`, `tsc`, `lint`, `test`).
- **Qadamlar:**

```bash
cd mystat
npx create-expo-app@latest mobile --template default   # TS + expo-router
cd mobile
npx expo install expo-sqlite expo-font @expo-google-fonts/inter expo-localization \
  expo-notifications @react-native-async-storage/async-storage react-native-svg
npm i @tanstack/react-query i18next react-i18next
npm i -D jest-expo @testing-library/react-native
npx expo start           # Expo Go yoki emulyatorda tekshirish
```

- **Qabul:** `npx tsc --noEmit`, `npx expo lint`, `npm test` toza; ilova Android emulyatorida ochiladi; CI'da `mobile` job yashil.

```text
mystat repo'sida mystat/MOBIL_ILOVA.md dagi MOB-0 ni bajar.
mobile/ papkasida Expo (TypeScript, expo-router) loyiha yarat, 2.1 jadvalidagi paketlarni o'rnat, boshqa paket qo'shma.
Mavjud CI fayliga mobile uchun alohida job qo'sh (tsc, lint, test). backend/ va frontend/ ga tegma.
Branch: task/MOB-0-scaffold. PR oching.
```

### MOB-1 · Tokenlar va dizayn komponentlari

- **Fayllar:** ✚ `mobile/scripts/sync-tokens.mjs`, ✚ `mobile/src/theme/{tokens.ts,ThemeProvider.tsx,useTheme.ts}`, ✚ `mobile/src/components/ds/{StatCard,SourceNote,SampleBadge,StatusBadge,ServiceCard,ScoreBadge,Chip,ListRow,EmptyState,ErrorState,Skeleton,DemoBanner}.tsx`, ✚ `mobile/src/format/number.ts` (+ test), ✚ `mobile/app/dev/ui-kit.tsx` (faqat `__DEV__`).
- **Qadamlar:** 4.1 jadvali bo'yicha tokenlar; veb `frontend/src/theme/tokens.ts` bo'lsa undan nusxa (`--check` rejimi bilan), bo'lmasa HIBRID 3.1–3.3 dan qo'lda. Inter shrifti yuklanguncha splash. `tabular-nums` raqamlarda. `number.ts`: `7 525 717`, `2,85`, `38,2 mln`, `▲ 1,6%`.
- **Qabul:** UiKit ekranida hamma komponent kunduzgi va tungi rejimda; `number.ts` testlari; komponentlarda `#hex` yo'q (`grep -rn "#[0-9A-Fa-f]\{6\}" mobile/src/components` bo'sh).

```text
mystat/MOBIL_ILOVA.md dagi MOB-1 ni bajar. Tokenlarni frontend/src/theme/tokens.ts dan sync-tokens.mjs bilan ol;
fayl yo'q bo'lsa HIBRID_DIZAYN.md 3.1-3.3 jadvallaridan qo'lda yarat va PR'da yoz.
4.3 jadvalidagi komponentlarni yoz, faqat tokenlar bilan. Dev uchun UiKit ekrani qo'sh.
Branch: task/MOB-1-tokens.
```

### MOB-2 · Namuna baza va ma'lumot qatlami

- **Fayllar:** ✚ `mobile/assets/data/mystat_demo.db` (`mystat/mobil_namuna/` dan), ✚ `mobile/scripts/build-data.sh`, ✎ `mobile/metro.config.js` (`assetExts` ga `db`), ✚ `mobile/src/data/{types.ts,DataSource.ts,version.ts,hooks.ts,DataProvider.tsx}`, ✚ `mobile/src/data/local/LocalDataSource.ts`, ✚ `mobile/src/data/api/ApiDataSource.ts` (hamma metod `NotImplemented`), ✚ `mobile/src/domain/{deadlines.ts,status.ts}` (+ testlar).
- **Qadamlar:**
  1. `build-data.sh`: `python3 ../mystat/mobil_namuna/generate_mobile_data.py --sqlite`, bazani `assets/data/` ga nusxalash, `meta.dataset_version` ni `src/data/version.ts` ga yozish.
  2. `_layout.tsx` da `SQLiteProvider databaseName="mystat_demo.db" assetSource={{ assetId: require('../assets/data/mystat_demo.db') }}`; versiya farq qilsa qayta yozish (6.4-4).
  3. `LocalDataSource` 7.1 dagi hamma metod. `homeWidgets` BOSH_SAHIFA 5.1 shaklida: `change` oldingi yilga nisbatan (`percent` yoki `pp`), `sparkline` oxirgi 10 yil, `scope` hudud qiymati bo'lmasa `country`.
  4. `deadlines.ts`: `deadlineFor("Q+25d", periodEnd)`, `periodsFor("Q", 2026)`; `status.ts`: `computeStatus(row, today)` → `due_soon` (0–5 kun), `overdue`, yoki saqlangan holat.
  5. `DataProvider` `EXPO_PUBLIC_DATA_MODE` ga qarab manba tanlaydi (hozir faqat `local`).
- **Qabul:** testlar: `homeWidgets("1726", default_cards)` 4 kartochka qaytaradi; `inflation` hudud tanlanganda `scope: "country"`; `searchCompanies({q: "Savdo"})` natija beradi; `searchCompanies({q: "9746"})` STIR bo'yicha topadi; har periodicity uchun `deadlines` testi; `status` uchun chegaraviy kunlar (5, 0, -1).

```text
mystat/MOBIL_ILOVA.md dagi MOB-2 ni bajar. Namuna bazani mystat/mobil_namuna/generate_mobile_data.py --sqlite bilan yarat
va mobile/assets/data/ ga joyla. 7.1 dagi DataSource interfeysini va LocalDataSource ni yoz, javob shakllari
BOSH_SAHIFA_VIDJETLAR.md 5.1 va 5.2 bilan bir xil bo'lsin. HT-01 va HT-03 qoidalarini domain/ ga testlar bilan yoz.
Ekran yozma. Branch: task/MOB-2-data.
```

### MOB-3 · Navigatsiya va Bosh ekran

- **Fayllar:** ✚ `mobile/app/(tabs)/_layout.tsx`, ✚ `mobile/app/(tabs)/index.tsx`, ✚ `mobile/src/components/home/{RegionSelect,WeatherRow,HomeCards,RegionRanking}.tsx`, ✚ `mobile/src/components/charts/{Sparkline,BarList}.tsx`, ✚ `mobile/src/state/homeLayout.ts` (hudud, kartochkalar, AsyncStorage).
- **Qadamlar:** 5.1 dagi 5 tab (Kabinet tabi MOB-7 gacha `EmptyState`). Bosh ekran 5.2 tartibida, mobil maket BOSH_SAHIFA 2.3: kartochkalar → ob-havo → reyting. Kamida 4 kartochka (ma'lumoti yo'q kartochka o'rniga navbatdagisi, BOSH_SAHIFA 3.3). `DemoBanner` hamma ekranda `(tabs)/_layout.tsx` da.
- **Qabul:** hudud almashsa kartochkalar, ob-havo va reyting bir vaqtda yangilanadi; ilova qayta ochilganda tanlangan hudud saqlangan; samolyot rejimida hammasi ishlaydi; 360 dp da gorizontal skroll yo'q.

```text
mystat/MOBIL_ILOVA.md dagi MOB-3 ni bajar: 5 tabli navigatsiya va Bosh ekran (5.2 jadvali, BOSH_SAHIFA_VIDJETLAR.md 2.3 mobil maketi).
Xarita o'rniga BarList reytingi (5.3). Ma'lumot faqat src/data/hooks.ts orqali.
Branch: task/MOB-3-home.
```

### MOB-4 · Ko'rsatkichlar va mavzular

- **Fayllar:** ✚ `mobile/app/(tabs)/indicators/{index,[key]}.tsx`, ✚ `mobile/app/topics/[slug].tsx`, ✚ `mobile/src/components/charts/LineChart.tsx`.
- **Qadamlar:** 5.2 jadvalidagi uch ekran. `LineChart`: o'q, setka (`color.chart.*`), oxirgi nuqta `accentStrong`, nuqtani bosganda qiymat; ekran o'quvchi uchun grafik ostida yillar jadvali (grafik `accessible={false}`, jadval o'qiladi). Sarlavha "nima, qayerda, qachon".
- **Qabul:** 8 ko'rsatkichning har biri ochiladi; `scope=country` ko'rsatkichda hudud tanlovi o'rniga "Respublika bo'yicha" belgisi; `preliminary` qiymatda "dastlabki" belgisi.

```text
mystat/MOBIL_ILOVA.md dagi MOB-4 ni bajar: Ko'rsatkichlar ro'yxati, ko'rsatkich sahifasi, mavzu sahifasi va LineChart.
Grafik kutubxona qo'shma, react-native-svg bilan yoz. Branch: task/MOB-4-indicators.
```

### MOB-5 · Korxonalar

- **Fayllar:** ✚ `mobile/app/(tabs)/companies/{index,[stir]}.tsx`, ✚ `mobile/src/components/company/{CompanyFilters,PillarBars,CompanyFacts}.tsx`.
- **Qadamlar:** qidiruv 300 ms kechikish bilan, FTS (`name`) yoki STIR prefiksi (faqat raqam bo'lsa); filtrlar hudud, OKED bo'limi, sinf; 50 tadan cheksiz skroll. Kartochka 5.2 jadvali bo'yicha; to'liqlik `< 0.6` → "Ma'lumot yetarli emas", `0.6–0.85` → "qisman ma'lumot" (KORXONA_SCORING 4.7). Preset tanlovi yashirin (6.2 cheklovi). Xom qiymatlar (tushum, foyda) ko'rsatiladimi: **OS-MOB-04**, default: namuna bazada ko'rsatiladi, API rejimida faqat API bergan maydonlar.
- **Qabul:** 3 000 korxona ichida qidiruv natijasi 200 ms dan tez (o'rta Android emulyatori); filtr kombinatsiyalari testlangan; `soliq_qarzi` bayrog'i bor korxonada izoh ko'rinadi.

```text
mystat/MOBIL_ILOVA.md dagi MOB-5 ni bajar: korxona qidiruvi (FTS + STIR), filtrlar va korxona kartochkasi.
KORXONA_SCORING.md 4.5-4.7 qoidalariga amal qil, "rasmiy baho emas" izohi bo'lsin. Branch: task/MOB-5-companies.
```

### MOB-6 · Xizmatlar

- **Fayllar:** ✚ `mobile/app/(tabs)/services/{index,sphere/[id],[number]}.tsx`, ✚ `mobile/src/config/serviceRoutes.ts` (`mobile=offline` xizmat → ilova ichidagi ekran: `#101`/`#401` → Korxonalar, `#201` → kalendar, `#601`/`#602` → `population` ko'rsatkichi va h.k.).
- **Qadamlar:** Ommabop 12 plitka (`popular_order` tartibida), 14 soha. Qidiruvda `#302` yoki `302` → pasport. Pasportda CTA: ilova ichida bo'lsa "Ochish", aks holda "Veb saytda ochish" (`Linking.openURL`), offline bo'lsa tugma o'rnida "Internet kerak".
- **Qabul:** 50 xizmatning har biri ochiladi; `prod=hidden` xizmatlar ro'yxatda ko'rinmaydi (veb S-6 qoidasi bilan bir xil); har `mobile=offline` xizmat haqiqiy ekranga olib boradi (test).

```text
mystat/MOBIL_ILOVA.md dagi MOB-6 ni bajar: xizmatlar katalogi, soha va xizmat pasporti.
prod=hidden xizmatlarni ko'rsatma. Branch: task/MOB-6-services.
```

### MOB-7 · Kabinet (demo)

- **Fayllar:** ✚ `mobile/app/(tabs)/cabinet/{index,reports,calendar,notifications}.tsx`, ✚ `mobile/src/components/cabinet/{OrgSwitcher,ReportRow,MonthCalendar}.tsx`, ✚ `mobile/src/notifications/reminders.ts`.
- **Qadamlar:** "Demo kirish" tugmasi (parolsiz, `demo_user.json`), tepada "Demo rejim". Bosh panel MS 5.2 qisqartmasi (5.2 jadvali). Hisobotlarim HT-02 ustunlari va filtrlari. Kalendar oy ko'rinishi. Eslatma: foydalanuvchi yoqsa, `expo-notifications` bilan muddatdan 5 va 1 kun oldin soat 09:00 da lokal xabar; ruxsat rad etilsa hech narsa buzilmaydi.
- **Qabul:** 3 demo korxona almashganda hamma raqamlar o'zgaradi; `unknown` qator "Ma'lumot yo'q" deb chiqadi; qurilma sanasini o'zgartirib `due_soon`/`overdue` sinaladi (test `today` parametri bilan); eslatma rejalashtirilgani testda tekshiriladi.

```text
mystat/MOBIL_ILOVA.md dagi MOB-7 ni bajar: demo kabinet, Hisobotlarim (HT-02, HT-03), kalendar, xabarnomalar va lokal eslatmalar.
Haqiqiy kirish (OneID) yozma. Branch: task/MOB-7-cabinet.
```

### MOB-8 · Sozlamalar, til, a11y, test build

- **Fayllar:** ✚ `mobile/app/{settings,about-data}.tsx`, ✚ `mobile/src/i18n/{uz,cry,ru}.json` (+ `index.ts`), ✎ hamma ekranlar (`t()` kalitlari), ✎ `eas.json` (`preview` profili: Android APK).
- **Qadamlar:** til, tema, standart hudud, kartochkalar sozlamasi. i18n kalitlari vebdagilar bilan bir xil nomda (veb locale fayllari topilsa, ulardan; aniqlash kerak). Hamma bosiladigan element 48 dp va `accessibilityLabel`. (Ixtiyoriy) SVG xarita 5.3.
- **Qabul:** 3 tilda hamma ekran (matn sig'adi, 360 dp); TalkBack bilan Bosh, Ko'rsatkich, Hisobotlarim ekranlari o'tiladi; `eas build --profile preview --platform android` yoki `npx expo run:android --variant release` APK beradi (OS-MOB-02).

```text
mystat/MOBIL_ILOVA.md dagi MOB-8 ni bajar: sozlamalar, "Ma'lumot haqida", 3 til, a11y tekshiruvi va Android test build.
Expo akkaunti bo'lmasa, lokal release build qil va PR'da yoz. Branch: task/MOB-8-settings-build.
```

### MOB-9 · API rejimi (B bosqich)

- **Shart:** BV-1 (`home/widgets`), BV-3 (`weather`), KR-33 (`company-scores`) production'da ishlaydi. Bo'lmasa qadam boshlanmaydi.
- **Fayllar:** ✎ `mobile/src/data/api/ApiDataSource.ts`, ✚ `mobile/src/data/HybridDataSource.ts`, ✎ `LocalDataSource` (`api_cache` jadvali), ✎ `app.config.ts` (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_DATA_MODE`).
- **Qadamlar:** 7.2 jadvalidagi ochiq metodlar API'ga; `HybridDataSource`: API → muvaffaqiyatli javobni keshga → xato bo'lsa kesh yoki namuna, `stale` belgisi bilan. Kabinet metodlari `local` da qoladi. `data_source: real` kelgan javobda `SampleBadge` yo'q.
- **Qabul:** samolyot rejimida ilova ishlaydi (kesh/namuna); internet bilan real raqamlar; API javob shakli o'zgarsa test tushadi (kontrakt testlari namuna JSON bilan).

```text
mystat/MOBIL_ILOVA.md dagi MOB-9 ni bajar: ApiDataSource va hybrid rejim, faqat ochiq metodlar (7.2).
Avval BV-1, BV-3, KR-33 endpoint'lari production'da borligini tekshir, yo'q bo'lsa to'xta va menga yoz.
Kabinetni API'ga o'tkazma. Branch: task/MOB-9-api.
```

---

## 10. Tekshiruv

### 10.1. Har qadamdan keyin (buyruqlar)

```bash
cd mobile
npx tsc --noEmit
npx expo lint
npm test -- --ci
npx expo-doctor                 # Expo paket versiyalari mosligi
node scripts/sync-tokens.mjs --check   # MOB-1 dan keyin
```

### 10.2. Qo'lda tekshiruv

- [ ] Samolyot rejimida ilova ochiladi va hamma tab ishlaydi (MOB-0..8).
- [ ] Har ekranda "Namuna" belgisi yoki `DemoBanner` ko'rinadi.
- [ ] 360 dp, kunduzgi va tungi rejim, uz / cry / ru: gorizontal skroll va kesilgan matn yo'q.
- [ ] Raqamlar formati: `37 278,3 ming`, `5,9%`, kartochkada qisqartma.
- [ ] `unknown` holat hech qayerda "Topshirilmagan" deb yozilmagan.
- [ ] Xizmat pasportidagi "Veb saytda ochish" to'g'ri route'ga olib boradi.
- [ ] Ilova hajmi (APK) ≤ 40 MB; sovuq ochilish o'rta Android'da ≤ 3 s.

---

## 11. Ochiq savollar

Har birida default bor, hech biri MOB-0..MOB-3 ni to'xtatmaydi.

| # | Savol | Default | Kimga |
|---|---|---|---|
| **OS-MOB-01** | Ilova nomi va ikonkasi ("my.stat.uz", "MyStat")? | "my.stat.uz", vaqtinchalik ikonka (brand rang + "S"), rasmiy logo tasdiqlangach almashadi | egasi |
| **OS-MOB-02** | Build qayerda: Expo EAS (bulut, akkaunt kerak) yoki lokal Android Studio / Xcode? | Lokal `expo run:android` (akkauntsiz), iOS keyin | egasi |
| **OS-MOB-03** | OneID mobil ilova uchun redirect URI beradimi? | C bosqichigacha faqat login/parol | OneID / backend |
| **OS-MOB-04** | Korxona kartochkasida xom raqamlar (tushum, foyda) ko'rsatilsinmi? API'da "xom qiymat yo'q" (KORXONA_SCORING 5.2) | Namuna rejimida ha (sintetik), API rejimida faqat API bergani | egasi |
| **OS-MOB-05** | iOS kerakmi (Apple Developer akkaunti, Mac kerak)? | Birinchi test faqat Android | egasi |
| **OS-MOB-06** | Namuna ma'lumotli test ilovani kimlarga tarqatish (ichki xodimlar, rahbariyat)? | Faqat ichki, APK havola orqali, "Demo" belgisi bilan | egasi |
| **OS-MOB-07** | Ko'rsatkichlar namuna bazada sintetik. Real SIAT qiymatlarini ham ilovaga offline joylash kerakmi (litsenziya ochiq)? | Hozircha yo'q: A bosqichi sintetik, real raqamlar B bosqichida API orqali | egasi |
