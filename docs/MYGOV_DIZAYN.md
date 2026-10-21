# my.stat.uz → my.gov.uz uslubidagi dizayn va menyu tuzilishi (Claude Code uchun topshiriq)

> **Sana:** 2026-10-20 · **Versiya:** 2 (2026-10-21: 0-bo'lim qo'shildi — bu reja **2-etap**, hozirgi dizayndan o'tish tartibi bilan)
> **Asos:** my.gov.uz jonli sahifalari tahlili (2026-10-20): bosh sahifa `/uz`, soha sahifalari `/uz/spheres/34` va `/uz/spheres/12`, xizmat sahifasi `/uz/service/411`, qidiruv `/uz/search`. Shuningdek `ISH_REJASI.md` (v2), `BARCHA_XIZMATLAR.md` (XS-01..XS-03) va `XIZMATLAR_BIZ_HAQIMIZDA.docx` (xizmatlar katalogi, 2026-10-19).
> **Maqsad:** my.stat.uz sahifalarining **tuzilishi, bloklar ketma-ketligi, menyu tartibi, yorliqlar uslubi va komponentlari** my.gov.uz bilan 98% mos bo'lishi (o'lchov usuli 1.12-bo'limda).
> **Qanday ishlatiladi:** har bir `MG-xx` alohida topshiriq. Claude Code'ga "`MYGOV_DIZAYN.md` dagi `MG-03` ni bajar" deyish yetarli. Tartib 6-bo'limda. `ISH_REJASI.md` ning 2-bo'limi (xavfsizlik, `payment/` ga tegilmaydi) va 3-bo'limidagi umumiy qoidalar shu yerda ham to'liq amal qiladi.

### Tahlilning cheklovi (muhim)

1. Tahlil sahifalarning **matn va tuzilishi** bo'yicha qilindi. Bu muhitdan my.gov.uz ning CSS fayllari, shriftlari va aniq rang kodlari olinmadi, `/uz/login` va kabinet sahifalari robots.txt bilan yopiq. Shuning uchun **ranglar, shrift, o'lchamlar va kabinet ko'rinishi `MG-00` da Claude Code tomonidan lokal kompyuterdan jonli saytdan o'lchanadi** (Playwright, `getComputedStyle`). Bu hujjatdagi vizual qiymatlar "kuzatilgan/taxminiy" deb belgilangan, `MG-00` natijasi ulardan ustun turadi.
2. **Nusxa olinmaydigan narsalar:** my.gov.uz logotipi, gerb bilan birga yozilgan portal nomi, egov/uzinfocom logolari, `cdn.my.gov.uz` dagi ikonka va rasmlar, "112SOS" kabi boshqa idoralar xizmatlari. my.stat.uz o'z logotipi, nomi va ikonkalarini ishlatadi. O'xshashlik **tuzilma, tartib, komponent va uslub** darajasida bo'ladi, foydalanuvchi qaysi saytda turganini har doim aniq biladi.

---

## Mundarija

0. [Etaplar: hozirgi dizayn → my.gov.uz uslubi](#0-etaplar-hozirgi-dizayn--mygovuz-uslubi-2026-10-21-qarori)

1. [my.gov.uz tahlili](#1-mygovuz-tahlili)
2. [Moslik xaritasi: my.gov.uz → my.stat.uz](#2-moslik-xaritasi)
3. [my.stat.uz uchun sohalar va xizmatlar daraxti](#3-sohalar-va-xizmatlar-daraxti)
4. [Mavjud vazifalar bilan bog'liqlik](#4-mavjud-vazifalar-bilan-bogliqlik)
5. [Vazifalar (MG-00..MG-15)](#5-vazifalar)
6. [Bajarish tartibi](#6-bajarish-tartibi)
7. [Ochiq savollar](#7-ochiq-savollar)

## 0. Etaplar: hozirgi dizayn → my.gov.uz uslubi (2026-10-21 qarori)

> **Egasining qarori (2026-10-21):** 2026-10-20 dagi hozirgi dizayn (statistika portali uslubi) **1-etap** sifatida qoladi. my.gov.uz uslubiga o'tish (shu hujjatdagi MG-00..MG-15) **2-etap**, ya'ni keyingi bosqich.
> Hozirgi dizayn tavsifi: [`DIZAYN_HOZIRGI_HOLAT.md`](DIZAYN_HOZIRGI_HOLAT.md).

### 0.1. Etaplar

| Etap | Nima | Holat |
|---|---|---|
| **1-etap** | Hozirgi dizayn: `Navbar.tsx` (rasmiy qator + gorizontal menyu), bosh sahifa (`Banner.tsx`, `HomeHighlights.tsx`, `Interactive.tsx`, `TariffComponent.tsx`, `CalendarReport.tsx`), xaritalar, ko'rsatkich kartochkalari | ✅ Kodda bor, lekin **commit qilinmagan** (CLAUDE_HISOBOT 7-bo'lim, 2026-10-20). 2-etapdan oldin commit qilinishi shart |
| **2-etap** | my.gov.uz uslubi: MG-00..MG-15 | ❌ Boshlanmagan. Tartib 0.3 va 6-bo'limda |

### 0.2. 2-etapning asosiy tamoyili

1. **Hech narsa o'chirilmaydi, ko'chiriladi.** 1-etapda qilingan bloklar (banner raqamlari, "O'zbekiston raqamlarda", portal faoliyati, kalendar, xaritalar) qayta yozilmaydi: ular `/statistics` sahifasiga (MG-13), soha sahifalariga yoki top bar'ga ko'chadi.
2. **Avval qo'shiladi, keyin almashtiriladi.** Yangi sahifalar (sohalar, xizmat pasportlari, `/search`, footer) eski dizayn yonida paydo bo'ladi. Navbar va bosh sahifa faqat oxirida, yangi navigatsiya to'liq tayyor bo'lgach almashtiriladi. Shunda sayt hech bir qadamda "yarim tayyor" ko'rinmaydi.
3. **Har qadam alohida PR** va qaytarib olinadigan bo'ladi.

### 0.3. O'tish tartibi (hozirgi dizayndan)

| Qadam | Vazifalar | Hozirgi saytda nima o'zgaradi | Foydalanuvchiga ko'rinadimi |
|---|---|---|---|
| **0** | 1-etapni commit qilish | Hech narsa | Yo'q |
| **2A. Tayyorgarlik** | MG-00, MG-01 | Tokenlar hozirgi komponentlarga qo'llanadi (rang, shrift, radius), tuzilma o'zgarmaydi | Ozgina (ranglar, shrift) |
| **2B. Yangi sahifalar qo'shiladi** | MG-04, MG-06, MG-07, MG-10 | `/spheres`, `/spheres/:id`, `/service/:id` paydo bo'ladi. Hozirgi Navbar'dagi "Xizmatlar" bandi `/spheres` ga yo'naltiriladi | Ha, yangi sahifalar |
| **2C. Qidiruv, footer, fikr** | MG-08, MG-09, MG-11 | `/search` sahifasi, yangi footer, sahifa oxirida fikr vidjeti. Hozirgi `Ctrl+K` oynasi saqlanadi | Ha |
| **2D. Statistika ko'chadi** | MG-13 | `HomeHighlights.tsx` va banner raqamlari `/statistics` ga **o'zgarishsiz** ko'chiriladi. Bosh sahifada hali qoladi (ikkala joyda) | Ha, `/statistics` boyiydi |
| **2E. Bosh sahifa va header almashadi** | MG-02, MG-03, MG-05 | Navbar → TopBar + Header; bosh sahifa → plitkalar, shaxsiy bloklar, sohalar. Bosh sahifadan statistik bloklar olinadi (ular 2D da `/statistics` da). Til prefiksli URL (`/uz/...`) | **Ha, asosiy o'zgarish** |
| **2F. Kabinet, mobil** | MG-12, MG-14 | Kabinet umumiy layout'ga, yangi chap menyu | Ha |
| **2G. Qolgan sahifalar** | MG-15 | Barcha ommaviy sahifalar yangi layout va tokenlarda, 98% tekshiruvi | Ha |

**Nega shu tartib:** 6-bo'limdagi asl tartib (MG-B da avval header almashadi) hozirgi saytda gorizontal menyuni sohalar sahifasi hali yo'q paytda olib tashlagan bo'lardi. Shuning uchun header va bosh sahifa (2E) sohalar (2B) va `/statistics` (2D) tayyor bo'lgandan keyinga surildi.

### 0.4. Hozirgi komponentlar 2-etapda qayerga boradi

| Hozirgi (1-etap) | 2-etapda | Vazifa |
|---|---|---|
| Navbar: rasmiy qator (qo'mita, Portal haqida, Reglamentlar, Portal statistikasi, stat.uz, SIAT) | Qo'mita nomi → Header (logo + portal nomi); qolgan havolalar → Footer "Ma'lumot" ustuni | MG-03, MG-09 |
| Navbar: "Ko'rsatkichlar" | `/statistics` + sohalar 5, 6, 7, 12 (narxlar, aholi, mehnat, ochiq ma'lumotlar) | MG-04, MG-13 |
| Navbar: "Hududlar" | Soha 8 "Hududlar" | MG-04 |
| Navbar: "Korxonalar" | Soha 1 "Korxonalar va tashkilotlar" va soha 4 "Biznes tahlili" | MG-04 |
| Navbar: "Fuqarolar uchun" | Soha 13 "Fuqarolar uchun" + footer "Jismoniy shaxs uchun" | MG-04, MG-09 |
| Navbar: "Xizmatlar" | "Barcha xizmatlar" → `/spheres` | MG-06 |
| Navbar: "Savol-javob" | Footer "Ko'p beriladigan savollar" + `/search` dagi FAQ bo'limi | MG-08, MG-09 |
| Navbar: "Aloqa" | Top bar "Qayta aloqa" | MG-03 |
| Navbar: avatar-profil menyusi (`Escape` bilan) | Top bar foydalanuvchi menyusi, mantiq qayta ishlatiladi | MG-03 |
| "Test rejimi" xabari | Top bar ustida qoladi, production'gacha | MG-02 |
| Banner: global qidiruv | Header qidiruv maydoni (`open-global-search` hodisasi saqlanadi) | MG-03, MG-08 |
| Banner: tezkor havolalar | "Ommabop xizmatlar" plitkalari | MG-05 |
| Banner: jonli aholi soni, portal faoliyati | `/statistics` | MG-13 |
| `HomeHighlights.tsx` ("O'zbekiston raqamlarda", "Portal faoliyati") | `/statistics` sahifasining yuqori qismi, komponent o'zgarishsiz | MG-13 |
| `Interactive.tsx` (xizmat havolalari, ikonkalar) | Ma'lumoti katalogga (`serviceCatalog.ts`, `spheres.ts`) o'tadi; ikonkalar soha kartochkalarida | MG-04, MG-05 |
| `TariffComponent.tsx` (narx oralig'i) | Soha 14 "Tariflar va shartnomalar" sahifasi va `/tariffs` | MG-06 |
| `CalendarReport.tsx` | Top bar'dagi "Hisobot kalendari" tezkor havolasi (yaqin muddatlar soni) + "Hisobotlarim" shaxsiy bloki + `/report-calendar` | MG-03, MG-05 |
| Xaritalar (`ChoroplethMap`, `RegionBubbleMap`), ko'rsatkich grafiklari, `ShareBar` | O'zgarmaydi, faqat tokenlarga o'tadi | MG-15 |
| Kabinet (18 bo'lim, turga qarab) | Funksiya o'zgarmaydi, MG-12 dagi menyu tartibi va umumiy layout | MG-12 |

### 0.5. Bajarilish holati (2026-10-21)

> 2-etap bitta sessiyada 0.3 tartibida bajarildi (2A → 2G). Commit qilinmagan. Jonli my.gov.uz o'lchovi (MG-00) hujjatdagi 1-bo'lim taxminlaridan bir necha joyda farq qildi — jonli tuzilma olindi, farqlar [`mygov-reference/README.md`](mygov-reference/README.md) 2-bo'limida.
> **O'xshashlik: 67 / 69 = 97,1%** ([`mygov-reference/checklist.md`](mygov-reference/checklist.md)); maqsad 98% — bajarilmagan, qolgan 3 band pastda.

| Vazifa | Holat | Nima qilindi (asosiy fayllar) |
|---|---|---|
| **MG-00** | ✅ | `tools/mygov-reference/capture.ts` (Playwright, proksi orqali), `docs/mygov-reference/tokens.json`, `screens/*.jpg` (4 sahifa × 360/768/1280), `README.md`, `checklist.md`. Shrift, ikonka, rasm yuklab olinmagan |
| **MG-01** | ✅ | `frontend/src/theme/tokens.ts`; `index.css` da `--mg-*` CSS o'zgaruvchilari (tungi variant bilan); `tailwind.config.js` da `mg-*` ranglar, radius, soya, gradientlar; Montserrat (Google Fonts) |
| **MG-02** | ⚠️ | `components/layout/MainLayout.tsx`: skip-link → sidebar → header → test rejimi → breadcrumb → main → sana va fikr → footer; hamma sahifa (kabinet ham) shu layout'da, `/embed/*` — layout'siz. Til: `i18n/LangContext.tsx` (uz, cry — lotindan avtomatik `translit.ts`, ru). **Farq:** `/uz`, `/cry`, `/ru` prefiksi tilni o'rnatib prefikssiz manzilga o'tadi (to'liq prefiksli URL — checklist 4.1) |
| **MG-03** | ✅ | `layout/Sidebar.tsx` (desktop 85→268 px, mobil panel), `Header.tsx` (portal nomi, qidiruv, hisobot muddati — 112 SOS o'rnida, telefon + "Qayta aloqa", `LanguageSwitcher`, `AccessibilityMenu` — shrift va tungi rejim, "Kirish"/foydalanuvchi menyusi). Eski `Navbar.tsx` o'chirildi |
| **MG-04** | ✅ | `config/spheres.ts` (14 soha), `config/serviceCatalog.ts` (50 xizmat, 48 tasi ishlaydi, 2 tasi "Tez orada"; doimiy raqam, narx, foydalanuvchilar, huquqiy asos, "Bu qanday ishlaydi?"), `config/situations.ts`, `config/navigation.ts`. Test: `serviceCatalog.test.ts` (raqam takrorlanmaydi, har sohada ≥ 2 xizmat, har yo'l router'da bor) |
| **MG-05** | ✅ | `pages/HomePage.tsx` + `components/home/HomeHero.tsx`, `PersonalBlocks.tsx`, `SpheresGrid.tsx`, `PortalBlocks.tsx`. Eski `Interactive.tsx` o'chirildi, `TariffComponent` → soha 14, `CalendarReport` → soha 2 |
| **MG-06** | ✅ | `pages/portal/Spheres.tsx` (`/spheres`, `/spheres/:id`, `?user=&price=&q=&sub=`); `/services` va `/all-services` → `/spheres`. Eski `AllServices.tsx`, `NewServices.tsx` o'chirildi |
| **MG-07** | ✅ | `pages/portal/ServicePage.tsx` (`/service/:number`); ishchi sahifalarda "#302 — xizmat haqida" qatori (`Breadcrumbs.tsx`); "Tanlanganlarga qo'shish" — `FavoriteIndicator.kind="service"` (`citizens.0002`) |
| **MG-08** | ✅ | `pages/portal/Search.tsx` (`/search?q=`, `#302` → pasport); Ctrl+K oynasi katalog xizmatlarini ham topadi |
| **MG-09** | ✅ | `layout/Footer.tsx`; `/privacy`, `/terms`, `/ai-usage` (`LegalPage.tsx`, "Namuna matn, yuridik tekshiruvdan o'tmagan"), `/sitemap` (katalogdan) |
| **MG-10** | ✅ | Yangi `backend/apps/portal`: `ServiceUsage`, `ServiceReview` (moderatsiya), `ServiceReviewVote` ("Foydali/Foydasiz"); `/api/portal/services/stats/`, `services/<n>/stats|use|reviews/`, `reviews/<id>/vote/`; seeder `portal` (faqat DEBUG); admin analitikada "Xizmatlar bo'yicha foydalanish" |
| **MG-11** | ✅ | `layout/PageFeedback.tsx`, `TypoReporter.tsx` (Ctrl+Enter); `/api/portal/page-feedback/`, `typo-report/` (IP cheklovi, kuniga bir marta); admin'da sahifalar bo'yicha "Ha" foizi |
| **MG-12** | ✅ | Kabinet umumiy layout'da; menyu tartibi MG-12 bo'yicha, yangi "Tanlanganlar" (`cabinet/FavoritesTab.tsx`), "Korxona pasporti", "Sozlamalar"; `/cabinet?tab=` havolalari. my.gov.uz kabineti skrinshotsiz (OS-MG-09) |
| **MG-13** | ✅ | `pages/portal/StatisticsHub.tsx` (`/statistics`): banner va "O'zbekiston raqamlarda" o'zgarishsiz, "Eng ko'p foydalanilgan xizmatlar", mavjud portal statistikasi |
| **MG-14** | ⚠️ | 360 px, burger, Esc, skip-link — `e2e/mygov.spec.ts`. axe-core CI'da yo'q (bog'liqlik qo'shish ruxsati kerak) |
| **MG-15** | ⚠️ | 44 ta sahifadan to'liq ekran fon va 7xl konteyner olib tashlandi, `PageHeader` breadcrumb'siz va ko'k H1. Checklist: 95,7% |

**98% gacha qolgan bandlar (birortasi yetarli):** (1) to'liq til prefiksli URL; (2) `@axe-core/playwright`. Plitka illyustratsiyalari 2026-10-21 da qo'shildi (`components/home/TileArt.tsx`).

**Ochiq savollar (7-bo'lim) — default bilan ishlandi:** OS-MG-01 (telefon: saytdagi +998 71 233-45-67, "24/7" yozilmadi), OS-MG-02 (English yo'q), OS-MG-03 (nom: "Milliy statistika qo'mitasi · Yagona onlayn statistika portali"), OS-MG-04 (katalog statik), OS-MG-05 (plitka → pasport, "story" yo'q), OS-MG-06 (namuna matn belgisi bilan), OS-MG-07 (sharh moderatsiyadan keyin), OS-MG-08 (statistik bloklar `/statistics` da; bosh sahifada faqat qisqa "raqamlarda" bloki — rahbariyat tasdig'i kerak), OS-MG-09 (kabinet skrinshotlari yo'q).

---

## 1. my.gov.uz tahlili

### 1.1. Bosh sahifa skeleti (yuqoridan pastga)

| # | Blok | Tarkibi |
|---|---|---|
| 0 | Skip-link | "Asosiy kontentga o'tish" (faqat klaviatura fokusida ko'rinadi) |
| 1 | Yuqori qator (top bar) | 112SOS · 1242 · Qayta aloqa · til almashtirgich · Kirish |
| 2 | Header | Logo + portal nomi ("O'zbekiston Respublikasi Yagona interaktiv davlat xizmatlari portali"), qidiruv, "Kengaytirilgan qidiruv" havolasi |
| 3 | "Ommabop so'rovlar" | Gorizontal skroll qilinadigan **rasmli plitkalar (stories uslubi)**, 13 ta |
| 4 | Shaxsiy bloklar | "Elektron hujjatlaringiz" va "Shaxsiy xabarnomalar" (o'qilmaganlar soni belgisi, masalan "3"), har birida "Batafsil ma'lumot" |
| 5 | "Sohalar" | 25 ta soha kartochkasi to'ri: ikonka, nom, 2 ta namunaviy xizmat, "Barchasi" havolasi; blok sarlavhasi yonida "Barcha xizmatlar" |
| 6 | Fikr vidjeti | "Sahifadagi kontent sizga ma'qul keldimi?" **Ha** / **Yo'q** + "Matndagi xatoni belgilab Ctrl+Enter bosing" eslatmasi |
| 7 | Footer | Logo + nom, 3 ustun havolalar, ijtimoiy tarmoqlar, huquqiy havolalar, hamkor logolari |

**Bosh sahifada yo'q narsalar:** yangiliklar lentasi, statistik raqamlar bloki, katta reklama banneri, mobil ilova bloki. Bosh sahifa faqat "xizmatga tez yetib borish" uchun. Statistika footer'dagi alohida sahifada (`/statistics`).

### 1.2. Yuqori qator va header

Elementlar tartibi (chapdan o'ngga, desktop):

1. "112SOS" (qo'ng'iroqcha ikonkasi bilan, favqulodda)
2. "1242" (`tel:` havola, ishonch telefoni)
3. "Qayta aloqa" (`/contact`)
4. Til almashtirgich (ochiluvchi ro'yxat): **O'zbekcha · Русский · English BETA · Qaraqalpaqsha BETA**. Faqat to'liq tarjima qilinmagan tillarda "BETA" belgisi
5. "Kirish" tugmasi (`/login`); kirgandan keyin "Xush kelibsiz!" va foydalanuvchi menyusi

Header'da **gorizontal ochiluvchi bosh menyu yo'q**. Navigatsiya 3 joyda: (a) qidiruv, (b) bosh sahifadagi "Sohalar" va soha sahifasidagi chap sidebar, (c) footer ustunlari. Bu my.gov.uz ning eng muhim tuzilmaviy xususiyati: menyu = sohalar ro'yxati.

### 1.3. "Ommabop so'rovlar" plitkalari

Tartib: Byurokratiyasiz · Karta · Bog'cha · Keshbek qaytarish · SOS yuborish · Avtosug'urta · Jarima ball · Yo'lovchi tashishga litsenziya · Ijtimoiy transport kartasi · Tonirovka olish · Mehnat faoliyati maʼlumoti · Daromadni hisoblash · Kredit tarixi.

Xususiyatlar: har plitka rasm + qisqa nom (1–3 so'z), bir qatorda gorizontal skroll, bosilganda "story" (rasm/qisqa tushuntirish) yoki to'g'ridan-to'g'ri xizmat ochiladi. Nomlar **foydalanuvchi tilida, qisqa, fe'lsiz** ("Kredit tarixi", "Daromadni hisoblash").

### 1.4. Shaxsiy bloklar

Ikki yonma-yon kartochka: "Elektron hujjatlaringiz" (`/user/digital-doc`) va "Shaxsiy xabarnomalar" (`/user/static-notification`, son belgisi bilan). Har birida "Batafsil ma'lumot" havolasi. Mehmonga ham ko'rinadi (bosganda login'ga yuboradi).

### 1.5. "Sohalar" bloki

25 soha, bosh sahifadagi tartib: Sog'liqni saqlash · Bandlik va mehnat · Ta'lim · Ijtimoiy himoya · Adliya · Ekologiya · Subsidiya · Oila va bolalar · Ko'chmas mulk · Fuqarolik · Ma'lumotnomalar · Davlat aktivlari · Iqtisodiyot va biznes · Litsenziya · Yoshlar · Bojxona · Transport · Axborot va aloqa · Geologiya · Pensiya · Madaniyat, turizm va sport · UJKX · Soliqlar · Sinov tartibida · Sug'urtalash.

Har kartochka: soha ikonkasi (SVG), soha nomi, **2 ta eng ommabop xizmat nomi** (havola), "Barchasi" (`/spheres/:id`). URL'lar raqamli id bilan (`/spheres/12`), xizmatlar ham (`/service/411`).

### 1.6. Soha sahifasi (`/spheres/:id`)

| Qism | Tarkibi |
|---|---|
| Header | Bosh sahifadagi bilan bir xil |
| H1 | Soha nomi ("Subsidiya") |
| Chap sidebar | "Sohalar" sarlavhasi va **barcha sohalar ro'yxati** (joriysi birinchi turadi yoki ajratiladi); ba'zi sohalar ostida kichik toifalar |
| Asosiy qism | Kichik toifalar (masalan "Iqtisodiyot va biznes": Biznesni ochish va yuritish · Qimmatli qog'ozlar · Investitsiyalar va innovatsiyalar · Biznesga oid ma'lumotnomalar · Kredit tarixi · Sertifikatlash va eksport · Shtrix-kodlar va klassifikatorlar · Agrosektorga davlat ko'magi · Tadbirkorlar uchun pensiya ta'minoti), ostida xizmatlar ro'yxati (sarlavha = havola) |
| Filtr yorliqlari | "Foydalanuvchilar bo'yicha ma'lumot", "Foydalanuvchi turi", "Xizmat bo'yicha ma'lumot" |
| Pastda | Fikr vidjeti, footer |

Breadcrumb ko'rinmaydi; orqaga yo'l sidebar orqali.

### 1.7. Xizmat sahifasi (`/service/:id`)

Yuqoridan pastga:

1. **H1**: xizmat nomi.
2. **Xulosa qatori**: "3 daqiqa — Bajarish vaqti" · "7 525 717 — marotaba foydalanilgan" · reyting (4.62, yulduz).
3. **Tugmalar**: "Tanlanganlarga qo'shish" (ikkinchi darajali) va **"Ariza yuborish"** (asosiy). Yonida video ko'rsatma prevyusi.
4. **Ikonkali ma'lumot bo'limlari** (tab emas, ketma-ket kartochkalar), aynan shu tartibda:
   1. Xizmat narxi
   2. Xizmat ko'rsatishning huquqiy asosi (hujjatga havola)
   3. Xizmat ko'rsatish muddati ("Avtomatik tarzda")
   4. Xizmatni olish uchun kerakli hujjatlar ("Talab etilmaydi")
   5. Xizmat foydalanuvchilari ("Jismoniy va yuridik shaxslar")
   6. Aloqa (telefonlar)
   7. Tashkilot
5. **"Bu qanday ishlaydi?"**: raqamlangan 2–4 qadam.
6. **"Umumiy statistika"**: "Xizmat bo'yicha umumiy ma'lumotlar", "Xizmat ishga tushirilganidan beri", davr filtri ("Barcha").
7. **"Baho va sharhlar"**: o'rtacha baho, nechta baho asosida, 1–5 yulduz taqsimoti, "Yaqinda qo'shilgan" saralash, "Sharhlar soni:".
8. Fikr vidjeti, footer.

### 1.8. Qidiruv (`/search`)

Sarlavha "Izlash". Natijalar bo'limlarga ajratilgan: "Xizmatlar" (har natija: **`#raqam`** + nom + bajarish vaqti "7 daq."), "Ko'p beriladigan savollar"; har bo'limda "Barchasini ko'rish". Yuqorida yana "Ommabop so'rovlar".

### 1.9. Footer

| Ustun | Havolalar (tartibda) |
|---|---|
| **Ma'lumot** | Statistika · Yagona portal missiyasi · Davlat tashkilotlari · Bepul wifi zonalari · Ko'p beriladigan savollar |
| **Foydalanuvchilar uchun** | Jismoniy shaxs uchun · Yuridik shaxs · Xorij fuqarolari uchun · Rasmiy yo'riqnomalar · Interaktiv kalendar |
| **Aloqa va qo'llab-quvvatlash** | Bog'lanish · Qayta aloqa · "1242 - umumiy savollar (24/7)" · "1148 - takliflar va shikoyatlar" · Korrupsiya to'g'risida onlayn murojaat |

Pastki qator: ijtimoiy tarmoqlar (YouTube, Facebook, Instagram, Telegram) · Maxfiylik siyosati · Foydalanish shartlari · Portal xaritasi · Sun'iy intellektdan foydalanish · hamkor logolari.

### 1.10. Umumiy UX qoidalari (kuzatilgan)

- Barcha URL'lar til prefiksi bilan: `/uz/...`, `/ru/...`, `/en/...`, `/kaa/...`.
- Har sahifa oxirida bir xil fikr vidjeti.
- Xizmatlarning doimiy raqami bor (`#411`), qidiruvda ko'rinadi.
- Har xizmatda "bajarish vaqti" va "necha marta foydalanilgan" ijtimoiy isbot sifatida.
- Matnlar qisqa, rasmiy, ikkinchi shaxsda ("Elektron hujjatlaringiz").

### 1.11. Vizual uslub (kuzatilgan, aniq qiymatlar MG-00 da)

| Token | Kuzatuv | Aniqlash |
|---|---|---|
| Fon | Oq asosiy fon, bloklar och kulrang/oq kartochkalarda | MG-00 |
| Asosiy rang | Ko'k (tugmalar, havolalar, faol holat) | MG-00, aniq hex |
| Matn | To'q kulrang/qora sarlavhalar, kulrang ikkinchi darajali matn | MG-00 |
| Kartochka | Yumaloq burchak, yupqa chegara yoki yengil soya, ichki bo'sh joy keng | MG-00: `border-radius`, `box-shadow`, `padding` |
| Ikonkalar | Bir rangli/ikki rangli chiziqli SVG soha ikonkalari | my.stat.uz o'z ikonkalarini shu uslubda chizadi |
| Shrift | Sans-serif, sarlavhalar yarim qalin | MG-00: `font-family`, o'lchamlar shkalasi |
| Konteyner | Markazlashgan, maksimal kenglik bilan | MG-00: `max-width`, ustunlar soni 360/768/1280 da |
| Grid | Sohalar to'ri desktopda bir necha ustun, telefonda 1–2 | MG-00 |

### 1.12. "98% o'xshash" qanday o'lchanadi

Piksel taqqoslash ma'nosiz (kontent boshqa). O'xshashlik **tekshiruv ro'yxati** bilan o'lchanadi: `docs/mygov-reference/checklist.md` (MG-00 yaratadi, MG-15 tekshiradi). Ro'yxat 4 guruhdan iborat, har band "bor/yo'q":

1. **Tuzilma va tartib** (1.1, 1.6, 1.7, 1.8, 1.9 dagi har qator alohida band): bloklar bir xil ketma-ketlikda.
2. **Komponentlar**: top bar, til almashtirgich (BETA belgisi bilan), plitkalar, shaxsiy bloklar, soha kartochkasi, sidebar, xizmat xulosa qatori, ikonkali bo'limlar, "Bu qanday ishlaydi?", baho bloki, fikr vidjeti, footer ustunlari.
3. **Dizayn tokenlari**: MG-00 da o'lchangan rang, shrift, radius, soya, bo'sh joy qiymatlari ±2 px / bir xil hex.
4. **Xatti-harakat**: til prefiksli URL, gorizontal skroll plitkalar, mobil menyu, Ctrl+Enter, `#raqam` qidiruvda.

Natija = bajarilgan bandlar / jami. Maqsad **≥ 98%**. Ataylab farq qiladigan bandlar (logo, nom, 112SOS o'rniga statistika ishonch telefoni, kontent) ro'yxatga "istisno" sifatida kiritiladi va hisobga olinmaydi.

---

## 2. Moslik xaritasi

| my.gov.uz | my.stat.uz ekvivalenti | Vazifa |
|---|---|---|
| Top bar: 112SOS | **Yo'q** (boshqa idora xizmati). O'rniga "Hisobot kalendari" tezkor havolasi (ikonkali, muddati yaqin hisobot soni bilan) | MG-03 |
| Top bar: 1242 | Statistika qo'mitasi ishonch telefoni (`tel:`, raqam aniqlash kerak, OS-MG-01) | MG-03 |
| Qayta aloqa | `/contact` (mavjud murojaat/operator moduli, U-12) | MG-03 |
| Til: O'zbekcha · Русский · English BETA · Qaraqalpaqsha BETA | **O'zbekcha · Ўзбекча · Русский** (mavjud uz/cry/ru), English BETA ixtiyoriy (OS-MG-02) | MG-03 |
| Kirish | Mavjud login (login/parol, OneID, ERI) | MG-03 |
| Logo + portal nomi | my.stat.uz logosi + "O'zbekiston Respublikasi Statistika qo'mitasining yagona onlayn portali" (rasmiy nom aniqlash kerak) | MG-03 |
| Qidiruv + "Kengaytirilgan qidiruv" | Global qidiruv (U-10) + `/search` | MG-08 |
| Ommabop so'rovlar (13 plitka) | "Ommabop xizmatlar", 12 plitka (2.1) | MG-05 |
| Elektron hujjatlaringiz | Yuridik shaxs: **"Hisobotlarim"** (K-05); jismoniy: **"Savollarim"** (FQ-10); mehmon: "Hisobotlarim" (login'ga yuboradi) | MG-05 |
| Shaxsiy xabarnomalar | "Shaxsiy xabarnomalar" (B-05/U-03, `unread-count`) | MG-05 |
| Sohalar (25) | "Sohalar" (14, 3-bo'lim) | MG-04, MG-05 |
| Barcha xizmatlar → `/spheres/34` | "Barcha xizmatlar" → `/spheres` (barcha sohalar bir sahifada); eski `/all-services` → redirect | MG-06 |
| `/spheres/:id` | `/spheres/:id` (sidebar bilan) | MG-06 |
| `/service/:id` | `/service/:id` (umumiy xizmat sahifasi) + "Xizmatdan foydalanish" tugmasi mavjud sahifaga olib boradi | MG-07 |
| Bajarish vaqti / marotaba foydalanilgan / reyting | Katalogdagi `duration`, backend hisoblagich, `ServiceRating` | MG-07, MG-10 |
| Tanlanganlarga qo'shish | Sevimlilar (FQ-04 dagi sevimlilar, korxonaga ham) | MG-07 |
| Ariza yuborish | So'rov turidagi xizmatlarda "Ariza yuborish" (K-06, FQ-10, konsultatsiya); ko'rish turidagilarda "Xizmatdan foydalanish" | MG-07 |
| Fikr vidjeti + Ctrl+Enter | Xuddi shunday, javoblar admin'da | MG-11 |
| Footer 3 ustun | 2.2 dagi footer | MG-09 |
| `/user/...` kabinet | Mavjud kabinet my.gov.uz kabineti uslubida (MG-12) | MG-12 |
| Interaktiv kalendar | Hisobot kalendari (`/report-calendar`) | MG-09 |
| Statistika (footer) | Portal statistikasi + bosh sahifadagi jonli ko'rsatkichlar shu yerga ko'chadi (U-08) | MG-13 |

### 2.1. "Ommabop xizmatlar" plitkalari (tartibda)

Foydalanuvchi bergan katalogdagi eng ko'p ishlatiladigan va mehmonga ochiq xizmatlar birinchi. Tartib admin'da o'zgartiriladigan bo'ladi (MG-04), boshlang'ich qiymat:

1. Korxona ma'lumoti (STIR bo'yicha) → `/orginfo`
2. Hisobot kalendari → `/report-calendar`
3. Tashqi savdo → tashqi savdo sahifasi
4. Inflyatsiya kalkulyatori → `/cpi-calculator`
5. Demografiya → demografiya sahifasi
6. Korxona bali → `/company/:stir` qidiruvi
7. Hamkor qidirish → `/partners`
8. Bozor tahlili → `/market-report`
9. Mening maoshim → FQ-05
10. Mening hududim → `/regions`
11. Tariflar → `/tariffs`
12. Ochiq API → `/developers`

Nomlar 1–3 so'z, fe'lsiz (1.3 uslubi). Plitka rasmlari: my.stat.uz o'z illyustratsiyalari (bir uslubda, `frontend/src/assets/popular/`).

### 2.2. Footer (my.stat.uz)

| Ustun | Havolalar (tartibda) |
|---|---|
| **Ma'lumot** | Statistika (portal statistikasi, MG-13) · Portal missiyasi (`/about`, docx'dagi "Biz haqimizda") · Hududiy statistika boshqarmalari · Statistika oddiy tilda (FQ-07) · Ko'p beriladigan savollar |
| **Foydalanuvchilar uchun** | Jismoniy shaxs uchun (`/citizens`) · Yuridik shaxs uchun (korxona xizmatlari soha sahifasi) · Tadqiqotchilar uchun (`/developers`) · Rasmiy yo'riqnomalar (hisobot shakllari yo'riqnomalari, S-12) · Hisobot kalendari |
| **Aloqa va qo'llab-quvvatlash** | Bog'lanish · Qayta aloqa · ishonch telefoni (24/7 bo'lsa shunday yoziladi) · Takliflar va shikoyatlar · Korrupsiya to'g'risida onlayn murojaat (`eanticor.uz`) |

Pastki qator: ijtimoiy tarmoqlar (qo'mitaning rasmiy kanallari, aniqlash kerak) · Maxfiylik siyosati · Foydalanish shartlari · Portal xaritasi (`/sitemap`, katalogdan avtomatik) · Sun'iy intellektdan foydalanish ("Stat AI", U-11) · stat.uz logosi.

---

## 3. Sohalar va xizmatlar daraxti

my.gov.uz "soha = menyu" tamoyili bo'yicha my.stat.uz ning ~60 xizmati (`XIZMATLAR_BIZ_HAQIMIZDA.docx`) 14 sohaga bo'linadi. Bosh sahifadagi tartib = sidebar tartibi = shu jadval tartibi. Har sohadagi **birinchi 2 xizmat** bosh sahifa kartochkasida ko'rinadi.

| # | Soha (`slug`) | Kichik toifalar | Xizmatlar (birinchi 2 tasi kartochkada) |
|---|---|---|---|
| 1 | Korxonalar va tashkilotlar (`companies`) | Ma'lumotnomalar · Reyting va ball | **Korxona to'g'risida ma'lumot (STIR bo'yicha)** · **Korxona bali** · Korxona va tashkilotlar ro'yxati · KTUT bo'yicha korxona · Korxona profili: "Ball nimaga asoslangan" · Korxona profili: "Chuqur tahlil" · Korxona pasporti |
| 2 | Hisobot topshirish (`reporting`) | Kalendar · Shakllar · Yordamchi | **Hisobot kalendari** · **Hisobotlarim** · Hisobot shakllari va yo'riqnomalar · Hisobot topshirish yordamchisi (K-05) · Formalarni avtomatik to'ldirish (K-01) |
| 3 | Tashqi savdo (`trade`) | Statistika · Tahlil | **Tashqi savdo statistikasi** · **Bozor tahlili** · Savdo oqimlari (U-09) · Taqqoslash va eksport (U-16) |
| 4 | Biznes tahlili (`business`) | Raqobat · Benchmark · Buyurtma | **Hamkor va raqobatchilarni qidirish** · **Tarmoq benchmarki** · Tahliliy ma'lumot tayyorlash · Individual ma'lumot so'rovi |
| 5 | Narxlar va inflyatsiya (`prices`) | Kalkulyatorlar · Monitoring | **Inflyatsiya (ISN) kalkulyatori** · **Narxlar monitoringi** · "Savat" kalkulyatori |
| 6 | Aholi va demografiya (`population`) | — | **Demografik ma'lumotlar** · **Ismlar statistikasi** |
| 7 | Mehnat va ish haqi (`labour`) | — | **Mening maoshim** · **O'rtacha ish haqi hudud va tarmoq bo'yicha** |
| 8 | Hududlar (`regions`) | Xarita · Prognoz | **Mening hududim** · **Hududlar xaritasi** · Salohiyat indeksi · Prognoz va "Nima bo'lsa" ssenariylari |
| 9 | Sanoat (`industry`) | — | **Sanoat mahsulotlari ishlab chiqaruvchilari** · **Tarmoq sahifasi (`/industry/:oked`)** · Mahsulot bo'yicha (`/products/:hs`) |
| 10 | Nashrlar (`publications`) | Byulletenlar · To'plamlar · Kitoblar | **Statistik byulletenlar** · **Statistik to'plamlar** · Nashr buyurtmasi · Elektron kitoblar |
| 11 | Tasniflagichlar va metodologiya (`classifiers`) | — | **Statistik tasniflagichlar** · **Metodologiya** · Lug'at (`/glossary`) |
| 12 | Ochiq ma'lumotlar (`open-data`) | API · Yuklab olish | **Ochiq API** · **Ma'lumotlarni yuklab olish (CSV/XLSX)** · Ko'rsatkichlarga obuna (A-02) |
| 13 | Fuqarolar uchun (`citizens`) | — | **Savol bering (Savollarim)** · **So'rovnomalar** · Statistika oddiy tilda |
| 14 | Tariflar va shartnomalar (`tariffs`) | Paketlar · Konsultatsiya | **Tarif paketlari va narx kalkulyatori** · **Konsultatsiya** · Shartnoma holati (K-08) · Scoring kreditlari |

Qoidalar:
- Bir xizmat faqat **bitta** asosiy sohada turadi, boshqa sohada `alsoIn` orqali ko'rinishi mumkin (my.gov.uz da ham kredit tarixi ikki joyda).
- Har xizmatga doimiy raqam (`#101`, `#102` …) beriladi: soha raqami × 100 + tartib. Raqam o'zgarmaydi, qidiruvda va URL'da (`/service/101`) ishlatiladi.
- Hali yozilmagan xizmatlar (masalan FQ-06) katalogda `status: 'soon'` bilan, kartochkada "Tez orada" belgisi, sahifasi ochilmaydi.

---

## 4. Mavjud vazifalar bilan bog'liqlik

| Mavjud vazifa | Bu hujjatdagi o'zgarish |
|---|---|
| XS-01 (`serviceCatalog.ts`, `/all-services`) | Katalog **saqlanadi va kengaytiriladi** (MG-04). `/all-services` sahifasi `/spheres` ga aylanadi (MG-06), eski route redirect. Agar XS-01 hali bajarilmagan bo'lsa, MG-04 + MG-06 uning o'rniga bajariladi |
| XS-02 (`ServicePageLayout`) | MG-07 qolipi uning **o'rnini bosadi** (tuzilma my.gov.uz 1.7 bo'yicha). Bajarilgan bo'lsa, komponent nomi saqlanib ichki tuzilma o'zgaradi |
| XS-03 | O'zgarmaydi, MG-07 qolipi ichida bajariladi |
| U-01 (UI to'plami) | `PageHeader` dan breadcrumb olib tashlanadi (my.gov.uz da yo'q), `Skeleton/EmptyState/ErrorState` MG-01 tokenlariga o'tkaziladi |
| U-03 (xabarnomalar) | Header'dagi qo'ng'iroqcha qoladi + bosh sahifadagi "Shaxsiy xabarnomalar" bloki (MG-05) |
| U-08 (bosh sahifa jonli ko'rsatkichlari) | Bosh sahifadan **"Statistika" sahifasiga ko'chadi** (MG-13). Tartib 98% mos bo'lishi uchun bosh sahifada faqat 1.1 dagi bloklar qoladi |
| U-10 (global qidiruv) | MG-08 bilan birlashadi |
| U-14 (mobil, a11y) | MG-14 bilan birlashadi |
| FQ-04 sevimlilar | MG-07 "Tanlanganlarga qo'shish" shu modelni ishlatadi, korxonaga ham ochiladi |
| A-01 admin analitika | Xizmat foydalanish hisoblagichi (MG-10) analitikaga ham qo'shiladi |

---

## 5. Vazifalar

Umumiy talablar (har vazifa uchun): 3 tilda (uz/cry/ru) matnlar, tungi/kunduzgi rejim (`ThemeContext`), 360/768/1280 px, `tsc`/`eslint`/`vite build` toza, `backend/apps/payment/` va xavfsizlik sozlamalarida diff yo'q, PR'da 3 kenglikdagi skrinshot (demo foydalanuvchi bilan). Branch: `task/MG-xx-<qisqa-nom>`.

### MG-00 · my.gov.uz dan namuna olish va tokenlarni o'lchash · **P0**

**Fayllar:** yangi `tools/mygov-reference/capture.ts` (repo'ga kiradi), natija `docs/mygov-reference/` (skrinshotlar `.gitignore` da emas, lekin hajmi 5 MB dan oshmasin).

**Qadamlar:**
1. Playwright skripti `https://my.gov.uz/uz`, `/uz/spheres/12`, `/uz/service/411`, `/uz/search` ni 360, 768, 1280 px da ochadi, to'liq sahifa skrinshotini oladi.
2. Har sahifada asosiy elementlar (`header`, top bar, qidiruv, plitka, soha kartochkasi, sidebar, xizmat xulosa qatori, ma'lumot bo'limi kartochkasi, tugmalar, footer, fikr vidjeti) uchun `getComputedStyle` dan: `font-family`, `font-size`, `font-weight`, `line-height`, `color`, `background-color`, `border`, `border-radius`, `box-shadow`, `padding`, `margin`, `gap`, konteyner `max-width`, grid ustunlari soni. Natija `docs/mygov-reference/tokens.json`.
3. Ishlatilgan shrift nomini aniqlash. Agar u ochiq litsenziyali bo'lsa (masalan Google Fonts'da bor) — o'sha shrift `npm` paket yoki Google Fonts orqali ulanadi; bo'lmasa eng yaqin ochiq muqobil tanlanadi va PR'da yoziladi. **my.gov.uz serveridan shrift fayli, ikonka yoki rasm yuklab olinmaydi va repo'ga qo'yilmaydi.**
4. `docs/mygov-reference/checklist.md`: 1.12 dagi 4 guruh bo'yicha bandlar ro'yxati (har band: tavsif, my.gov.uz skrinshotdagi joy, my.stat.uz sahifasi, holat). Istisnolar alohida.
5. Kabinet sahifalari (login talab qiladi) skript bilan olinmaydi. `docs/mygov-reference/README.md` da foydalanuvchidan kabinetning 3–4 skrinshotini so'rash eslatmasi qoldiriladi (MG-12 uchun).

**Qabul mezonlari:** `tokens.json` va `checklist.md` mavjud; har bir 1.11 dagi token aniq qiymat bilan to'ldirilgan; skript qayta ishga tushirilsa natija yangilanadi.

---

### MG-01 · Dizayn tokenlari va tema · **P0**

**Fayllar:** `frontend/src/theme/tokens.ts` (yangi), mavjud tema/`ThemeContext` fayli (aniqlash kerak), global CSS.

**Qadamlar:**
1. `tokens.json` dan rang, shrift, radius, soya, bo'sh joy shkalasi, konteyner kengligi va breakpoint'lar CSS o'zgaruvchilariga (`--mg-color-primary`, `--mg-radius-card`, `--mg-space-4` …) o'tkaziladi. Loyihada UI kutubxonasi (MUI/Tailwind/boshqa) qaysi bo'lsa, uning temasi ham shu tokenlardan quriladi.
2. Tungi rejim: my.gov.uz da tungi rejim bo'lmasa, my.stat.uz dagisi saqlanadi, ranglar shu palitradan avtomatik qorong'ilashtirilgan variant (kontrast ≥ 4.5:1).
3. Mavjud qattiq yozilgan ranglar (`#...`) yangi tokenlarga almashtiriladi — faqat MG vazifalari tegadigan komponentlarda; qolganlari MG-15 da.

**Qabul mezonlari:** tokenlar bitta joyda; MG-00 qiymatlari bilan ±2 px / bir xil hex; ikkala rejimda kontrast tekshiruvi (axe yoki Lighthouse) xatosiz.

---

### MG-02 · Umumiy layout skeleti · **P0**

**Fayllar:** `frontend/src/layouts/MainLayout.tsx` (yangi yoki mavjudini qayta yozish), router fayli.

**Qadamlar:**
1. Tuzilma: `SkipLink` → `TopBar` → `Header` → `<main id="main">` → `PageFeedback` (MG-11) → `Footer`. Barcha ommaviy sahifalar shu layout ichida.
2. Konteyner kengligi va yon bo'shliqlar MG-01 tokenlaridan.
3. Til prefiksli marshrutlar: `/:lang(uz|cry|ru)/...`. Prefikssiz eski URL'lar `uz` ga 301/klient redirect bo'ladi (eski havolalar sinmasin). Joriy til saqlash mexanizmi (localStorage/cookie) URL bilan sinxron.
4. Kabinet va admin sahifalari hozircha o'z layoutida qoladi (MG-12 gacha).

**Qabul mezonlari:** har ommaviy sahifada blok tartibi 1.1 dagi 0, 1, 2, …, 6, 7 bilan bir xil; eski URL'lar ishlaydi; `Tab` bosilganda birinchi bo'lib "Asosiy kontentga o'tish" chiqadi.

---

### MG-03 · Top bar, header va til almashtirgich · **P0**

**Fayllar:** `frontend/src/components/layout/TopBar.tsx`, `Header.tsx`, `LanguageSwitcher.tsx`, `MobileMenu.tsx`; mavjud header komponenti (aniqlash kerak) o'chiriladi yoki shular bilan almashtiriladi.

**Qadamlar:**
1. Top bar tartibi (chapdan): Hisobot kalendari tezkor havolasi (2-bo'lim) · ishonch telefoni (`tel:`) · "Qayta aloqa" · til almashtirgich · "Kirish".
2. Til almashtirgich: ochiluvchi ro'yxat, tartib "O'zbekcha · Ўзбекча · Русский" (+ "English BETA", agar OS-MG-02 "ha" bo'lsa). Tanlov joriy sahifani boshqa tildagi o'sha URL'da ochadi.
3. Kirgan foydalanuvchi: "Kirish" o'rnida ism/korxona nomi + ochiluvchi menyu (Kabinet · Hisobotlarim/Savollarim · Xabarnomalar · Chiqish) va qo'ng'iroqcha (U-03).
4. Header: chapda logo + portal nomi (2 qator), markazda qidiruv maydoni (MG-08 ga ulanadi, `Ctrl+K`), yonida "Kengaytirilgan qidiruv" havolasi.
5. Header'dagi eski gorizontal ochiluvchi menyular **olib tashlanadi**: ularning bandlari 3-bo'limdagi sohalarga ko'chadi. Hech bir sahifa menyusiz qolmasligi uchun eski menyudagi har band uchun soha/xizmat moslik jadvali PR tavsifida.
6. Mobil (< 768 px): top bar bandlari "burger" ichiga, header'da logo + qidiruv ikonkasi + burger. Burger ichida: sohalar ro'yxati (3-bo'lim tartibida), keyin top bar bandlari.

**Qabul mezonlari:** 1.2 dagi tartib bilan band-band mos (istisno: 112SOS → hisobot kalendari); eski menyudagi barcha sahifalarga yangi navigatsiya orqali 2 bosishda yetib borish mumkin; mobil menyu klaviatura bilan ochiladi/yopiladi (`Esc`).

---

### MG-04 · Katalogni sohalar bilan kengaytirish · **P0**

**Fayllar:** `frontend/src/config/serviceCatalog.ts` (XS-01), yangi `frontend/src/config/spheres.ts`; ixtiyoriy backend: `GET /api/common/catalog/` (agar admin'dan tartibni boshqarish kerak bo'lsa, OS-MG-04).

**Qadamlar:**
1. `Sphere` turi: `id` (1..14), `slug`, `title` (I18nKey), `icon`, `subcategories: {id, title}[]`, `order`.
2. `ServiceCatalogItem` ga qo'shiladi: `number` (doimiy raqam, 3-bo'lim qoidasi), `sphere`, `subcategory?`, `alsoIn?: sphereId[]`, `duration` (I18nKey, masalan "Darhol", "3 daqiqa", "1–3 ish kuni"), `legalBasis?` (hujjat nomi va havola), `requiredDocs?`, `users` (Jismoniy/Yuridik/Hamma), `contact?`, `unit` (mas'ul bo'linma), `howItWorks: I18nKey[]` (2–4 qadam), `actionType: 'open' | 'apply'`, `status: 'live' | 'soon'`, `popularOrder?` (2.1 uchun), `featuredInSphere?` (kartochkadagi 2 ta).
3. 3-bo'lim jadvalidagi barcha xizmatlar katalogga kiritiladi (docx'dagi ~60 xizmat; route'lar mavjud koddan, topilmasa `status: 'soon'`).
4. Matnlar (tavsif, "Bu qanday ishlaydi?", narx) `XIZMATLAR_BIZ_HAQIMIZDA.docx` dagi kirish sharti va izohlardan olinadi; narx va limitlar docx'dagi tarif jadvaliga mos.
5. Katalog bo'yicha birlik testi: har xizmatning `number` takrorlanmaydi, har sohada kamida 2 `live` xizmat, har `route` router'da mavjud.

**Qabul mezonlari:** menyu, bosh sahifa, soha sahifasi, qidiruv, sitemap faqat shu katalogdan o'qiydi (takroriy ro'yxat yo'q); test o'tadi.

---

### MG-05 · Bosh sahifa (my.gov.uz tartibida) · **P0**

**Fayllar:** `frontend/src/pages/Home.tsx` (mavjud bosh sahifa, aniqlash kerak), `components/home/PopularTiles.tsx`, `PersonalBlocks.tsx`, `SpheresGrid.tsx`, `SphereCard.tsx`.

**Qadamlar:**
1. Bloklar aynan shu tartibda: header (qidiruv) → **"Ommabop xizmatlar"** plitkalari → **shaxsiy bloklar** → **"Sohalar"** (sarlavha yonida "Barcha xizmatlar" → `/spheres`) → fikr vidjeti → footer.
2. Plitkalar: 2.1 dagi 12 ta, gorizontal skroll (sichqoncha g'ildiragi, sudrash, o'q tugmalari desktopda), rasm + nom. Bosilganda xizmat sahifasi ochiladi (my.gov.uz dagi "story" ko'rinishi ixtiyoriy: OS-MG-05).
3. Shaxsiy bloklar (2 kartochka yonma-yon, telefonda ustma-ust):
   - yuridik shaxs: "Hisobotlarim" (muddati yaqin/o'tgan hisobotlar soni) va "Shaxsiy xabarnomalar" (o'qilmaganlar soni);
   - jismoniy shaxs: "Savollarim" (javob kelganlar soni) va "Shaxsiy xabarnomalar";
   - mehmon: "Hisobotlarim" va "Shaxsiy xabarnomalar" sonsiz, bosilganda login (`next=`).
   Har birida "Batafsil ma'lumot".
4. Sohalar to'ri: 14 kartochka, har birida ikonka, nom, 2 ta `featuredInSphere` xizmat havolasi, "Barchasi" → `/spheres/:id`. Ustunlar soni MG-00 bo'yicha.
5. Mavjud bosh sahifadagi boshqa bloklar (banner, jonli ko'rsatkichlar, yangiliklar va h.k.) bosh sahifadan olib tashlanadi va MG-13 dagi "Statistika" sahifasiga yoki tegishli soha sahifasiga ko'chiriladi. Ro'yxat PR tavsifida. **2-etap eslatmasi:** bu qadam MG-13 dan keyin bajariladi (0.3, qadam 2E); hozirgi `Banner.tsx`, `HomeHighlights.tsx`, `Interactive.tsx`, `TariffComponent.tsx`, `CalendarReport.tsx` qayerga borishi 0.4-bo'limda.

**Qabul mezonlari:** 1.1 bilan blok tartibi 100% mos; plitkalar 360 px da gorizontal skrolldan boshqa sahifa skrolli bermaydi; shaxsiy bloklar 3 rolda to'g'ri; bosh sahifa Lighthouse Performance ≥ 85 (mobil).

---

### MG-06 · Soha sahifasi va "Barcha xizmatlar" · **P0**

**Fayllar:** `frontend/src/pages/Sphere.tsx`, `pages/AllSpheres.tsx`, `components/spheres/SpheresSidebar.tsx`, `ServiceListItem.tsx`.

**Qadamlar:**
1. `/spheres/:id`: H1 = soha nomi; chapda "Sohalar" sidebar (14 soha, joriysi ajratilgan, kichik toifalari ochilgan); o'ngda kichik toifalar bo'yicha guruhlangan xizmatlar ro'yxati.
2. Ro'yxat elementi: `#raqam` (kichik, kulrang), xizmat nomi (havola), bir qatorli tavsif, belgilar: kim uchun (Jismoniy/Yuridik/Hamma), kirish sharti (Ochiq · Ro'yxatdan o'tgach · Paket · Alohida narx), bajarish vaqti, `status: 'soon'` bo'lsa "Tez orada".
3. Filtr paneli my.gov.uz yorliqlari bilan: "Foydalanuvchi turi" (Hammasi · Jismoniy shaxs · Yuridik shaxs), "Xizmat bo'yicha ma'lumot" (Hammasi · Bepul · Pullik). Filtr URL'da (`?user=legal&price=free`).
4. `/spheres` ("Barcha xizmatlar"): xuddi shu layout, o'ngda barcha sohalar ketma-ket, har biri o'z sarlavhasi bilan. `/all-services` → `/spheres` redirect (XS-01 dagi query parametrlari mos filtrga o'giriladi).
5. Mobil: sidebar sahifa tepasida gorizontal chip'lar yoki "Sohalar" ochiluvchi tanlovi.

**Qabul mezonlari:** 1.6 bilan tuzilma mos; har xizmat 3-bo'limdagi sohasida; filtr URL'dan tiklanadi; eski `/all-services` havolasi ishlaydi.

---

### MG-07 · Xizmat sahifasi qolipi (`/service/:id`) · **P0**

**Fayllar:** `frontend/src/pages/ServicePage.tsx`, `components/services/ServiceSummary.tsx`, `ServiceInfoSections.tsx`, `HowItWorks.tsx`, `ServiceStats.tsx`, `ServiceRatings.tsx`; XS-02 dagi `ServicePageLayout` (bor bo'lsa) shu tuzilmaga o'tkaziladi.

**Qadamlar:**
1. Har katalog xizmatining **"pasport" sahifasi** `/service/:number`: tuzilma 1.7 dagi 1–8 tartibda.
   - Xulosa qatori: "Bajarish vaqti" (`duration`) · "marotaba foydalanilgan" (MG-10) · reyting (MG-10).
   - Tugmalar: "Tanlanganlarga qo'shish" (login talab qiladi) va asosiy tugma: `actionType='apply'` → **"Ariza yuborish"**, `'open'` → **"Xizmatdan foydalanish"**. Asosiy tugma mavjud xizmat sahifasiga (masalan `/market-report`) olib boradi; login yoki paket kerak bo'lsa oldindan ogohlantirish (docx X-08).
   - Ikonkali bo'limlar 1.7.4 tartibida: Xizmat narxi (docx tarif jadvalidan, paket limiti bilan) · Huquqiy asos · Xizmat ko'rsatish muddati · Kerakli hujjatlar · Xizmat foydalanuvchilari · Aloqa · Mas'ul bo'linma (my.gov.uz dagi "Tashkilot").
   - "Bu qanday ishlaydi?" (`howItWorks`).
   - "Umumiy statistika": foydalanishlar soni, davr filtri (Barcha · Yil · Oy).
   - "Baho va sharhlar": o'rtacha baho, 1–5 taqsimot, sharhlar ro'yxati ("Yaqinda qo'shilgan"), login qilgan va xizmatdan foydalangan foydalanuvchi baho qoldiradi.
2. Mavjud xizmat sahifalari (`/tariffs`, `/market-report`, `/partners`, `/consultation`, `/citizens`, `/developers`, kabinet xizmatlari) **o'z ish sahifasi bo'lib qoladi**, ularning tepasiga kichik qator qo'shiladi: "← #302 Bozor tahlili haqida" (pasportga havola). Funksionallik o'zgarmaydi.
3. `document.title` va meta tavsif katalogdan.

**Qabul mezonlari:** katalogdagi har `live` xizmat uchun pasport sahifasi ochiladi; 1.7 bilan bo'limlar tartibi mos; asosiy tugma to'g'ri sahifaga, kerak bo'lsa login'dan keyin qaytib keladi.

---

### MG-08 · Qidiruv va "Kengaytirilgan qidiruv" · **P1**

**Fayllar:** backend `GET /api/common/search/?q=` (U-10), frontend `pages/Search.tsx`, header qidiruv maydoni.

**Qadamlar:**
1. Header maydoni: yozish bilan takliflar ochiluvchi ro'yxatda (xizmatlar `#raqam` + nom, keyin FAQ, keyin korxonalar STIR/nom bo'yicha — faqat ochiq maydonlar).
2. `/search?q=` sahifasi: sarlavha "Izlash"; tepada "Ommabop xizmatlar" plitkalari (qisqa variant); natija bo'limlari "Xizmatlar" (`#raqam`, nom, bajarish vaqti), "Ko'p beriladigan savollar", "Korxonalar", "Maqolalar" (FQ-07), har birida "Barchasini ko'rish".
3. Raqam bilan qidirish: `#302` yoki `302` → to'g'ridan-to'g'ri xizmat pasporti.
4. Kengaytirilgan filtrlar: soha, foydalanuvchi turi, narx.

**Qabul mezonlari:** 3 tilda va lotin/kirill aralash so'rovda topadi; natijalar 300 ms ichida (lokal); PINFL, telefon kabi maxfiy maydonlar qidiruvda va javobda yo'q.

---

### MG-09 · Footer · **P1**

**Fayllar:** `frontend/src/components/layout/Footer.tsx`.

**Qadamlar:**
1. 2.2 dagi 3 ustun aynan shu tartibda; pastki qator (ijtimoiy tarmoqlar, huquqiy havolalar, "Sun'iy intellektdan foydalanish", logo).
2. Hali yo'q sahifalar uchun oddiy statik sahifalar: `/about` (docx "Biz haqimizda" matni), `/privacy`, `/terms`, `/ai-usage` (Stat AI qanday ishlashi, OS-06 bo'yicha), `/sitemap` (katalogdan avtomatik). Huquqiy matnlar namuna sifatida "Namuna matn, yuridik tekshiruvdan o'tmagan" belgisi bilan (OS-MG-06).
3. Mobil: ustunlar ochiluvchi (accordion).

**Qabul mezonlari:** 1.9 bilan ustun soni va tuzilma mos; barcha havolalar ishlaydi (404 yo'q).

---

### MG-10 · Foydalanish hisoblagichi va baholar (backend) · **P1**

**Fayllar:** backend yangi app yoki mavjud `services` app (aniqlash kerak): `ServiceUsage`, `ServiceRating` modellari, migratsiya, endpoint'lar; `seed_demo` ga seeder.

**Qadamlar:**
1. `ServiceUsage(service_number, user_nullable, created_at)` — xizmatning asosiy amali bajarilganda (hisobot ochildi, eksport, ariza yuborildi) yoziladi; sahifa ochilishi emas. Yozish mavjud view'larga minimal dekorator/signal bilan; to'lov kodiga tegilmaydi.
2. `GET /api/common/services/:number/stats/?period=` → `{usage_count, rating_avg, rating_count, distribution}`; natija keshlanadi (5 daqiqa).
3. `ServiceRating(service_number, user, score 1–5, comment, created_at)`, bir foydalanuvchi bir xizmatga bitta baho (o'zgartirishi mumkin); sharh admin'da moderatsiya (`is_published`).
4. Sintetik namuna (ISH_REJASI 8-bo'lim qoidalari, faqat `DEBUG=True`): har xizmatga foydalanish soni va 20–200 baho; UI'da "Namuna ma'lumot" belgisi (S-09).
5. A-01 admin analitikasiga "Xizmatlar bo'yicha foydalanish" jadvali.

**Qabul mezonlari:** testlar (model, endpoint, takroriy baho); demo muhitda har pasportda raqam va baho ko'rinadi va "Namuna" deb belgilangan; production'da sintetik yozuv yo'q.

---

### MG-11 · Sahifa fikri vidjeti va Ctrl+Enter · **P2**

**Fayllar:** `components/layout/PageFeedback.tsx`, backend `POST /api/common/page-feedback/`, `POST /api/common/typo-report/`, admin ro'yxatlari.

**Qadamlar:**
1. Har sahifa oxirida "Sahifadagi kontent sizga ma'qul keldimi?" **Ha** / **Yo'q**. "Yo'q" bosilsa ixtiyoriy izoh maydoni (500 belgigacha). Bir sahifaga bir brauzerdan kuniga bir marta.
2. Matnni belgilab `Ctrl+Enter` → kichik oyna: belgilangan matn, izoh, "Yuborish". Sahifa URL'i va til avtomatik.
3. Rate limit (IP bo'yicha), mehmonga ochiq, shaxsiy ma'lumot so'ralmaydi.
4. Admin'da sahifalar bo'yicha "Ha/Yo'q" foizi.

**Qabul mezonlari:** ikkala amal ishlaydi va admin'da ko'rinadi; spam himoyasi test bilan tekshirilgan.

---

### MG-12 · Kabinetni my.gov.uz kabineti uslubiga o'tkazish · **P1**

**Fayllar:** kabinet layouti va sahifalari (aniqlash kerak), `MainLayout` bilan bir xil header/footer.

**Qadamlar:**
1. Kabinet ham MG-02 layoutida (bir xil top bar, header, footer); ichida chap menyu.
2. Chap menyu tartibi (yuridik shaxs): Bosh panel · Hisobotlarim · Xabarnomalar · Mening xizmatlarim (paket va limitlar) · Arizalarim (xizmat so'rovlari, individual buyurtmalar) · Shartnomalar · To'lovlar tarixi · Tanlanganlar · Korxona pasporti · Sozlamalar. Jismoniy shaxs: Bosh panel · Savollarim · Xabarnomalar · Tanlanganlar · Obunalar · API kalitlarim · Sozlamalar.
3. my.gov.uz kabinetining aniq tuzilmasi bu tahlilda ko'rilmadi (login talab qiladi). Foydalanuvchi bergan skrinshotlar (MG-00, 5-qadam) bo'lsa, menyu nomlari va tartibi o'shalarga moslanadi; bo'lmasa yuqoridagi tartib ishlatiladi va PR'da "skrinshot bilan tekshirilmagan" deb yoziladi.
4. Bosh panel kartochkalari MG-05 dagi shaxsiy bloklar uslubida.

**Qabul mezonlari:** kabinetning barcha mavjud sahifalari yangi menyudan ochiladi; mavjud funksiyalar o'zgarmagan (qo'lda tekshirish ro'yxati PR'da).

---

### MG-13 · "Statistika" sahifasi (bosh sahifadan ko'chgan bloklar) · **P1**

**Fayllar:** `pages/Statistics.tsx` (`/statistics`).

**Qadamlar:**
1. Bosh sahifadan olib tashlangan jonli ko'rsatkichlar (U-08: aholi, inflyatsiya, YaIM, tashqi savdo va h.k.) shu yerga, `StatCard` (U-01) bilan. **2-etap eslatmasi:** 1-etapdagi `HomeHighlights.tsx` ("O'zbekiston raqamlarda", aholi soati, tashqi savdo, e'lonlar, "Portal faoliyati") va banner raqamlari qayta yozilmaydi, komponentlar o'zgarishsiz shu sahifaga qo'yiladi. MG-13 bosh sahifa almashishidan (MG-05) **oldin** bajariladi.
2. Pastda portal statistikasi: ro'yxatdan o'tganlar, eng ko'p ishlatilgan 10 xizmat (MG-10 dan), oy bo'yicha foydalanish grafigi.
3. Footer "Ma'lumot → Statistika" shu sahifaga.

**Qabul mezonlari:** bosh sahifadagi eski ma'lumotlar yo'qolmagan, shu yerda ochiladi; grafiklar loyihadagi yagona grafik kutubxonasida (Q-03).

---

### MG-14 · Mobil moslashuv va kirish qulayligi · **P1**

U-14 shu vazifaga qo'shiladi.

**Qadamlar:**
1. 360, 768, 1280 px da MG-00 skrinshotlari bilan yonma-yon taqqoslash (`docs/mygov-reference/compare/`): bloklar joylashuvi va ustunlar soni bir xil.
2. Klaviatura: skip-link, fokus halqasi ko'rinadi, plitkalar va sidebar strelkalar bilan.
3. `aria-label`: til almashtirgich, qidiruv, burger, plitkalar; rasmlarda `alt`.
4. axe-core avtomatik tekshiruvi CI'ga (Q-06): bosh sahifa, soha, xizmat pasporti, qidiruv.

**Qabul mezonlari:** axe'da "serious/critical" xato yo'q; 360 px da gorizontal skroll faqat plitkalarda.

---

### MG-15 · Qolgan sahifalarni yangi uslubga o'tkazish va 98% tekshiruvi · **P1**

**Qadamlar:**
1. ISH_REJASI 4.1 dagi barcha ommaviy sahifalar (tashqi savdo, demografiya, KTUT, hisobotlar, sanoat, CPI, tasniflagichlar, byulletenlar, kitob do'koni, FAQ, `/regions`, `/industry`, `/orginfo`, `/company/:stir` va h.k.) uchun: MG-02 layout, H1 uslubi, kartochkalar MG-01 tokenlarida, qattiq yozilgan ranglar tokenga almashtiriladi. Har sahifa alohida kichik PR bo'lishi mumkin (`task/MG-15-<sahifa>`).
2. Sahifa ichidagi breadcrumb'lar olib tashlanadi (my.gov.uz da yo'q), o'rniga soha sidebar'i yoki "← #raqam xizmat haqida" qatori (MG-07.2).
3. `checklist.md` to'liq to'ldiriladi, natija foizi PR tavsifida. **< 98% bo'lsa** bajarilmagan bandlar ro'yxati va sababi bilan yangi vazifalar taklif qilinadi.

**Qabul mezonlari:** checklist natijasi ≥ 98% (istisnolarsiz hisob); barcha ommaviy sahifalar yangi layoutda.

---

## 6. Bajarish tartibi

> **2026-10-21:** hozirgi dizayndan o'tishda **0.3-bo'limdagi tartib (2A..2G) ustun turadi**. Quyidagi asl jadval ma'lumot uchun qoldirildi: unda header (MG-B) sohalar sahifasidan oldin almashadi, bu hozirgi saytda menyusiz qolishga olib kelardi.

ISH_REJASI 15-bo'limidagi qadamlarga parallel ravishda. MG vazifalari ma'lumot (S-...) vazifalariga bog'liq emas, faqat MG-10 seeder'i `seed_demo` karkasini (S-02) talab qiladi.

| Qadam | Vazifalar | Natija |
|---|---|---|
| MG-A | MG-00, MG-01 | Namuna va tokenlar, tema |
| MG-B | MG-02, MG-03, MG-09 | Yangi skelet: top bar, header, footer har sahifada |
| MG-C | MG-04, MG-06, MG-07 | Sohalar, "Barcha xizmatlar", xizmat pasportlari |
| MG-D | MG-05, MG-13 | Bosh sahifa my.gov.uz tartibida, jonli ko'rsatkichlar "Statistika"da |
| MG-E | MG-08, MG-10, MG-11 | Qidiruv, foydalanish soni va baholar, fikr vidjeti |
| MG-F | MG-12, MG-14 | Kabinet, mobil va a11y |
| MG-G | MG-15 | Qolgan sahifalar va 98% tekshiruvi |

### Claude Code'ga topshiriq berish namunalari

Bitta vazifa:
```text
mystat repo'sida mystat/MYGOV_DIZAYN.md dagi MG-03 ni bajar.
ISH_REJASI.md ning 2- va 3-bo'limlaridagi qoidalarga amal qil.
my.gov.uz dan logo, ikonka, rasm yoki shrift faylini ko'chirma.
"(aniqlash kerak)" joylarni mavjud koddan top; topilmasa PR tavsifida yoz.
Qabul mezonlarini tekshirib, 360/768/1280 skrinshotlarini PR'ga qo'sh.
```

Butun qadam:
```text
mystat repo'sida mystat/MYGOV_DIZAYN.md 6-bo'limdagi MG-A va MG-B qadamlarini bajar:
har vazifa uchun alohida branch va PR, jadvaldagi tartibda.
MG-00 ni lokal kompyuterdan ishga tushir (my.gov.uz ga to'g'ridan-to'g'ri kirish kerak).
Har PR oxirida docs/mygov-reference/checklist.md dagi tegishli bandlarni belgilab, foizni yoz.
```

---

## 7. Ochiq savollar

| # | Savol | Default (javob bo'lmaguncha) | Vazifa |
|---|---|---|---|
| OS-MG-01 | Top bar'dagi ishonch telefoni raqami qaysi va 24/7 mi? | Mavjud saytdagi aloqa raqami, "24/7" yozilmaydi | MG-03, MG-09 |
| OS-MG-02 | "English BETA" qo'shilsinmi? | Yo'q, faqat uz/cry/ru (my.gov.uz dagi "BETA" uslubi kelajakda) | MG-03 |
| OS-MG-03 | Portalning rasmiy to'liq nomi header'da qanday yoziladi? | "O'zbekiston Respublikasi Statistika qo'mitasi · Yagona onlayn statistika portali" | MG-03 |
| OS-MG-04 | Sohalar va "Ommabop xizmatlar" tartibini admin o'zgartira olsinmi? | Hozircha statik katalogda; keyin admin endpoint | MG-04 |
| OS-MG-05 | Plitkalar my.gov.uz dagi kabi "story" (rasmli tushuntirish) ochsinmi? | Yo'q, to'g'ridan-to'g'ri xizmat pasporti | MG-05 |
| OS-MG-06 | Maxfiylik siyosati va foydalanish shartlari matnini kim beradi? | Namuna matn, "yuridik tekshiruvdan o'tmagan" belgisi | MG-09 |
| OS-MG-07 | Xizmatlarga baho/sharh ochiq e'lon qilinsinmi (salbiy sharhlar ham)? | Ha, moderatsiyadan keyin | MG-10 |
| OS-MG-08 | Bosh sahifadan jonli ko'rsatkichlarni olib tashlash rahbariyat bilan kelishilganmi? | **Qaror (2026-10-21):** 1-etapda bosh sahifada qoladi; 2-etapda `/statistics` ga ko'chadi (0.3, qadam 2D–2E). Rahbariyat bilan kelishuv 2E dan oldin tasdiqlanishi kerak | MG-05, MG-13 |
| OS-MG-09 | my.gov.uz kabinetining skrinshotlarini foydalanuvchi bera oladimi? | Bo'lmaguncha 5-bo'lim MG-12 dagi tartib | MG-12 |

---

*Manba sahifalar (2026-10-20 holati):* [my.gov.uz/uz](https://my.gov.uz/uz) · [Subsidiya sohasi](https://my.gov.uz/uz/spheres/34) · [Iqtisodiyot va biznes sohasi](https://my.gov.uz/uz/spheres/12) · ["Kredit tarixi" xizmati](https://my.gov.uz/uz/service/411) · [Qidiruv](https://my.gov.uz/uz/search)
