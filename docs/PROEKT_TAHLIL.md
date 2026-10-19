# my.stat.uz — loyihaning to'liq tahlili

> **Sana:** 2026-10-13
> **Qanday tekshirildi:** kod o'qildi, lokal PostgreSQL bazasiga ulanib jadvallardagi yozuvlar sanaldi, backend lokalda ishga tushirilib API endpoint'lar mehmon sifatida chaqirildi, `manage.py check` / `makemigrations --check` / `manage.py test` ishga tushirildi, frontend'da `tsc`, `eslint` va `vite build` bajarildi.
> **Tekshirilmagan narsalar:** login qilingan foydalanuvchi nomidan API chaqiruvlari (faqat kod bo'yicha tahlil qilindi), Docker Compose orqali ishga tushirish, real Click / DIDOX / OneID / Telegram integratsiyalari (lokalda kalitlar va ro'yxatdan o'tgan domen yo'q).
>
> Hujjatda parol, token, kalit va server manzillari **yo'q**.
>
> **Yangilanish (2026-10-14):** bu hujjat 2026-10-13 dagi holatni tasvirlaydi. Keyin ko'p narsa tuzatildi va ba'zi xulosalar aniqlashtirildi — joriy holat [ISH_REJASI.md](ISH_REJASI.md) ning "Bajarilish holati" bo'limida. Aniqlashtirishlar: `/statistical-data` demografiya sahifasi **emas**, zaglushka edi (frontend'da demografiya UI'si umuman yo'q edi); `trade-flows` frontend'da chaqirilmagan (konsolda 404 bo'lmagan); `/statistics` sahifasidagi raqamlar soxta (`random`) edi; kabinetdagi shartnomalar ro'yxati mijozlar uchun doim bo'sh edi.
>
> Boshqa hujjatlar: [README.md](../README.md) (tez ishga tushirish), [LOYIHA.md](LOYIHA.md) (arxitektura va sozlamalar), [backend/README.md](../backend/README.md) (endpoint'lar ro'yxati).

---

## Mundarija

