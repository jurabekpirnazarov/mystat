# my.stat.uz — feature'lar: eskida nima bor edi, hozir nima bor va ma'lumot qayerdan keladi

> **Sana:** 2026-10-21
> **"Eski holat"** — boshlang'ich commit `1e4e61e` (2026-10-13), [PROEKT_TAHLIL.md](PROEKT_TAHLIL.md) tahlili. **"Hozirgi holat"** — commit `efc0d9b` (2026-10-20).
> **Manba:** `frontend/src/App.tsx` marshrutlari (eski va hozirgi versiya `git show` bilan solishtirildi), `PersonalCabinet.tsx` menyusi, backend view'lari va modellari, `seed_demo` seeder'lari (`backend/apps/common/seeders/`), [XIZMATLAR_TAHLILI.md](XIZMATLAR_TAHLILI.md).
> Raqamlar lokal bazadagi holat (production dump'i).

---

## 1. Qisqacha xulosa

| Ko'rsatkich | Eskida (2026-10-13) | Hozir (2026-10-20) |
|---|---|---|
| Frontend sahifalari (marshrutlar) | 25 | 59 (+ 404 sahifa) |
| Kabinet bo'limlari | 7, hammaga bir xil | 18, foydalanuvchi turiga qarab (`all` / `legal` / `citizen`) |
| Backend app'lari | 11 (2 tasi ishlamaydi: `chat`, `monitoring`) | 18 (yangi: `analytics`, `siat`, `credits`, `citizens`, `consultations`, `open_api`, + `organizations` tuzatildi) |
| Ma'lumot manbalari | Production bazasi + admin kiritgan kontent | + **SIAT API** (har kuni), **stat.uz** aholi hisoblagichi, **sintetik namuna** (`seed_demo`, faqat `DEBUG=True`) |
| Ishlamaydigan yoki soxta qismlar | Stat AI va operator chat (faqat UI), `/statistics` raqamlari `random`, kabinetdagi to'lovlar qattiq yozilgan, xabarnomalar brauzer xotirasida | Asosiylari tuzatildi; sintetik ma'lumot "Namuna" belgisi bilan ajratiladi |

**Bir gap bilan:** eskida portal asosan "ochiq ma'lumot ko'rish + paket sotish" edi. Hozir unga hududlar tahlili (SIAT), korxona scoringi va kontragent kartasi, fuqarolar bo'limi, konsultatsiya, ochiq API va ommaviy statistik xizmatlar (e'lonlar kalendari, panellar, aholi soati) qo'shildi. Yangi qismlarning bir qismi hozircha **real manbasiz** ishlaydi: ular faqat demo muhitdagi namuna ma'lumot bilan to'lgan (6-bo'lim).

---

## 2. Foydalanuvchi turlari

| Tur | Eskida | Hozir |
|---|---|---|
| **Mehmon** | Tashqi savdo, demografiya, hisobot ro'yxati, FAQ, tariflar | ~30 xizmat: yuqoridagilar + hududlar xaritasi va prognoz, hamkor qidiruvi, korxona umumiy bali, kontragent kartasi, bozor tahlili (qisqa), fuqarolar bo'limi, panellar, e'lonlar kalendari |
| **Jismoniy shaxs** (`individual`) | OneID orqali; ochiq ma'lumot va kitob bozori. Kabinet yuridik shaxsnikidan farq qilmasdi | Login/parol yoki OneID. Bepul: ISN kalkulyatori, tasniflagichlar, sanoat, so'rovnomada qatnashish, "Savollarim", obunalar, API kaliti, kitob buyurtmasi |
| **Yuridik shaxs** (`legal_entity` + `Organization`) | Login/parol; paket → shartnoma → limit bo'yicha xizmat, kitob | OneID yoki ERI. + Xizmat so'rovlari, individual ma'lumot, faoliyat rejasi, "Hisobotlarim", benchmark, konsultatsiya, korxona pasporti, StatCoin bilan korxona profili |
| **Buxgalter** (`bugalter`) | Filial shartnomalari, Telegram xabar, pochta bo'limlari | O'zgarmagan |
| **Xodim** (`employee`, `manager`) | Xizmat so'rovlariga javob (tuman bo'yicha) | + Navbatlar, faoliyat rejalari; javob yozish faqat biriktirilgan xodimga (`IsAssignedEmployee`) |
| **Konsultant** | Yo'q edi | Yangi: o'z jadvali va band qilingan konsultatsiyalar |
| **Admin** | Maxfiy URL + reCAPTCHA + TOTP 2FA; kontent, paketlar, DIDOX | + Analitika paneli, SIAT sinxron holati, `ReleaseEvent` sanalari, StatCoin hamyonlari |

