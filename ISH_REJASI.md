# my.stat.uz — ilovani yangilash rejasi (Claude Code uchun topshiriq)

> **Versiya:** 2 · 2026-10-14 (1-versiya 2026-10-13 dagi tuzatish va sintetik ma'lumot rejasi edi; bu versiya uni yangi xizmatlar, fuqarolar uchun alohida yechimlar va "har sahifada ma'lumot bo'lsin" talabi bilan to'liq qayta yozadi)
> **Asos:** `PROEKT_TAHLIL.md` (loyiha tahlili) va `README.md`. Fayl yo'llari va raqamlar o'sha tahlildan olingan. Tahlilda aniq yo'l ko'rsatilmagan joylarda "(aniqlash kerak)" deb yozilgan, Claude Code ularni kodni o'qib topadi.
> **Qanday ishlatiladi:** har bir vazifa alohida topshiriq. Claude Code'ga "`ISH_REJASI.md` dagi `K-02` ni bajar" deyish yetarli. Butun yangilanishni bosqichma-bosqich qilish tartibi 15-bo'limda.

### Qisqacha: nima qilinadi

1. **Buzuq joylar tuzatiladi** (token yangilash, 500 xatolar, `trade-flows`, xabarnomalar, Celery Beat).
2. **Har sahifa ma'lumot bilan ochiladi.** Real ma'lumot bo'lmagan joyga bazaga **sintetik namuna** yoziladi va UI'da "Namuna ma'lumot" deb belgilanadi (4-bo'limdagi jadval har sahifa uchun manbani ko'rsatadi).
3. **Korxonalar uchun yangi xizmatlar:** autofill, tarmoq benchmarki, bozor tahlili hisoboti, hamkor/raqobatchi qidiruvi, hisobot topshirish yordamchisi, buyurtma asosida statistik ma'lumot va boshqalar.
4. **Fuqarolar va tadqiqotchilar uchun alohida yechimlar:** ma'lumotlar API'si, hududiy profil, kengaytirilgan inflyatsiya kalkulyatori, fuqaro kabineti, "Mening maoshim", narxlar monitoringi va boshqalar.
5. **Ichki/admin:** analitika paneli, ko'rsatkichlarga obuna va avtomatik xabarlar, konsultant bilan onlayn konsultatsiya.
6. **Xavfsizlik va onlayn to'lov hozircha o'zgartirilmaydi** (2-bo'lim).

---

## Bajarilish holati

> Oxirgi yangilanish: 2026-10-14 (2-versiya). Har bir vazifa yoki vazifalar guruhi alohida git commit'da (`git log --oneline`). Masofaviy repo yo'q, shuning uchun branch/MR o'rniga `main` da ketma-ket commit'lar. 1-versiya vazifalari (F, B, S-01..S-09, U-01..U-14, Q) bajarilgan holati git tarixidagi oldingi `ISH_REJASI.md` da; quyida qisqacha.

### Yakuniy tekshiruv

| Tekshiruv | Natija |
|---|---|
| `manage.py test` | **160 test, hammasi o'tdi** (1-versiya oxirida 76) |
| `manage.py check` | Faqat CKEditor 4 ogohlantirishi (xavfsizlik, keyinga qoldirilgan) |
| `makemigrations --check` | O'zgarish yo'q |
| `npx tsc --noEmit` | 0 xato |
| `eslint src` | 0 xato, 9 eski ogohlantirish (Fast Refresh) |
| `npm test` (vitest, yangi) | 11 test: autofill qoidasi, inflyatsiya stsenariylari, maosh persentili |
| `vite build` | O'tadi; 500 KB dan katta chunk yo'q |
| `seed_demo` | Ikki marta ketma-ket — ikkinchisida yangi yozuv yo'q; `--flush --dry-run` real yozuvlarga tegmaydi |

### 2-versiya vazifalari

| Vazifa | Holat | Izoh |
|---|---|---|
| S-07 (yangilangan) | ✅ | `demo_tadqiqotchi`, 5 ta `demo_konsultant_*`; demo korxonalarga OKED bo'limi |
| S-09 (yangilangan) | ✅ | "Namuna" yorlig'i (bosilganda tushuntirish), `SampleBanner`, `data_source`, PNG/PDF'da "NAMUNA" suv belgisi |
| S-10 | ✅ (o'zgartirilgan) | KTUT'da OKED/hudud **yo'q** (faqat STIR, nom, soxta OKPO). Guruh belgilari `EnterpriseIndicator` ning o'zida; benchmark guruhi **anonim** namuna korxonalar (STIR `P…`), real korxonaga o'ylab topilgan raqam biriktirilmadi. 21 203 qator |
| S-11 | ✅ | 14 hudud × 10 ko'rsatkich × 2018–2025 (yillik + choraklik), 369 tuman × 4 ko'rsatkich |
| S-12 | ✅ | 108 shakl uchun yo'riqnoma, top-20 ga namunaviy PDF (o'z PDF yozuvchimiz — `common/pdf.py`, bog'liqliksiz). Demo korxonalar sintetik KTUT yozuvi orqali 6 shaklga bog'langan |
| S-13 | ✅ | 6 tarif, 15 buyurtma, bajarilganlariga NAMUNA XLSX |
| S-14 | ✅ | 5 konsultant, ~700 slot, 12 band qilish |
| S-15 | ✅ | 12 maqola + 40 atama (uz, ru sarlavha/ta'rif, kirill — transliteratsiya), ish haqi, 25 mahsulot narxi, ~200 ism, 4 so'rovnoma (1 720 namuna javob), 20 fuqaro savoli |
| S-16 | ✅ | 2 API kalit (faqat xesh), 30 kunlik foydalanish, 22 obuna, 10 hodisa, 4 saqlangan filtr |
| U-15 | ✅ | `UserPreference`, bir martalik tanishtiruv (korxona/fuqaro), profil to'ldirilganligi |
| U-16 | ✅ (o'zgartirilgan) | Taqqoslash, saqlangan filtrlar va eksport (≤10 000 qator) **/trade-flows** da. `/ex-trade` (to'lov oqimi bor, 1 391 qator) ga tegilmadi |
| U-17 | ✅ | Qidiruv, saralash, sevimlilar, "Menga eng yaqin" pochta; to'lov oqimi o'zgarmagan |
| K-01 | ✅ | `me/prefill/`, `me/registry-diff/` (3 s timeout, 24 soat kesh), manba belgilari, shartnoma uchun "Rekvizitlarni tasdiqlayman" (backend ham talab qiladi) |
| K-02 | ✅ | Faqat agregat, kichik guruhda respublikaga kengayadi, PDF |
| K-03 | ✅ (o'zgartirilgan) | Hammasi real. "Imkoniyatlar" (jahon importi) uchun bazada jahon savdosi yo'q — o'rniga O'zbekiston eksporti o'sayotgan/qisqarayotgan bozorlar |
| K-04 | ✅ (o'zgartirilgan) | Manba — sanoat mahsulotlari reyestri (39 ming korxona: hudud, tuman, faoliyat turi). **"O'lcham" filtri qo'shilmadi** (real xodimlar soni yo'q). Eksportda telefon/PINFL yo'q |
| K-05 | ✅ | Topshirilganlik holati yo'q (`submitted-report` qattiq yozilgan stub, OS-11) — faqat muddatlar |
| K-06 | ✅ (o'zgartirilgan) | Alohida `CustomDataRequest` (mavjud `ServiceRequestResponse` shartnoma+paket talab qiladi va GET ruxsatida tegilmagan muammo bor) |
| K-07 | ✅ | `/cabinet/organization`; tashqi savdoda korxona kesimi yo'q — blok chiqmaydi |
| K-08 | ✅ | `ContractStatusLog` (signal), vaqt chizig'i, oldindan ko'rish (bazaga yozmaydi). Lokalda shartnoma shabloni (`datas/contractContentTemplate.json`) yo'q — qisqa shartlar ko'rsatiladi |
| K-09 | ✅ | `services/pricing.py` — yagona formula (shartnoma ham ishlatadi), taqqoslash, "Menga qaysi paket mos?" |
| FQ-01 | ✅ | `/api/open/v1/` (6 endpoint), 401/429, CSV BOM, alohida hujjat `/api/open/docs/`, kabinetda kalitlar |
| FQ-02 | ✅ | Real (sanoat korxonalari, tashqi savdo, tumanlar) + namuna; xarita, infografika PNG, ikki hududni solishtirish |
| FQ-03 | ✅ | Ochiq CPI qatori, 3 stsenariy, URL'da parametrlar |
| FQ-04 | ✅ | Fuqaro bosh paneli, korxona bo'limlari yashiriladi, sevimlilar. Endpoint: `/api/citizens/me/summary/` |
| FQ-05..FQ-10 | ✅ | Maosh brauzerdan chiqmaydi; savat `localStorage` da; so'rovnoma — bitta foydalanuvchi bitta javob; "Muhammad" = "Мухаммад"; ochiq savol-javob faqat rozilik bilan |
| FQ-07 | ✅ (o'zgartirilgan) | `Article`/`GlossaryTerm` `common` emas, yangi `citizens` app'da; `<Term>` 10 joyda |
| FQ-11 | ✅ (o'zgartirilgan) | `vite-plugin-pwa` o'rniga o'z `sw.js` (kesh qoidalari aniq nazoratda). **Lighthouse o'lchanmagan** |
| A-01 | ✅ | `/<admin>/analytics/`; voronkada "tarif ko'rdi" yo'q (sahifa ko'rishlari saqlanmaydi) |
| A-02 | ✅ | Obunalar, hodisalar (CPI yangi davri — signal), Celery (har soat, oylik dayjest), Telegram — mavjud `/start <token>` |
| A-03 | ✅ | Faqat korxonalar (OS-17), 24 soat qoidasi, eslatmalar; baho band qilishning o'zida (ServiceRating xizmatga bog'langan) |

### 2-versiyada topilgan va tuzatilgan buglar

| Bug | Ta'siri |
|---|---|
| `ServicePackage` da `name` yo'q, shartnoma kodi `service_package.name` ni ishlatadi | Standart (007) shartnoma yaratish har doim 500 |
| `ServiceModal` doim `service_package_id: 1` yuborardi | Qaysi tarif tanlansa ham 1-paket uchun shartnoma |
| CPI kalkulyatori ikki oyning **oylik** indeksini ayirardi | Davr inflyatsiyasi butunlay noto'g'ri (masalan 100.58 va 100.66 → 0.08%) |
| Kitob ro'yxati `book.name`/`book.price` o'qirdi (API: `name_uz`, `options[].price`) | Barcha kitoblar nomsiz va "Bepul" |
| Baza `C` collation — `icontains` kirillchada katta-kichik harfni farqlaydi | Kirillcha qidiruv ("хлоп" → "Хлопок") topmasdi; global qidiruv ham |
| `BaseModel.delete()` yumshoq o'chirish, limit hisobi esa barcha yozuvlarni sanaydi | Limitni "qaytarish" ishlamaydi (konsultatsiyada `hard_delete` ishlatildi; boshqa joylarda e'tibor kerak) |
| `index.html` dagi `/vite.svg` favicon mavjud emas | Favicon 404 |
| OKED nomlarida lotin matnga kirill "А" aralashgan | "ISHLАB" kabi nomlar — `common/text.fix_lookalikes` bilan ko'rsatishda tozalanadi |

### Ma'lumot bo'yicha kuzatuvlar

- **TradeData.value — "ming AQSh $"** ekani narxlar bilan tasdiqlandi (paxta tolasi ~1 770–2 700 $/t) — OS-10 yopilishi mumkin.
- KTUT: 65 540 yozuv, lekin faqat STIR va nom; `okpo` soxta ("2134rf34r"), 5 ta "ktut1..5" test yozuvi.
- `submitted-report` endpoint'i qattiq yozilgan raqamlar qaytaradi.

### Yangi pullik xizmatlar uchun paket limiti (OS-14)

Admin'da `PackageService` shu slug'lar bilan qo'shilsa va paketlarga limit berilsa, limit ishlaydi; qo'shilmaguncha xizmatlar limitsiz:

| Slug | Xizmat |
|---|---|
| `benchmark` | Tarmoq benchmarki (bir kunda bir xil hisobot qayta sanalmaydi) |
| `market-report` | Bozor tahlili — to'liq versiya/PDF |
| `partners-export` | Hamkorlar ro'yxatini Excel'ga eksport |
| `consultation` | Konsultatsiya band qilish |

### Ochiq savollar (yangilari)

| ID | Savol | Hozirgi default |
|---|---|---|
| OS-18 | Shartnoma shabloni `datas/contractContentTemplate.json` repoda yo'q — serverdagi faylni repoga qo'shamizmi? | Oldindan ko'rishda qisqa shartlar |
| OS-19 | Korxona o'lchami (xodimlar soni) uchun real manba bormi? | K-04 da o'lcham filtri yo'q |
| OS-20 | Jahon savdosi ma'lumoti (K-03 "imkoniyatlar") olinadimi? | O'zbekiston eksporti dinamikasi bilan |
| OS-21 | Production'da `TELEGRAM_BOT_TOKEN`, `EMAIL_HOST` sozlanganmi? | Sozlanmagan kanal jim o'tkaziladi |
| OS-22 | Nginx'da `sw.js` uchun `Cache-Control: no-cache` | ✅ Qo'shildi (`sw.js` va `manifest.webmanifest`) |

### Qo'lda tekshirish kerak (brauzerda)

1. Kabinet (korxona: `demo_yuridik_2`): bosh panel, tanishtiruv (`demo_yuridik_4/5` da chiqadi), Hisobotlarim, Benchmark (PDF), Individual ma'lumot, Konsultatsiyalarim, Obunalarim, API kalitlarim, korxona pasporti.
2. Shartnoma oqimi: tarif → "Shartnoma orqali" → rekvizitlar va matn → tasdiqlash (DIDOX lokal muhitda ishlamaydi).
3. Fuqaro (`demo_jismoniy_1`): bosh panel, Savollarim; ochiq sahifalar `/citizens`, `/regions`, `/cpi-calculator`, `/my-salary`, `/prices`, `/learn`, `/surveys`, `/names`, `/answers`.
4. Xodim (`demo_employee`): Individual ma'lumot va Savollarim — "Xodim navbati"; konsultant (`demo_konsultant_1`): "Mening jadvalim".
5. Admin: `/<admin>/analytics/`, Excel eksport.
6. PWA (production build), mobil ko'rinish, Lighthouse.

---

## Mundarija

1. [Maqsad va chegaralar](#1-maqsad-va-chegaralar)
2. [Hozircha tegilmaydigan narsalar](#2-hozircha-tegilmaydigan-narsalar)
3. [Claude Code uchun umumiy qoidalar](#3-claude-code-uchun-umumiy-qoidalar)
4. [Ma'lumot qamrovi: har sahifa nima bilan to'ladi](#4-malumot-qamrovi)
5. [Vazifalar jadvali](#5-vazifalar-jadvali)
6. [0-bosqich: ishchi muhit va sifat poydevori (F)](#6-0-bosqich-ishchi-muhit-va-sifat-poydevori)
7. [1-bosqich: buzuq joylarni tuzatish (B)](#7-1-bosqich-buzuq-joylarni-tuzatish)
8. [2-bosqich: sintetik ma'lumot (S)](#8-2-bosqich-sintetik-malumot)
9. [3-bosqich: UI'ni boyitish (U)](#9-3-bosqich-uini-boyitish)
10. [4-bosqich: korxonalar uchun xizmatlar (K)](#10-4-bosqich-korxonalar-uchun-xizmatlar)
11. [5-bosqich: fuqarolar va tadqiqotchilar uchun (FQ)](#11-5-bosqich-fuqarolar-va-tadqiqotchilar-uchun)
12. [6-bosqich: ichki va admin imkoniyatlari (A)](#12-6-bosqich-ichki-va-admin-imkoniyatlari)
13. [7-bosqich: kod sifati (Q)](#13-7-bosqich-kod-sifati)
14. [Ochiq savollar](#14-ochiq-savollar)
15. [Bajarish tartibi](#15-bajarish-tartibi)

---

## 1. Maqsad va chegaralar

**Maqsad:**
1. Ishlamayotgan yoki buzuq joylarni tuzatish (xavfsizlik va onlayn to'lovdan tashqari).
2. Platformada **bo'sh sahifa qolmasligi**: real ma'lumot bo'lmagan har bir sahifa, blok va bo'lim bazadagi sintetik namuna bilan to'ladi va bu foydalanuvchiga ochiq aytiladi.
3. Korxonalar uchun bazadagi mavjud ma'lumotga tayanadigan yangi pullik/limitli xizmatlar qo'shish.
4. Fuqarolar (OneID orqali kiruvchi jismoniy shaxslar) va tadqiqotchilar uchun alohida, bepul va sodda yechimlar qo'shish.
5. UI'ni boyitish: kabinetlar, bosh sahifa, grafiklar, qidiruv, mobil moslashuv.

**Foydalanuvchi guruhlari va ularga tegishli bo'limlar:**

| Guruh | Kiradi | Asosiy bo'limlar |
|---|---|---|
| Mehmon | — | Ochiq ma'lumotlar, hududiy profil (FQ-02), inflyatsiya kalkulyatori (FQ-03), maqolalar (FQ-07), narxlar (FQ-06) |
| Fuqaro (jismoniy shaxs) | OneID | Fuqaro kabineti (FQ-04) va 11-bo'limdagi barcha xizmatlar |
| Tadqiqotchi | Login yoki OneID | Ma'lumotlar API'si va yuklab olish (FQ-01) |
| Korxona (yuridik shaxs) | Login | Korxona kabineti va 10-bo'limdagi xizmatlar |
| Buxgalter, xodim, konsultant | Login | So'rovlarga javob, konsultatsiya jadvali (A-03) |
| Admin | Admin panel | Analitika (A-01), kontent, sintetik ma'lumot boshqaruvi |

**Ustuvorlik belgilari:**

| Belgi | Ma'nosi |
|---|---|
| **P0** | Birinchi navbatda. Foydalanuvchiga to'g'ridan-to'g'ri xato ko'rsatadi yoki boshqa vazifalarni to'sadi |
| **P1** | Muhim. Bo'sh/yolg'on ma'lumot ko'rsatadigan joylar, asosiy yangi xizmatlar |
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
8. **UI kutubxonalari:** yangi komponentlar Tailwind + mavjud MUI bilan; yangi grafiklar **Recharts** bilan (Q-03 da bitta kutubxonaga o'tish rejasi bor, yangi Chart.js/Highcharts kodi qo'shilmaydi).
9. Har vazifadagi **"Qabul mezonlari"** bajarilmaguncha vazifa tugagan hisoblanmaydi.
10. **Bo'sh sahifa bo'lmaydi.** Har bir yangi sahifa yoki blok uchun vazifada "Ma'lumot" qatori bor: real manba yoki sintetik seeder. Vazifa o'z seeder'ini (`seed_demo` ichida) qo'shmaguncha tugagan hisoblanmaydi. Sintetik yozuv UI'da S-09 dagi "Namuna ma'lumot" belgisi bilan chiqadi.
11. **Yagona istisno:** to'lov jadvallari (`Transaction`, `Order`). Ularga sintetik yozuv qo'shilmaydi (2.2), to'lovlar tarixi bo'sh bo'lsa tushuntiruvchi bo'sh holat ko'rsatiladi.
12. **Pul hisoblanadigan yangi xizmatlar** (buyurtma asosida ma'lumot, konsultatsiya) narxni faqat **ko'rsatadi** va so'rovni yaratadi. To'lov mavjud oqim bo'yicha (shartnoma + bank o'tkazmasi + admin) qoladi, onlayn to'lov qo'shilmaydi.

---

## 4. Ma'lumot qamrovi

Har bir sahifa va blok nima bilan to'lishi. "Real" — production dump'idagi ma'lumot. "Sintetik" — `seed_demo` yozadigan namuna (faqat `DEBUG=True` muhitda), UI'da belgilanadi.

### 4.1. Mavjud sahifalar

| Sahifa / blok | Real ma'lumot (tahlil bo'yicha) | Bo'sh joy | Sintetik namuna | Vazifa |
|---|---|---|---|---|
| Tashqi savdo | 3,58 mln yozuv | `trade-flows` endpoint yo'q | Kerak emas | B-04, U-09 |
| Demografiya | Sxema bor, parquet lokalda yo'q | Lokal dev'da hamma grafik | Sintetik parquet | B-08 |
| KTUT, korxonalar | 65 540 korxona | — | Kerak emas | — |
| Hisobotlar, kalendar | 108 shakl, 225 768 bog'lanish | Shakl namunasi, yo'riqnoma | Yo'riqnomalar | S-12, K-05 |
| Sanoat mahsulotlari | 53 319 | — | Kerak emas | — |
| CPI kalkulyatori | 311 yozuv | — | Kerak emas | FQ-03 |
| Statistik klassifikatorlar | 0 | Butun sahifa | Daraxt, ~250 element | S-03, U-07 |
| Byulletenlar | 11 | — | Kerak emas | — |
| Kitob do'koni | 116 kitob, 1450 pochta | — | Kerak emas | U-17 |
| FAQ, portal haqida | 10 FAQ | — | Kerak emas | — |
| Kabinet: xizmatlarim, paket | 4 paket | Demo foydalanuvchida | Demo paketlar, limit ishlatilishi | S-07 |
| Kabinet: shartnomalar | 62 | Demo foydalanuvchida | Demo shartnomalar (DIDOX/Telegram'siz) | S-07 |
| Kabinet: to'lovlar tarixi | `Transaction` 10 | Ko'pchilikda | **Yo'q** (istisno, 3.11) | U-04 |
| Kabinet: xabarnomalar | 8 | Ko'pchilikda | Har demo foydalanuvchiga 10–20 | S-06 |
| Kabinet: xizmat so'rovlari | 0 so'rov, 6 javob | Butun bo'lim | ~40 so'rov va javoblar | S-04 |
| Kabinet: faoliyat rejasi | 0 | Butun bo'lim | ~30 reja | S-05 |
| Operator chat, murojaatlar | 10 murojaat | Javoblar | 15 murojaat + javoblar | S-08, U-12 |
| Stat AI chat | FAQ + katalog | — | Kerak emas | U-11 |
| Email obuna | 0 | — | 20 obunachi | S-08 |

### 4.2. Yangi xizmatlar

| Xizmat | Real ma'lumot | Sintetik namuna | Vazifa |
|---|---|---|---|
| Autofill | Profil, `Organization`, KTUT | Demo korxonalar | K-01, S-07 |
| Tarmoq benchmarki | KTUT (OKED, hudud) | Korxona ko'rsatkichlari (tushum, xodimlar, mahsulot hajmi) | K-02, S-10 |
| Bozor tahlili hisoboti | Tashqi savdo, HS, davlatlar | Kerak emas | K-03 |
| Hamkor/raqobatchi qidiruvi | KTUT | O'lcham (xodimlar soni) uchun S-10 | K-04 |
| Hisobot topshirish yordamchisi | KTUT↔hisobot bog'lanishi | Shakl namunalari, yo'riqnomalar | K-05, S-12 |
| Buyurtma asosida ma'lumot | `ServiceRequests` moduli | Narx jadvali, namunaviy buyurtmalar | K-06, S-13 |
| Korxona pasporti | KTUT, hisobotlar, sanoat | S-10 ko'rsatkichlari | K-07 |
| Shartnoma vaqt chizig'i | 62 shartnoma | Demo shartnomalar holat tarixi | K-08, S-07 |
| Tarif taqqoslash | 4 paket, 17 narx | Kerak emas | K-09 |
| Ma'lumotlar API'si | Ochiq ko'rsatkichlar | Demo API kalit va foydalanish logi | FQ-01, S-16 |
| Hududiy profil | 14 hudud, 369 tuman, KTUT | Hududiy ko'rsatkichlar (ish haqi, ishsizlik, YaHM va h.k.) | FQ-02, S-11 |
| Inflyatsiya kalkulyatori | CPI 311 yozuv | Kerak emas | FQ-03 |
| Fuqaro kabineti | OneID profil | Demo fuqarolar, sevimlilar | FQ-04, S-07 |
| Mening maoshim | — | Ish haqi taqsimoti (hudud × tarmoq) | FQ-05, S-15 |
| Narxlar monitoringi | CPI (indeks) | Mahsulot narxlari hudud bo'yicha | FQ-06, S-15 |
| Statistika oddiy tilda | — | Maqolalar, lug'at | FQ-07, S-15 |
| So'rovnomalar | — | 3–5 so'rovnoma, javoblar | FQ-08, S-15 |
| Ismlar statistikasi | — | Ismlar yil/hudud bo'yicha | FQ-09, S-15 |
| Fuqaro savoli | Murojaat moduli | Namunaviy savol-javoblar | FQ-10, S-15 |
| Admin analitika | Hammasi real | Sintetik yozuvlar almashtirgich bilan | A-01 |
| Ko'rsatkichlarga obuna | `Subscribe` (0) | Obunalar, "yangilandi" hodisalari | A-02, S-16 |
| Onlayn konsultatsiya | — | Konsultantlar, vaqt jadvali, bandlar | A-03, S-14 |

---

## 5. Vazifalar jadvali

`OS-..` — 14-bo'limdagi ochiq savollar.

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
| S-04 | Xizmat so'rovlari va javoblari | 2 | P1 | S-07 |
| S-05 | Faoliyat rejalari (`ActivityPlans`) | 2 | P1 | S-07 |
| S-06 | Xabarnomalar | 2 | P1 | S-07 |
| S-07 | Demo foydalanuvchilar (korxona va fuqaro) va paketlar | 2 | P0 | S-02 |
| S-08 | Email obunalar, murojaatlar, reytinglar | 2 | P2 | S-07 |
| S-09 | "Namuna ma'lumot" belgisi UI'da | 2 | P0 | S-02 |
| S-10 | Korxona ko'rsatkichlari (benchmark uchun) | 2 | P1 | S-07 |
| S-11 | Hududiy ko'rsatkichlar | 2 | P1 | S-02 |
| S-12 | Hisobot shakllari namunalari va yo'riqnomalar | 2 | P1 | S-02 |
| S-13 | Buyurtma asosida ma'lumot: narxlar va namunaviy buyurtmalar | 2 | P1 | S-07 |
| S-14 | Konsultantlar va vaqt jadvali | 2 | P2 | S-07 |
| S-15 | Fuqarolar uchun kontent va ma'lumot to'plamlari | 2 | P1 | S-02 |
| S-16 | API kalitlar va ko'rsatkichlarga obunalar | 2 | P2 | S-07 |
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
| U-12 | "Operator" chat: murojaatni bazaga yozish | 3 | P2 | S-08 |
| U-13 | Hisobot kalendari: oy ko'rinishi va eslatma | 3 | P2 | B-06 |
| U-14 | Mobil moslashuv va kirish qulayligi (a11y) | 3 | P2 | U-01 |
| U-15 | Profilni to'ldirish darajasi va onboarding | 3 | P2 | K-01 |
| U-16 | Tashqi savdo: taqqoslash, saqlangan filtrlar, eksport | 3 | P2 | U-09 |
| U-17 | Kitob do'koni: qidiruv, filtr, eng yaqin pochta | 3 | P2 | F-04 |
| K-01 | Formalarni avtomatik to'ldirish (autofill) | 4 | P1 | B-02, S-07 |
| K-02 | Tarmoq benchmarki | 4 | P1 | S-10 |
| K-03 | Bozor tahlili hisoboti (HS kodi bo'yicha PDF) | 4 | P1 | B-04 |
| K-04 | Hamkor/raqobatchi qidiruvi | 4 | P1 | S-10 |
| K-05 | Hisobot topshirish yordamchisi | 4 | P1 | S-12, U-13 |
| K-06 | Buyurtma asosida statistik ma'lumot | 4 | P1 | S-13, U-05 |
| K-07 | Korxona pasporti sahifasi | 4 | P2 | K-01, S-10 |
| K-08 | Shartnoma holati vaqt chizig'i va oldindan ko'rish | 4 | P1 | B-03 |
| K-09 | Tarif taqqoslash va narx kalkulyatori | 4 | P1 | — |
| FQ-01 | Ochiq ma'lumotlar API'si va yuklab olish | 5 | P1 | S-16 |
| FQ-02 | Hududiy profil va infografika | 5 | P1 | S-11, B-08 |
| FQ-03 | Inflyatsiya kalkulyatori: maosh, ijara, kredit | 5 | P1 | — |
| FQ-04 | Fuqaro kabineti (OneID) | 5 | P1 | S-07 |
| FQ-05 | "Mening maoshim": o'rtacha bilan taqqoslash | 5 | P2 | S-15 |
| FQ-06 | Narxlar monitoringi va "savat" kalkulyatori | 5 | P2 | S-15 |
| FQ-07 | "Statistika oddiy tilda": maqolalar va lug'at | 5 | P1 | S-15 |
| FQ-08 | Aholi so'rovnomalari | 5 | P2 | S-15 |
| FQ-09 | Ismlar statistikasi | 5 | P2 | S-15 |
| FQ-10 | Fuqaro savoli: statistik ma'lumot so'rash | 5 | P2 | S-15, U-12 |
| FQ-11 | O'rnatiladigan ilova (PWA) | 5 | P2 | U-14 |
| A-01 | Admin analitika paneli | 6 | P1 | S-07 |
| A-02 | Ko'rsatkichlarga obuna, email va Telegram xabarlar | 6 | P2 | B-05, B-06, S-16 |
| A-03 | Konsultant bilan onlayn konsultatsiya | 6 | P2 | S-14 |
| Q-01 | Katta frontend fayllarini bo'lish | 7 | P2 | F-04 |
| Q-02 | `OrgInfoPage` chunk'ini kichraytirish | 7 | P2 | — |
| Q-03 | Grafik kutubxonalarini Recharts'ga keltirish | 7 | P2 | Q-01 |
| Q-04 | Dublikat va ishlatilmaydigan fayllarni tozalash | 7 | P2 | — |
| Q-05 | Backend testlari: asosiy oqimlar | 7 | P1 | F-01, S-02 |
| Q-06 | CI'ga tekshiruv bosqichlari | 7 | P1 | F-01, F-04 |
| Q-07 | Backend tozalash: `drf-yasg`, `requirements`, vaqtinchalik fayllar | 7 | P2 | — |

---

## 6. 0-bosqich: ishchi muhit va sifat poydevori

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

## 7. 1-bosqich: buzuq joylarni tuzatish

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

## 8. 2-bosqich: sintetik ma'lumot

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

### S-07 · Demo foydalanuvchilar (korxona va fuqaro) va paketlar · **P0**

**Maqsad:** UI'ni barcha rollar bo'yicha "to'la" holatda ko'rish, real foydalanuvchi akkauntiga kirmasdan.

**Fayllar:** `backend/apps/accounts/models.py`, `organizations/models.py`, `services/models.py`, `contracts/models.py`, `common/seeders/demo_users.py`

**Qadamlar:**
1. Rollar bo'yicha demo akkauntlar: `demo_yuridik_1..5` (yuridik shaxs), `demo_jismoniy_1..3` (fuqaro, OneID'siz parol bilan kiradi, `User.role` jismoniy shaxs), `demo_tadqiqotchi`, `demo_bugalter`, `demo_employee`; konsultantlar S-14 da. Username `demo_` bilan boshlanadi, email `@demo.invalid` domenida.
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

### S-09 · "Namuna ma'lumot" belgisi UI'da · **P0**

**Fayllar:** tegishli serializer'lar (S-03..S-08 modellari), `frontend/src/components/common/SampleBadge.tsx`, `SampleBanner.tsx` (yangi)

**Qadamlar:**
1. Sintetik obyekt qaytaradigan serializer'larga `is_synthetic` maydoni (S-01 `synthetic_ids` orqali, N+1 so'rovsiz).
2. Frontend'da ikki komponent: kichik "Namuna" yorlig'i (kartochka, jadval qatori, grafik sarlavhasi) va sahifa tepasidagi banner "Bu bo'limdagi ma'lumotlar namuna sifatida ko'rsatilmoqda" (butun sahifa yoki asosiy blok sintetik bo'lsa). Yorliq ustiga bosilganda qisqa tushuntirish.
3. Agregat endpoint'lar (benchmark, hududiy profil, ish haqi va h.k.) javobida `data_source: "real" | "synthetic" | "mixed"` maydoni; frontend shunga qarab belgi qo'yadi.
4. Grafik va PNG/PDF eksportlarda ham "NAMUNA" yozuvi qoladi (skrinshot real ma'lumot deb tarqalmasligi uchun).
5. `DEBUG=False` da maydon doim `false` va yorliq chiqmaydi.

**Qabul mezonlari:**
- 4-bo'limdagi jadvalda "Sintetik namuna" ustuni to'ldirilgan har bir sahifada yorliq yoki banner ko'rinadi.
- Real ma'lumotli sahifalarda (tashqi savdo, KTUT, CPI) belgi chiqmaydi.

---

### Yangi xizmatlar uchun seeder'lar (S-10..S-16)

Umumiy talab: har bir yangi model **alohida jadval** (real jadvallarga ustun qo'shilmaydi, faqat yangi jadvallar). Ko'rsatkichlar realistik oraliqda, qat'iy `random seed` bilan, hudud va tumanlar real `Region`/`District` jadvallaridan olinadi. Yangi jadvallardagi hamma qatorlar S-01 reyestriga tushadi, shuning uchun `--flush` ularni to'liq tozalaydi. Keyinchalik real manba paydo bo'lsa (OS-13), xuddi shu jadvalga import qilinadi va namuna `--flush` bilan olib tashlanadi.

### S-10 · Korxona ko'rsatkichlari · **P1**

**Kerak:** K-02 benchmark, K-04 o'lcham filtri, K-07 pasport.

**Model (yangi, `additional_services` yoki yangi `analytics` app):**
```text
EnterpriseIndicator
  stir          CharField, index   (KTUT STIR'iga mos)
  year          PositiveSmallIntegerField
  revenue       Decimal  (ming so'm)
  employees     PositiveIntegerField
  output_value  Decimal  (ishlab chiqarilgan mahsulot, ming so'm)
  export_value  Decimal  (ming USD, nullable)
  unique(stir, year)
```

**Seed:**
1. Demo korxonalar (S-07) uchun 2019–2025 yillar ko'rsatkichlari, yildan yilga ±5–20% o'zgarish bilan.
2. Benchmark guruhlari bo'sh qolmasligi uchun: KTUT'dagi **real** korxonalardan har (OKED bo'limi × hudud) guruhidan ko'pi bilan 30 tasiga sintetik ko'rsatkich. Real korxona nomi va STIR'i ishlatiladi, lekin ko'rsatkichlar o'ylab topilgan, shuning uchun UI'da ular **faqat guruh o'rtachasi** sifatida ko'rinadi, alohida begona korxona ko'rsatkichi hech qachon chiqmaydi (K-02, K-04).
3. Taqsimot: xodimlar soni log-normal (ko'p kichik, kam katta korxona), tushum xodimlar soniga proporsional + shovqin.

**Qabul mezonlari:** har demo korxonaning OKED×hudud guruhida kamida 10 ta yozuv bor; `--flush` dan keyin jadval bo'sh.

### S-11 · Hududiy ko'rsatkichlar · **P1**

**Kerak:** FQ-02 hududiy profil, FQ-05, bosh sahifa.

**Model:**
```text
RegionIndicator
  region        FK Region
  district      FK District, nullable   (tuman darajasi uchun)
  indicator     CharField (choices: avg_salary, unemployment_rate, grp_per_capita,
                births, deaths, migration_net, retail_turnover, housing_built, ...)
  year          PositiveSmallIntegerField
  period        CharField ("Y", "Q1".."Q4")
  value         Decimal
  unit          CharField
```

**Seed:** 14 hudud × 8–10 ko'rsatkich × 2018–2025, yillik va choraklik; tumanlar uchun asosiy 4 ko'rsatkich. Toshkent shahri yuqoriroq ish haqi va YaHM bilan, hududlar o'rtasida realistik farq. Agar biror ko'rsatkich real manbada bo'lsa (masalan, aholi soni demografiyada), u sintetikdan **ustun** turadi va sintetigi yaratilmaydi.

### S-12 · Hisobot shakllari namunalari va yo'riqnomalar · **P1**

**Kerak:** K-05 hisobot topshirish yordamchisi, U-13.

**Model:**
```text
ReportGuide
  report        FK ReportList (108 ta real shakl)
  summary_uz/_ru/_cry      TextField  (kim topshiradi, nima uchun)
  steps_uz/_ru/_cry        TextField  (Markdown, to'ldirish qadamlari)
  common_errors_uz/_ru/_cry TextField
  sample_file   FileField, nullable   (namunaviy to'ldirilgan shakl PDF)
  legal_basis   CharField
```

**Seed:** eng ko'p korxonaga biriktirilgan 20 ta shakl uchun yo'riqnoma (`KtutReportList` bo'yicha sanab tanlanadi), qolganlari uchun umumiy shablon matn. Namunaviy PDF `media/demo/report_samples/` ga generatsiya qilinadi (reportlab yoki oddiy HTML→PDF), sahifasida "NAMUNA" suv belgisi.

### S-13 · Buyurtma asosida ma'lumot: narxlar va namunaviy buyurtmalar · **P1**

**Kerak:** K-06.

**Model:**
```text
CustomRequestTariff
  data_type       CharField (choices: trade, enterprise, industry, demography, prices, other)
  base_bhm        Decimal   (asosiy narx, BHM'da)
  per_indicator_bhm Decimal
  per_year_bhm    Decimal
  per_region_bhm  Decimal
  urgency_multiplier Decimal (shoshilinch uchun, masalan 1.5)
```
`ServiceRequests` ga bog'langan `CustomRequestSpec` (ma'lumot turi, ko'rsatkichlar, yillar, hududlar, format, muddat, hisoblangan narx).

**Seed:** har ma'lumot turi uchun tarif; demo korxonalardan 15 ta buyurtma turli holatda, bajarilganlariga namunaviy XLSX natija fayli (`media/demo/custom_requests/`).

### S-14 · Konsultantlar va vaqt jadvali · **P2**

**Kerak:** A-03.

**Model:**
```text
Consultant      user FK, mavzular (M2M Service), bio_uz/_ru/_cry, foto, faol
ConsultationSlot consultant FK, starts_at, duration_min, format (online|ofis), is_booked
ConsultationBooking slot FK (unique), user FK, mavzu, savol, holat (band, o'tdi, bekor),
                    meeting_url, izoh, limit_use FK UserServicePackageItemUse (nullable)
```

**Seed:** 5 ta demo konsultant (`demo_konsultant_1..5`, `employee` roli), keyingi 30 kun uchun ish kunlari 10:00–17:00 oralig'ida slotlar, o'tgan va kelgusi 12 ta band qilish.

### S-15 · Fuqarolar uchun kontent va ma'lumot to'plamlari · **P1**

**Kerak:** FQ-05..FQ-10.

| Model | Maydonlar (qisqa) | Seed hajmi |
|---|---|---|
| `SalaryDistribution` | hudud, tarmoq (OKED bo'limi), yil, median, o'rtacha, p25, p75, p90 | 14 hudud × 15 tarmoq × 2020–2025 |
| `ConsumerPrice` | mahsulot (non, go'sht, guruch, yog', tuxum, kartoshka, sut, benzin, ...), hudud, sana (oylik), narx, birlik | 25 mahsulot × 14 hudud × 36 oy |
| `Article` | sarlavha/matn uz/ru/cry, mavzu, muqova, o'qish vaqti, chop etilgan sana, `is_published` | 12 maqola ("Inflyatsiya nima?", "YaIM qanday hisoblanadi?", "Ishsizlik darajasi", ...) |
| `GlossaryTerm` | atama, ta'rif uz/ru/cry, misol | 40 atama |
| `Survey`, `SurveyQuestion`, `SurveyAnswer` | so'rovnoma, savollar (bitta/ko'p tanlov, shkala), javoblar (anonim, hudud, yosh guruhi) | 4 so'rovnoma, har biriga 300–800 sintetik javob |
| `NameStat` | ism, jins, yil, hudud, soni | eng ommabop 200 ism × 2015–2025 × 14 hudud |
| `CitizenQuestion` | savol, toifa, javob, javob bergan xodim, holat | 20 savol-javob |

Ism statistikasi va so'rovnoma natijalari **to'liq sintetik**: UI'da sahifa tepasida doimiy banner "Bu bo'limdagi ma'lumotlar namuna" (S-09). Maqolalar matni Claude Code tomonidan yozilgan oddiy ta'riflar, statistik raqam o'z ichiga olmaydi (yoki "namuna raqam" deb belgilanadi).

### S-16 · API kalitlar va ko'rsatkichlarga obunalar · **P2**

**Kerak:** FQ-01, A-02.

**Model:**
```text
ApiKey          user FK, nom, prefix (8 belgi, ko'rinadi), key_hash, kunlik_limit, faol, created_at, last_used_at
ApiUsage        api_key FK, sana, endpoint, so'rovlar_soni      (kunlik agregat)
IndicatorSubscription user FK, ko'rsatkich (choices: cpi, trade, demography, region:<id>, report:<id>),
                kanal (in_app|email|telegram), faol
IndicatorUpdateEvent  ko'rsatkich, sarlavha, sana, havola
```

**Seed:** demo tadqiqotchiga 2 ta API kalit (kalitning o'zi bazada faqat hash sifatida, seed tugaganda bir marta konsolga chiqadi), so'nggi 30 kunlik foydalanish statistikasi; demo foydalanuvchilarga 3–5 obuna; 10 ta "ko'rsatkich yangilandi" hodisasi.

---

## 9. 3-bosqich: UI'ni boyitish

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

### U-15 · Profilni to'ldirish darajasi va onboarding · **P2**

**Ma'lumot:** foydalanuvchi profili; demo foydalanuvchilar S-07 da turli to'ldirilganlik darajasida.

**Qadamlar:**
1. Kabinetda "Profil 60% to'ldirilgan" ko'rsatkichi va yetishmayotgan maydonlar ro'yxati (K-01 bilan bir bosishda to'ldirish).
2. Birinchi kirishda 4–5 qadamli qisqa tanishtiruv (xizmatlar, tariflar, hisobotlarim, xabarnomalar); yopilgani profilda saqlanadi.

**Qabul mezonlari:** tanishtiruv bir marta chiqadi; foiz maydonlar to'ldirilganda yangilanadi.

---

### U-16 · Tashqi savdo: taqqoslash, saqlangan filtrlar, eksport · **P2**

**Ma'lumot:** real tashqi savdo; saqlangan filtrlar namunasi demo foydalanuvchilar uchun `seed_demo` da.

**Qadamlar:**
1. Ikki davlat yoki ikki yilni yonma-yon taqqoslash.
2. Login qilgan foydalanuvchi uchun filtrlarni saqlash ("Mening so'rovlarim"), yangi model `SavedTradeQuery` (foydalanuvchi, nom, filtr JSON).
3. Joriy jadvalni CSV/XLSX ga eksport (maksimum 10 000 qator, server'da cheklanadi).

**Qabul mezonlari:** saqlangan filtr ochilganda bir xil natija; eksport chegarasi ishlaydi.

---

### U-17 · Kitob do'koni: qidiruv, filtr, eng yaqin pochta · **P2**

**Ma'lumot:** real kitoblar va pochta nuqtalari; sevimlilar namunasi demo foydalanuvchilar uchun.

**Qadamlar:**
1. Nom, yil, tur (elektron/bosma/disk) bo'yicha qidiruv va filtr; saralash (yangi, narx).
2. "Sevimlilar" ro'yxati.
3. Pochta xaritasida "Menga eng yaqin" (geolokatsiya ruxsati bilan, 1450 nuqtadan masofa bo'yicha).
4. To'lov qismi o'zgarmaydi (2.2).

**Qabul mezonlari:** filtr holati URL'da; geolokatsiya rad etilsa xarita odatdagidek ishlaydi.

---

## 10. 4-bosqich: korxonalar uchun xizmatlar

Korxonalar uchun yangi xizmatlar bazada allaqachon bor ma'lumotga tayanadi: KTUT (65 540 korxona), korxona↔hisobot bog'lanishi (225 768), tashqi savdo (3,58 mln), sanoat (53 319). Real ma'lumot yetmaydigan joyda (korxona ko'rsatkichlari, yo'riqnomalar, tariflar) 8-bo'limdagi seeder'lar namuna yozadi.

### 10.1. Formalarni avtomatik to'ldirish (autofill): yondashuv

**Qisqa javob: ha, foydali, lekin "avtomatik to'ldirish + foydalanuvchi tasdiqlaydi" ko'rinishida.** Qiymat jim qo'yib yuborilmaydi: har bir to'ldirilgan maydon yonida manba belgisi turadi va foydalanuvchi uni o'zgartira oladi.

**Nima beradi:**
- Shartnoma rekvizitlaridagi xatolar kamayadi (korxona nomi, STIR, manzil, rahbar, bank). Shartnoma DOCX'da yuridik hujjat bo'lgani uchun bu eng katta foyda.
- Foydalanuvchi vaqti tejaladi: bir xil ma'lumot (STIR, telefon, manzil) har formada qayta yozilmaydi.
- Ma'lumot bir manbadan keladi, shuning uchun hisobotlarda bir korxona ikki xil nom bilan chiqmaydi.

**Qayerdan to'ldiriladi:**

| Manba | Qaysi maydonlar | Izoh |
|---|---|---|
| Foydalanuvchi profili (`User`) | F.I.Sh., telefon, email | Har doim mavjud |
| `Organization` (1:1) | Korxona nomi, STIR, manzil, hudud/tuman, bank rekvizitlari | Profil to'ldirilgan bo'lsa |
| KTUT jadvali (bazada) | Nomi, OKED, hudud, tuman, mulkchilik shakli | STIR bo'yicha, ichki baza, tashqi so'rov yo'q |
| Tashqi reyestr (`REGISTER_BASE_URL`) | Rahbar, manzil, ustav fondi | Ishlamasa, KTUT yoki qo'lda kiritishga qaytadi |
| OneID (jismoniy shaxs) | F.I.Sh., manzil | Faqat OneID orqali kirganda |
| Oldingi buyurtma/shartnoma | Yetkazish manzili, pochta bo'limi, bank rekvizitlari | "Oxirgi marta ishlatilgan" |

**Qaysi formalarga:** profil va korxona ma'lumoti, shartnoma yaratish, xizmat so'rovi (U-05), kitob buyurtmasi (manzil + eng yaqin pochta bo'limi), murojaat/operator chat (U-12).

**Xavflar va ularga yechim:**

| Xavf | Yechim |
|---|---|
| Reyestrdagi ma'lumot eskirgan bo'lishi mumkin, shartnomaga noto'g'ri rekvizit tushadi | Shartnoma yaratishdan oldin "Rekvizitlarni tekshiring" bosqichi; foydalanuvchi tasdiqlamaguncha shartnoma yaratilmaydi |
| Begona STIR kiritib boshqa korxona ma'lumotini ko'rish | Autofill faqat foydalanuvchining **o'z** `Organization` STIR'i bo'yicha ishlaydi; boshqa STIR uchun faqat ochiq KTUT maydonlari (nom, OKED, hudud). Rahbar PINFL'i va telefonlar hech qachon to'ldirilmaydi |
| STIR bo'yicha korxona ma'lumoti pullik xizmat (paket limiti hisoblanadi) | Autofill uchun ichki chaqiruv limitni **sarflamaydi**; u alohida endpoint, xizmat endpoint'i emas |
| Tashqi reyestr ishlamay qolsa forma qotib qoladi | 3 soniya timeout, keyin KTUT'dan yoki qo'lda; xato forma ishini to'xtatmaydi |
| Foydalanuvchi to'ldirilgan qiymatni o'zgartirgani yo'qoladi | Qo'lda o'zgartirilgan maydon "Tahrirlangan" deb belgilanadi va qayta to'ldirishda so'ralmasdan ustidan yozilmaydi (Stat Hisobot loyihasidagi prefill qoidasi bilan bir xil) |

### K-01 · Formalarni avtomatik to'ldirish · **P1**

**Ma'lumot:** real (profil, `Organization`, KTUT); demo korxonalar S-07 dan.

**Fayllar:** backend: yangi `GET /api/organizations/me/prefill/` (`organizations` app'ida); `Organization` va KTUT modellari; tashqi reyestr chaqiruvchi kod (aniqlash kerak). Frontend: yangi `frontend/src/hooks/usePrefill.ts`, `frontend/src/components/forms/PrefillBadge.tsx`; shartnoma, profil, kitob buyurtmasi, xizmat so'rovi formalari.

**Qadamlar:**
1. Endpoint `request.user` uchun maydonlar ro'yxatini qaytaradi: `{ field, value, source: "profile|organization|ktut|registry|last_order", fetched_at }`. Manbalar ustuvorligi: profil/organization (foydalanuvchi o'zi kiritgan) > reyestr > KTUT > oxirgi buyurtma.
2. Tashqi reyestrga so'rov 3 soniya timeout bilan, natija 24 soat keshlanadi. Bu chaqiruv paket limitini (`UserServicePackageItemUse`) **yozmaydi**.
3. Faqat o'z korxonasi. Boshqa STIR uchun autofill yo'q (10.1-bo'lim jadvali).
4. Frontend hook bo'sh maydonlarni to'ldiradi, foydalanuvchi o'zgartirgan maydonni belgilaydi va ustidan yozmaydi. Har to'ldirilgan maydon yonida kichik manba belgisi (tooltip: "KTUT bazasidan, 2026-10-14").
5. Shartnoma formasida yaratishdan oldin "Rekvizitlarni tasdiqlayman" belgilash katagi.
6. Kitob buyurtmasida: oxirgi yetkazish manzili va brauzer geolokatsiyasi (ruxsat berilsa) bo'yicha eng yaqin pochta bo'limi (1450 nuqtadan, U-17 bilan umumiy funksiya).
7. Profil sahifasida "Ma'lumotlarni reyestrdan yangilash" tugmasi: farqlarni ko'rsatadi (eski → yangi), foydalanuvchi qaysilarini qabul qilishni tanlaydi.

**Qabul mezonlari:**
- Demo yuridik foydalanuvchida shartnoma formasi ochilganda korxona maydonlari to'la, har birida manba belgisi.
- Tashqi reyestr o'chiq bo'lsa ham forma 3 soniyadan keyin ishlaydi (KTUT yoki bo'sh).
- Qo'lda o'zgartirilgan maydon qayta to'ldirishda saqlanib qoladi (frontend test).
- Autofill so'rovi `UserServicePackageItemUse` ga yozuv qo'shmaydi (backend test).

---

### K-02 · Tarmoq benchmarki · **P1**

**Nima:** korxona o'z ko'rsatkichlarini (tushum, xodimlar soni, mahsulot hajmi, eksport, xodim boshiga tushum) shu OKED va hududdagi korxonalar bilan solishtiradi: guruh medianasi, kvartillar va korxonaning qaysi foizilda turgani.

**Ma'lumot:** guruh — KTUT (real OKED va hudud); ko'rsatkichlar — `EnterpriseIndicator` (S-10, sintetik namuna). Korxonaning o'z ko'rsatkichlari: S-10 dan yoki foydalanuvchi qo'lda kiritadi (kiritilgani faqat o'ziga ko'rinadi).

**Fayllar:** backend: `GET /api/analytics/benchmark/?year=&level=oked_section|oked_division&geo=region|country`; frontend: kabinetda yangi "Benchmark" bo'limi (`pages/cabinet/Benchmark.tsx`).

**Qadamlar:**
1. Foydalanuvchi `Organization` STIR'i → KTUT'dan OKED va hudud. Guruh: shu OKED + shu hudud; guruhda 10 dan kam korxona bo'lsa avtomatik kengaytiriladi (OKED bo'limi → butun respublika) va UI'da qaysi daraja tanlangani aytiladi.
2. Javob faqat agregat: median, p25, p75, guruh hajmi va foydalanuvchining o'z qiymati/persentili. Begona korxonaning alohida qiymati qaytarilmaydi.
3. UI: har ko'rsatkich uchun "quti" grafik (p25–p75 oraliq, median chizig'i, korxona nuqtasi), yillar bo'yicha dinamika (korxona vs guruh medianasi), qisqa matnli xulosa ("Xodim boshiga tushum bo'yicha guruhning yuqori 30% idasiz").
4. Paket limiti: har bir benchmark hisoboti `UserServicePackageItemUse` ga yoziladi (yangi `Service` yozuvi "Tarmoq benchmarki" admin orqali qo'shiladi; qaysi paketga kirishi OS-14).
5. PDF eksport (jsPDF, lazy-load).

**Qabul mezonlari:**
- Demo korxona uchun barcha grafiklar to'la va "Namuna ma'lumot" belgisi bor.
- API javobida begona STIR yo'q (test).
- Limit tugaganda 403 va "Paketni kengaytirish" havolasi.

---

### K-03 · Bozor tahlili hisoboti · **P1**

**Nima:** tanlangan mahsulot (HS kodi) bo'yicha bir sahifalik hisobot: eksport va import hajmi yillar bo'yicha, asosiy hamkor davlatlar, o'rtacha narx dinamikasi (qiymat ÷ og'irlik), bozor konsentratsiyasi, o'sayotgan va qisqarayotgan bozorlar. PDF ko'rinishida yuklab olinadi.

**Ma'lumot:** to'liq real — tashqi savdo (3,58 mln yozuv, 7330 HS, 251 davlat, 8 yil). Sintetik kerak emas. Og'irlik bo'lmagan yozuvlar narx hisobidan chiqariladi va bu hisobotda yoziladi.

**Fayllar:** backend: `GET /api/additional-services/market-report/?hs=&years=&flow=`; PDF generatsiya (server tomonda, mavjud kutubxonalar bilan; agar yo'q bo'lsa `weasyprint` emas, frontend jsPDF bilan); frontend: `/market-report` sahifasi va tashqi savdo sahifasidan havola.

**Qadamlar:**
1. HS kodi qidiruvi (kod yoki nom bo'yicha, 3 tilda, avtomatik taklif).
2. Agregatlar bitta so'rovda hisoblanadi va 24 soat keshlanadi (B-04 dagi indekslardan foydalaniladi).
3. Hisobot bloklari: asosiy raqamlar, dinamika grafigi, top-10 davlat (eksport/import), narx dinamikasi, Herfindahl indeksi (konsentratsiya) sodda tushuntirish bilan, "Imkoniyatlar" (importi o'sayotgan, lekin O'zbekiston ulushi kichik davlatlar).
4. Ko'rish bepul (qisqa versiya), to'liq PDF paket limiti bilan (K-02 dagi kabi yangi `Service`).

**Qabul mezonlari:**
- 3 ta turli HS kodi uchun hisobot raqamlari SQL bilan qo'lda tekshirilganga teng.
- Kesh bilan qayta ochish 300 ms dan tez.

---

### K-04 · Hamkor/raqobatchi qidiruvi · **P1**

**Nima:** KTUT bo'yicha korxonalarni hudud, tuman, OKED, mulkchilik shakli va o'lcham (xodimlar soni oralig'i) bo'yicha filtrlash, ro'yxatni Excel'ga eksport qilish.

**Ma'lumot:** KTUT (real, 65 540). O'lcham filtri `EnterpriseIndicator` (S-10) dan, faqat oraliq sifatida ("1–10", "11–50", "51–250", "250+"); aniq raqam ko'rsatilmaydi. O'lchami yo'q korxonalar "Noma'lum" guruhida.

**Fayllar:** backend: `GET /api/additional-services/ktut/search/` (mavjud KTUT endpoint'ini kengaytirish yoki yangi); frontend: `/partners` sahifasi.

**Qadamlar:**
1. Filtrlar paneli, natijalar jadvali (nom, STIR, OKED, hudud/tuman, o'lcham oralig'i), sahifalash (50 tadan).
2. Xaritada ko'rinish (tuman markazi bo'yicha klaster, aniq manzil yo'q).
3. Eksport: XLSX, bir martada ko'pi bilan 1000 qator, har eksport paket limitidan yechiladi. Telefon, PINFL va rahbar ma'lumotlari eksportga **kirmaydi**.
4. "Saqlangan qidiruvlar" (U-16 dagi model bilan bir xil yondashuv).

**Qabul mezonlari:**
- Filtrlar birgalikda to'g'ri ishlaydi (test); 65 ming qatorda javob 500 ms dan tez (indekslar bilan).
- Eksport faylida shaxsiy ma'lumot ustunlari yo'q.

---

### K-05 · Hisobot topshirish yordamchisi · **P1**

**Nima:** korxona o'z STIR'i bo'yicha qaysi hisobotlarni qachon topshirishi kerakligini ko'radi; har shakl uchun namuna, to'ldirish yo'riqnomasi, keng tarqalgan xatolar va muddatdan oldin eslatma.

**Ma'lumot:** majburiy hisobotlar va muddatlar — real (`KtutReportList` 225 768, `ReportList` 108). Yo'riqnoma va namunalar — `ReportGuide` (S-12, sintetik namuna). Topshirilgan/topshirilmagan holat — `submitted-report` mavjud bo'lsa (OS-11).

**Fayllar:** backend: `GET /api/additional-services/my-reports/`, `GET /api/additional-services/report-guide/<report_id>/`; `send_report_notifications` (B-06). Frontend: kabinetda "Hisobotlarim" bo'limi, hisobot kartochkasi.

**Qadamlar:**
1. Ro'yxat: "Shu oy", "Kechikkan", "Yil bo'yicha" kalendar; har qatorda shakl nomi, muddat, qolgan kunlar (rangli).
2. Hisobot kartochkasi: kim topshiradi, qadamlar, keng tarqalgan xatolar, namunaviy PDF, huquqiy asos.
3. Eslatma sozlamasi: muddatdan N kun oldin in-app (A-02 dan keyin email/Telegram) xabarnoma; Celery Beat task'i.
4. Kabinet bosh panelida (U-02) "Yaqin muddatlar" kartochkasi.
5. STIR'i KTUT'da yo'q foydalanuvchida tushuntiruvchi bo'sh holat va "Hisobot kalendari" umumiy sahifasiga havola.

**Qabul mezonlari:**
- Demo korxonada kamida 3 ta hisobot, har birida yo'riqnoma va namuna ko'rinadi.
- Eslatma task'i belgilangan kunda xabarnoma yaratadi (test, vaqt mock).

---

### K-06 · Buyurtma asosida statistik ma'lumot · **P1**

**Nima:** korxona katalogda yo'q individual ma'lumotni buyurtma qiladi (masalan, "2020–2025 yillarda Farg'ona vodiysida to'qimachilik korxonalari soni va ishlab chiqarish hajmi"). Narx forma to'ldirilayotganda avtomatik hisoblanadi, buyurtma xodimga tushadi, natija fayli kabinetga keladi.

**Ma'lumot:** mavjud `ServiceRequests` / `ServiceDeliverables` moduli; tariflar va namunaviy buyurtmalar — S-13.

**Fayllar:** `backend/apps/services/` (so'rov API'si kengaytiriladi), yangi `CustomRequestTariff`, `CustomRequestSpec`; frontend: U-05 dagi "Yangi so'rov" formasiga "Individual ma'lumot" turi.

**Qadamlar:**
1. Forma: ma'lumot turi, ko'rsatkichlar (ko'p tanlov), yillar oralig'i, hududlar, format (XLSX/PDF), shoshilinchlik, izoh. K-01 autofill bilan korxona ma'lumotlari to'ladi.
2. Narx kalkulyatori backend'da: `base + indicators × per_indicator + years × per_year + regions × per_region`, shoshilinch bo'lsa ko'paytuvchi; BHM qiymati `SiteSettings` dan. Frontend faqat backend natijasini ko'rsatadi.
3. Buyurtma yuborilganda: so'rov `ServiceRequests` ga, spetsifikatsiya va narx `CustomRequestSpec` ga; mas'ul xodimga xabarnoma.
4. Xodim interfeysi (U-05 dagi employee qismi): narxni tasdiqlash yoki o'zgartirish, natija faylini yuklash.
5. To'lov: **onlayn to'lov qo'shilmaydi.** Narx tasdiqlangach, buyurtma mavjud oqim bo'yicha (shartnomaga qo'shimcha yoki paket limiti) davom etadi; UI'da "To'lov bo'yicha menejer bog'lanadi" matni.

**Qabul mezonlari:**
- Bir xil parametrlar bilan frontend va backend narxi bir xil (test).
- Demo korxona buyurtma yaratadi → demo xodim natija yuklaydi → korxona kabinetda faylni yuklab oladi.

---

### K-07 · Korxona pasporti sahifasi · **P1**

**Ma'lumot:** real KTUT, hisobotlar, sanoat; ko'rsatkichlar bloki S-10 (namuna).

**Nega:** korxona haqidagi ma'lumot hozir bir necha sahifaga tarqalgan (`/organizations-ktut`, `/orginfo`, `/industry`, hisobotlar). Bitta sahifa foydalanuvchi uchun ham, xodim uchun ham qulay.

**Fayllar:** frontend: yangi `/cabinet/organization` sahifasi; mavjud API'lar: KTUT, `submitted-report`, sanoat mahsulotlari, `my-reports` (K-05).

**Qadamlar:**
1. Bloklar: asosiy ma'lumot (KTUT), hisobotlar (K-05 qisqacha), ishlab chiqaradigan mahsulotlari (sanoat jadvali, agar STIR bo'yicha bog'lanish bo'lsa), tashqi savdo faoliyati (agar ma'lumotda korxona kesimi bo'lsa; bo'lmasa blok chiqmaydi), shartnomalar va paket.
2. "PDF qilib yuklab olish" (jsPDF allaqachon bor; Q-02 dagi lazy-load bilan).
3. Faqat o'z korxonasi. Boshqa korxonalar uchun mavjud ochiq sahifalar o'zgarishsiz qoladi.

**Qabul mezonlari:** demo korxona sahifasi to'la; ma'lumoti yo'q blok yashiriladi, xato chiqarmaydi.

---

### K-08 · Shartnoma holati vaqt chizig'i va oldindan ko'rish · **P1**

**Ma'lumot:** real shartnomalar; demo shartnomalar va holat tarixi S-07 dan.

**Fayllar:** `backend/apps/contracts/` (serializer, holat tarixi), frontend kabinetdagi shartnomalar bo'limi.

**Qadamlar:**
1. Har shartnoma uchun qadamlar chizig'i: yaratildi → DIDOX'ga yuborildi → mijoz imzoladi → agentlik imzoladi → to'langan summa / jami (faqat o'qish, `payed_amount` dan) → paket faol.
2. Holat tarixi saqlanmasa: `ContractStatusLog` modeli (shartnoma, holat, vaqt), DIDOX tekshiruvi (B-06) holat o'zgarganda yozadi. Mavjud real shartnomalar uchun tarix bo'sh boshlanadi, joriy holat ko'rsatiladi.
3. Yaratishdan oldin shartnoma matnini oldindan ko'rish (DOCX'dan HTML yoki PDF ko'rinish; backend'da mavjud docxtpl natijasi asosida). Bu ko'rinish bazaga shartnoma yozmaydi.
4. Holat o'zgarganda xabarnoma (B-05).

**Qabul mezonlari:**
- Demo shartnomalarda vaqt chizig'i to'g'ri bosqichda turadi.
- Oldindan ko'rish `Contract` jadvaliga yozuv qo'shmaydi, DIDOX va Telegram chaqirilmaydi (test).
- `payment/` kodida diff yo'q.

---

### K-09 · Tarif taqqoslash va narx kalkulyatori · **P1**

**Ma'lumot:** real (4 paket, 17 sektor narxi, `SiteSettings`). Sintetik kerak emas.

**Fayllar:** `/services`, `/tariff/:id` sahifalari; mavjud `services/package/`, `ServicePackagePrice`, `SiteSettings` (BHM qiymati).

**Qadamlar:**
1. 4 ta paketni yonma-yon taqqoslash jadvali: har xizmat bo'yicha limit (40 element), narx.
2. Kalkulyator: foydalanuvchi sektorini tanlaydi (login bo'lsa `Organization` dan avtomatik, K-01) → `BHM soni × BHM qiymati` va sektor narxi bo'yicha yakuniy summa.
3. "Menga qaysi paket mos?" 3 savolli yordamchi (oyiga nechta e-kitob, byulleten, korxona ma'lumoti kerak) → tavsiya.
4. "Shartnoma tuzish" tugmasi mavjud oqimga olib boradi (to'lov qismi o'zgarmaydi).

**Qabul mezonlari:** kalkulyator natijasi backend narx hisobi bilan bir xil (narx backend'dan keladi, frontend'da formula takrorlanmaydi).

---

## 11. 5-bosqich: fuqarolar va tadqiqotchilar uchun

**Yondashuv:** fuqaro uchun platforma korxona kabinetining kichraytirilgan nusxasi emas, alohida tajriba bo'lishi kerak: sodda til, telefon uchun qulay, ro'yxatdan o'tmasdan ko'p narsa ochiq, raqamlar shaxsiy hayotga bog'lab tushuntiriladi ("maoshingiz", "hududingiz", "savatingiz"). Bu bo'limdagi xizmatlar **bepul** (FQ-01 API kunlik limit bilan).

**Navigatsiya:** saytda yangi "Fuqarolar uchun" bo'limi (asosiy menyuda), ichida: Mening hududim (FQ-02), Inflyatsiya kalkulyatori (FQ-03), Mening maoshim (FQ-05), Narxlar (FQ-06), Statistika oddiy tilda (FQ-07), So'rovnomalar (FQ-08), Ismlar (FQ-09), Savol bering (FQ-10). OneID bilan kirgan foydalanuvchi bosh sahifasi — fuqaro kabineti (FQ-04).

### FQ-01 · Ochiq ma'lumotlar API'si va yuklab olish · **P1**

**Nima:** tadqiqotchi, jurnalist va dasturchilar ochiq ko'rsatkichlarni API kalit bilan oladi; har ochiq jadvalni CSV/XLSX qilib yuklab olish mumkin.

**Ma'lumot:** real ochiq ma'lumotlar (CPI, tashqi savdo agregatlari, hisobot shakllari ro'yxati, klassifikatorlar, demografiya) va S-11 hududiy ko'rsatkichlar. API kalitlar va foydalanish — S-16.

**Fayllar:** yangi `backend/apps/open_api/` (URL `api/open/v1/`), `ApiKey`, `ApiUsage`; frontend: `/developers` sahifasi (hujjat, kalit olish), kabinetda "API kalitlarim".

**Qadamlar:**
1. Faqat o'qish endpoint'lari: `cpi/`, `trade/summary/`, `regions/indicators/`, `classifications/`, `reports/forms/`, `demographics/` (agregat). Sahifalash, `?format=json|csv`.
2. Kalit: login yoki OneID foydalanuvchisi kabinetda yaratadi; bazada faqat hash, kalit bir marta ko'rsatiladi; bekor qilish mumkin.
3. Kunlik limit kalit bo'yicha (default 1000 so'rov), `ApiUsage` ga kunlik hisob, limitdan oshganda 429. Bu xizmat kvotasi; saytning umumiy rate limiti (tahlil 10.7, 2.1-bo'lim) baribir keyinga qoldirilgan.
4. `drf-spectacular` bilan alohida ochiq hujjat sahifasi (`/api/open/docs/`), har endpoint uchun misol so'rov.
5. Saytdagi ochiq jadvallar yonida "Yuklab olish (CSV/XLSX)" tugmasi; fayl tagida manba va sana; namuna ma'lumot bo'lsa fayl nomi `_NAMUNA` bilan tugaydi va birinchi qatorda izoh.
6. Kabinetda kalit bo'yicha 30 kunlik foydalanish grafigi.

**Qabul mezonlari:**
- Kalitsiz so'rov 401, noto'g'ri kalit 401, limitdan oshganda 429 (testlar).
- CSV Excel'da to'g'ri ochiladi (UTF-8 BOM).
- Demo tadqiqotchi kabinetida kalitlar va foydalanish grafigi ko'rinadi.

---

### FQ-02 · Hududiy profil va infografika · **P1**

**Nima:** har viloyat va tuman uchun bir sahifalik "pasport": aholi, tug'ilish/o'lim, o'rtacha ish haqi, ishsizlik, korxonalar soni va asosiy tarmoqlar, sanoat, tashqi savdo. Xarita orqali tanlanadi, rasm yoki PDF sifatida ulashiladi.

**Ma'lumot:** real — `Region`/`District`, KTUT (korxonalar soni va tarmoqlar hudud bo'yicha), demografiya (B-08). Sintetik — `RegionIndicator` (S-11) yetishmayotgan ko'rsatkichlar uchun. Har ko'rsatkich yonida manba belgisi (real/namuna).

**Fayllar:** backend: `GET /api/common/regions/<id>/profile/`, `GET /api/common/districts/<id>/profile/`; frontend: `/regions` (xarita) va `/regions/:id` sahifalari.

**Qadamlar:**
1. Xarita (Leaflet): 14 hudud, ko'rsatkich tanlanadi (aholi, ish haqi, korxonalar soni), rang shkalasi va legenda.
2. Profil sahifasi: 6–8 ta `StatCard`, respublika o'rtachasi bilan taqqoslash (yuqori/past belgisi), dinamika grafiklari, tumanlar reytingi jadvali.
3. "Infografika" ko'rinishi: bitta vertikal karta (telefon ekraniga mos), PNG sifatida yuklab olish (html2canvas allaqachon bor) va havola ulashish.
4. Ikki hududni yonma-yon taqqoslash rejimi.

**Qabul mezonlari:**
- 14 hudud profili to'liq ochiladi; ma'lumot manbasi har ko'rsatkichda ko'rinadi.
- PNG eksport mobil'da ishlaydi.

---

### FQ-03 · Inflyatsiya kalkulyatori: maosh, ijara, kredit · **P1**

**Nima:** mavjud CPI kalkulyatori kengaytiriladi. Uch tayyor stsenariy: "Maoshim 2020-yilda X edi, bugungi narxlarda qancha?", "Ijara haqi inflyatsiyadan tez o'sdimi?", "Kredit/omonat foizi inflyatsiyani qoplaydimi?" (real foiz stavkasi). Natija grafik va sodda matn bilan, havola orqali ulashiladi.

**Ma'lumot:** real CPI (311 yozuv). Sintetik kerak emas.

**Fayllar:** `/cpi-calculator` sahifasi (kengaytiriladi), mavjud `price-index` API. Hozir CPI login talab qiladi: kalkulyator uchun **agregat indekslar** endpoint'i mehmonga ochiladi (OS-15; default: ochiladi, chunki bu ommaviy statistika).

**Qadamlar:**
1. Stsenariy tanlash tablari; har birida 2–3 maydon.
2. Hisob: summa × (CPI_oxiri / CPI_boshi); kredit uchun real stavka = (1+nominal)/(1+inflyatsiya) − 1.
3. Grafik: summa xarid qobiliyatining oyma-oy o'zgarishi.
4. Parametrlar URL'da; "Natijani ulashish" tugmasi.
5. Natija ostida "Inflyatsiya nima?" maqolasiga havola (FQ-07).

**Qabul mezonlari:** 3 ta stsenariy natijasi qo'lda hisoblangan bilan bir xil (frontend unit test); URL bilan ochilganda bir xil natija.

---

### FQ-04 · Fuqaro kabineti (OneID) · **P1**

**Nima:** OneID orqali kirgan jismoniy shaxs uchun alohida bosh panel. Korxona bo'limlari (shartnoma, paket, benchmark) ko'rinmaydi.

**Ma'lumot:** OneID profili; demo fuqarolar `demo_jismoniy_1..3` (S-07), sevimlilar va obunalar (S-16).

**Fayllar:** `frontend/src/pages/cabinet/` (rolga qarab boshqa layout), backend: `GET /api/accounts/me/citizen-summary/`, yangi `FavoriteIndicator` modeli (foydalanuvchi, ko'rsatkich turi, parametrlar JSON).

**Qadamlar:**
1. Bloklar: "Mening hududim" (OneID manzilidan yoki tanlangan hudud, FQ-02 qisqacha), sevimli ko'rsatkichlar (har biri mini grafik bilan), obunalarim (A-02), kitob buyurtmalarim, savollarim (FQ-10), so'rovnomalar (FQ-08).
2. Har ochiq ko'rsatkich sahifasida "Sevimlilarga qo'shish" yulduzchasi.
3. Rol bo'yicha marshrut himoyasi: fuqaro korxona sahifasiga kirsa tushuntirish va "Korxona sifatida kirish" havolasi.

**Qabul mezonlari:**
- Demo fuqaro bilan kirilganda faqat fuqaro bloklari, hammasi to'la.
- Korxona foydalanuvchisi kabineti o'zgarmagan.

---

### FQ-05 · "Mening maoshim": o'rtacha bilan taqqoslash · **P2**

**Nima:** foydalanuvchi hudud, tarmoq va maoshini kiritadi, natijada o'z hududi va tarmog'idagi taqsimotda qayerda turganini ko'radi (median, kvartillar), boshqa hududlar bilan taqqoslash va yillar bo'yicha o'sish.

**Ma'lumot:** `SalaryDistribution` (S-15, to'liq sintetik namuna; real manba bo'lsa OS-13). Kiritilgan maosh **saqlanmaydi** (hisob brauzerda, faqat agregat backend'dan olinadi).

**Qadamlar:** forma → taqsimot grafigi (p25/median/p75/p90 va foydalanuvchi chizig'i) → "Sizning maoshingiz hududingizdagi xodimlarning taxminan X% idan yuqori" → hududlar xaritasi. Sahifa tepasida "Namuna ma'lumot" banneri.

**Qabul mezonlari:** network so'rovlarida foydalanuvchi kiritgan maosh yuborilmaydi; persentil hisobi unit test bilan.

---

### FQ-06 · Narxlar monitoringi va "savat" kalkulyatori · **P2**

**Nima:** asosiy iste'mol mahsulotlari narxlari hudud bo'yicha va oyma-oy; foydalanuvchi o'z "savati"ni tuzadi (non 10 dona, go'sht 3 kg ...) va uning narxi qanday o'zgarganini, qaysi hududda arzonroq ekanini ko'radi.

**Ma'lumot:** `ConsumerPrice` (S-15, sintetik namuna); umumiy indeks real CPI bilan yonma-yon ko'rsatiladi.

**Qadamlar:** mahsulot kartochkalari (oxirgi narx, oylik o'zgarish, mini grafik) → hududlar taqqoslash xaritasi → savat konstruktori (brauzerda saqlanadi, `localStorage`, try/catch bilan) → savat narxi dinamikasi grafigi.

**Qabul mezonlari:** savat sahifa yangilanganda saqlanadi; ma'lumot bo'lmagan hudud uchun "Ma'lumot yo'q", xato emas.

---

### FQ-07 · "Statistika oddiy tilda": maqolalar va lug'at · **P1**

**Nima:** asosiy statistik tushunchalarni oddiy tilda tushuntiruvchi qisqa maqolalar (rasm/grafik bilan) va atamalar lug'ati. Saytdagi murakkab atamalar ustiga sichqoncha olib borilganda (yoki bosilganda) lug'atdan qisqa ta'rif chiqadi.

**Ma'lumot:** `Article`, `GlossaryTerm` (S-15). Admin'da tahrirlanadi (mavjud CKEditor bilan; CKEditor almashtirish keyinga qoldirilgan).

**Fayllar:** backend: `common` ga `Article`, `GlossaryTerm` va ochiq API; frontend: `/learn`, `/learn/:slug`, `/glossary`, `<Term>` komponenti.

**Qadamlar:** maqolalar ro'yxati (mavzu bo'yicha filtr, o'qish vaqti) → maqola sahifasi (bog'liq ko'rsatkichlarga havolalar) → lug'at (alifbo bo'yicha, qidiruv) → `<Term id="inflation">` komponentini CPI, demografiya va hududiy profil sahifalarida 5–10 joyda ishlatish.

**Qabul mezonlari:** 3 tilda ochiladi; `<Term>` mobil'da bosish bilan ishlaydi.

---

### FQ-08 · Aholi so'rovnomalari · **P2**

**Nima:** fuqarolar qisqa so'rovnomalarda qatnashadi (masalan, "Uy xo'jaligi xarajatlari", "Raqamli xizmatlardan foydalanish"); yopilgan so'rovnoma natijalari hamma uchun ochiq grafiklarda.

**Ma'lumot:** `Survey`, `SurveyQuestion`, `SurveyAnswer` (S-15, javoblar sintetik). Haqiqiy foydalanuvchi javoblari ham shu jadvalga yoziladi, natijalarda "namuna javoblar"dan alohida hisoblanadi.

**Qadamlar:** faol so'rovnomalar ro'yxati → qadamma-qadam forma (progress bar) → bitta foydalanuvchi bitta javob (OneID bo'yicha) → natijalar sahifasi (ustunli grafiklar, hudud va yosh guruhi bo'yicha filtr). Admin'da so'rovnoma yaratish.

**Qabul mezonlari:** takroriy javob bloklanadi; natijalar sahifasida "N ta namuna javob, M ta haqiqiy javob" ko'rinadi.

---

### FQ-09 · Ismlar statistikasi · **P2**

**Nima:** "Ismingiz qanchalik ommabop?" — ism kiritiladi, yillar bo'yicha yangi tug'ilganlarga qo'yilishi grafigi, hududlar xaritasi, yilning eng ommabop 10 ta ismi. Fuqarolar orasida tez tarqaladigan, saytga trafik olib keladigan xizmat.

**Ma'lumot:** `NameStat` (S-15, to'liq sintetik namuna; real ma'lumot FHDYo organlaridan kelishi mumkin, OS-16).

**Qadamlar:** ism qidiruvi (lotin/kirill moslashtirish) → grafik va xarita → top-10 jadvali yil va jins bo'yicha → ulashish kartochkasi (PNG). "Namuna ma'lumot" banneri.

**Qabul mezonlari:** "Muhammad" va "Мухаммад" bir xil natija beradi; 3 harfdan kam so'rovga natija yo'q.

---

### FQ-10 · Fuqaro savoli: statistik ma'lumot so'rash · **P2**

**Nima:** fuqaro bepul savol yuboradi ("Tumanimizda nechta maktab bor?"), xodim javob beradi; javob berilgan savollar (fuqaro ruxsati bilan) ochiq "Savol-javob" bazasiga qo'shiladi va Stat AI (U-11) ularni ham qidiradi.

**Ma'lumot:** `CitizenQuestion` (S-15). Operator chat (U-12) bilan bir xil xodim interfeysi.

**Qadamlar:** forma (toifa, savol, hudud) → kabinetda holat → xodim javobi → "Ochiq bazaga qo'shishga roziman" belgisi → `/answers` ochiq sahifasi.

**Qabul mezonlari:** demo fuqaro savoli → demo xodim javobi → ochiq sahifada ko'rinadi (rozilik bo'lsa).

---

### FQ-11 · O'rnatiladigan ilova (PWA) · **P2**

**Nima:** sayt telefon bosh ekraniga o'rnatiladi; oxirgi ko'rilgan ochiq sahifalar internetsiz ham ochiladi.

**Qadamlar:** `vite-plugin-pwa`, manifest (nom, ikonkalar, rang), statik fayllar va ochiq GET so'rovlari uchun "stale-while-revalidate" kesh; login talab qiladigan so'rovlar keshlanmaydi.

**Qabul mezonlari:** Lighthouse PWA tekshiruvi o'tadi; kabinet ma'lumotlari keshda saqlanmaydi.

---

## 12. 6-bosqich: ichki va admin imkoniyatlari

### A-01 · Admin analitika paneli · **P1**

**Ma'lumot:** real jadvallar; sintetik yozuvlar almashtirgich bilan qo'shiladi (default o'chiq).

**Nega:** hozir admin'da faqat `ContractStats` (hududlar kesimida) bor. Rahbariyatga bitta ko'rinishdagi panel kerak.

**Fayllar:** `backend/templates/admin/` (Jazzmin bosh sahifasi yoki alohida admin view), `common` yoki yangi `analytics` moduli.

**Qadamlar:**
1. Ko'rsatkichlar: yangi foydalanuvchilar (oy bo'yicha), shartnomalar soni va summasi hudud/oy bo'yicha, faol paketlar, xizmatlar bo'yicha limit ishlatilishi, kitob buyurtmalari, xizmat so'rovlari holati va o'rtacha javob vaqti, reytinglar.
2. Voronka: ro'yxatdan o'tdi → tarif ko'rdi → shartnoma yaratdi → imzoladi → paket faol.
3. Davr filtri, Excel eksport.
4. Sintetik yozuvlar (S-01) hisobdan chiqarilishi uchun "Demo ma'lumotni ko'rsatish" almashtirgichi, default o'chiq.

**Qabul mezonlari:** raqamlar SQL bilan qo'lda sanalganiga teng (2–3 ko'rsatkich uchun test); sahifa 2 soniyadan tez ochiladi.

---

### A-02 · Ko'rsatkichlarga obuna, email va Telegram xabarlar · **P2**

**Nima:** foydalanuvchi (korxona yoki fuqaro) tanlangan ko'rsatkichga obuna bo'ladi (CPI, tashqi savdo, hududi, hisobot muddati); ko'rsatkich yangilanganda in-app, email yoki Telegram orqali xabar oladi. Oylik avtomatik qisqa hisobot (sevimli ko'rsatkichlar bo'yicha email).

**Ma'lumot:** `IndicatorSubscription`, `IndicatorUpdateEvent` (S-16); mavjud `Subscribe` (email obuna) shu tizimga birlashtiriladi.

**Fayllar:** `notifications`, Telegram bot (`runbot`), `accounts` (Telegram chat ID), Celery task'lar (B-06).

**Qadamlar:**
1. Har ko'rsatkich sahifasida "Obuna bo'lish" tugmasi, kanal tanlash.
2. Telegram'ni ulash: kabinetda bir martalik kod → botga `/start <kod>` → chat ID bog'lanadi.
3. Admin ma'lumot import qilganda yoki yangi davr qo'shganda `IndicatorUpdateEvent` yaratiladi (admin action yoki import signal), Celery task obunachilarga yuboradi.
4. Oylik digest: har oyning 1-kuni, sevimli ko'rsatkichlar bo'yicha qisqa email (HTML shablon).
5. Token/email sozlanmagan muhitda kanal jim o'tkazib yuboriladi, in-app ishlayveradi.

**Qabul mezonlari:** demo foydalanuvchida obunalar ro'yxati va kelgan xabarlar ko'rinadi; token yo'q lokal muhitda hech narsa yiqilmaydi; obunadan chiqish bir bosishda.

---

### A-03 · Konsultant bilan onlayn konsultatsiya · **P2**

**Nima:** korxona (paket limiti bilan) yoki fuqaro (agar egasi ruxsat bersa, OS-17) statistik konsultant bilan vaqt band qiladi; onlayn uchrashuv havolasi kabinetga keladi; konsultatsiyadan keyin baholash.

**Ma'lumot:** `Consultant`, `ConsultationSlot`, `ConsultationBooking` (S-14).

**Fayllar:** yangi `backend/apps/consultations/` (yoki `services` ichida), frontend: `/consultation` (konsultantlar va kalendar), kabinetda "Konsultatsiyalarim", konsultant uchun "Mening jadvalim".

**Qadamlar:**
1. Konsultantlar ro'yxati (mavzular, bio) → bo'sh slotlar kalendari → band qilish formasi (mavzu, savol; K-01 autofill).
2. Band qilish tranzaksiyada: slot `is_booked`, paket bo'lsa `UserServicePackageItemUse` yoziladi; limit yo'q bo'lsa 403 va tarif havolasi. Onlayn to'lov qo'shilmaydi.
3. Konsultant jadvali: slot qo'shish (takrorlanuvchi), band qilishlar, uchrashuv havolasini kiritish, izoh.
4. Eslatmalar: 24 soat va 1 soat oldin (Celery Beat).
5. Bekor qilish 24 soatgacha bepul (limit qaytariladi), keyin limit qaytmaydi (qoida OS-17).
6. Konsultatsiyadan keyin 1–5 baho (mavjud reyting modeli bilan).

**Qabul mezonlari:** ikki foydalanuvchi bir slotni bir vaqtda band qila olmaydi (test, `select_for_update`); demo korxona band qiladi, demo konsultant jadvalida ko'radi.

---

## 13. 7-bosqich: kod sifati

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

## 14. Ochiq savollar

Bu savollar egasi tomonidan hal qilinadi. Javob kelguncha vazifalar ko'rsatilgan **default** bilan bajariladi.

| ID | Savol | Default | Vazifa |
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
| OS-10 | Autofill tashqi reyestrga murojaat qilsinmi yoki faqat ichki KTUT bazasidanmi? | Avval ichki KTUT, reyestr faqat profilni yangilashda | K-01 |
| OS-11 | "Hisobotlarim" uchun topshirilgan/topshirilmagan holatini qayerdan olamiz (`submitted-report` yetarlimi)? | `submitted-report` bo'lsa ko'rsatiladi, bo'lmasa faqat muddatlar | K-05 |
| OS-12 | Admin analitika Jazzmin ichida bo'lsinmi yoki alohida sahifa? | Jazzmin bosh sahifasidagi blok + alohida admin view | A-01 |
| OS-13 | Korxona ko'rsatkichlari, hududiy ko'rsatkichlar, ish haqi va narxlar uchun real manba (qo'mitaning ichki bazasi, ochiq portal) bormi? | Bo'lmaguncha sintetik namuna (S-10, S-11, S-15) | K-02, FQ-02, FQ-05, FQ-06 |
| OS-14 | Yangi pullik xizmatlar (benchmark, bozor tahlili PDF, hamkor eksporti, konsultatsiya) qaysi paketlarga va qancha limit bilan kiradi? | Admin'da yangi `Service` sifatida qo'shiladi, paketlarga 0 limit bilan; admin o'zi belgilaydi | K-02, K-03, K-04, A-03 |
| OS-15 | CPI agregat indekslari mehmonga ochilsinmi? | Ha, faqat kalkulyator uchun agregat | FQ-03 |
| OS-16 | Ismlar statistikasi uchun real ma'lumot olish mumkinmi? | Bo'lmaguncha namuna, banner bilan | FQ-09 |
| OS-17 | Fuqarolar konsultatsiya band qila oladimi va bekor qilish qoidasi qanday? | Faqat korxonalar; 24 soatgacha bepul bekor qilish | A-03 |

---

## 15. Bajarish tartibi

Tavsiya etilgan ketma-ketlik. Har qadam alohida PR'lar to'plami; bir qatordagi vazifalarni parallel bajarish mumkin. Har qadam oxirida `seed_demo` qayta ishga tushirilib, 4-bo'limdagi jadval bo'yicha sahifalar ko'zdan kechiriladi.

| Qadam | Vazifalar | Natija |
|---|---|---|
| 1 | F-01, B-01, B-02, B-03 | Testlar ishlaydi, foydalanuvchi chiqarib yuborilmaydi, 500'lar yo'q |
| 2 | F-04, S-01, S-02, S-09, U-01 | Sintetik ma'lumot karkasi, "Namuna" belgisi, UI poydevori |
| 3 | S-07, S-03..S-06, S-08, B-05 | Mavjud bo'sh sahifalar to'ldi |
| 4 | U-02..U-08, B-04, U-09, B-06 | Kabinet, bosh sahifa, tashqi savdo oqimlari, Celery Beat |
| 5 | K-01, K-09, K-08, S-12, K-05 | Autofill, tarif kalkulyatori, shartnoma holati, hisobot yordamchisi |
| 6 | S-10, K-02, K-03, K-04, S-13, K-06, K-07 | Korxonalar uchun yangi xizmatlar |
| 7 | S-11, S-15, FQ-04, FQ-02, FQ-03, FQ-07 | Fuqarolar bo'limi: kabinet, hududim, kalkulyator, maqolalar |
| 8 | S-16, FQ-01, FQ-05, FQ-06, FQ-08, FQ-09, FQ-10 | API va qolgan fuqaro xizmatlari |
| 9 | A-01, A-02, S-14, A-03 | Admin analitika, obunalar, konsultatsiya |
| 10 | Q-05, Q-06 | Testlar va CI himoyasi |
| 11 | B-07, B-08, U-10..U-17, FQ-11 | Qo'shimcha imkoniyatlar |
| 12 | F-02, F-03, F-05, Q-01..Q-04, Q-07 | Tozalash va optimallashtirish |

### Claude Code'ga topshiriq berish namunalari

Bitta vazifa:
```text
mystat repo'sida ISH_REJASI.md dagi K-02 vazifasini bajar.
3-bo'limdagi umumiy qoidalarga va 2-bo'limdagi tegilmaydigan joylarga amal qil.
Vazifaning "Ma'lumot" qatoridagi seeder bo'lmasa, avval uni qo'sh.
Qabul mezonlarini tekshirib, natijasini PR tavsifida yoz.
```

Butun qadam:
```text
mystat repo'sida ISH_REJASI.md 15-bo'limdagi 6-qadamni bajar:
har vazifa uchun alohida branch va PR, jadvaldagi tartibda.
Har PR'dan keyin seed_demo ni qayta ishga tushirib, 4-bo'limdagi tegishli sahifalar
ma'lumot bilan ochilishini tekshir.
```