1. [Qisqacha xulosa](#1-qisqacha-xulosa)
2. [Loyiha nima va kim uchun](#2-loyiha-nima-va-kim-uchun)
3. [Texnologiyalar va tuzilma](#3-texnologiyalar-va-tuzilma)
4. [Feature'lar: nima bor va holati](#4-featurelar-nima-bor-va-holati)
5. [Asosiy biznes oqimi: paket → shartnoma → to'lov → foydalanish](#5-asosiy-biznes-oqimi)
6. [Ma'lumotlar bazasi: nimada qancha ma'lumot bor](#6-malumotlar-bazasi-nimada-qancha-malumot-bor)
7. [API tekshiruvi natijalari](#7-api-tekshiruvi-natijalari)
8. [Frontend holati](#8-frontend-holati)
9. [Ishlamayotgan yoki buzuq narsalar](#9-ishlamayotgan-yoki-buzuq-narsalar)
10. [Xavfsizlik muammolari](#10-xavfsizlik-muammolari)
11. [Infratuzilma va deploy](#11-infratuzilma-va-deploy)
12. [Kod sifati va texnik qarz](#12-kod-sifati-va-texnik-qarz)
13. [Tavsiya etilgan ishlar tartibi](#13-tavsiya-etilgan-ishlar-tartibi)

---

## 1. Qisqacha xulosa

| Ko'rsatkich | Holat |
|---|---|
| Backend ishga tushadimi | ✅ Ha. `manage.py check` — faqat 2 ta ogohlantirish (CKEditor 4 eskirgan, `accounts` namespace takrori) |
| Migratsiyalar | ✅ Hammasi qo'llangan, yangi migratsiya kerak emas |
| Baza | ✅ Production dump'i tiklangan: ~912 foydalanuvchi, 62 shartnoma, 3,58 mln tashqi savdo yozuvi |
| Frontend build | ✅ `vite build` o'tadi (~7 s) |
| Frontend TypeScript | ⚠️ 37 ta `tsc` xatosi (build'ni to'xtatmaydi, chunki Vite tip tekshirmaydi) |
| ESLint | ⚠️ 92 muammo (85 xato, 7 ogohlantirish) |
| Testlar | ❌ Jami 6 ta test funksiyasi bor, test runner import xatosi bilan yiqiladi |
| Ochiq statistik ma'lumot xizmatlari | ✅ Asosan ishlaydi |
| Paket sotish oqimi | ⚠️ Qisman: shartnoma avtomatik, lekin paketni faollashtirish qo'lda (admin) |
| Onlayn to'lov | ⚠️ Click callback'lari yozilgan, lekin kitob uchun to'lov havolasi **qattiq yozilgan**, xizmat buyurtmasi summasi doim **0** |
| Xavfsizlik | ❌ Bir nechta jiddiy teshik (10-bo'lim): mehmon tashqi savdo faylini yuklay oladi, istalgan foydalanuvchi boshqa foydalanuvchini o'chira oladi |

**Bir gap bilan:** platformaning "ochiq ma'lumot" qismi (tashqi savdo, KTUT, sanoat, demografiya, CPI, kitob katalogi) yaxshi ishlaydi va ma'lumot bilan to'la. Pullik qism (paket → shartnoma → to'lov → limit) esa qisman qo'lda ishlaydi. Xavfsizlik va avtomatik testlar eng zaif joylar.

---

## 2. Loyiha nima va kim uchun

**my.stat.uz** — O'zbekiston Statistika qo'mitasining **konsalting va statistik xizmatlar portali**.

**Maqsad:** korxonalar, tashkilotlar va fuqarolarga statistik ma'lumot va xizmatlarni bitta joyda, onlayn berish. Bepul ochiq ma'lumotlar ham, pullik paketlar ham shu yerda.

**Foydalanuvchilar:**

| Kim | Qanday kiradi | Nima qiladi |
|---|---|---|
| Mehmon | — | Ochiq ma'lumotlarni ko'radi: tashqi savdo, demografiya, hisobot kalendari, FAQ, tariflar |
| Yuridik shaxs (korxona) | Login/parol | Tarif paketi tanlaydi, shartnoma tuzadi, xizmatlardan limit bo'yicha foydalanadi, kitob buyurtma qiladi |
| Jismoniy shaxs | OneID (egov.uz) | Ochiq ma'lumotlar, kitob bozori |
| Buxgalter (`bugalter`) | Login | Filial shartnomalarini kuzatadi, Telegram orqali xabar oladi, pochta bo'limlari ro'yxatini ko'radi |
| Xodim (`employee`) | Login | Xizmat so'rovlariga javob beradi (tuman bo'yicha) |
| Admin | Maxfiy URL + reCAPTCHA + TOTP 2FA | Kontent, paketlar, narxlar, ma'lumot importi, shartnoma imzolash (DIDOX) |

**Pul qanday aylanadi:** paket narxi = `BHM soni × BHM qiymati` (BHM qiymati admin'dagi `SiteSettings` da). Sektor bo'yicha differensial narx bor (`ServicePackagePrice`).

---

## 3. Texnologiyalar va tuzilma

### Stack

| Qatlam | Texnologiya |
|---|---|
| Backend | Python 3.12, Django 5.0, DRF 3.15, simplejwt, drf-spectacular |
| Baza | PostgreSQL 14 |
| Kesh/navbat | Redis, Celery 5.4 (lokalda Redis o'chiq, `LocMemCache`) |
| Admin | Jazzmin, CKEditor 4, import-export, jsonform, TOTP 2FA + reCAPTCHA |
| Ma'lumot ishlash | pandas, pyarrow (parquet), openpyxl |
| Hujjat | docxtpl (shartnoma DOCX shabloni), num2word-uz (summani so'z bilan) |
| Bot | python-telegram-bot 22 |
| Frontend | React 18, TypeScript, Vite 5, Tailwind, MUI 7, React Router 7, axios |
| Grafik/xarita | Chart.js, Highcharts, Recharts, Leaflet; PDF: jsPDF + html2canvas |
| Infra | Docker Compose (db, redis, backend, worker, bot, nginx) + GitLab CI (systemd, Docker'siz) |

### Papkalar

```
mystat/
├── backend/            Django API + admin
│   ├── core/           settings (base/develop/production), urls, celery
│   ├── apps/           11 ta Django app (pastda)
│   ├── templates/admin/  admin login, 2FA, DIDOX, import sahifalari
│   └── contractTemplate.docx   shartnoma shabloni
├── frontend/src/       28 sahifa, ~50 komponent, API klient
├── db/                 dump + avtomatik tiklash skripti
├── nginx/              reverse proxy shabloni
├── _archive/           eski/ishlatilmaydigan fayllar (git'ga kirmaydi)
└── docker-compose.yml, .gitlab-ci.yml, .env.example
```

### Backend app'lari

| App | Vazifa | Holat |
|---|---|---|
| `accounts` | Foydalanuvchi, rol, JWT, OneID, ERI, parol tiklash | ✅ Ishlaydi (xavfsizlik teshigi bor, 10-bo'lim) |
| `organizations` | Foydalanuvchiga 1:1 korxona | ⚠️ Model ishlaydi, **API 500 qaytaradi** |
| `services` | Xizmat, paket, limit, so'rov/javob, reyting | ✅ Katalog ishlaydi; so'rov moduli ishlatilmagan (0 yozuv) |
| `contracts` | Shartnoma DOCX + DIDOX imzo | ✅ Ishlaydi (62 shartnoma) |
| `payment` | Order, Transaction, Click | ⚠️ Qisman (5-bo'lim) |
| `book_market` | Kitob katalogi, savat, pochta | ✅ Katalog va buyurtma; ⚠️ to'lov havolasi buzuq |
| `additional_services` | Tashqi savdo, demografiya, sanoat, KTUT, CPI, klassifikator | ✅ Asosiy qismi ishlaydi; klassifikatorlar bo'sh |
| `notifications` | In-app + Telegram xabarnoma | ⚠️ Backend bor, frontend undan foydalanmaydi |
| `common` | BaseModel, SiteSettings, hududlar, FAQ, byulleten, admin 2FA, bot | ✅ Ishlaydi |
| `monitoring` | — | ❌ Bo'sh skelet |
| `chat` | WebSocket chat (Channels) | ❌ `INSTALLED_APPS` da yo'q, `channels` o'rnatilmagan |

---

## 4. Feature'lar: nima bor va holati

Belgilar: ✅ ishlaydi · ⚠️ qisman / shartli · ❌ ishlamaydi yoki faqat dizayn

### 4.1. Autentifikatsiya va profil

| Feature | Holat | Izoh |
|---|---|---|
| Login/parol (yuridik shaxs) | ✅ | JWT: access 300 daqiqa, refresh 7 kun |
| OneID (jismoniy shaxs) | ⚠️ | Kod bor, lokalda ishlamaydi (egov.uz kalitlari va domen kerak) |
| ERI (elektron imzo) login | ⚠️ | `social_auth/eri/` endpoint'lari bor, frontend'da ishlatilmaydi |
| Avtomatik token yangilash | ❌ | Frontend `/accounts/TokenRefresh/` ga yuboradi, backend'da yo'l `TokenRefresh` (slash'siz) → **404**. Natija: 5 soatdan keyin foydalanuvchi majburan chiqarib yuboriladi |
| Logout (refresh blacklist) | ✅ | |
| Parol tiklash (email) | ⚠️ | Kod bor; lokalda email konsolga chiqadi |
| API 2FA (`2fa/send`, `2fa/check`) | ⚠️ | Endpoint bor, frontend ishlatmaydi |
| Admin panel 2FA + reCAPTCHA | ✅ | TOTP qurilmasi bazada ro'yxatdan o'tgan |
| Email obuna | ⚠️ | Endpoint bor, 0 obunachi |
| Ichki rol tizimi (`Role`/`Permission`) | ❌ | Jadvallar bo'sh, amalda `User.role` maydoni ishlatiladi |

### 4.2. Xizmatlar va tarif paketlari

| Feature | Holat | Izoh |
|---|---|---|
| Xizmatlar katalogi (9 xizmat, 2 kategoriya) | ✅ | 3 tilda: uz, ru, kiril |
| Tarif paketlari (4 ta) va narx hisoblash | ✅ | Sektor bo'yicha narx (17 yozuv) |
| Paket ichidagi limitlar (40 element) | ✅ | |
| Foydalanuvchi paketi (`UserServicePackage`) | ⚠️ | Faqat 4 ta; **admin qo'lda yaratadi**, shartnoma/to'lovdan keyin avtomatik faollashmaydi |
| Limit hisobi (`UserServicePackageItemUse`) | ✅ | 34 foydalanish yozilgan; e-kitob, byulleten, korxona ma'lumoti uchun ishlaydi |
| Xizmat reytingi | ✅ | 20 baho |
| Xizmat so'rovi / javob (`ServiceRequests`) | ⚠️ | API bor, so'rovlar jadvali bo'sh (0), javoblar 6 ta |
| Faoliyat rejasi (`ActivityPlans`) | ❌ | Jadval bo'sh |
| Korxona ma'lumoti STIR bo'yicha (tashqi reyestr) | ⚠️ | `REGISTER_BASE_URL` kerak; lokalda bo'sh |

### 4.3. Shartnomalar

| Feature | Holat | Izoh |
|---|---|---|
| Shartnoma yaratish (DOCX shablondan) | ✅ | `contractTemplate.docx` + docxtpl, summa so'z bilan |
| DIDOX'ga yuborish va elektron imzo | ⚠️ | Kod ishlaydi, DIDOX kalitlari kerak |
| DIDOX holatini tekshirish | ⚠️ | `check_didox_documents` komandasi va Celery task bor, lekin **Celery Beat sozlanmagan** — avtomatik ishlamaydi |
| Telegram xabar (mijoz + buxgalter) | ⚠️ | Ishlaydi, lekin shartnomada `branch` yoki buxgalter bo'lmasa view **yiqiladi** (`contract.branch.bugalter...`) |
| Admin'da hududlar kesimida statistika | ✅ | `ContractStats` proxy model |

### 4.4. To'lov

| Feature | Holat | Izoh |
|---|---|---|
| Click Prepare / Complete callback'lari | ✅ | MD5 imzo tekshiruvi, idempotentlik, summa tekshiruvi bor |
| Kitob buyurtmasi uchun to'lov havolasi | ❌ | Model to'g'ri havola yasaydi, lekin view **qattiq yozilgan** `https://my.click.uz/services/pay` qaytaradi (parametrsiz) — foydalanuvchi Click'da nimani to'lashini bilmaydi |
| Xizmat buyurtmasi (`Order`) | ❌ | `Order.save()` yangi buyurtma summasini **doim 0.00** qiladi |
| Shartnoma to'lovi | ⚠️ | `Contract.payed_amount` Transaction'dan hisoblanadi, lekin Click provayderi faqat `book` va `Order` ni taniydi — shartnoma onlayn to'lanmaydi (bank o'tkazmasi + admin) |
| Payme | ❌ | Faqat enum va xato xabari: "Payme uchun avval invoice yaratish kerak" |
| Provayder so'rovlari logi | ❌ | `PaymentMerchantRequestLog` jadvali bo'sh — log yozilmaydi |
| Kabinetdagi "To'lovlar tarixi" | ❌ | Frontend'da **qattiq yozilgan demo ma'lumot** (2024-yil, "Start tarifi" va h.k.) |

### 4.5. Kitob bozori

| Feature | Holat | Izoh |
|---|---|---|
| Katalog (116 kitob, 160 variant: elektron/bosma/disk) | ✅ | Faqat login qilganlarga (mehmonga 401) |
| Savat va buyurtma (64 buyurtma, 105 element) | ✅ | Narx buyurtma paytida qotiriladi (`price_snapshot`) |
| Pochta bo'limlari xaritasi (1450 nuqta) | ✅ | Leaflet |
| E-kitob yuklab olish (paket limiti bilan) | ✅ | Mehmonga 401, paketsizga 403 |
| Pochta kuzatuvi (`postal_status`, trek raqam) | ⚠️ | Maydonlar bor, admin qo'lda to'ldiradi |
| To'lov | ❌ | 4.4 ga qarang |

### 4.6. Ochiq statistik ma'lumotlar

| Feature | Holat | Ma'lumot | Izoh |
|---|---|---|---|
| Tashqi savdo tahlili | ✅ | 3 581 342 yozuv, 7330 mahsulot (HS), 3203 SITC, 251 davlat, 8 yil | Mehmonga ochiq. Frontend'dagi `trade-flows/` endpoint backend'da **yo'q** (404, sahifa bo'sh ro'yxat bilan davom etadi) |
| Demografiya | ⚠️ | 7 bo'lim, "Aholi soni" 205 223 qator | Sxema va filtrlar ishlaydi. **Lokalda ma'lumot bo'sh** qaytadi, chunki `media/demographics/data.parquet` fayli dump bilan kelmaydi — serverdan nusxalash kerak |
| Korxonalar reyestri (KTUT) | ✅ | 65 540 korxona | Login kerak |
| Hisobot kalendari va ro'yxati | ✅ | 108 hisobot shakli, 225 768 korxona↔hisobot bog'lanishi | Ro'yxat mehmonga ochiq |
| Sanoat mahsulotlari | ✅ | 53 319 mahsulot, 311 kategoriya, 2137 SKP | Login kerak |
| Narx indeksi (CPI) kalkulyatori | ✅ | 311 yozuv | Login kerak |
| Statistik klassifikatorlar | ❌ | **0 yozuv** | API ishlaydi, jadval bo'sh |
| Byulletenlar | ✅ | 11 ta | Login + paket limiti |
| Hududiy ma'lumot fayllari (`information`) | ✅ | 222 fayl | ⚠️ yozish/o'chirish ruxsatsiz (10-bo'lim) |

### 4.7. Kontent va boshqalar

| Feature | Holat | Izoh |
|---|---|---|
| FAQ (10), Portal haqida, Murojaat formasi (10 ta murojaat) | ✅ | |
| Sayt va platforma statistikasi (banner) | ✅ | |
| Oylik foydalanuvchi statistikasi | ✅ | Mehmonga ochiq |
| In-app xabarnomalar | ⚠️ | Backend `notifications/me` bor (8 yozuv), lekin **frontend undan foydalanmaydi** — kabinetdagi xabarnomalar faqat brauzer xotirasida, sahifa yangilansa yo'qoladi |
| Telegram bot | ⚠️ | `runbot` komandasi; token kerak; Docker'da `--profile bot` bilan |
| "Stat AI" chat va "Operator" chat | ❌ | Faqat UI: xabar yozilsa, hech qayerga yuborilmaydi, javob kelmaydi |
| Tungi/kunduzgi rejim | ✅ | `ThemeContext` |

---

## 5. Asosiy biznes oqimi

Pullik xizmatlar shunday ishlashi **kerak**:

```
Tarif tanlash → Shartnoma yaratish → DIDOX'da imzolash → To'lov → Paket faollashadi → Limit bo'yicha foydalanish
```

Hozir **amalda** shunday ishlaydi:

| Qadam | Kim/nima bajaradi | Holat |
|---|---|---|
| 1. Tarif tanlash | Foydalanuvchi (frontend) | ✅ Avtomatik |
| 2. Shartnoma yaratish | API: DOCX + DIDOX + Telegram | ✅ Avtomatik |
| 3. Imzolash | Mijoz va admin DIDOX'da | ⚠️ Holat tekshiruvi qo'lda komanda bilan (Beat yo'q) |
| 4. To'lov | Bank o'tkazmasi | ⚠️ Onlayn to'lov shartnoma uchun ulanmagan |
| 5. Paketni faollashtirish | **Admin qo'lda** `UserServicePackage` yaratadi | ⚠️ Avtomatlashtirilmagan |
| 6. Foydalanish | API limitni tekshiradi va hisoblaydi | ✅ e-kitob, byulleten, korxona ma'lumoti uchun |

**E'tibor:** limit faqat e-kitob, byulleten va korxona ma'lumoti (STIR) xizmatlarida tekshiriladi. KTUT, sanoat mahsulotlari, CPI va klassifikatorlar uchun **faqat login yetarli**, paket tekshirilmaydi. Bu biznes qarormi yoki kamchilikmi — aniqlashtirish kerak.

`UserServicePackage` modelida tugash sanasi yo'q (faqat `year`, `month`). Paket muddati (`duration_days`) foydalanishda tekshirilmaydi.

---

## 6. Ma'lumotlar bazasi: nimada qancha ma'lumot bor

Lokal bazadagi holat (production dump'i):

| Guruh | Jadval | Yozuvlar |
|---|---|---|
| Foydalanuvchilar | User / Organization / Accountant / Employee | 912 / 224 / 2 / 1 |
| Hududlar | Region / District / Sector | 14 / 369 / 1681 |
| Xizmatlar | Service / ServicePackage / PackageServiceItem | 9 / 4 / 40 |
| Paket foydalanish | UserServicePackage / ItemUse / Rating | 4 / 34 / 20 |
| Shartnoma va to'lov | Contract / Order / Transaction | 62 / 2 / 10 |
| Kitob | Book / BookOption / OrderBook / OrderItem / PostalLocation | 116 / 160 / 64 / 105 / 1450 |
| Tashqi savdo | TradeData / Product / SITC / Country | 3 581 342 / 7330 / 3203 / 251 |
| KTUT va hisobotlar | Ktut / KtutReportList / ReportList | 65 540 / 225 768 / 108 |
| Sanoat | IndustrialProduct / Category / Skp | 53 319 / 311 / 2137 |
| Boshqa | PriceIndex / DemographicSection / Byulleten / InformationModel | 311 / 7 / 11 / 222 |
| **Bo'sh jadvallar** | Role, Permission, Subscribe, File, ServiceRequests, ServiceDeliverables, ActivityPlans, PaymentMerchantRequestLog, StatisticClassification(+Category) | 0 |

**Begona jadvallar** (Django modellariga tegishli emas, qo'lda yaratilgan): `test`, `uz`, `my_stat_uz_platforma_uchun`. Kerakmi yoki yo'qligini aniqlab, o'chirish kerak.

**Muhim:**
- Fayllar (rasm, PDF, video, demografiya parquet) bazada emas, `backend/media/` da. Lokalda `media/` deyarli bo'sh (416 KB). Rasm/PDF'lar `MEDIA_FALLBACK_URL` orqali production'dan olinadi (faqat `DEBUG=True` da). **Parquet fayli bu yo'l bilan olinmaydi**, shuning uchun lokal demografiya bo'sh.
- Dump'da shaxsiy ma'lumot bor (PINFL, telefon). Uni faqat ishonchli joyda saqlang.

---

## 7. API tekshiruvi natijalari

Backend lokalda ishga tushirildi, endpoint'lar **login qilmasdan** chaqirildi. Barcha javoblar 0,04–0,37 soniyada keldi.

| Natija | Endpoint'lar |
|---|---|
| **200** (ochiq, ishlaydi) | `services/service/`, `services/item/`, `services/package/`, `common/question-answer/`, `branches/`, `site-stat/`, `platform-stat/`, `information/`, `about-portal/`, `books/years/`, `books/postal-location/`, barcha `external-trade/*` klassifikatorlari, `reportlist/`, `demographics/schema/`, `accounts/month-user-stat`, `api/schema/`, `api/docs/` |
| **401** (login kerak, to'g'ri) | `accounts/me/`, `profile/`, `contracts/`, `books/books-list/`, `e-books/`, byulletenlar, `price-index`, `industrial-product-categories/`, `statistic-classification`, `notifications/me`, `orders/OrderList/`, `services/category/` |
| **400** | `submitted-report` — `stir_number` parametri majburiy (to'g'ri xatti-harakat) |
| **404** | `services/1/` — bunday ID'li xizmat yo'q (normal) |
| **405** | `external-trade/trade-data/` — faqat POST (normal) |
| ❌ **500** | `organizations/organizations/` — `OrganizationListView` da `queryset` yo'q (`AssertionError`) |
| ❌ **404 (bo'lmasligi kerak)** | `accounts/TokenRefresh/` (slash bilan, frontend shunday chaqiradi), `external-trade/trade-flows/` (backend'da umuman yo'q) |

`logs/error.log` da ilgari mehmon `common/views.py` dagi byulleten endpoint'iga kirganda `AnonymousUser` xatosi bo'lgan. Hozir u 401 qaytaradi, ya'ni tuzatilgan.

---

## 8. Frontend holati

### Sahifalar (28 ta, `src/pages/`)

| Yo'l | Sahifa | Holat |
|---|---|---|
| `/` | Bosh sahifa (banner, statistika, xizmatlar, "Stat AI" chat tugmasi) | ✅ (chat — faqat UI) |
| `/services`, `/tariff/:id` | Xizmatlar, tarif tafsiloti | ✅ |
| `/ex-trade`, `/foreign-trade` | Tashqi savdo tahlili (grafiklar) | ✅ (`trade-flows` 404, bo'sh ro'yxat bilan davom etadi) |
| `/statistical-data` | Demografiya | ✅ (lokalda ma'lumot bo'sh, 6-bo'lim) |
| `/statistics` | Statistika dashboard | ✅ |
| `/industry` | Sanoat mahsulotlari | ✅ |
| `/organizations`, `/organizations-ktut`, `/organizations-register`, `/orginfo` | Korxonalar, KTUT, STIR bo'yicha ma'lumot | ✅ / ⚠️ (reyestr tashqi API'ga bog'liq) |
| `/reports`, `/report-calendar`, `/reglaments` | Hisobotlar, kalendar | ✅ |
| `/cpi-calculator` | Narx indeksi kalkulyatori | ✅ |
| `/statistical-classifications` | Klassifikatorlar | ⚠️ backend jadvali bo'sh |
| `/books`, `/book-order`, `/book-order/map` | Kitob do'koni, buyurtma, pochta xaritasi | ✅ (to'lov ❌) |
| `/about`, `/contact`, `/questions` | Portal haqida, aloqa, FAQ | ✅ |
| `/login`, `/auth/oneid/callback` | Kirish | ✅ / ⚠️ OneID |
| `/cabinet` | Shaxsiy kabinet (himoyalangan) | ⚠️ pastga qarang |

**Shaxsiy kabinet bo'limlari:**

| Bo'lim | Holat |
|---|---|
| Profil | ✅ API'dan |
| Xizmatlarim (paket va limitlar) | ✅ API'dan |
| Shartnomalar | ✅ API'dan |
| Buyurtmalar | ✅ API'dan |
| To'lovlar tarixi | ❌ Qattiq yozilgan demo ma'lumot |
| Xabarnomalar | ⚠️ Faqat brauzer xotirasida; backend `notifications/me` chaqirilmaydi |
| Qo'llab-quvvatlash | ✅ Statik kontakt ma'lumotlari |

**Ishlatilmaydigan fayllar:** `pages/BookShop.tsx`, `pages/StatisticIndicators.tsx` hech qayerda import qilinmagan. `_archive/frontend/` da eski versiyalar bor.

### Build va sifat

- `vite build` muvaffaqiyatli. Sahifalar lazy-load qilingan, lekin `OrgInfoPage` chunk'i **635 KB** (gzip 188 KB) — 500 KB chegarasidan katta.
- `tsc`: **37 xato**. Ko'pi ishlatilmagan import'lar, lekin haqiqiy tip xatolari ham bor: `ReportData` tipida `name`/`deadline` yo'q, `BookStore` da `"print"` va `"bosma"` aralashib ketgan, `BookOrderPage` noto'g'ri props uzatadi, `BookOrderMapPage` da `string`/`number` nomuvofiqligi.
- `eslint`: 92 muammo.
- `package.json` dagi nom hali ham `vite-react-typescript-starter`.
- JWT `localStorage` da saqlanadi (XSS bo'lsa o'g'irlanishi mumkin).
- Kodda ko'p `console.log` qolgan.

---

## 9. Ishlamayotgan yoki buzuq narsalar

Muhimlik tartibida:

| # | Muammo | Joyi | Ta'siri |
|---|---|---|---|
| 1 | Token yangilash URL'i noto'g'ri (`TokenRefresh/` → 404) | `frontend/src/api/apiUrls.ts:2` | Har bir foydalanuvchi 5 soatdan keyin majburan chiqarib yuboriladi |
| 2 | Kitob to'lov havolasi qattiq yozilgan | `backend/apps/book_market/api/OrderCreateView/views.py:34` | Kitobni Click orqali to'lab bo'lmaydi |
| 3 | `Order` summasi doim 0 | `backend/apps/payment/models.py:70-76` | Xizmat buyurtmasini onlayn to'lab bo'lmaydi |
| 4 | Paket to'lov/imzodan keyin avtomatik faollashmaydi | `services` + `contracts` | Admin qo'lda ishlashi shart |
| 5 | `organizations/` API 500 | `backend/apps/organizations/api/OrganizationView/views.py` | Endpoint ishlamaydi |
| 6 | Shartnoma yaratishda `branch`/buxgalter bo'lmasa 500 | `backend/apps/contracts/api/ContractCreate/views.py` | Shartnoma bazaga yoziladi, lekin foydalanuvchi xato ko'radi |
| 7 | Celery Beat yo'q | `core/celery.py`, `docker-compose.yml` | DIDOX holati avtomatik yangilanmaydi |
| 8 | Statistik klassifikatorlar bo'sh | baza | Sahifa bo'sh |
| 9 | Demografiya parquet lokalda yo'q | `backend/media/demographics/` | Lokal dev'da demografiya bo'sh |
| 10 | `trade-flows` endpoint yo'q | frontend `externalTrade.ts` | Konsolda xato, filtr bo'sh |
| 11 | Payme ulanmagan | `book_market/models.py` | Faqat Click |
| 12 | Kabinetda to'lovlar demo, xabarnomalar API'siz | `PersonalCabinet.tsx` | Foydalanuvchi noto'g'ri ma'lumot ko'radi |
| 13 | Chat'lar (AI/operator) faqat UI | `components/chats/` | Javob kelmaydi |
| 14 | `core/asgi.py` bo'sh `core.settings` paketini ko'rsatadi (`base`/`production` emas) | `backend/core/asgi.py` | ASGI server sozlamalarsiz ishga tushadi (hozir WSGI ishlatiladi, shuning uchun ta'siri yo'q) |
| 15 | Testlar yiqiladi | `additional_services/api_endpoints/OrganizationAPI/__init__.py` mavjud bo'lmagan `views` ni import qiladi | `manage.py test` ishlamaydi |
| 16 | Throttling yoqilgan, lekin limitlar izohda | `settings/base.py` | Amalda so'rov chegarasi yo'q |

---

## 10. Xavfsizlik muammolari

| # | Muammo | Daraja | Tafsilot |
|---|---|---|---|
| 1 | **Tashqi savdo faylini mehmon yuklay oladi** | 🔴 Kritik | `POST /api/additional-services/trade-data/upload` da `permission_classes` yo'q (default `AllowAny`). Istalgan odam Excel yuborib, savdo ma'lumotlarini bazaga yozdira oladi va serverdagi `datas/` papkasiga fayl tashlay oladi |
| 2 | **Istalgan foydalanuvchi boshqa foydalanuvchini o'chira oladi** | 🔴 Kritik | `/api/accounts/update/email/<username>/` (`RetrieveUpdateDestroyAPIView`). Faqat `update` da egasi tekshiriladi, `DELETE` va `GET` da tekshiruv yo'q. `User` soft-delete emas, ya'ni yozuv butunlay o'chadi |
| 3 | **Hududiy ma'lumot fayllarini mehmon qo'shishi/o'zgartirishi/o'chirishi mumkin** | 🔴 Yuqori | `common/information/` va `information/<pk>/` da ruxsat yo'q |
| 4 | `ALLOWED_HOSTS=['*']`, `CORS_ALLOW_ALL_ORIGINS=True` + `CORS_ALLOW_CREDENTIALS=True` | 🟠 O'rta | Production'da ham shunday |
| 5 | `__debug__/` (debug toolbar) URL'i production'da ham ulangan | 🟠 O'rta | `core/urls.py` oxirida shartsiz qo'shilgan |
| 6 | CKEditor 4.22 eskirgan, tuzatilmagan zaifliklari bor | 🟠 O'rta | Django check ogohlantiradi |
| 7 | So'rov chegarasi (rate limit) yo'q | 🟠 O'rta | Login, parol tiklash, murojaat formasi brute-force/spam'ga ochiq |
| 8 | Parol tiklashda email mavjudligi oshkor bo'ladi | 🟡 Past | `get_object_or_404(User, email=...)` → mavjud emasligi 404 bilan bilinadi |
| 9 | `SECRET_KEY` uchun default qiymat bor | 🟡 Past | `.env` bo'lmasa xavfsiz bo'lmagan kalit bilan ishga tushadi |
| 10 | `production.py` da `CSRF_COOKIE_SECURE=False`, ichki IP'lar qattiq yozilgan | 🟡 Past | |
| 11 | `DATA_UPLOAD_MAX_MEMORY_SIZE = 500 MB` | 🟡 Past | Katta so'rovlar bilan xotirani to'ldirish mumkin |
| 12 | JWT `localStorage` da | 🟡 Past | XSS bo'lsa token o'g'irlanadi |

**Yaxshi tomonlari:** admin panel maxfiy URL + reCAPTCHA + TOTP 2FA bilan himoyalangan; Click callback'lari imzoni tekshiradi; profil API'dan parol hash'i olib tashlangan; refresh token rotatsiya va blacklist yoqilgan; maxsus `IsAuthenticated` tokenning blacklist'da emasligini ham tekshiradi.

---

## 11. Infratuzilma va deploy

**Docker Compose** (lokal / yangi server): `db` (postgres 14, birinchi ishga tushishda dump avtomatik tiklanadi), `redis`, `backend` (gunicorn, migrate + collectstatic), `worker` (celery), `bot` (ixtiyoriy profil), `web` (nginx: SPA + `/api/` + admin + static/media). Konfiguratsiya to'g'ri ko'rinadi, lekin **bu tahlilda Docker orqali ishga tushirib ko'rilmadi**.

**Production (GitLab CI):** Docker'siz, systemd + venv + nginx. `backend/**` o'zgarsa: pip → migrate → collectstatic → `apiconsult`, `consultbot`, nginx qayta ishga tushadi. `frontend/**` o'zgarsa: npm build → nginx. Monorepo'ga ko'chirish qadamlari `README.md` da.

**Kamchiliklar:**
- CI'da test, lint yoki build tekshiruvi bosqichi yo'q, to'g'ridan-to'g'ri deploy qilinadi.
- `git reset --hard` + `git clean` bilan deploy: serverdagi qo'lda o'zgarishlar yo'qoladi (ataylab shunday qilingan).
- Celery worker production'da systemd unit sifatida ko'rsatilmagan (faqat `apiconsult` va `consultbot`).
- Celery Beat hech qayerda yo'q.
- Media fayllar zaxirasi (backup) haqida hech narsa yo'q.

**Lokal ishga tushirish** (hozirgi kompyuterda tekshirildi): PostgreSQL `5433` portda, backend `.env` bilan `DEBUG=True`, Redis o'chiq. Frontend Vite dev server `5173` da ishlab turibdi.

---

## 12. Kod sifati va texnik qarz

**Backend:**
- Testlar deyarli yo'q (6 ta test funksiyasi) va runner yiqiladi.
- Ikkita Swagger kutubxonasi: `drf-spectacular` (ishlatiladi) va `drf-yasg` (faqat dekorator uchun; `pkg_resources` ogohlantirishini chiqaradi).
- `requirements/base.txt` da takrorlar (`django-import-export` ikki marta) va `tqdm==2.2.3` (juda eski versiya).
- `django-parler` o'rnatilgan va sozlangan, lekin `INSTALLED_APPS` da yo'q; tarjimalar `_uz/_ru/_cry` maydonlari bilan qo'lda qilinadi.
- `CKEDITOR_CONFIGS` va `CKEDITOR_UPLOAD_PATH` `base.py` da ikki marta e'lon qilingan.
- URL namespace `accounts` ikki marta ishlatilgan (`notifications` ham `accounts` namespace'ida).
- `additional_services` ichida `v.py`, `newviews.py` kabi vaqtinchalik fayllar.
- Kodda ko'p izohga olingan (comment) bloklar.
- Endpoint nomlari aralash uslubda: `OrderCreate/`, `GetLastTransactionStatus/`, `Token` (CamelCase) va `order/create/` (kebab-case); ba'zilarida oxirida slash bor, ba'zilarida yo'q. 9.1-muammo (TokenRefresh) aynan shu nomuvofiqlikdan kelib chiqqan.
- Migratsiyalar ko'p qayta nomlash (rename) bilan to'lgan (`additional_services` da 64 ta), squash qilish mumkin.

**Frontend:**
- Katta fayllar: `BookStore.tsx` 1750 qator, `ExternalTrade.tsx` 1394, `PersonalCabinet.tsx` 1251 — bo'laklarga ajratish kerak.
- Bir xil vazifa uchun 3 ta grafik kutubxonasi (Chart.js, Highcharts, Recharts) va 2 ta UI kutubxonasi (MUI + Tailwind).
- `ReportsCard.tsx`/`ReportsTable.tsx` `components/` da ham, `components/reports/` da ham bor (dublikat).
- `tsc` va `eslint` xatolari build'ni to'xtatmaydi, shuning uchun to'planib qolgan.

---

## 13. Tavsiya etilgan ishlar tartibi

### 1-bosqich — darhol (xavfsizlik, 1–2 kun)
1. `trade-data/upload` ga admin ruxsati qo'yish (`IsAdminUser`).
2. `update/email/<username>/` dan `DELETE` ni olib tashlash yoki faqat o'z profiliga cheklash.
3. `common/information/` yozish metodlarini admin bilan cheklash.
4. `__debug__/` ni faqat `DEBUG=True` da ulash.
5. Throttling limitlarini yoqish (kamida login, parol tiklash, murojaat uchun).
6. Production'da `ALLOWED_HOSTS` va CORS'ni domen bilan cheklash.

### 2-bosqich — buzuq funksiyalar (3–5 kun)
1. Frontend'da `refresh_token` URL'ini `/accounts/TokenRefresh` ga to'g'rilash.
2. Kitob to'lov havolasini `order.get_payment_url(provider)` natijasiga qaytarish.
3. `OrganizationListView` ga `queryset` qo'shish.
4. Shartnoma yaratishda `branch`/buxgalter yo'q holatini xavfsiz qilish.
5. `core/asgi.py` ni to'g'rilash, test import xatosini tuzatish.
6. Kabinetdagi demo to'lovlarni API'ga ulash, xabarnomalarni `notifications/me` dan olish.
7. `trade-flows` chaqiruvini olib tashlash yoki backend'da qo'shish.

### 3-bosqich — biznes oqimini yakunlash (1–2 hafta)
1. Shartnoma imzolanib to'langanda `UserServicePackage` ni avtomatik yaratish.
2. Paket muddatini (`duration_days`) foydalanishda tekshirish.
3. Qaysi xizmatlar paket limitini talab qilishini kelishib olish (KTUT, sanoat, CPI).
4. Celery Beat qo'shish (DIDOX tekshiruvi, hisobot eslatmalari `send_report_notifications`).
5. Click'ni shartnoma to'lovi uchun ham ulash; Payme'ni yakunlash yoki olib tashlash.
6. `PaymentMerchantRequestLog` ga yozishni yoqish.
7. Statistik klassifikatorlarni bazaga yuklash.

### 4-bosqich — sifat (doimiy)
1. CI'ga `manage.py check`, `test`, `tsc`, `eslint`, `vite build` bosqichlarini qo'shish.
2. Asosiy oqimlar uchun testlar: login, shartnoma, Click callback, limit hisobi.
3. CKEditor 4 ni almashtirish.
4. Begona jadvallarni (`test`, `uz`, `my_stat_uz_platforma_uchun`) va ishlatilmaydigan app'larni (`chat`, `monitoring`) tozalash.
5. Katta frontend sahifalarini bo'lish, `OrgInfoPage` chunk'ini kichraytirish, grafik kutubxonalarini bittaga keltirish.
6. Media fayllar uchun zaxira (backup) rejasini tuzish.