---

## 3. Eski holat (2026-10-13): feature'lar, kim uchun, ma'lumot qayerdan

Belgilar: ✅ ishlaydi · ⚠️ qisman · ❌ ishlamaydi yoki faqat dizayn.

### 3.1. Ochiq statistika

| Feature | Sahifa | Kim uchun | Holat | Ma'lumot manbasi |
|---|---|---|---|---|
| Tashqi savdo tahlili | `/ex-trade`, `/foreign-trade` | Mehmon | ✅ (`trade-flows` 404) | Baza: `TradeData` 3,58 mln qator, `Product` (HS), `SITC`, `Country`. Admin Excel yuklaydi (`trade-data/upload`) |
| Demografiya | `/statistical-data` | Mehmon | ❌ zaglushka, UI yo'q edi | `media/demographics/data.parquet` (serverdagi fayl, dump bilan kelmaydi) + `DemographicSection` sxemasi |
| Statistika dashboard | `/statistics` | Mehmon | ❌ raqamlar `random` | Yo'q (kodda tasodifiy) |
| Korxonalar reyestri (KTUT) | `/organizations-ktut`, `/organizations` | Login | ✅ | Baza: `Ktut` 65 540 korxona (faqat STIR, OKPO, nom) |
| Korxona ma'lumoti STIR bo'yicha | `/orginfo`, `/organizations-register` | Login + paket limiti | ⚠️ | Tashqi reyestr API (`REGISTER_BASE_URL`, lokalda bo'sh) |
| Sanoat mahsulotlari | `/industry` | Login | ✅ | Baza: `IndustrialProduct` 53 319, kategoriya 311, SKP 2137 |
| Hisobot ro'yxati va kalendari | `/reports`, `/report-calendar`, `/reglaments` | Mehmon | ✅ | Baza: `ReportList` 108 shakl, `KtutReportList` 225 768 bog'lanish |
| ISN (CPI) kalkulyatori | `/cpi-calculator` | Login | ✅ | Baza: `PriceIndex` 311 yozuv (admin kiritadi) |
| Statistik klassifikatorlar | `/statistical-classifications` | Login | ❌ jadval bo'sh | `StatisticClassification` — 0 yozuv |
| Byulletenlar | Kabinet | Yuridik, paket | ✅ | Admin yuklagan fayllar (11 ta) |
| Hududiy ma'lumot fayllari | — | Mehmon | ✅ (yozish ochiq — xavfsizlik teshigi) | `InformationModel` 222 fayl, admin yuklaydi |

### 3.2. Xizmatlar, shartnoma, to'lov

| Feature | Kim uchun | Holat | Ma'lumot manbasi |
|---|---|---|---|
| Xizmatlar katalogi, 4 tarif paketi | Mehmon ko'radi, yuridik sotib oladi | ✅ | Admin: `Service`, `ServicePackage`, `ServicePackagePrice` (sektor bo'yicha BHM), `SiteSettings` (BHM qiymati) |
| Shartnoma (DOCX + DIDOX imzo) | Yuridik | ✅ / ⚠️ holat tekshiruvi qo'lda | `contractTemplate.docx`, DIDOX API, Telegram bot |
| Paketni faollashtirish | Admin | ⚠️ qo'lda | Admin `UserServicePackage` yaratadi |
| Limit hisobi | Yuridik | ✅ e-kitob, byulleten, orginfo | `UserServicePackageItemUse` |
| Click to'lov | Kitob xaridori | ❌ havola qattiq yozilgan, `Order` summasi 0 | Click callback'lari |

