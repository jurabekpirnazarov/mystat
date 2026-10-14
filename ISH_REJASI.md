# my.stat.uz — ish rejasi: tuzatish, sintetik ma'lumot va UI'ni boyitish

> **Sana:** 2026-10-13
> **Asos:** `PROEKT_TAHLIL.md` (loyiha tahlili) va `README.md`. Fayl yo'llari va raqamlar o'sha tahlildan olingan; tahlilda aniq yo'l ko'rsatilmagan joylarda "(aniqlash kerak)" deb yozilgan.
> **Kim uchun:** har bir vazifa Claude Code'ga alohida topshiriq sifatida berilishi uchun yozilgan. Vazifani berishda: "`ISH_REJASI.md` dagi `F-03` ni bajar" deyish yetarli.

---

## Bajarilish holati

> Oxirgi yangilanish: 2026-10-14. Har bir vazifa alohida git commit'da (`git log --oneline`). Loyiha 2026-10-13 da git repo qilindi. Masofaviy repo yo'q, shuning uchun branch/MR o'rniga `main` da ketma-ket commit'lar qilingan.

### Yakuniy tekshiruv (2026-10-14)

| Tekshiruv | Natija |
|---|---|
| `manage.py test` | **76 test, hammasi o'tdi**, skip yo'q (boshida 6 ta test bo'lgan va runner yiqilardi) |
| `manage.py check` | Faqat CKEditor 4 ogohlantirishi (xavfsizlik, keyinga qoldirilgan) |
| `makemigrations --check` | O'zgarish yo'q |
| `npm run typecheck` | **0 xato** (boshida 37) |
| `eslint src` | **0 xato**, 9 ogohlantirish (Fast Refresh) (boshida 85 xato) |
| `vite build` | O'tadi; 500 KB dan katta chunk yo'q (OrgInfoPage 635 → 19 KB) |
| `console.log` | 0 (boshida 159) |

### Vazifalar holati

| Vazifa | Holat | Izoh |
|---|---|---|
| F-01 | ✅ | Runner tuzatildi; OneID testlari Q-05 da loyihaga moslab qayta yozildi |
| F-02 | ✅ | `asgi.py` → `core.settings.production` |
| F-03 | ✅ | `notifications` namespace, takroriy CKEditor sozlamalari, `PARLER_LANGUAGES` |
| F-04 | ✅ | 37 → 0. Buglar: "Bosma" tab savati ishlamas edi (`print`/`bosma`), render ichida `navigate()` |
| F-05 | ✅ | 85 → 0 xato; `any` o'rniga tiplar. Tiplashda topilgan buglar pastda |
| B-01 | ✅ | Refresh URL + bitta umumiy refresh promise. Brauzerda qo'lda tekshirilmagan |
| B-02 | ✅ | |
| B-03 | ✅ | |
| B-04 | ✅ | `external-trade/trade-flows/` + `dynamics/`, 1 soat kesh (birinchi so'rov ~1,7 s, keshdan 45 ms) |
| B-05 | ✅ | `notifications/me` filtrlari, `unread-count/`; `NotificationsContext` |
| B-06 | ✅ | DIDOX (15 daq), hisobot eslatmalari va U-13 eslatmalari (09:00); `docker-compose` ga `beat` servisi. Production systemd unit'i yo'q (README) |
| B-07 | ✅ | `starts_at`/`expires_at`; 4 ta real paket NULL (muddatsiz). E-kitob, byulleten, STIR → 403 |
| B-08 | ✅ | `seed_demo --demographics` (214 704 qator); `data_source()`: real > sintetik (faqat DEBUG) |
| S-01..S-09 | ✅ | `seed_demo` (`--only/--flush/--dry-run`). Real bazada flush'dan keyin barcha jadvallardagi sonlar seed'dan oldingi holat bilan **bayt-ma-bayt bir xil** |
| S-03 | ✅ (o'zgartirilgan) | Model kodlar daraxti emas, klassifikator **hujjatlari** ro'yxati — 6 kategoriya, 16 hujjat |
| S-04 | ✅ (o'zgartirilgan) | Ilova `ServiceRequestResponse` ni ishlatadi; `ServiceRequests` admin uchun to'ldirildi |
| U-01..U-08 | ✅ | |
| U-07 | ✅ (o'zgartirilgan) | Daraxt o'rniga kategoriyalar + 3 tilda qidiruv + tafsilot + CSV (S-03 ga qarang) |
| U-09 | ✅ | `/foreign-trade` (bo'sh zaglushka edi) va `/trade-flows`: choropleth xarita, top-20, dinamika |
| U-10..U-13 | ✅ | Ctrl+K qidiruv, Stat AI (FAQ), operator chat (`ContactReply`), oy kalendari + eslatma + .ics |
| U-14 | ⚠️ qisman | Statik tuzatishlar (lang, alt, aria, focus-visible, skip-link, reduced-motion). **Lighthouse o'lchanmagan** (brauzer yo'q) |
| **U-15** (yangi) | ✅ | Demografiya sahifasi `/demographics`, `/statistical-data` — frontend'da umuman yo'q edi |
| Q-01 | ⚠️ qisman | `PersonalCabinet.tsx` 1129 → 291. **`BookStore.tsx` (1744) va `ExternalTrade.tsx` (1391) bo'linmadi**: ularda to'lov/xarid oqimi bor, testsiz va brauzersiz xatti-harakat saqlanishini kafolatlab bo'lmaydi |
| Q-02 | ✅ | |
| Q-03 | ✅ | Chart.js → Recharts; `chart.js`, `react-chartjs-2`, `highcharts*` olib tashlandi |
| Q-04 | ✅ | 14 ta ishlatilmaydigan fayl o'chirildi |
| Q-05 | ✅ | 76 test (≥30) |
| Q-06 | ✅ | CI `test` bosqichi; Docker executor kerak (OS-11) |
| Q-07 | ⚠️ qisman | parler va takroriy import-export olib tashlandi, tqdm 2.2.3 → 4.66.5. **drf-yasg qoldi**: Click to'lov view'lari ishlatadi (2.2-bo'lim) |

### Ish davomida topilgan va tuzatilgan buglar (rejada yo'q edi)

| Bug | Ta'siri |
|---|---|
| `ContractList` faqat `role == "client"` ga ro'yxat qaytarardi — bunday rol yo'q | Mijozlar (898 ta `user`) kabinetda o'z shartnomalarini hech qachon ko'rmas edi |
| Kabinet `response.data.results` ni o'qirdi (`getRequest` allaqachon javob tanasini qaytaradi) | Shartnomalar ro'yxati ikkinchi sabab bilan ham bo'sh edi |
| `common/platform-stat/` `random.randint` va qattiq yozilgan raqamlar qaytarardi | `/statistics` soxta "45 600 foydalanuvchi" va mavjud bo'lmagan "Soliq/Audit" xizmatlarini ko'rsatardi |
| `/demographics` marshruti yo'q edi | `/services` dagi demografiya xizmati bo'sh oq sahifaga olib borardi |
| `/foreign-trade`, `/statistical-data` — matnli zaglushka | |
| Sharhlarda `user_name`/`rating` o'qilardi (API: `user`/`value`) | Barcha sharhlar "Anonim" va har doim 5 yulduz |
| Login'dan keyin ism `ООО "Технологии"` bo'lib qolardi | login javobida `name` yo'q — AuthContext'dagi zaxira nom chiqardi |
| `state.clearAll()` (kerak: `methods.clearAll()`) | Tashqi savdo filtridagi "tozalash" tugmasi TypeError berardi |
| `service-request` POST `validated_data['client_file']` | Fayl biriktirilmasa 500 |
| `bugalter` profili yo'q bo'lsa `ContractList` 500 | |
| Mavjud bo'lmagan marshrutlar | Oq ekran (endi 404 sahifasi) |

### Topilgan, lekin tegilmagan (xavfsizlik/to'lov — 2-bo'lim)

- `services/service-request/` GET: `?package_item=` yoki `?contract=` bilan **boshqa foydalanuvchilarning so'rovlari qaytadi** (`Q(...) | Q(package_item=...) | Q(contract=...)`).
- `service-response/<pk>/` PATCH: `IsAttachedUser` mijozning o'ziga ham ruxsat beradi — mijoz o'z so'roviga "admin javobi" yozishi mumkin.
- OneID view'lari `print()` orqali kod va auth ma'lumotlarini (PINFL) log'ga chiqaradi.
- OneID: frontend callback `accounts/oneid/` ga POST yuboradi, backend esa faqat GET qabul qiladi. egov.uz kalitlarisiz tekshirib bo'lmadi.
- `User.image_url` mavjud bo'lmagan `settings.LOCAL_BASE_URL/PROD_BASE_URL` ni ishlatadi (hozircha avatarli foydalanuvchi yo'q).
- Paketni aniqlashda `UserServicePackage...first()` tartibsiz: foydalanuvchida bir nechta paket bo'lsa, tasodifiy biri olinadi.

### Ma'lumot sifati muammolari (bazada)

- Tashqi savdo: **2023-yil qiymatlari boshqa yillardan ~16 marta kichik** (masalan, 2024 vs 2023 "+776%"). Birlik farqi bo'lishi mumkin.
- 2021-yil yo'q, 2022-yil faqat `M1`.
- "Boshqa davlatlar" (kod 999) eksportning ~50% i — reytingdan ajratildi.
- Hisobot muddatlari (`ReportList.deadline`) 2025-yilda qotib qolgan — kalendar ularni `report_type` bo'yicha takrorlaydi.

### Yangi ochiq savollar

| ID | Savol | Hozirgi default |
|---|---|---|
| OS-10 | `TradeData.value` birligi qanday (ming AQSh $?) | UI'da "ming AQSh $" (`TRADE_VALUE_UNIT`, bitta joyda o'zgartiriladi) |
| OS-11 | GitLab'da Docker executor'li runner bormi? | CI test job'lari `python:3.12`/`node:20` image va `postgres:14` service bilan yozildi; runner bo'lmasa `CI_TESTS_DISABLED=true` |
| OS-12 | Frontend ko'p tilli bo'ladimi (i18n)? | Hozir faqat o'zbek (lotin); yangi UI ham shunday |
| OS-13 | Production'da Celery worker/beat uchun systemd unit qo'shiladimi? | Hozircha faqat docker-compose'da bor |

### Qo'lda tekshirish kerak (brauzerda)

1. `/trade-flows` — xarita chizilishi va davlat bosilganda dinamika.
2. `/demographics` — filtrlar, grafik, Excel eksport.
3. Kabinet: demo akkaunt bilan (`backend/.env` ga `DEMO_USER_PASSWORD=...` qo'yib, `python manage.py seed_demo --only demo_users` ni ishga tushiring) — bosh panel, xabarnomalar, so'rovlar, faoliyat rejasi, to'lovlar.
4. Ctrl+K qidiruv, Stat AI va operator chat (javobni admin'da `Contact` → inline orqali yozib).
5. Token yangilanishi: lokal `SIMPLE_JWT` access muddatini 1 daqiqaga qo'yib.
6. Mobil (360 px) ko'rinish va Lighthouse.

---

## Mundarija

1. [Maqsad va chegaralar](#1-maqsad-va-chegaralar)
2. [Hozircha tegilmaydigan narsalar](#2-hozircha-tegilmaydigan-narsalar)
3. [Claude Code uchun umumiy qoidalar](#3-claude-code-uchun-umumiy-qoidalar)
4. [Vazifalar jadvali (qisqa ko'rinish)](#4-vazifalar-jadvali)
5. [0-bosqich: ishchi muhit va sifat poydevori](#5-0-bosqich-ishchi-muhit-va-sifat-poydevori)
6. [1-bosqich: buzuq joylarni tuzatish](#6-1-bosqich-buzuq-joylarni-tuzatish)
7. [2-bosqich: sintetik ma'lumot (bazada)](#7-2-bosqich-sintetik-malumot)
8. [3-bosqich: UI'ni boyitish va yangi imkoniyatlar](#8-3-bosqich-uini-boyitish)
9. [4-bosqich: kod sifati va texnik qarz](#9-4-bosqich-kod-sifati)
10. [Ochiq savollar (egasi hal qiladi)](#10-ochiq-savollar)
11. [Tavsiya etilgan bajarish tartibi](#11-bajarish-tartibi)

---

## 1. Maqsad va chegaralar

**Maqsad:**
1. Ishlamayotgan yoki buzuq joylarni tuzatish (xavfsizlik va onlayn to'lovdan tashqari).
2. Bo'sh jadvallar va "faqat dizayn" bo'lgan sahifalarni **bazada saqlanadigan vaqtinchalik sintetik ma'lumot** bilan to'ldirish, shunda har bir sahifa ishlab turgan holda ko'rinadi.
3. Frontend'ni boyitish: kabinet, bosh sahifa, ochiq ma'lumot sahifalariga yangi bloklar, grafiklar, qidiruv va qulayliklar qo'shish.

**Ustuvorlik belgilari:**

| Belgi | Ma'nosi |
|---|---|
| **P0** | Birinchi navbatda. Foydalanuvchiga to'g'ridan-to'g'ri xato ko'rsatadi yoki boshqa vazifalarni to'sadi |
| **P1** | Muhim. Bo'sh/yolg'on ma'lumot ko'rsatadigan joylar, asosiy UI ishlari |
| **P2** | Foydali, lekin kutishi mumkin |

---

## 2. Hozircha tegilmaydigan narsalar

Egasining ko'rsatmasi: **xavfsizlik va onlayn to'lov tranzaksiyalari hozircha o'z holicha qoladi.** Quyidagilar bu rejaga **kirmaydi** va ularga tegishli kod o'zgartirilmaydi.

### 2.1. Xavfsizlik (tahlilning 10-bo'limi, to'liq)

| Tahlil # | Muammo | Holat |
|---|---|---|
| 10.1 | `trade-data/upload` mehmonga ochiq | Keyinga qoldirildi |
| 10.2 | `update/email/<username>/` orqali boshqa foydalanuvchini o'chirish | Keyinga qoldirildi |
| 10.3 | `common/information/` yozish/o'chirish ruxsatsiz | Keyinga qoldirildi |
| 10.4 | `ALLOWED_HOSTS=['*']`, CORS hammaga ochiq | Keyinga qoldirildi |
| 10.5 | `__debug__/` production'da | Keyinga qoldirildi |
| 10.6 | CKEditor 4 eskirgan | Keyinga qoldirildi |
| 10.7 | Rate limit yo'q (tahlil 9.16 throttling ham shu yerga kiradi) | Keyinga qoldirildi |
| 10.8 | Parol tiklashda email oshkor bo'lishi | Keyinga qoldirildi |
| 10.9 | `SECRET_KEY` default qiymati | Keyinga qoldirildi |
| 10.10 | `CSRF_COOKIE_SECURE=False`, qattiq yozilgan IP'lar | Keyinga qoldirildi |
| 10.11 | `DATA_UPLOAD_MAX_MEMORY_SIZE = 500 MB` | Keyinga qoldirildi |
| 10.12 | JWT `localStorage` da | Keyinga qoldirildi |

> Bu rejadagi biror vazifa yuqoridagi fayllarga tegishi kerak bo'lib qolsa (masalan, `accounts` dagi URL), faqat vazifa so'ragan o'zgarish qilinadi, ruxsat/permission mantiqi o'zgartirilmaydi.

### 2.2. Onlayn to'lov va tranzaksiyalar

| Tahlil # | Muammo | Holat |
|---|---|---|
| 9.2 | Kitob to'lov havolasi qattiq yozilgan (`book_market/api/OrderCreateView/views.py:34`) | Keyinga qoldirildi |
| 9.3 | `Order` summasi doim 0 (`payment/models.py:70-76`) | Keyinga qoldirildi |
| 9.11 | Payme ulanmagan | Keyinga qoldirildi |
| 4.4 | Shartnomani Click orqali to'lash | Keyinga qoldirildi |
| 4.4 | `PaymentMerchantRequestLog` ga log yozish | Keyinga qoldirildi |
| — | Click Prepare/Complete callback'lari | O'zgartirilmaydi |

**Qoida:** `backend/apps/payment/` ichidagi model, view va provayder kodi o'zgartirilmaydi. `Transaction` va `Order` jadvallariga **sintetik yozuv qo'shilmaydi** (to'lov hisobotlari va `Contract.payed_amount` buzilmasligi uchun). Kabinetdagi "To'lovlar tarixi" faqat mavjud real yozuvlarni **o'qib** ko'rsatadi (U-04).

---

## 3. Claude Code uchun umumiy qoidalar

Har bir vazifada amal qilinadi:

1. **Bitta vazifa = bitta branch + bitta PR/MR.** Branch nomi: `task/<ID>-qisqa-nom`, masalan `task/F-01-token-refresh`.
2. **Tegilmaydigan joylar:** 2-bo'limdagi hamma narsa. `backend/apps/payment/` va xavfsizlik sozlamalari (`settings/production.py`, permission'lar) o'zgarmaydi.
3. **Real ma'lumotga tegilmaydi.** Baza production dump'idan tiklangan (912 foydalanuvchi, 62 shartnoma va h.k.). Hech bir migratsiya yoki komanda mavjud real qatorlarni o'zgartirmaydi yoki o'chirmaydi. Sintetik ma'lumot faqat 2-bosqichdagi `seed_demo` komandasi orqali kiritiladi.
4. **Shaxsiy ma'lumot:** dump'da PINFL va telefonlar bor. Ularni log, test fixture, skrinshot yoki commit'ga chiqarmang.
5. **Har vazifa oxirida tekshiruv:**
   - Backend: `python manage.py check`, `python manage.py makemigrations --check`, `python manage.py test` (0-bosqichdan keyin ishlaydi).
   - Frontend: `npx tsc --noEmit`, `npx eslint src`, `npx vite build`. Yangi xato qo'shilmasligi kerak (eski xatolar F-04/F-05 da tozalanadi).
6. **Ko'p tillilik:** yangi model matn maydonlari loyihadagi uslubda `_uz`, `_ru`, `_cry` bo'ladi. Frontend matnlari mavjud tarjima mexanizmi orqali (aniqlash kerak: `i18n` fayllari qayerda).
7. **API uslubi:** yangi endpoint'lar kebab-case va oxirida slash bilan (`/api/<app>/<resource>/`). Eski endpoint'lar nomi o'zgartirilmaydi (frontend buzilmasligi uchun).
8. **UI kutubxonalari:** yangi komponentlar Tailwind + mavjud MUI bilan; yangi grafiklar **Recharts** bilan (4-bosqichda bitta kutubxonaga o'tish rejasi bor, yangi Chart.js/Highcharts kodi qo'shilmaydi).
9. Har vazifadagi **"Qabul mezonlari"** bajarilmaguncha vazifa tugagan hisoblanmaydi.

---

## 4. Vazifalar jadvali

| ID | Vazifa | Bosqich | Ustuvorlik | Bog'liqlik |
|---|---|---|---|---|
| F-01 | Test runner import xatosini tuzatish | 0 | P0 | — |
| F-02 | `core/asgi.py` sozlamasini to'g'rilash | 0 | P2 | — |
| F-03 | Django ogohlantirishlari va konfiguratsiya takrorlari | 0 | P2 | — |
| F-04 | Frontend TypeScript xatolarini (37) tuzatish | 0 | P1 | — |
| F-05 | ESLint xatolarini (92) tuzatish, `console.log` tozalash | 0 | P2 | F-04 |
| B-01 | Token yangilash URL'i (`TokenRefresh`) | 1 | P0 | — |
| B-02 | `organizations/` API 500 | 1 | P0 | — |
| B-03 | Shartnoma yaratishda `branch`/buxgalter yo'qligida 500 | 1 | P0 | — |
| B-04 | `trade-flows` endpoint'i | 1 | P1 | — |
| B-05 | Kabinet xabarnomalarini `notifications/me` ga ulash | 1 | P1 | — |
| B-06 | Celery Beat qo'shish | 1 | P1 | — |
| B-07 | Paket muddatini (`duration_days`) tekshirish | 1 | P2 | OS-02 |
| B-08 | Demografiya ma'lumoti lokal dev'da | 1 | P1 | OS-04 |
| S-01 | Sintetik yozuvlar reyestri (`SyntheticRecord`) | 2 | P0 | F-01 |
| S-02 | `seed_demo` management komandasi (karkas) | 2 | P0 | S-01 |
| S-03 | Statistik klassifikatorlar | 2 | P1 | S-02 |
| S-04 | Xizmat so'rovlari va javoblari | 2 | P1 | S-02 |
| S-05 | Faoliyat rejalari (`ActivityPlans`) | 2 | P1 | S-02 |
| S-06 | Xabarnomalar | 2 | P1 | S-02 |
| S-07 | Demo foydalanuvchilar va paketlar | 2 | P1 | S-02 |
| S-08 | Email obunalar, murojaatlar, reytinglar | 2 | P2 | S-02 |
| S-09 | Sintetik ma'lumot belgisi UI'da | 2 | P1 | S-02 |
| U-01 | Umumiy UI to'plami: skeleton, bo'sh holat, xato chegarasi | 3 | P0 | — |
| U-02 | Kabinet: bosh panel (dashboard) | 3 | P1 | U-01, S-07 |
| U-03 | Kabinet: xabarnomalar markazi | 3 | P1 | B-05, S-06 |
| U-04 | Kabinet: to'lovlar tarixi (faqat o'qish) | 3 | P1 | U-01 |
| U-05 | Kabinet: xizmat so'rovlari bo'limi | 3 | P1 | S-04 |
| U-06 | Kabinet: faoliyat rejasi bo'limi | 3 | P2 | S-05 |
| U-07 | Klassifikatorlar sahifasi: daraxt va qidiruv | 3 | P1 | S-03 |
| U-08 | Bosh sahifa: jonli ko'rsatkichlar va bo'limlar | 3 | P1 | U-01 |
| U-09 | Tashqi savdo: savdo oqimlari vizualizatsiyasi | 3 | P1 | B-04 |
| U-10 | Global qidiruv | 3 | P2 | S-03 |
| U-11 | "Stat AI" chat: FAQ/katalog bo'yicha javob | 3 | P2 | — |
| U-12 | "Operator" chat: murojaatni bazaga yozish | 3 | P2 | — |
| U-13 | Hisobot kalendari: eslatma va oy ko'rinishi | 3 | P2 | — |
| U-14 | Mobil moslashuv va kirish qulayligi (a11y) | 3 | P2 | U-01 |
| Q-01 | Katta frontend fayllarini bo'lish | 4 | P2 | F-04 |
| Q-02 | `OrgInfoPage` chunk'ini kichraytirish | 4 | P2 | — |
| Q-03 | Grafik kutubxonalarini Recharts'ga keltirish | 4 | P2 | Q-01 |
| Q-04 | Dublikat va ishlatilmaydigan fayllarni tozalash | 4 | P2 | — |
| Q-05 | Backend testlari: asosiy oqimlar | 4 | P1 | F-01, S-02 |
| Q-06 | CI'ga tekshiruv bosqichlari | 4 | P1 | F-01, F-04 |
| Q-07 | Backend tozalash: `drf-yasg`, `requirements`, vaqtinchalik fayllar | 4 | P2 | — |

> `OS-..` — 10-bo'limdagi ochiq savollar.

---

## 5. 0-bosqich: ishchi muhit va sifat poydevori

Maqsad: keyingi ishlarni tekshirib bo'ladigan holga keltirish (testlar ishlasin, tip xatolari yangi xatolarni yashirmasin).

### F-01 · Test runner import xatosini tuzatish · **P0**

**Muammo:** `manage.py test` ishga tushmaydi. `additional_services/api_endpoints/OrganizationAPI/__init__.py` mavjud bo'lmagan `views` modulini import qiladi.

**Fayllar:**
- `backend/apps/additional_services/api_endpoints/OrganizationAPI/__init__.py`

**Qadamlar:**
1. `__init__.py` dagi import'ni ko'rib chiqing: `views` haqiqatan yo'qmi yoki boshqa nom bilanmi.
2. Agar modul yo'q bo'lsa, import'ni olib tashlang; agar boshqa nomda bo'lsa, to'g'ri nomga o'zgartiring.
3. `python manage.py test` ni ishga tushiring, mavjud 6 ta test natijasini yozib qo'ying.

**Qabul mezonlari:**
- `python manage.py test` import xatosisiz yakunlanadi.
- Agar mavjud testlardan biri yiqilsa, sababi PR tavsifida yozilgan (bu vazifada testlarni o'zgartirmaslik mumkin).

---

### F-02 · `core/asgi.py` sozlamasini to'g'rilash · **P2**

**Muammo:** `core/asgi.py` bo'sh `core.settings` paketini ko'rsatadi (`base`/`production` emas). Hozir WSGI ishlatiladi, shuning uchun ta'siri yo'q.

**Fayllar:** `backend/core/asgi.py`, taqqoslash uchun `backend/core/wsgi.py`, `backend/manage.py`

**Qadamlar:**
1. `wsgi.py` va `manage.py` qaysi `DJANGO_SETTINGS_MODULE` ni ishlatsa, `asgi.py` da ham xuddi shuni qo'ying.

**Qabul mezonlari:**
- `python -c "import django, os; os.environ.setdefault(...); from core.asgi import application"` xatosiz import bo'ladi.

---

### F-03 · Django ogohlantirishlari va konfiguratsiya takrorlari · **P2**

**Muammo:** `manage.py check` 2 ta ogohlantirish chiqaradi; `base.py` da takrorlar bor.

**Fayllar:** `backend/core/settings/base.py`, `backend/core/urls.py`, `notifications` URL fayli (aniqlash kerak)

**Qadamlar:**
1. `notifications` URL'larini o'z namespace'iga o'tkazing (`accounts` takrorini yo'qotish). Frontend chaqiradigan yo'l (`notifications/me`) **o'zgarmasligi** kerak, faqat `namespace` nomi o'zgaradi. `reverse()` bilan chaqirilgan joylarni yangilang.
2. `base.py` dagi ikki marta e'lon qilingan `CKEDITOR_CONFIGS` va `CKEDITOR_UPLOAD_PATH` dan bittasini qoldiring (qiymatlar bir xil bo'lmasa, amalda ishlayotganini — keyingisini — qoldiring).
3. CKEditor 4 ogohlantirishi qoladi (10.6, keyinga qoldirilgan).

**Qabul mezonlari:**
- `manage.py check` faqat CKEditor ogohlantirishini chiqaradi.
- Barcha mavjud URL yo'llari avvalgidek javob beradi.

---

### F-04 · Frontend TypeScript xatolarini tuzatish · **P1**

**Muammo:** `tsc` 37 xato beradi. Vite tip tekshirmaydi, shuning uchun xatolar to'planib qolgan.

**Fayllar (tahlil bo'yicha):**
- `ReportData` tipi (`name`/`deadline` maydonlari yo'q) — aniqlash kerak: `src/types/` yoki `src/api/`
- `src/pages/BookStore.tsx` — `"print"` va `"bosma"` aralashgan
- `src/pages/BookOrderPage.tsx` — noto'g'ri props
- `src/pages/BookOrderMapPage.tsx` — `string`/`number` nomuvofiqligi
- ishlatilmagan import'lar bo'lgan barcha fayllar

**Qadamlar:**
1. `npx tsc --noEmit` natijasini guruhlang: ishlatilmagan import'lar va haqiqiy tip xatolari.
2. Ishlatilmagan import'larni olib tashlang.
3. `ReportData` tipini backend `reportlist/` javobiga qarab to'g'rilang.
4. Kitob variant turi uchun bitta union tip kiriting (backend qaysi qiymatni qaytarsa, o'shani asos qiling) va `BookStore.tsx` ni unga moslang.
5. `BookOrderPage` va `BookOrderMapPage` dagi props/tiplarni moslang.
6. `package.json` ga `"typecheck": "tsc --noEmit"` skriptini qo'shing.

**Qabul mezonlari:**
- `npm run typecheck` 0 xato.
- `vite build` avvalgidek o'tadi; kitob do'koni va buyurtma sahifalari brauzerda avvalgidek ishlaydi.

---

### F-05 · ESLint xatolari va `console.log` · **P2**

**Fayllar:** `frontend/src/**`, `frontend/package.json`

**Qadamlar:**
1. `npx eslint src --fix` bilan avtomatik tuzatiladiganlarini tuzating.
2. Qolganlarini qo'lda tuzating; tuzatib bo'lmaydiganlarini sababi bilan `// eslint-disable-next-line` qiling (faylning hammasiga emas).
3. `console.log` larni olib tashlang (`console.error` xato ishlovchilarida qolishi mumkin).
4. `package.json` dagi `name` ni `mystat-frontend` ga o'zgartiring.

**Qabul mezonlari:**
- `npx eslint src` 0 xato (ogohlantirishlar qolishi mumkin).
- `src/` da `console.log` qolmagan.

---

## 6. 1-bosqich: buzuq joylarni tuzatish

### B-01 · Token yangilash URL'i · **P0**

**Muammo:** frontend `/accounts/TokenRefresh/` ga yuboradi, backend'da yo'l `TokenRefresh` (slash'siz) → 404. Foydalanuvchi 5 soatdan keyin majburan chiqarib yuboriladi.

**Fayllar:** `frontend/src/api/apiUrls.ts:2`, token yangilovchi axios interceptor (aniqlash kerak: `src/api/` ichida)

**Qadamlar:**
1. `apiUrls.ts` dagi refresh URL'ini backend yo'liga (`/accounts/TokenRefresh`) moslang. Backend URL'iga tegmang (boshqa mijozlar buzilmasligi uchun).
2. Interceptor mantiqini tekshiring: 401 kelganda bir marta refresh qiladi, muvaffaqiyatsiz bo'lsa login sahifasiga yuboradi, bir vaqtda kelgan bir nechta 401 uchun bitta refresh so'rovi ketadi.
3. Agar parallel 401 holati to'g'ri ishlamasa, refresh promise'ini umumiy qilib (queue) tuzating.

**Qabul mezonlari:**
- Lokalda `SIMPLE_JWT` access muddatini vaqtincha 1 daqiqaga qo'yib (faqat lokal `.env`/develop sozlamasida, commit qilinmaydi) tekshirilganda: 1 daqiqadan keyin foydalanuvchi chiqarib yuborilmaydi, Network'da `TokenRefresh` 200 qaytaradi.
- Refresh token muddati o'tgan bo'lsa, foydalanuvchi login sahifasiga o'tadi va xato tsikli bo'lmaydi.

---

### B-02 · `organizations/` API 500 · **P0**

**Muammo:** `OrganizationListView` da `queryset` yo'q → `AssertionError`.

**Fayllar:** `backend/apps/organizations/api/OrganizationView/views.py`, `serializers.py` (shu papkada, aniqlash kerak)

**Qadamlar:**
1. View'ga `get_queryset()` qo'shing. Default: oddiy foydalanuvchi faqat **o'z** korxonasini ko'radi (`Organization` foydalanuvchiga 1:1), admin hammasini. (Bu xavfsizlikni kengaytirish emas, endpoint'ni ishlaydigan qilish; mavjud `permission_classes` o'zgarmaydi.)
2. Mehmon uchun javob mavjud ruxsat sozlamasiga qarab 401 yoki bo'sh ro'yxat bo'ladi.
3. Endpoint uchun 2 ta test yozing: login qilgan foydalanuvchi o'z korxonasini oladi; korxonasi yo'q foydalanuvchi bo'sh ro'yxat oladi.

**Qabul mezonlari:**
- `GET /api/organizations/organizations/` 500 qaytarmaydi.
- Testlar o'tadi.

---

### B-03 · Shartnoma yaratishda `branch`/buxgalter yo'qligida 500 · **P0**

**Muammo:** `contract.branch.bugalter...` — `branch` yoki buxgalter bo'lmasa view yiqiladi. Shartnoma bazaga yoziladi, lekin foydalanuvchi xato ko'radi.

**Fayllar:** `backend/apps/contracts/api/ContractCreate/views.py`, Telegram yuboruvchi yordamchi funksiya (aniqlash kerak)

**Qadamlar:**
1. Buxgalterga Telegram yuborish qismini xavfsiz qiling: `branch` yoki `branch.bugalter` yoki uning Telegram ID'si bo'lmasa, yuborish o'tkazib yuboriladi va `logger.warning` yoziladi.
2. Telegram yuborishdagi har qanday xato (tarmoq, token yo'q) shartnoma yaratish javobini buzmasin: `try/except` + log. Imkon bo'lsa, yuborishni `transaction.on_commit` ichiga oling.
3. DIDOX qismiga tegilmaydi.
4. Test: `branch=None` bilan shartnoma yaratish 201 qaytaradi (Telegram va DIDOX chaqiruvlari mock qilinadi).

**Qabul mezonlari:**
- `branch` yoki buxgalter yo'q holatda API 201 qaytaradi, shartnoma bazada bor, log'da ogohlantirish bor.
- Mavjud oqim (buxgalter bor holat) avvalgidek xabar yuboradi.

---

### B-04 · `trade-flows` endpoint'i · **P1**

**Muammo:** frontend `externalTrade.ts` `external-trade/trade-flows/` ni chaqiradi, backend'da bu endpoint yo'q (404). Sahifa bo'sh ro'yxat bilan davom etadi.

**Qaror (default):** endpoint'ni backend'da **qo'shamiz**, chunki tashqi savdo jadvalida 3,58 mln real yozuv bor va oqim (eksport/import yo'nalishi) ma'lumoti undan hisoblanadi. Sintetik ma'lumot kerak emas.

**Fayllar:**
- `backend/apps/additional_services/` ichidagi tashqi savdo URL va view'lari (aniqlash kerak: `external-trade/*` qayerda ro'yxatdan o'tgan)
- `frontend/src/api/externalTrade.ts`, `frontend/src/pages/ExternalTrade.tsx`

**Qadamlar:**
1. Frontend `trade-flows` dan qanday javob shaklini kutayotganini `externalTrade.ts` dan aniqlang (maydon nomlari, filtrlar).
2. Agar kutilgan shakl aniq bo'lmasa, quyidagini qabul qiling: `GET /api/additional-services/external-trade/trade-flows/?year=&flow=export|import&hs=&limit=20` → `[{ country_id, country_name, flow, value_usd, weight, share }]`, qiymat bo'yicha kamayish tartibida.
3. `TradeData` bo'yicha agregatsiya (`values().annotate(Sum(...))`), kerakli maydonlar bo'yicha indeks bormi tekshiring. Javobni keshlang (`cache_page` yoki low-level cache, 1 soat).
4. Mehmonga ochiq bo'lsin (boshqa `external-trade/*` klassifikatorlari kabi; yangi ruxsat mantiqi kiritilmaydi).
5. Frontend'da chaqiruvni yangi shaklga moslang, xatoda bo'sh holat (U-01) ko'rsating.
6. Javob vaqti katta yil uchun 1 soniyadan oshsa, PR'da yozing (materialized view yoki oldindan hisoblangan jadval keyingi vazifa bo'ladi).

**Qabul mezonlari:**
- Endpoint 200 qaytaradi, konsolda 404 yo'q.
- Filtr ro'yxati to'ladi, U-09 uchun ma'lumot bor.
- Kesh bilan qayta so'rov 100 ms dan tez.

---

### B-05 · Kabinet xabarnomalarini `notifications/me` ga ulash · **P1**

**Muammo:** backend'da `notifications/me` bor (8 yozuv), lekin kabinetdagi xabarnomalar faqat brauzer xotirasida.

**Fayllar:** `backend/apps/notifications/` (view, serializer, url), `frontend/src/pages/PersonalCabinet.tsx`, yangi `frontend/src/api/notifications.ts`

**Qadamlar:**
1. Backend'da `notifications/me` javobini tekshiring: sahifalash (pagination), `is_read` maydoni bormi.
2. Yetishmasa qo'shing: `POST notifications/<id>/read/` (bitta xabarni o'qilgan qilish), `POST notifications/read-all/`, `GET notifications/unread-count/`. Faqat o'z xabarnomalari (`request.user` bo'yicha filtr).
3. Frontend'da `localStorage` ga asoslangan xabarnoma holatini olib tashlang, API'ga ulang.
4. UI qismi U-03 da kengaytiriladi; bu vazifada ro'yxat API'dan kelishi yetarli.

**Qabul mezonlari:**
- Sahifa yangilanganda xabarnomalar yo'qolmaydi.
- O'qilgan belgisi bazada saqlanadi.
- Boshqa foydalanuvchining xabarnomasini o'qilgan qilish 404 qaytaradi (test bilan).

---

### B-06 · Celery Beat qo'shish · **P1**

**Muammo:** DIDOX holat tekshiruvi (`contracts.tasks.periodic_didox_check`) va hisobot eslatmalari (`send_report_notifications`) avtomatik ishlamaydi.

**Fayllar:** `backend/core/celery.py`, `backend/core/settings/base.py`, `docker-compose.yml`, `backend/requirements/base.txt`

**Qadamlar:**
1. `CELERY_BEAT_SCHEDULE` ni `base.py` da e'lon qiling. Default jadval:
   - `periodic_didox_check` — har 15 daqiqada;
   - `send_report_notifications` — har kuni 09:00 (`Asia/Tashkent`).
   (Vaqtlar OS-05 bo'yicha egasi bilan tasdiqlanadi; o'zgartirish oson bo'lishi uchun `.env` dan o'qilsin.)
2. `docker-compose.yml` ga `beat` servisi qo'shing: `celery -A core beat -l info`, `worker` bilan bir xil image va env.
3. Lokal (Redis o'chiq) rejimda beat ishga tushmasligi va hech narsani buzmasligi kerak.
4. GitLab CI/systemd uchun `beat` unit'i shu vazifaga **kirmaydi**; README'ga "production'da beat unit qo'shish kerak" eslatmasini yozing.
5. Agar `send_report_notifications` task sifatida yo'q bo'lib, faqat management komanda bo'lsa, uni chaqiruvchi yupqa Celery task yozing.

**Qabul mezonlari:**
- `docker compose up` da `beat` servisi ko'tariladi, log'da jadval ko'rinadi.
- `celery -A core inspect scheduled` yoki beat log'ida DIDOX tekshiruvi rejalashtirilgani ko'rinadi.

---

### B-07 · Paket muddatini tekshirish · **P2**

**Muammo:** `UserServicePackage` da tugash sanasi yo'q (faqat `year`, `month`); `duration_days` foydalanishda tekshirilmaydi.

**Bog'liqlik:** OS-02 (egasi tasdiqlashi kerak). Javob kelguncha **default** quyida.

**Fayllar:** `backend/apps/services/models.py`, limit tekshiruvchi kod (e-kitob, byulleten, STIR xizmatlari; aniqlash kerak), yangi migratsiya

**Qadamlar:**
1. `UserServicePackage` ga `starts_at` (date) va `expires_at` (date, nullable) maydonlarini qo'shing.
2. Data migratsiya: **mavjud 4 ta real yozuvga `expires_at=NULL` qoladi** (muddatsiz deb hisoblanadi), ya'ni real foydalanuvchilar ta'sirlanmaydi.
3. Yangi paket yaratilganda (admin yoki kod) `expires_at = starts_at + duration_days`.
4. Limit tekshiruvida: `expires_at` bor va o'tgan bo'lsa → 403 "Paket muddati tugagan".
5. Admin ro'yxatida muddat va holat (faol/tugagan) ustunlari.
6. Testlar: muddati o'tgan paket bilan e-kitob yuklash 403; `expires_at=NULL` bilan ishlaydi.

**Qabul mezonlari:**
- Migratsiyadan keyin mavjud 4 ta paket egalari avvalgidek foydalana oladi.
- Testlar o'tadi.

> Paketni shartnoma/to'lovdan keyin **avtomatik faollashtirish** (tahlil 9.4) to'lov oqimiga bog'liq, shuning uchun bu rejaga kirmaydi (2.2-bo'lim).

---

### B-08 · Demografiya ma'lumoti lokal dev'da · **P1**

**Muammo:** demografiya `media/demographics/data.parquet` faylidan o'qiydi, fayl dump bilan kelmaydi, lokalda sahifa bo'sh.

**Bog'liqlik:** OS-04. **Default:** real faylni serverdan nusxalash eng to'g'ri yo'l. Fayl berilmaguncha dev uchun sintetik parquet generatori.

**Fayllar:** demografiya ma'lumotini o'qiydigan kod (`additional_services`, aniqlash kerak), `backend/media/demographics/`, yangi `seed_demo` qismi (S-02)

**Qadamlar:**
1. Kod parquet'dan qaysi ustunlarni o'qishini aniqlang (`DemographicSection` sxemasi, 7 bo'lim).
2. Fayl yo'q bo'lsa, API 500 emas, bo'sh natija + `"data_available": false` qaytarsin; frontend "Ma'lumot yuklanmagan" holatini ko'rsatsin.
3. `seed_demo --demographics` opsiyasi: sxemaga mos sintetik parquet'ni `media/demographics/data.synthetic.parquet` ga yozadi. Kod faqat `DEBUG=True` va asosiy fayl yo'q bo'lsa sintetik faylni o'qiydi. Asosiy fayl hech qachon ustidan yozilmaydi.
4. Sintetik qiymatlar real tartibga yaqin bo'lsin (hududlar 14 ta, yillar 2018–2025, aholi soni realistik oraliqda) va qat'iy `random seed` bilan yaratilsin.

**Qabul mezonlari:**
- Lokalda fayl bo'lmaganda sahifa xatosiz ochiladi.
- Sintetik fayl bilan grafiklar to'ladi va sahifada "sintetik ma'lumot" belgisi ko'rinadi (S-09).
- Production'da (`DEBUG=False`) sintetik fayl hech qachon o'qilmaydi.

> Eslatma: parquet fayl, baza emas. Egasi demografiyani ham bazada bo'lishini xohlasa, bu alohida vazifa (parquet → jadval ko'chirish), OS-04 ga qarang.

---

## 7. 2-bosqich: sintetik ma'lumot

### Asosiy tamoyillar

1. **Ma'lumot bazada.** Barcha sintetik yozuvlar Django modellari orqali PostgreSQL'ga yoziladi (B-08 parquet bundan istisno).
2. **Real qatorlarga tegilmaydi.** Komanda mavjud yozuvlarni hech qachon `update` yoki `delete` qilmaydi. Faqat o'zi yaratgan yozuvlarni o'chiradi.
3. **Har bir sintetik yozuv ro'yxatga olinadi** (S-01 reyestri), shuning uchun keyin bitta buyruq bilan aniq tozalanadi.
4. **Idempotent.** Komanda ikki marta ishga tushirilsa, dublikat yaratilmaydi. Har bir yozuv barqaror kalit (`seed_key`) bilan aniqlanadi, masalan `classification:okonx:01`.
5. **Takrorlanuvchan.** `random.seed(<qat'iy son>)` / `Faker.seed()` — har safar bir xil ma'lumot.
6. **Production'da ishlamaydi.** `DEBUG=False` bo'lsa komanda xato bilan to'xtaydi. `--allow-production` bayrog'i **yo'q** (atayin).
7. **Ko'rinadigan belgi.** Sintetik matnlar `[DEMO]` prefiksi bilan boshlanadi yoki UI'da "Sintetik ma'lumot" yorlig'i chiqadi (S-09), real ma'lumot bilan adashtirilmasligi uchun.
8. **Shaxsiy ma'lumot o'ylab topiladi.** PINFL, telefon, STIR — formatga mos, lekin real bo'lishi mumkin bo'lmagan diapazonda (masalan, telefonlar `+998 00 ...`, STIR `9xxxxxxxx` demo diapazoni) va hech qachon real foydalanuvchidan nusxa olinmaydi.

### S-01 · Sintetik yozuvlar reyestri · **P0**

**Fayllar:** `backend/apps/common/models.py`, `backend/apps/common/admin.py`, yangi migratsiya

**Qadamlar:**
1. `common` app'iga model qo'shing:
   ```text
   SyntheticRecord
     content_type  FK -> ContentType
     object_id     CharField (UUID va int PK'lar uchun)
     seed_key      CharField, unique
     created_at    DateTimeField(auto_now_add)
   ```
2. Yordamchi funksiyalar (`common/synthetic.py`):
   - `get_or_create_synthetic(model, seed_key, defaults)` — reyestrda `seed_key` bo'lsa obyektni qaytaradi, bo'lmasa yaratadi va ro'yxatga oladi (bitta `transaction.atomic` ichida);
   - `is_synthetic(obj)` — obyekt reyestrdami;
   - `synthetic_ids(model)` — model bo'yicha sintetik ID'lar to'plami (serializer'lar uchun).
3. Admin'da faqat o'qish uchun ro'yxat (model bo'yicha filtr).

**Qabul mezonlari:**
- Migratsiya mavjud jadvallarga tegmaydi (faqat yangi jadval).
- `get_or_create_synthetic` uchun test: ikki marta chaqirilsa bitta obyekt.

---

### S-02 · `seed_demo` management komandasi (karkas) · **P0**

**Fayllar:** `backend/apps/common/management/commands/seed_demo.py`, `backend/apps/common/seeders/` (har modul uchun alohida fayl), `backend/requirements/develop.txt` (`Faker`)

**Interfeys:**
```text
python manage.py seed_demo                      # hamma bo'limlar
python manage.py seed_demo --only classifications,service_requests
python manage.py seed_demo --flush              # faqat sintetik yozuvlarni o'chiradi
python manage.py seed_demo --flush --only notifications
python manage.py seed_demo --dry-run            # nima yaratilishini ko'rsatadi, yozmaydi
python manage.py seed_demo --demographics       # B-08 parquet
```

**Qadamlar:**
1. Seeder interfeysi: har bir seeder `name`, `depends_on`, `seed()`, `flush()` ga ega. Komanda bog'liqlik tartibida chaqiradi (masalan, `demo_users` → `service_requests`).
2. `DEBUG=False` bo'lsa xato bilan chiqish.
3. Har bir seeder `transaction.atomic` ichida.
4. `--flush` faqat `SyntheticRecord` dagi obyektlarni teskari bog'liqlik tartibida o'chiradi, keyin reyestr yozuvlarini. Real yozuvlarga `on_delete=CASCADE` orqali ta'sir qilish ehtimolini tekshiring: agar sintetik obyektni o'chirish real obyektni o'chirsa, komanda to'xtaydi va xabar beradi.
5. Oxirida jadval chiqarsin: model, yaratildi, mavjud edi, o'chirildi.
6. README'ga "Demo ma'lumot" bo'limi qo'shing.

**Qabul mezonlari:**
- `seed_demo` ikki marta ketma-ket ishga tushirilganda ikkinchisida "yaratildi: 0".
- `seed_demo --flush` dan keyin har bir jadvaldagi yozuvlar soni seed'dan oldingi soniga teng (test: oldin/keyin sanash).
- `DEBUG=False` bilan ishga tushirilsa, bazaga hech narsa yozilmaydi.

---

### S-03 · Statistik klassifikatorlar · **P1**

**Muammo:** `StatisticClassification` va `StatisticClassificationCategory` — 0 yozuv; `/statistical-classifications` sahifasi bo'sh.

**Fayllar:** `backend/apps/additional_services/` dagi klassifikator modellari (aniqlash kerak), `common/seeders/classifications.py`

**Qadamlar:**
1. Model maydonlarini o'qing (kod, nom 3 tilda, ota element, kategoriya, fayl/havola bo'lishi mumkin).
2. Seed: 6 ta kategoriya (masalan, "Iqtisodiy faoliyat turlari", "Mahsulotlar", "Hududlar", "Mulkchilik shakllari", "Tashkiliy-huquqiy shakllar", "Kasblar") va har birida 2–3 darajali daraxt, jami ~150–250 element.
3. Nomlar uz/ru/cry da. Kodlar real klassifikator formatiga o'xshash (`01`, `01.1`, `01.11`), lekin har bir kategoriya nomi `[DEMO]` bilan.
4. Agar egasi real klassifikator faylini bersa (OS-03), alohida import komandasi yoziladi va bu seed `--flush` bilan olib tashlanadi.

**Qabul mezonlari:**
- API ro'yxat va daraxt qaytaradi, sahifa to'ladi.
- `--flush` dan keyin jadvallar yana 0.

---

### S-04 · Xizmat so'rovlari va javoblari · **P1**

**Muammo:** `ServiceRequests` = 0, `ServiceDeliverables` = 0, javoblar 6 ta.

**Fayllar:** `backend/apps/services/models.py`, `common/seeders/service_requests.py`

**Qadamlar:**
1. So'rov holatlari modelidan oling (yangi, ko'rib chiqilmoqda, bajarildi, rad etildi va h.k.).
2. Faqat **demo foydalanuvchilar** (S-07) nomidan ~40 so'rov: 9 xizmat bo'yicha taqsimlangan, so'nggi 6 oy ichidagi sanalar, turli holatlar, tumanlar (mavjud real `District` jadvalidan o'qiladi, o'zgartirilmaydi).
3. Bajarilgan so'rovlarga `ServiceDeliverables` (fayl o'rniga kichik PDF/TXT `media/demo/` ga yoziladi va reyestrga qo'shiladi) va javob matni.
4. Javob beruvchi: demo `employee` foydalanuvchisi.

**Qabul mezonlari:**
- Demo foydalanuvchi bilan kirilganda kabinetda so'rovlar ko'rinadi (U-05).
- Real foydalanuvchilar kabinetida sintetik so'rov ko'rinmaydi.

---

### S-05 · Faoliyat rejalari (`ActivityPlans`) · **P1**

**Fayllar:** `backend/apps/services/models.py` (`ActivityPlans`), `common/seeders/activity_plans.py`

**Qadamlar:**
1. Model maydonlariga qarab demo korxonalar uchun yillik/choraklik reja yozuvlari (~30 ta): nomi, muddat, holat, mas'ul.
2. Agar `ActivityPlans` umumiy (korxonaga bog'liq bo'lmagan) reja bo'lsa, Statistika qo'mitasining namunaviy reja punktlari sifatida yarating.

**Qabul mezonlari:**
- API (mavjud bo'lsa) yoki admin'da yozuvlar ko'rinadi; U-06 uchun ma'lumot bor.
- API yo'q bo'lsa, bu vazifada faqat-o'qish endpoint qo'shiladi: `GET /api/services/activity-plans/` (login kerak, o'z yozuvlari).

---

### S-06 · Xabarnomalar · **P1**

**Fayllar:** `backend/apps/notifications/models.py`, `common/seeders/notifications.py`

**Qadamlar:**
1. Demo foydalanuvchilar uchun 10–20 tadan xabarnoma: shartnoma holati, paket limiti 80% ga yetgani, yangi byulleten, hisobot muddati yaqinlashgani, so'rovga javob kelgani.
2. Yarmi o'qilgan, yarmi o'qilmagan; sanalar so'nggi 30 kun.
3. Real foydalanuvchilarga xabarnoma **yaratilmaydi**.

**Qabul mezonlari:**
- Demo foydalanuvchi bilan kirilganda xabarnomalar ro'yxati va o'qilmaganlar soni ko'rinadi.

---

### S-07 · Demo foydalanuvchilar va paketlar · **P1**

**Maqsad:** UI'ni barcha rollar bo'yicha "to'la" holatda ko'rish, real foydalanuvchi akkauntiga kirmasdan.

**Fayllar:** `backend/apps/accounts/models.py`, `organizations/models.py`, `services/models.py`, `contracts/models.py`, `common/seeders/demo_users.py`

**Qadamlar:**
1. Rollar bo'yicha demo akkauntlar: `demo_yuridik_1..5` (yuridik shaxs), `demo_jismoniy_1..3`, `demo_bugalter`, `demo_employee`. Username `demo_` bilan boshlanadi, email `@demo.invalid` domenida.
2. Parol `.env` dagi `DEMO_USER_PASSWORD` dan olinadi; o'zgaruvchi bo'lmasa, komanda tasodifiy parol yaratib konsolga **bir marta** chiqaradi. Parol kodga yozilmaydi.
3. Har yuridik demo foydalanuvchiga `Organization` (o'ylab topilgan nom, `[DEMO]` prefiksi, demo STIR diapazoni, real `Region`/`District` ga bog'lanadi).
4. 4 ta mavjud paketdan turlicha `UserServicePackage` (B-07 qilingan bo'lsa, muddatlari bilan) va `UserServicePackageItemUse` yozuvlari: kimdir limitning 20% ini, kimdir 85% ini ishlatgan.
5. **Shartnoma:** demo foydalanuvchilarga `Contract` yozuvlari yaratilishi mumkin, lekin DIDOX va Telegram chaqirilmaydi (model to'g'ridan-to'g'ri yaratiladi, view orqali emas), `payed_amount` ga ta'sir qiluvchi `Transaction` yaratilmaydi. Agar `Contract` modelida saqlashda tashqi chaqiruv (signal) bo'lsa, shartnomalar seed'i o'tkazib yuboriladi va PR'da yoziladi.
6. Admin'da demo foydalanuvchilarni filtrlash uchun `is_synthetic` ustuni (S-01 orqali).

**Qabul mezonlari:**
- Har bir rol bilan login qilib, kabinetning har bir bo'limi to'la ko'rinadi.
- Real foydalanuvchilar soni (912) o'zgarmagan, `--flush` dan keyin demo akkauntlar yo'q.

---

### S-08 · Email obunalar, murojaatlar, reytinglar · **P2**

**Fayllar:** `accounts` (`Subscribe`), `common` (murojaat modeli, aniqlash kerak), `services` (reyting)

**Qadamlar:**
1. `Subscribe`: 20 ta `@demo.invalid` obunachi.
2. Murojaatlar: 15 ta demo murojaat turli holatda (U-12 operator chat bilan bir modelga tushadi).
3. Reytinglar: demo foydalanuvchilardan 9 xizmatga 1–5 baho, izohlar bilan.

**Qabul mezonlari:**
- Admin va tegishli sahifalarda ko'rinadi; `--flush` bilan tozalanadi.

---

### S-09 · Sintetik ma'lumot belgisi UI'da · **P1**

**Fayllar:** tegishli serializer'lar (S-03..S-08 modellari), `frontend/src/components/common/DemoBadge.tsx` (yangi)

**Qadamlar:**
1. Sintetik obyekt qaytaradigan serializer'larga `is_synthetic` maydoni (S-01 `synthetic_ids` orqali, N+1 so'rovsiz).
2. Frontend'da kichik "Demo" yorlig'i komponenti: kartochka, jadval qatori, sahifa sarlavhasi (butun sahifa sintetik bo'lsa).
3. `DEBUG=False` da maydon doim `false` va yorliq chiqmaydi.

**Qabul mezonlari:**
- Klassifikatorlar, so'rovlar, xabarnomalar, demografiya (sintetik fayl) sahifalarida yorliq ko'rinadi.

---

## 8. 3-bosqich: UI'ni boyitish

Umumiy talablar: barcha yangi bloklar 3 tilda, tungi/kunduzgi rejimda (`ThemeContext`), 360 px kenglikdan boshlab moslashadi. Har bir sahifada yuklanish, bo'sh va xato holatlari bor (U-01).

### U-01 · Umumiy UI to'plami · **P0**

**Fayllar:** yangi `frontend/src/components/ui/` papkasi, `frontend/src/App.tsx` (yoki router fayli)

**Qadamlar:**
1. Komponentlar: `Skeleton` (kartochka, jadval, grafik variantlari), `EmptyState` (ikonka, matn, ixtiyoriy tugma), `ErrorState` (qayta urinish tugmasi bilan), `StatCard` (raqam, o'zgarish foizi, mini grafik), `PageHeader` (sarlavha, breadcrumb, amallar).
2. Marshrut darajasida `ErrorBoundary`: bitta sahifa yiqilsa, butun ilova oq ekranga aylanmaydi.
3. API chaqiruvlari uchun umumiy hook `useApi(fn, deps)` → `{data, loading, error, reload}` (agar loyihada shunga o'xshash narsa bo'lsa, o'shani kengaytiring).
4. Mavjud sahifalarga majburan joriy qilmang; yangi va o'zgaradigan sahifalarda ishlatiladi.

**Qabul mezonlari:**
- Komponentlar ikkala mavzuda to'g'ri ko'rinadi.
- Ataylab xato tashlaydigan komponent bilan tekshirilganda ErrorBoundary ishlaydi.

---

### U-02 · Kabinet: bosh panel (dashboard) · **P1**

**Fayllar:** `frontend/src/pages/PersonalCabinet.tsx` (yangi bo'lim sifatida, Q-01 da alohida faylga ko'chadi), yangi `frontend/src/pages/cabinet/Overview.tsx`; backend: `GET /api/accounts/me/summary/` (yangi, aniqlash kerak qaysi app)

**Qadamlar:**
1. Backend agregat endpoint: faol paket nomi va muddati, har xizmat bo'yicha limit (jami/ishlatilgan), shartnomalar soni holat bo'yicha, ochiq so'rovlar soni, o'qilmagan xabarnomalar soni, so'nggi 5 ta faoliyat (limit ishlatilishi, buyurtma, so'rov). Faqat `request.user` ma'lumoti.
2. UI: tepada 4 ta `StatCard`; limitlar uchun progress bar'lar (80% dan oshsa sariq, 100% qizil); so'nggi 6 oyda limit ishlatilishi (Recharts ustunli grafik); "So'nggi faoliyat" lenta; tez amallar (yangi so'rov, kitob do'koni, tariflar).
3. Kabinetga kirilganda birinchi ochiladigan bo'lim shu bo'lsin.

**Qabul mezonlari:**
- Demo yuridik foydalanuvchi bilan barcha bloklar to'la; paketsiz foydalanuvchida "Tarif tanlang" bo'sh holati va tariflar havolasi.

---

### U-03 · Kabinet: xabarnomalar markazi · **P1**

**Bog'liqlik:** B-05, S-06

**Fayllar:** `frontend/src/components/notifications/` (yangi), header komponenti (aniqlash kerak)

**Qadamlar:**
1. Header'da qo'ng'iroqcha ikonka + o'qilmaganlar soni (`unread-count`, har 60 soniyada yoki oyna fokusga kelganda yangilanadi).
2. Ochiladigan panel: so'nggi 10 ta, "Hammasini o'qilgan qilish", "Barchasini ko'rish".
3. Kabinetdagi to'liq ro'yxat: tur bo'yicha filtr (shartnoma, paket, hisobot, tizim), o'qilgan/o'qilmagan, sahifalash.
4. Xabarnoma bosilganda tegishli sahifaga o'tish (agar xabarnomada havola/obyekt bo'lsa).

**Qabul mezonlari:**
- O'qilgan holati sahifa yangilangandan keyin ham saqlanadi.
- Hisoblagich o'qilganda kamayadi.

---

### U-04 · Kabinet: to'lovlar tarixi (faqat o'qish) · **P1**

**Muammo:** hozir qattiq yozilgan demo ma'lumot (2024-yil, "Start tarifi").

**Cheklov:** to'lov kodi o'zgartirilmaydi (2.2). Bu vazifa faqat mavjud `Transaction` / `Order` / kitob buyurtmalari yozuvlarini **o'qib** ko'rsatadi.

**Fayllar:** `frontend/src/pages/PersonalCabinet.tsx` (to'lovlar bo'limi); backend: mavjud endpoint'lar (`orders/OrderList/`, `GetLastTransactionStatus/`). Agar foydalanuvchining tranzaksiyalar ro'yxati uchun endpoint bo'lmasa, **`payment` app'idan tashqarida** (masalan `accounts/me/payments/`) faqat-o'qish view qo'shiladi: `request.user` ga tegishli yozuvlar, maydonlar: sana, summa, maqsad (kitob/shartnoma/xizmat), provayder, holat.

**Qadamlar:**
1. Qattiq yozilgan massivni olib tashlang.
2. Jadval: sana, maqsad, summa, provayder, holat (rangli belgi). Filtr: davr, holat. Bo'sh holat: "Hozircha to'lovlar yo'q".
3. Shartnoma bo'yicha `payed_amount` / umumiy summa progress bar'i (shartnomalar bo'limidan havola).

**Qabul mezonlari:**
- Kodda demo to'lov massivi qolmagan.
- Real foydalanuvchida o'z yozuvlari, demo foydalanuvchida bo'sh holat ko'rinadi (sintetik `Transaction` yaratilmaydi).
- `backend/apps/payment/` da diff yo'q.

---

### U-05 · Kabinet: xizmat so'rovlari bo'limi · **P1**

**Bog'liqlik:** S-04

**Fayllar:** yangi `frontend/src/pages/cabinet/Requests.tsx`, `frontend/src/api/services.ts`; backend `services` dagi so'rov API'lari (tahlilda "API bor" deyilgan)

**Qadamlar:**
1. Ro'yxat: xizmat, sana, holat, javob beruvchi tuman; holat bo'yicha filtr va qidiruv.
2. "Yangi so'rov" formasi: xizmat tanlash, tavsif, fayl biriktirish (mavjud API qabul qilsa), paket limiti qolganini ko'rsatish.
3. So'rov tafsiloti: holat tarixi (vaqt chizig'i), javob matni, natija fayllari (`ServiceDeliverables`) yuklab olish, xizmatni baholash (mavjud reyting API).
4. `employee` roli uchun: o'z tumanidagi so'rovlar ro'yxati va javob yozish formasi (agar backend'da bor bo'lsa; yo'q bo'lsa PR'da yozing, alohida vazifa bo'ladi).

**Qabul mezonlari:**
- Demo foydalanuvchi so'rov yaratadi, demo employee javob beradi, foydalanuvchi javobni ko'radi (qo'lda end-to-end tekshiruv).

---

### U-06 · Kabinet: faoliyat rejasi bo'limi · **P2**

**Bog'liqlik:** S-05

**Qadamlar:**
1. Rejalar ro'yxati: chorak/oy bo'yicha guruhlangan, holat belgisi.
2. Oddiy Gantt yoki vaqt chizig'i ko'rinishi (Recharts yoki CSS grid).

**Qabul mezonlari:** demo ma'lumot bilan bo'lim to'la, bo'sh holat ishlaydi.

---

### U-07 · Klassifikatorlar sahifasi · **P1**

**Bog'liqlik:** S-03

**Fayllar:** `/statistical-classifications` sahifasi (aniqlash kerak: `src/pages/`), API klient

**Qadamlar:**
1. Chapda kategoriyalar, o'ngda ochiladigan daraxt (kod + nom).
2. Kod yoki nom bo'yicha qidiruv (debounce 300 ms), topilgan element daraxtda ochilib ko'rsatiladi.
3. Element tafsiloti paneli: to'liq yo'l (breadcrumb), 3 tildagi nom, bolalar soni.
4. Joriy kategoriyani CSV/XLSX ga eksport (frontend'da, mavjud `xlsx` bo'lmasa CSV).

**Qabul mezonlari:**
- 250 ta element bilan daraxt silliq ishlaydi; qidiruv 3 tilda ishlaydi.

---

### U-08 · Bosh sahifa: jonli ko'rsatkichlar · **P1**

**Fayllar:** bosh sahifa komponenti (aniqlash kerak: `src/pages/Home*.tsx`), mavjud endpoint'lar: `site-stat/`, `platform-stat/`, `accounts/month-user-stat`, `external-trade/*`

**Qadamlar:**
1. "Raqamlarda platforma" bloki: korxonalar (KTUT) soni, tashqi savdo yozuvlari, kitoblar soni, xizmatlar soni — mavjud API'lardan, sanab chiqish animatsiyasi bilan.
2. "Oylik foydalanuvchilar" mini grafigi (`month-user-stat`).
3. "Tashqi savdo qisqacha": oxirgi yil eksport/import jami va top-5 davlat (B-04 dan keyin).
4. "Yaqinlashayotgan hisobot muddatlari" (hisobot kalendaridan keyingi 5 ta).
5. "Ommabop xizmatlar" (reyting bo'yicha top-3).
6. Har bir blok mustaqil yuklanadi (bittasi xato bersa, qolganlari ishlaydi).

**Qabul mezonlari:**
- Bosh sahifadagi yangi bloklar API'dan to'ladi, qattiq yozilgan raqam yo'q.
- Lighthouse Performance mobil'da hozirgidan pasaymaydi (oldin/keyin raqamini PR'ga yozing).

---

### U-09 · Tashqi savdo: savdo oqimlari vizualizatsiyasi · **P1**

**Bog'liqlik:** B-04

**Fayllar:** `frontend/src/pages/ExternalTrade.tsx` (Q-01 da bo'linadi; bu vazifada yangi komponent alohida faylda: `components/externalTrade/TradeFlows.tsx`)

**Qadamlar:**
1. Dunyo xaritasi (Leaflet allaqachon bor): davlatlar savdo hajmi bo'yicha rang bilan (choropleth), eksport/import almashtirgich.
2. Top-20 davlat jadvali: hajm, ulush, o'tgan yilga nisbatan o'zgarish.
3. Yillar bo'yicha dinamika (Recharts chiziqli grafik), tanlangan davlat uchun.
4. Filtr holati URL query'da saqlansin (havolani ulashish mumkin bo'lsin).

**Qabul mezonlari:**
- Konsolda xato yo'q, filtr o'zgarganda faqat kerakli so'rov ketadi.

---

### U-10 · Global qidiruv · **P2**

**Fayllar:** backend: yangi `GET /api/common/search/?q=` ; frontend: header'da qidiruv maydoni, `Ctrl+K` bilan ochiladigan oyna

**Qadamlar:**
1. Backend bir nechta manbadan qidiradi (har biridan 5 tadan): xizmatlar, FAQ, kitoblar, klassifikatorlar, hisobot shakllari, sahifalar ro'yxati (statik). Login talab qiladigan manbalar mehmonga qaytarilmaydi.
2. Natijalar guruhlangan, klaviatura bilan boshqariladi.

**Qabul mezonlari:**
- 2 harfdan qisqa so'rovga natija qaytmaydi; javob 300 ms dan tez (lokal).

---

### U-11 · "Stat AI" chat: FAQ va katalog bo'yicha javob · **P2**

**Muammo:** hozir faqat UI, javob kelmaydi.

**Default yechim:** tashqi LLM ulanmaydi (kalit, xarajat va ma'lumot maxfiyligi qarori egasida, OS-06). Hozircha qoidaga asoslangan yordamchi.

**Fayllar:** `frontend/src/components/chats/` (AI chat), backend: `POST /api/common/assistant/` (yangi)

**Qadamlar:**
1. Backend savolni FAQ, xizmatlar va sahifalar bo'yicha qidiradi (U-10 qidiruvidan foydalanadi) va eng mos 1–3 javobni havolalar bilan qaytaradi.
2. Javob topilmasa: "Operator bilan bog'lanish" tugmasi (U-12 ga o'tadi).
3. Chat oynasida tayyor savol tugmalari ("Tarif qanday tanlanadi?", "Shartnoma qanday tuziladi?").
4. Suhbat tarixi sessiya davomida saqlanadi (bazaga yozilmaydi).
5. UI'da "Yordamchi FAQ asosida javob beradi" izohi.

**Qabul mezonlari:**
- FAQ'dagi 10 savolning har biriga o'xshash so'rov to'g'ri javob qaytaradi.

---

### U-12 · "Operator" chat: murojaatni bazaga yozish · **P2**

**Muammo:** xabar hech qayerga yuborilmaydi.

**Default yechim:** WebSocket emas (`chat` app ishlamaydi, `channels` o'rnatilmagan). Chat oynasi mavjud **murojaat** modeliga (10 ta murojaat bor) yozadi va javobni polling bilan oladi.

**Fayllar:** `frontend/src/components/chats/` (operator chat), `common` dagi murojaat modeli va API (aniqlash kerak), admin

**Qadamlar:**
1. Login qilgan foydalanuvchi xabari murojaat sifatida saqlanadi (mehmon uchun ism + telefon so'raladi, mavjud murojaat formasi kabi).
2. Agar murojaat modelida javob maydoni bo'lmasa: `ContactReply` modeli (murojaat FK, matn, muallif, sana) qo'shiladi; admin'da inline.
3. Foydalanuvchi oynasi ochiq bo'lsa har 15 soniyada yangi javobni tekshiradi.
4. Telegram bot orqali operatorlarga xabar yuborish keyingi vazifa (bot tokeni kerak).

**Qabul mezonlari:**
- Foydalanuvchi xabari admin'da ko'rinadi, admin javobi foydalanuvchi oynasida chiqadi.

---

### U-13 · Hisobot kalendari: oy ko'rinishi va eslatma · **P2**

**Fayllar:** `/report-calendar` sahifasi, `notifications` (eslatma), `send_report_notifications` (B-06)

**Qadamlar:**
1. Oy kalendari ko'rinishi (ro'yxatdan tashqari), kunlarda hisobotlar soni.
2. "Meni ogohlantir" tugmasi: login qilgan foydalanuvchi uchun hisobot muddatidan 3 kun oldin in-app xabarnoma (B-06 task'i orqali).
3. `.ics` fayl sifatida kalendarga eksport.

**Qabul mezonlari:**
- Eslatma yoqilgan hisobot uchun task xabarnoma yaratadi (test bilan, vaqt mock qilinadi).

---

### U-14 · Mobil moslashuv va kirish qulayligi · **P2**

**Qadamlar:**
1. Asosiy sahifalarni 360, 768, 1280 px kengliklarda tekshiring (bosh sahifa, xizmatlar, kabinet, tashqi savdo, kitob do'koni); gorizontal skroll yo'qolsin.
2. Jadvallar mobil'da kartochka ko'rinishiga o'tsin yoki o'z ichida skroll qilsin.
3. Tugmalar va havolalarda `aria-label`, rasmlarda `alt`, klaviatura bilan navigatsiya, fokus ko'rinishi.
4. Rang kontrasti (WCAG AA) ikkala mavzuda.

**Qabul mezonlari:**
- Lighthouse Accessibility asosiy sahifalarda ≥ 90.

---

## 9. 4-bosqich: kod sifati

### Q-01 · Katta frontend fayllarini bo'lish · **P2**

**Fayllar:** `BookStore.tsx` (1750 qator), `ExternalTrade.tsx` (1394), `PersonalCabinet.tsx` (1251)

**Qadamlar:** har birini sahifa papkasiga ajrating (`pages/cabinet/`, `pages/externalTrade/`, `pages/bookStore/`): bo'limlar alohida komponent, API chaqiruvlari hook'larga, tiplar alohida faylga. Xatti-harakat o'zgarmaydi.

**Qabul mezonlari:** hech bir fayl 400 qatordan oshmaydi; sahifalar avvalgidek ishlaydi.

### Q-02 · `OrgInfoPage` chunk'ini kichraytirish · **P2**

**Qadamlar:** `vite build --mode production` + `rollup-plugin-visualizer` bilan sababini toping (ehtimol jsPDF/html2canvas yoki Highcharts); og'ir kutubxonalarni faqat kerak paytda `import()` bilan yuklang.

**Qabul mezonlari:** chunk 500 KB dan kichik, ogohlantirish yo'q.

### Q-03 · Grafik kutubxonalarini bittaga keltirish · **P2**

**Qadamlar:** Chart.js va Highcharts'dagi grafiklar ro'yxatini tuzing, Recharts'ga ko'chiring, keyin `package.json` dan olib tashlang. Har bir ko'chirilgan grafik oldin/keyin skrinshot bilan.

**Qabul mezonlari:** `chart.js`, `react-chartjs-2`, `highcharts` bog'liqliklari yo'q; bundle hajmi kamaygan.

### Q-04 · Dublikat va ishlatilmaydigan fayllar · **P2**

**Fayllar:** `pages/BookShop.tsx`, `pages/StatisticIndicators.tsx` (import qilinmagan), `components/ReportsCard.tsx` va `components/ReportsTable.tsx` (`components/reports/` da ham bor), `additional_services` dagi `v.py`, `newviews.py`

**Qadamlar:** har biri haqiqatan ishlatilmasligini `grep` bilan tasdiqlang, keyin o'chiring. Dublikatlarda bittasini qoldirib, import'larni yangilang.

**Qabul mezonlari:** build, `tsc`, `manage.py check` o'tadi.

### Q-05 · Backend testlari: asosiy oqimlar · **P1**

**Qadamlar:** quyidagilar uchun testlar (`pytest` emas, mavjud Django test runner):
- login, token refresh (B-01 URL bilan);
- shartnoma yaratish (DIDOX va Telegram mock qilingan), `branch=None` holati;
- limit hisobi: e-kitob, byulleten, STIR; limit tugaganda 403; paket muddati (B-07);
- `seed_demo`: idempotentlik va `--flush` real yozuvlarga tegmasligi;
- xabarnomalar: faqat o'zinikini o'qish/belgilash.

Click callback testlari bu rejaga kirmaydi (to'lov kodi o'zgartirilmaydi), lekin mavjud bo'lsa yiqilmasligi kerak.

**Qabul mezonlari:** kamida 30 ta test, hammasi o'tadi, test bazasi uchun real dump kerak emas (fixture/factory).

### Q-06 · CI'ga tekshiruv bosqichlari · **P1**

**Fayllar:** `.gitlab-ci.yml`

**Qadamlar:** deploy'dan oldin `test` bosqichi: backend (`check`, `makemigrations --check`, `test` — PostgreSQL service konteyneri bilan), frontend (`typecheck`, `eslint`, `vite build`). Bosqich yiqilsa deploy bo'lmaydi. Mavjud deploy qadamlari o'zgartirilmaydi.

**Qabul mezonlari:** MR'da pipeline tekshiruvlarni ko'rsatadi; ataylab buzilgan test deploy'ni to'xtatadi.

### Q-07 · Backend tozalash · **P2**

**Qadamlar:**
1. `drf-yasg` dekoratorlarini `drf-spectacular` ning `extend_schema` iga almashtiring, `drf-yasg` ni olib tashlang.
2. `requirements/base.txt`: `django-import-export` takrorini olib tashlang; `tqdm==2.2.3` ni joriy versiyaga yangilang (ishlatilish joyini tekshiring).
3. `django-parler` ishlatilmasa, sozlamalari va bog'liqligini olib tashlang.
4. Katta izohga olingan kod bloklarini olib tashlang (git tarixida qoladi).

**Qabul mezonlari:** `pip install` toza, `api/docs/` avvalgidek ochiladi, `manage.py check` o'tadi.

---

## 10. Ochiq savollar

Bu savollar egasi tomonidan hal qilinadi. Javob kelguncha vazifalar ko'rsatilgan **default** bilan bajariladi.

| ID | Savol | Default | Ta'sir qiladigan vazifa |
|---|---|---|---|
| OS-01 | KTUT, sanoat mahsulotlari, CPI, klassifikatorlar uchun paket limiti kerakmi yoki faqat login yetarlimi? | Hozirgidek: faqat login | B-07, U-02 |
| OS-02 | Paket muddati qanday hisoblanadi: `duration_days` dan yoki kalendar oyi (`year`/`month`) bo'yicha? | `starts_at + duration_days`, mavjud paketlar muddatsiz | B-07 |
| OS-03 | Statistik klassifikatorlarning real fayli (Excel/CSV) bormi? | Bo'lmaguncha sintetik (S-03) | S-03, U-07 |
| OS-04 | Demografiya parquet faylini serverdan olish mumkinmi? Demografiyani bazaga ko'chirish kerakmi? | Lokal dev uchun sintetik parquet, bazaga ko'chirilmaydi | B-08 |
| OS-05 | DIDOX tekshiruvi va hisobot eslatmalari qaysi jadval bo'yicha ishlasin? | 15 daqiqa / har kuni 09:00 | B-06 |
| OS-06 | "Stat AI" uchun haqiqiy LLM ulanadimi? | Yo'q, FAQ asosidagi yordamchi | U-11 |
| OS-07 | Bazadagi begona jadvallar (`test`, `uz`, `my_stat_uz_platforma_uchun`) va ishlatilmaydigan `chat`, `monitoring` app'lari o'chiriladimi? | Tegilmaydi (qaytarib bo'lmaydigan amal, egasining aniq ruxsati kerak) | — |
| OS-08 | Ichki rol tizimi (`Role`/`Permission`, bo'sh) kerakmi yoki `User.role` yetarlimi? | `User.role` qoladi, jadvallar to'ldirilmaydi | S-07 |
| OS-09 | Sintetik ma'lumot test serverida ham kerakmi (DEBUG=False)? | Yo'q, faqat lokal/dev | S-02 |

---

## 11. Bajarish tartibi

Tavsiya etilgan ketma-ketlik. Bir qatordagi vazifalarni parallel bajarish mumkin.

| Qadam | Vazifalar | Natija |
|---|---|---|
| 1 | F-01, B-01, B-02, B-03 | Testlar ishlaydi, foydalanuvchi chiqarib yuborilmaydi, 500'lar yo'q |
| 2 | F-04, S-01, U-01 | Tip xatolari yo'q, sintetik reyestr va UI poydevori tayyor |
| 3 | S-02, S-07 | `seed_demo` va demo akkauntlar |
| 4 | S-03, S-04, S-05, S-06, S-09, B-05 | Bo'sh jadvallar to'ldi, xabarnomalar API'da |
| 5 | U-02, U-03, U-04, U-05, U-07 | Kabinet va klassifikatorlar to'liq |
| 6 | B-04, U-08, U-09, B-06 | Tashqi savdo oqimlari, bosh sahifa, Celery Beat |
| 7 | Q-05, Q-06 | Testlar va CI himoyasi |
| 8 | B-07, B-08, U-06, U-10..U-14, S-08 | Qo'shimcha imkoniyatlar |
| 9 | F-02, F-03, F-05, Q-01..Q-04, Q-07 | Tozalash va optimallashtirish |

### Claude Code'ga topshiriq berish namunasi

```text
mystat repo'sida ISH_REJASI.md dagi S-02 vazifasini bajar.
3-bo'limdagi umumiy qoidalarga va 2-bo'limdagi tegilmaydigan joylarga amal qil.
Qabul mezonlarini tekshirib, natijasini PR tavsifida yoz.
```