### 3.3. Kitob bozori va boshqalar

| Feature | Kim uchun | Holat | Ma'lumot manbasi |
|---|---|---|---|
| Kitob katalogi, savat, buyurtma | Login (jismoniy va yuridik) | ✅ (to'lov ❌) | Baza: `Book` 116, `BookOption` 160; `media/` dagi rasm va PDF |
| Pochta bo'limlari xaritasi | Login | ✅ | Baza: `PostalLocation` 1450 nuqta |
| FAQ, Portal haqida, Aloqa | Mehmon | ✅ | Admin kontenti |
| Banner va platforma statistikasi | Mehmon | ✅ | Baza (foydalanuvchi, shartnoma soni) |
| Stat AI va operator chat | Mehmon | ❌ faqat UI, xabar hech qayerga ketmaydi | Yo'q |
| Kabinet: profil, xizmatlar, shartnomalar, buyurtmalar | Login | ✅ | API |
| Kabinet: to'lovlar | Login | ❌ | Kodda qattiq yozilgan demo |
| Kabinet: xabarnomalar | Login | ⚠️ | Faqat brauzer xotirasida; `notifications/me` chaqirilmagan |

---

## 4. Hozirgi holat (2026-10-20): feature'lar, kim uchun, ma'lumot qayerdan

Belgilar: 🟢 mehmon · 🔵 ro'yxatdan o'tgan (bepul) · 🟡 pullik yoki paket limiti · 🏢 faqat yuridik · 👤 faqat jismoniy.
"Manba turi" ustuni: **Real** — production bazasi yoki tashqi rasmiy manba; **SIAT** — siat.stat.uz API; **Namuna** — `seed_demo` sintetik ma'lumoti (6-bo'lim); **Kontent** — admin yoki kodda yozilgan matn.

### 4.1. Ommaviy statistika

| Feature | Sahifa | Kim | Manba turi | Ma'lumot qayerdan |
|---|---|---|---|---|
| Bosh sahifa: "O'zbekiston raqamlarda" (4 ko'rsatkich, tashqi savdo, e'lonlar) | `/` | 🟢 | SIAT + Real | `SiatValue` (panellar), `TradeData`, `ReleaseEvent` |
| Aholi soati | `/`, `/dashboards/*` | 🟢 | Real (stat.uz) | `PopulationAnchor`: `sync_population_clock` stat.uz sahifasidagi hisoblagich parametrlarini har 6 soatda o'qiydi; soat brauzerda hisoblanadi |
| Portal faoliyati (banner) | `/` | 🟢 | Real | Baza: foydalanuvchi, xizmat, shartnoma sonlari (`platform-stat`) |
| Portal statistikasi | `/statistics` | 🟢 | Real | `platform-stat` (foydalanuvchi, xizmat foydalanishi); avval `random` edi |
| Mavzuli panellar (iqtisodiyot, mehnat, aholi) | `/dashboards/:slug` | 🟢 | SIAT | `apps/siat/public.py` → `PANELS` |
| E'lonlar kalendari (+ `.ics`) | `/release-calendar` | 🟢 | SIAT + Kontent | `ReleaseEvent` (admin kiritgan rasmiy sana); bo'lmasa SIAT `source_updated_at` + davriylikdan taxminiy sana |
| Ko'rsatkichni ulashish va embed | `/embed/indicator/:key` | 🟢 | SIAT | `/api/common/map/card/<key>/` |
| Hududlar xaritasi (drill-down, bivariant, eksport) | `/regions` | 🟢 | SIAT | `SiatIndicator`, `SiatValue`, `Territory`; SOATO chegaralari `apps/siat/data/` (+ `boundary_overrides.json`). `sync_siat` har kuni 03:30 |
| Hudud profili | `/regions/:id` | 🟢 | SIAT + Namuna | SIAT'da bor ko'rsatkichlar SIAT'dan (`siat/profile.py` → `SIAT_MAP`), qolganlari `RegionIndicator` namunasi (S-11); hududdagi sanoat va savdo — real `IndustrialProduct`, `TradeData` |
| Hududlar salohiyati indeksi, prognoz, "nima bo'lsa" | `/regions` | 🟢 | SIAT (hisoblangan) | `compute_scores` (`siat/scoring/`), `train_forecasts` (`siat/forecast/`, 80% oraliq) — SIAT qatorlaridan |
| Tashqi savdo tahlili, savdo oqimlari | `/ex-trade`, `/trade-flows` (`/foreign-trade`) | 🟢 | Real | `TradeData`, `Product`, `SITC`, `Country`; Excel yuklash endi faqat admin (`IsAdminUser`) |
| Demografiya (+ CSV) | `/demographics` (`/statistical-data`) | 🟢 | Real / Namuna | Production'da `media/demographics/data.parquet`. Lokalda u yo'q — `data.synthetic.parquet` (B-08, faqat `DEBUG=True`) |
| Hisobot kalendari, ro'yxati, eslatma | `/report-calendar`, `/reports`, `/reglaments` | 🟢 / eslatma 🔵 | Real + Namuna | `ReportList`, `KtutReportList`. Yo'riqnomalar va namuna PDF — S-12 namunasi. ⚠️ `ReportList.deadline` 2025 da qotgan |
| ISN kalkulyatori | `/cpi-calculator` | sahifa 🟢, hisob 🔵 | Real | `PriceIndex` (admin) |
| Statistik tasniflagichlar | `/statistical-classifications` | 🔵 | Namuna + tashqi | Hujjatlar ro'yxati — S-03 namunasi (`[DEMO]` prefiksi, production'da bo'sh). Kod daraxti — tashqi reyestr (`services/classify-item/`) |
| Ochiq API (`/api/open/v1/`: cpi, trade/summary, regions/indicators, classifications, reports/forms, demographics) | `/developers` | hujjat 🟢, kalit 🔵 | Aralash | Yuqoridagi jadvallarning o'zi: `PriceIndex`, `TradeData`, `RegionIndicator` (namuna), `StatisticClassification`, `ReportList`, demografiya parquet |
| Statistik kodlar ma'lumotnomasi (PDF + tekshirish) | `/stat-codes`, `/stat-codes/verify` | 🔵 / tekshirish 🟢 | Real | `Ktut` (STIR, OKPO), `KtutReportList`; imzo `django.core.signing`, bazaga yozilmaydi |

### 4.2. Korxonalar va biznes

| Feature | Sahifa | Kim | Manba turi | Ma'lumot qayerdan |
|---|---|---|---|---|
| Korxonalar ro'yxati, KTUT | `/organizations`, `/organizations-ktut` | 🟢 / batafsil 🔵 | Real | `Ktut` |
| Korxona ma'lumoti STIR bo'yicha | `/orginfo` | 🟡 paket (10/100/1000/10000) | Tashqi | Tashqi reyestr API (`REGISTER_BASE_URL`) |
| Sanoat ishlab chiqaruvchilari | `/industry` | 🔵 | Real | `IndustrialProduct` |
| Kontragent kartasi (iHamkor muqobili) + PDF | `/check`, `/methodology/company-card` | 🟢 (mehmonga 120/soat) | Real | `Ktut`, `KtutReportList`, `IndustrialProduct` (tuman, manzil, mahsulot). Telefon chiqmaydi |
| Hamkor va raqobatchi qidiruvi (+ xarita, XLSX) | `/partners` | qidiruv 🟢, eksport 🟡 | Real + Namuna | Filtrlar `IndustrialProduct` va `Ktut` dan; har qatordagi ball — `EnterpriseScore` (namuna) |
| Bozor tahlili (HS bo'yicha) | `/market-report` | qisqa 🟢, to'liq 🟡 | Real | `TradeData`, `Product` |
| Korxona bali (umumiy ball, sinf) | `/partners`, `/company/:stir`, `/company-score/components` | 🟢 | **Namuna** | `EnterpriseScore` ← `EnterpriseIndicator` (KR-30, `is_synthetic=True`). Real qismi: hisobotlar soni, mahsulot turlari. OKED, hudud, eksport, xodimlar, yosh — sintetik. Production'da ball yashirin (`company_score_public=False`, OS-13) |
| Korxona profili: ball tarkibi, chuqur tahlil, sezgirlik, o'xshashlar, PDF | `/company/:stir` | 🟡 StatCoin (1 va 3) | Namuna + Real | Yuqoridagi ball + `Ktut`/`IndustrialProduct` karta bloklari (hudud real bo'lsa real — `region_is_real`) |
| Scoring metodologiyasi | `/methodology/company-score` | 🟢 | Kontent | `company_scoring.yaml` |
| StatCoin hamyoni | Kabinet | 🔵 (tarif berilsa) | Admin | `CreditWallet`, ledger; tarif va grant admin'da qo'lda (KR-41 hali yo'q) |
| Tarmoq benchmarki | Kabinet | 🟡 🏢 | **Namuna** | `EnterpriseIndicator` (S-10): korxona va 12 ta tengdosh guruh, 2019–2025 |
| Korxona pasporti | `/cabinet/organization` | 🔵 🏢 | Namuna + Real | Benchmark ko'rsatkichlari + `Ktut`, `Organization` |
| Tariflar, taqqoslash, kalkulyator | `/tariffs`, `/tariff/:id`, `/services` | 🟢 | Admin | `Service`, `ServicePackage`, `ServicePackagePrice`, `PackageServiceItem` |
| Konsultatsiya: katalog, slotlar, band qilish | `/consultation` | ko'rish 🟢, band qilish 🟡 🏢 | Namuna | Konsultantlar va slotlar S-14 namunasi (`demo_konsultant_1..5`). Real konsultantni admin kiritishi kerak |

### 4.3. Fuqarolar uchun

| Feature | Sahifa | Kim | Manba turi | Ma'lumot qayerdan |
|---|---|---|---|---|
| Fuqarolar markazi | `/citizens` | 🟢 | Aralash | Quyidagi bo'limlarga havolalar |
| Mening ish haqim | `/my-salary` | 🟢 | **Namuna** | `SalaryDistribution` (S-15, hudud × tarmoq × yil) — real manba yo'q (OS-13, OS-16) |
| Narxlar va iste'mol savati | `/prices` | 🟢 | **Namuna** | `ConsumerPrice` (S-15) |
| Ismlar statistikasi | `/names` | 🟢 | **Namuna** | `NameStat` (S-15) |
| So'rovnomalar, natijalar, qatnashish | `/surveys`, `/surveys/:slug` | ko'rish 🟢, qatnashish 🔵 | Namuna + Real | Savollar va namuna javoblar S-15 (`is_sample=True`); real javoblar foydalanuvchilardan, natijada alohida sanaladi |
| Statistika oddiy tilda, lug'at | `/learn`, `/learn/:slug`, `/glossary` | 🟢 | Kontent | Kodda: `apps/citizens/content.py` |
| Savol yuborish, ochiq javoblar | kabinet "Savollarim" 👤, `/answers` 🟢 | 🔵 | Real | Foydalanuvchi savollari, xodim javoblari |
| Sevimli ko'rsatkichlar, obunalar | Kabinet | 🔵 | Real + Namuna | Foydalanuvchi tanlovi; "yangilandi" hodisalari demo'da S-16 namunasi |

### 4.4. Nashrlar, kabinet, yordamchi

| Feature | Sahifa | Kim | Manba turi | Ma'lumot qayerdan |
|---|---|---|---|---|
| Kitob do'koni (qidiruv, saralash, sevimlilar, eng yaqin pochta), buyurtma | `/books`, `/book-order`, `/book-order/map` | ro'yxat 🔵, buyurtma 🟡 Click | Real | `Book`, `BookOption`, `PostalLocation`; to'lov Click. ⚠️ to'lov havolasi muammosi (ISH_REJASI 2.2) hali ochiq |
| Kabinet: bosh panel | `/cabinet` | 🔵 | Real | `me/summary` |
| Kabinet: to'lovlar | `/cabinet` | 🔵 | Real | `me/payments` (`Transaction`) — avval demo edi |
| Kabinet: xabarnomalar | `/cabinet` | 🔵 | Real | `notifications/me` (avval brauzer xotirasi); demo'da S-06 namunasi |
| Kabinet: xizmatlarim, shartnomalar, buyurtmalar | `/cabinet` | 🏢 / hamma | Real | `UserServicePackage`, `Contract`, `OrderBook` |
| Kabinet: xizmat so'rovlari, individual ma'lumot, faoliyat rejasi | `/cabinet` | 🟡 🏢 | Real + Namuna | `ServiceRequestResponse`, individual buyurtma, `ActivityPlans`; demo'da S-04, S-13, S-05 |
| Kabinet: "Hisobotlarim" | `/cabinet` | 🔵 🏢 | Real | `KtutReportList` (korxona STIR'i bo'yicha) |
| Kabinet: API kalitlari | `/cabinet` | 🔵 | Real | `open_api` kalitlari va foydalanish (demo'da S-16) |
| Global qidiruv (Ctrl+K) | hamma joyda | 🟢 | Real | Baza bo'ylab qidiruv (`apps/common` search) + statik yozuvlar |
| Stat AI yordamchi | hamma joyda | 🟢 | Kontent | FAQ bazasi (`question-answer`) — avval faqat UI edi |
| Operator chat | hamma joyda | 🟢 | Real | `ContactReply` — avval faqat UI edi |
| FAQ, Portal haqida, Aloqa | `/questions`, `/about`, `/contact` | 🟢 | Kontent | Admin |

### 4.5. Admin va xodimlar

| Feature | Kim | Ma'lumot qayerdan |
|---|---|---|
| Admin analitika paneli | Admin | Baza: foydalanuvchilar, shartnomalar, xizmat foydalanishi |
| Obunalar va onlayn konsultatsiya jadvali | Admin, konsultant | `consultations` |
| So'rovlarga javob, navbatlar | Xodim | `ServiceRequestResponse`; faqat biriktirilgan xodim |
| SIAT sinxron, `ReleaseEvent`, `PopulationAnchor` | Admin | `sync_siat`, `sync_population_clock`, admin formalari |
| StatCoin hamyonlari va grant | Admin | `apps/credits` (qo'lda) |
| DIDOX va GoodSign | Admin | DIDOX API; GoodSign login/paroli `.env` da |

---

## 5. Ma'lumot manbalari xaritasi

### 5.1. Manba → qaysi feature'lar

| Manba | Qanday keladi | Yangilanish | Feature'lar |
|---|---|---|---|
| **Production bazasi** (`consult.dump`) | Admin import va eski tizimdan | Admin qo'lda | Tashqi savdo (`TradeData`), KTUT (`Ktut`, `KtutReportList`), sanoat (`IndustrialProduct`), hisobotlar (`ReportList`), ISN (`PriceIndex`), kitoblar, pochta bo'limlari, foydalanuvchi, shartnoma |
| **Server fayllari** (`backend/media/`) | Admin yuklaydi | Qo'lda | Demografiya parquet, kitob rasm va PDF'lari, byulletenlar, hududiy fayllar. ⚠️ Lokalda yo'q, serverdan olish kerak; zaxira rejasi yo'q |
| **SIAT API** (`api.siat.stat.uz`) | `sync_siat` (Celery Beat) | Har kuni 03:30, faqat o'zgarganlari | Hududlar xaritasi, hudud profili, salohiyat indeksi, prognoz, panellar, bosh sahifa ko'rsatkichlari, e'lonlar kalendari (taxminiy sana), embed, korxona balidagi ish haqi bazasi |
| **stat.uz** aholi hisoblagichi | `sync_population_clock` (sahifadagi JS o'zgaruvchilar) | Har 6 soatda | Aholi soati |
| **Tashqi reyestr** (`REGISTER_BASE_URL`) | So'rov paytida | Jonli | `/orginfo`, tasniflagich kod daraxti (`classify-item`) |
| **DIDOX / GoodSign** | API | Celery Beat, 15 daqiqa | Shartnoma imzosi va holati |
| **OneID, ERI** | OAuth / imzo | Kirishda | Jismoniy va yuridik shaxs kirishi |
| **Click** | Prepare/Complete callback | To'lovda | Kitob buyurtmasi to'lovi |
| **Telegram bot** | `runbot` | Hodisada | Shartnoma xabarlari (mijoz, buxgalter) |
| **Admin kontenti** | Django admin | Qo'lda | Xizmatlar, paketlar, narxlar (BHM), FAQ, Portal haqida, byulletenlar, `ReleaseEvent`, StatCoin hamyonlari |
| **Kodda yozilgan kontent** | Repo | Commit bilan | "Statistika oddiy tilda", lug'at (`citizens/content.py`), panellar ro'yxati (`PANELS`), scoring sozlamasi (`company_scoring.yaml`), metodologiya sahifalari |
| **Foydalanuvchilar** | Formalar | Jonli | So'rovnoma javoblari, savollar, murojaatlar, obunalar, sevimlilar, buyurtmalar |
| **Sintetik namuna** (`seed_demo`) | `python manage.py seed_demo` | Faqat `DEBUG=True` | 6-bo'limga qarang |

### 5.2. Sintetik namuna: qaysi feature'lar unga tayanadi

`seed_demo` real yozuvlarni o'zgartirmaydi. Har yozuv `SyntheticRecord` reyestriga tushadi va UI'da "Namuna" belgisi bilan chiqadi (`synthetic_ids` faqat `DEBUG=True` da ishlaydi).

| Seeder | Nima yaratadi | Qaysi feature to'liq namunaga tayanadi | Real manba bo'lmaguncha production'da |
|---|---|---|---|
| `demo_users` (S-07) | Demo akkauntlar, korxonalar, shartnomalar, paketlar | — (faqat demo) | Kerak emas |
| `analytics` (S-10, S-11) | `EnterpriseIndicator`, `RegionIndicator` | **Benchmark, korxona pasporti**, hudud profilining SIAT'da yo'q qismi | Benchmark bo'sh; hudud profili faqat SIAT qismi bilan |
| `enterprise_scoring` (KR-30) | 65 ming KTUT korxonasiga sintetik ko'rsatkichlar | **Korxona bali**, profil, hamkorlar ro'yxatidagi ball | Ball yashirin (OS-13) |
| `citizens` (S-15) | Ish haqi, narxlar, ismlar, so'rovnomalar | **Mening ish haqim, Narxlar, Ismlar**; so'rovnoma namuna javoblari | Sahifalar bo'sh |
| `consultations` (S-14) | 5 konsultant, slotlar, band qilishlar | **Konsultatsiya** | Admin konsultant qo'shishi kerak |
| `classifications` (S-03) | Tasniflagich hujjatlari ro'yxati | **Tasniflagichlar** ro'yxati | Bo'sh (real ro'yxatni yuklash kerak) |
| `report_guides` (S-12) | 108 shakl yo'riqnomasi, namuna PDF | Hisobot yo'riqnomalari | Yo'riqnomalarsiz, faqat ro'yxat |
| `demographics` (B-08) | `data.synthetic.parquet` | Lokal demografiya | Real parquet ishlatiladi |
| `service_requests`, `custom_requests`, `activity_plans` (S-04, S-13, S-05) | So'rovlar, individual buyurtmalar, rejalar | — | Real foydalanuvchi yozuvlari |
| `notifications`, `api_subscriptions`, `misc`, `credits` (S-06, S-16, S-08, KR-40) | Xabarnomalar, API kalitlari, murojaatlar, StatCoin hamyonlari | — | Real yozuvlar |

---

## 6. Eski → hozir: nima o'zgardi

### 6.1. Tuzatilgan eski feature'lar

| Feature | Eskida | Hozir |
|---|---|---|
| `/statistics` | Raqamlar `random` | Real hisob |
| `/statistical-data` | Zaglushka | To'liq demografiya sahifasi (`/demographics`) |
| `/foreign-trade` | `trade-flows` 404 | Savdo oqimlari API va sahifasi |
| Stat AI, operator chat | Faqat UI | FAQ bazasi va `ContactReply` ga ulangan |
| Kabinet: to'lovlar, xabarnomalar | Qattiq yozilgan demo / brauzer xotirasi | `me/payments`, `notifications/me` |
| Kabinet tuzilishi | 7 bo'lim, hammaga bir xil | 18 bo'lim, foydalanuvchi turiga qarab |
| Token yangilash | 404 → 5 soatdan keyin chiqarib yuborardi | Tuzatildi |
| Paket muddati | Tekshirilmasdi | `starts_at`/`expires_at`; muddati o'tgan paket → 403 |
| Limit `0` | "Ruxsat yo'q" va "cheksiz" aralashgan | `-1` = cheksiz |
| Klassifikatorlar | Bo'sh | Demo'da namuna; production'da hali bo'sh |
| Xavfsizlik | `trade-data/upload` mehmonga ochiq, begona hisobni o'chirish, `information` yozish ochiq | Yopildi (CLAUDE_HISOBOT 5.1) |
| Bosh sahifa, Navbar, banner | Soxta foizlar ("+12.5%") | Faqat real raqamlar, manba va davr bilan |

### 6.2. Yangi qo'shilgan feature'lar

- **Hududlar (SIAT):** `/regions`, `/regions/:id`, salohiyat indeksi, prognoz, panellar, e'lonlar kalendari, embed, aholi soati.
- **Korxonalar:** bozor tahlili, hamkor qidiruvi, korxona bali va profili, kontragent kartasi (`/check`), statistik kodlar ma'lumotnomasi, benchmark, korxona pasporti, "Hisobotlarim", StatCoin.
- **Fuqarolar:** fuqarolar markazi, ish haqi, narxlar, ismlar, so'rovnomalar, "Statistika oddiy tilda", lug'at, ochiq javoblar.
- **Xizmatlar:** tariflarni taqqoslash, konsultatsiya, individual ma'lumot so'rovi, xizmat so'rovlari, faoliyat rejasi, ochiq API va kalitlar, obunalar.
- **Umumiy:** global qidiruv (Ctrl+K), PWA, 404 sahifa, admin analitika paneli.

### 6.3. O'zgarmagan yoki hali ochiq

- `chat` va `monitoring` app'lari ishlatilmaydi (OS-07).
- Paket hali ham to'lovdan keyin avtomatik faollashmaydi; shartnomani Click orqali to'lab bo'lmaydi; Payme yo'q (ISH_REJASI 2.2).
- `/orginfo` tashqi reyestr API'siga bog'liq.

---

## 7. Production uchun xulosa

Real manba ulanmaguncha production'da (`DEBUG=False`) quyidagilar **bo'sh yoki yashirin** bo'ladi:

| Feature | Sabab | Kerakli qaror |
|---|---|---|
| Korxona bali, profil, ball bo'yicha filtr | Korxona kesimida OKED, hudud, eksport, xodimlar yo'q | OS-13, OS-19: real manba |
| Benchmark, korxona pasporti | `EnterpriseIndicator` faqat namuna | OS-13 |
| Mening ish haqim, Narxlar, Ismlar | Real jadval yo'q | OS-13, OS-16 |
| Konsultatsiya | Real konsultantlar kiritilmagan | Admin |
| Tasniflagichlar ro'yxati | Jadval bo'sh | Ro'yxatni yuklash |
| Hudud profilining SIAT'dan tashqari qismi | `RegionIndicator` namuna | SIAT katalogini kengaytirish |

To'liq real ma'lumot bilan ishlaydiganlar: tashqi savdo, bozor tahlili, KTUT, kontragent kartasi, statistik kodlar ma'lumotnomasi, sanoat, hisobotlar, ISN kalkulyatori, demografiya (serverdagi parquet bilan), hududlar xaritasi va panellar (SIAT), aholi soati, kitob do'koni, kabinetning asosiy bo'limlari.
