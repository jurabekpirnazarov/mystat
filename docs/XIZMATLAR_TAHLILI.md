# my.stat.uz — xizmatlar tahlili: kim, qachon va qanday shartda foydalanadi

> **Sana:** 2026-10-19
> **Manba:** kodning o'zi. Frontend marshrutlari (`frontend/src/App.tsx`), backend endpoint'larining ruxsatlari (`permission_classes`, 252 ta `/api/` yo'li avtomatik yig'ildi), paket limitlari (`apps/services/limits.py`, lokal bazadagi `ServicePackage`/`PackageServiceItem`), kabinet bo'limlari (`PersonalCabinet.tsx`). Har sahifa mehmon sifatida Playwright bilan ochib tekshirildi.
> **Eslatma:** narxlar, limitlar va paket tarkibi admin'da o'zgaradi. Bu yerdagi raqamlar lokal bazadagi holat.

---

## 1. Qisqacha xulosa

| Toifa | Nechta xizmat | Misollar |
|---|---|---|
| **Kirishsiz (mehmon)** ishlaydi | ~30 | Demografiya, tashqi savdo, hududlar xaritasi va prognoz, hisobot kalendari, hamkor qidiruvi, korxona bali (umumiy), fuqarolar bo'limi, bozor tahlili (qisqa) |
| **Ro'yxatdan o'tgach** (bepul) ochiladi | ~15 | ISN kalkulyatori, statistik tasniflagichlar, sanoat ishlab chiqaruvchilari, so'rovnomada qatnashish, savol yuborish, obunalar, API kalitlari |
| **Pullik** | 4 xil to'lov | (1) tarif paketi (1–4-tarif, faqat yuridik shaxs), (2) nashr/kitob buyurtmasi (Click), (3) individual ma'lumot so'rovi (narx hisoblanadi), (4) scoring kreditlari (korxona profili) |
| **Faqat yuridik shaxs** | 10 | Shartnoma va paket, xizmat so'rovlari, hisobotlarim, tarmoq benchmarki, konsultatsiya band qilish, korxona pasporti |
| **Faqat jismoniy shaxs** | 2 | "Savollarim", fuqaro bosh paneli |

**Asosiy qoida:** barcha ommaviy sahifalar mehmonga ochiladi (faqat `/cabinet` darhol `/login` ga yo'naltiradi). Cheklov sahifa ochilganda emas, **amal bajarilganda** ishlaydi. Mehmon login talab qiladigan amalni bossa, backend `401` qaytaradi va frontend uni `/login?next=<joriy sahifa>` ga yuboradi; kirgandan keyin (parol yoki OneID) o'sha sahifaga qaytadi (`utils/loginRedirect.ts`).

**Paket limiti qiymatlari:** `limit > 0` — shuncha marta, `0` — ruxsat yo'q, `-1` — cheksiz (`PackageServiceItem.is_exhausted`).

---

## 2. Foydalanuvchi turlari

| Tur | Kim | Qanday kiradi | Nima beradi |
|---|---|---|---|
| **Mehmon** | Ro'yxatdan o'tmagan har kim | — | Ommaviy statistika va ma'lumotlarni ko'rish |
| **Jismoniy shaxs** (`user_type=individual`) | Fuqaro, talaba, tadqiqotchi, jurnalist | Login/parol, OneID | Bepul shaxsiy imkoniyatlar: obuna, sevimlilar, savol, so'rovnoma, API kaliti, kitob buyurtmasi |
| **Yuridik shaxs** (`user_type=legal_entity` + `Organization` STIR bilan) | Korxona, tashkilot | OneID yoki ERI (elektron raqamli imzo) | Jismoniy shaxs imkoniyatlari + shartnoma, tarif paketi, korxona xizmatlari |
| **Xodimlar** (`role`: employee, manager, admin, bugalter) | Statistika qo'mitasi xodimlari | Login + admin uchun 2FA | So'rovlarni bajarish, navbatlar, buxgalteriya, admin panel |

Kabinet menyusi foydalanuvchi turiga qarab o'zgaradi (`PersonalCabinet.tsx`, `audience`): `all`, `legal`, `citizen`.

---

## 3. Belgilar

| Belgi | Ma'nosi |
|---|---|
| 🟢 | Kirishsiz ishlaydi |
| 🔵 | Ro'yxatdan o'tish kerak, bepul |
| 🟡 | Pullik yoki paket limitidan yechiladi |
| 🏢 | Faqat yuridik shaxs |
| 👤 | Faqat jismoniy shaxs |

---

## 4. Xizmatlar katalogi

### 4.1. Statistika va ma'lumotlar

| Xizmat | Sahifa | Mehmon | Ro'yxatdan o'tgan | Pullik | Kim uchun | Izoh |
|---|---|---|---|---|---|---|
| Statistika bosh sahifasi, ko'rsatkichlar | `/`, `/statistics` | 🟢 | 🟢 | — | Hamma | |
| Demografik ma'lumotlar | `/demographics` | 🟢 | 🟢 | — | Hamma | Katalogda "tekin". Eksport (CSV) ham ochiq |
| Tashqi savdo statistikasi | `/ex-trade`, `/trade-flows` | 🟢 | 🟢 | — | Hamma | Katalogda "tekin" (6-bo'lim, 2-band) |
| Hududlar xaritasi, salohiyat indeksi, prognoz, "nima bo'lsa" | `/regions`, `/regions/:id` | 🟢 | 🟢 | — | Hamma | |
| ISN (inflyatsiya) kalkulyatori | `/cpi-calculator` | sahifa 🟢, hisob 🔵 | 🔵 | — | Hamma | Katalogda "tekin" + "Kirish kerak" belgisi (`requires_login`) |
| Statistik tasniflagichlar | `/statistical-classifications` | sahifa 🟢, ma'lumot 🔵 | 🔵 | — | Hamma | API login talab qiladi; katalogda "Kirish kerak" |
| Statistik byulletenlar | kabinet → xizmatlarim | — | 🟡 🏢 | Paket | Yuridik | Yuklab olish paket limitidan (1/3/5/7 ta) |
| Statistik to'plamlar | kabinet → xizmatlarim | — | 🟡 🏢 | Paket | Yuridik | Paket limitidan (1/3/5 ta, 4-tarifda "barchasi" — `limit=-1`, cheksiz) |
| Tahliliy ma'lumot tayyorlash | kabinet → xizmatlarim | — | 🟡 🏢 | Paket | Yuridik | 2–4-tariflarda (10 → 50 ko'rsatkich) |
| Individual ma'lumot so'rovi | kabinet → "Individual ma'lumot" | — | 🟡 🏢 | Narx hisoblanadi | Yuridik | Narx: (asos + ko'rsatkichlar + yillar + hududlar) × shoshilinchlik, BHMda. Onlayn to'lov yo'q: xodim tasdiqlaydi, keyin shartnoma/bank o'tkazmasi |
| Ochiq API (`/api/open/v1/...`) | `/developers` | hujjat 🟢 | 🔵 kalit | — | Hamma | Kalit kabinetda olinadi; kunlik limit bor |

### 4.2. Korxonalar va biznes xizmatlari

| Xizmat | Sahifa | Mehmon | Ro'yxatdan o'tgan | Pullik | Kim uchun | Izoh |
|---|---|---|---|---|---|---|
| Korxona va tashkilotlar ro'yxati | `/organizations`, `/organizations-register` | 🟢 | 🟢 | — | Hamma | Katalogda "tekin" |
| Korxona to'g'risida ma'lumot (KTYaDR, STIR bo'yicha) | `/orginfo` | sahifa 🟢 | 🟡 | Paket | Hamma (limit — paketda) | Katalogda "Tarif bo'yicha", paketda "10/100/1000/10000 ta korxona" limiti |
| KTUT bo'yicha korxona (STIR) | `/organizations-ktut` | 🟢 umumiy ball | 🔵 batafsil | — | Hamma | `ktut/<stir>` API login talab qiladi |
| Sanoat mahsulotlari ishlab chiqaruvchilari | `/industry` | sahifa 🟢, ma'lumot 🔵 | 🔵 | — | Hamma | Katalogda "tekin" + "Kirish kerak" |
| Hamkor va raqobatchilarni qidirish | `/partners` | 🟢 qidiruv, xarita | 🟡 eksport | Paket | Qidiruv — hamma; eksport — paketi borlar | XLSX eksport paket limitidan (1/3/10/30) |
| Bozor tahlili | `/market-report` | 🟢 qisqa versiya | 🟡 to'liq | Paket | Hamma | To'liq versiya paket limitidan (1/3/10/30), kuniga bir HS uchun bir marta |
| Korxona bali (umumiy ball, sinf) | `/partners`, `/company/:stir` | 🟢 | 🟢 | — | Hamma | Demo muhitda "Namuna" belgisi bilan |
| Korxona profili: "Ball nimaga asoslangan" | `/company/:stir` | — | 🟡 | 1 kredit, 30 kun | Scoring tarifi borlar | O'z korxonasi — bepul |
| Korxona profili: "Chuqur tahlil" | `/company/:stir` | — | 🟡 | 3 kredit (2, agar birinchisi ochilgan bo'lsa) | Scoring 60+ | PDF bepul |
| Tarmoq benchmarki | kabinet → benchmark | — | 🟡 🏢 | Paket | Yuridik | Paket limitidan (1/3/10/30) |
| Korxona pasporti (o'z korxonasi) | `/cabinet/organization` | — | 🔵 🏢 | — | Yuridik | O'z bali, tavsiyalar, dinamika — bepul |
| Hisobotlar kalendari va ro'yxati | `/report-calendar`, `/reports` | 🟢 | 🟢 | — | Hamma | STIR bo'yicha majburiy hisobotlar ochiq |
| Hisobot muddati eslatmasi | `/report-calendar` | — | 🔵 | — | Hamma | `remind` API login talab qiladi |
| "Hisobotlarim" | kabinet | — | 🔵 🏢 | — | Yuridik | |
| Konsultatsiya: katalog va bo'sh vaqtlar | `/consultation` | 🟢 | 🟢 | — | Hamma | |
| Konsultatsiya band qilish | `/consultation` | — | 🟡 🏢 | Paket | **Faqat yuridik** (backend tekshiradi) | Paket limitidan (1/2/5/10) |
| Telefon orqali tushuntirish, eslatmalar, seminarlar | — (paket tarkibida) | — | 🟡 🏢 | Paket | Yuridik | Qo'lda bajariladigan xizmatlar, kodda limit yo'q |

### 4.3. Nashrlar

| Xizmat | Sahifa | Mehmon | Ro'yxatdan o'tgan | Pullik | Izoh |
|---|---|---|---|---|---|
| Nashrlar katalogi | `/books` | sahifa 🟢 | 🔵 ro'yxat | — | `books-list` API login talab qiladi |
| Nashrga elektron buyurtma | `/books`, `/book-order` | — | 🟡 | **Har buyurtma uchun** (Click) | Jismoniy va yuridik shaxs. Pochta bo'limini xaritadan tanlash |
| Elektron kitoblarni yuklab olish | kabinet | — | 🔵 | — | |

### 4.4. Fuqarolar uchun

| Xizmat | Sahifa | Mehmon | Ro'yxatdan o'tgan | Izoh |
|---|---|---|---|---|
| Fuqarolar markazi | `/citizens` | 🟢 | 🟢 | |
| Mening ish haqim (solishtirish) | `/my-salary` | 🟢 | 🟢 | |
| Narxlar va iste'mol savati | `/prices` | 🟢 | 🟢 | |
| Statistika oddiy tilda (maqolalar), lug'at | `/learn`, `/glossary` | 🟢 | 🟢 | |
| Ismlar statistikasi | `/names` | 🟢 | 🟢 | |
| So'rovnomalar: ro'yxat va natijalar | `/surveys` | 🟢 | 🟢 | |
| So'rovnomada qatnashish | `/surveys/:slug` | — | 🔵 | |
| Savol yuborish, "Savollarim" | kabinet | — | 🔵 👤 | Kabinetda faqat jismoniy shaxsga ko'rinadi |
| Ochiq javoblar | `/answers` | 🟢 | 🟢 | |
| Sevimli ko'rsatkichlar | kabinet | — | 🔵 | |

### 4.5. Umumiy va yordamchi

| Xizmat | Mehmon | Ro'yxatdan o'tgan | Izoh |
|---|---|---|---|
| Global qidiruv (Ctrl+K), AI yordamchi | 🟢 | 🟢 | |
| Savol-javob, reglamentlar, portal haqida, aloqa | 🟢 | 🟢 | |
| Qo'llab-quvvatlash murojaati | 🟢 | 🟢 | |
| Tariflarni taqqoslash, "menga qaysi paket mos?" | 🟢 | 🟢 | Narx sektor bo'yicha (BHM) |
| Ko'rsatkichlarga obuna ("yangilandi" xabarnomasi) | — | 🔵 | |
| Xabarnomalar | — | 🔵 | |
| API kalitlari | — | 🔵 | |
| Kredit hamyoni (`/cabinet/credits`) | — | 🔵 | Tarifi borlarda balans |

---

## 5. Pullik xizmatlar batafsil

### 5.1. Tarif paketlari (1–4-tarif)

- **Kim:** faqat **yuridik shaxs**. Shartnoma uchun korxona va STIR shart (`ContractCreate` → `user.organization`).
- **Qanday:** `/tariffs` → tarif tanlash → shartnoma (DIDOX'da imzolanadi) → bank o'tkazmasi → admin paketni faollashtiradi. Paket 365 kun amal qiladi.
- **Narx:** BHM soni korxonaning sektori (OKED) bo'yicha (`ServicePackagePrice`). Onlayn to'lov (Click) paket uchun ishlatilmaydi.
- **Limitlar** (kodda yechiladiganlari):

| Paket elementi (`slug`) | 1-tarif | 2-tarif | 3-tarif | 4-tarif | Qayerda yechiladi |
|---|---|---|---|---|---|
| Korxona to'g'risida ma'lumot (`orginfo`) | 10 | 100 | 1 000 | 10 000 | `/orginfo` |
| Statistik to'plamlar (`cabinet/statistical-prints`) | 1 | 3 | 5 | "barchasi" (`limit=-1`) | Kabinet |
| Statistik byulletenlar (`cabinet/statistic-byulleten`) | 1 | 3 | 5 | 7 | Kabinet, yuklab olish |
| Tahliliy ma'lumot (`cabinet/statistical-analysis`) | — | 10 ko'rs., 1 yil | 30 ko'rs., 5 yil | 50 ko'rs., 10 yil | So'rov orqali (xodim) |
| Tarmoq benchmarki (`benchmark`) | 1 | 3 | 10 | 30 | `analytics/benchmark` |
| Bozor tahlili, to'liq (`market-report`) | 1 | 3 | 10 | 30 | `market-report` |
| Hamkorlar eksporti (`partners-export`) | 1 | 3 | 10 | 30 | `partners/export` |
| Konsultatsiya (`consultation`) | 1 | 2 | 5 | 10 | `consultations/book` |

Paketdagi qolgan elementlar (telefon orqali tushuntirish, SMS/ovozli eslatma, axborotnomalar, Zoom va joylardagi seminarlar) kodda limit bilan bog'lanmagan. Ularni xodimlar qo'lda bajaradi.

### 5.2. Nashr buyurtmasi

- Jismoniy va yuridik shaxs uchun, har buyurtma alohida to'lanadi.
- Click orqali onlayn to'lov (`orders/OrderCreate`, `ClickPrepare`/`ClickComplete`), pochta orqali yetkazish.

### 5.3. Individual ma'lumot so'rovi

- Yuridik shaxs kabinetida. Narx backend'da hisoblanadi: ko'rsatkichlar, yillar, hududlar soni va shoshilinchlik bo'yicha, BHMda.
- Onlayn to'lov yo'q: xodim narxni tasdiqlaydi, keyin shartnoma yoki bank o'tkazmasi.

### 5.4. Scoring kreditlari (korxona profili)

- Umumiy ball hamma joyda bepul. "Ball nimaga asoslangan" — 1 kredit, "Chuqur tahlil" — 3 kredit (Scoring 60+). Ochilgan bo'lim 30 kun ochiq turadi.
- Tariflar: Scoring 50/60/90 va korporativ (oylik kredit). Hozircha tarif va kredit admin'da qo'lda beriladi (KORXONA_SCORING.md KR-41 hali bajarilmagan).
- O'z korxonasi va qo'mita xodimlari uchun bepul.

---

## 6. Topilgan nomuvofiqliklar va xavflar

Hammasi 2026-10-19 da yopildi. Katalog belgilari migratsiyada amaldagi holatga moslandi (`services.0046`); biznes qarori boshqacha bo'lsa, admin'da (`Servis` → "Tekin", "Kirish talab qilinadi", "Paketda") o'zgartiriladi.

| # | Muammo | Qayerda | Holat | Nima qilindi |
|---|---|---|---|---|
| 1 | 🔴 Savdo ma'lumotini yuklash endpoint'i login talab qilmasdi | `POST /api/additional-services/trade-data/upload` | ✅ | `IsAdminUser` (faqat `is_staff`). Test: `common.tests.StaffOnlyEndpointsTests` |
| 2 | Katalogda "pullik", amalda bepul | `ex-trade`, `organizations` | ✅ | `is_free=True`; `organizations` paketga bog'lanishi olib tashlandi (paketlarda bu element limitsiz va bo'sh edi) |
| 3 | Katalogda "pullik", amalda faqat login kerak | `industry` | ✅ | `is_free=True`, `requires_login=True` |
| 4 | Katalogda "tekin", amalda paket limiti | `orginfo` | ✅ | `is_free=False`, `requires_login=True`; katalogda "Tarif bo'yicha" |
| 5 | Katalogda "tekin", lekin login kerak | ISN kalkulyatori, tasniflagichlar, nashrlar | ✅ | Yangi `Service.requires_login` maydoni; katalog kartochkalarida (`AllServices`, bosh sahifadagi `Interactive`) "Kirish kerak" belgisi |
| 6 | `limit = 0` "cheksiz" emas, "ruxsat yo'q" deb o'qilardi | `consume()`, byulleten, kitob, xizmat so'rovi | ✅ | `-1` = cheksiz, `PackageServiceItem.is_exhausted()` hamma joyda; "Barcha …" nomli `limit=0` elementlar migratsiyada `-1` ga o'tkazildi (`services.0045`). Kabinet paneli "N / cheksiz" ko'rsatadi |
| 7 | 401 da sahifadan `/login` ga uloqtirilib, kontekst yo'qolardi | `api/baseUrl.ts`, `api/request.ts`, `App.tsx` | ✅ | `/login?next=...`; login (parol va OneID) dan keyin o'sha sahifaga qaytish. "Kiring" havolalari (hamkorlar, bozor tahlili, konsultatsiya, so'rovnoma, sevimlilar, obuna, API, profil) ham `next` bilan |
| 8 | Ochiq servislar: `submitted-report`, `didox/password`, `didox/company-login`, `month-user-stat` | `AllowAny` | ✅ | `didox/*`: kodga yozilgan GoodSign login/paroli bor edi — `IsAdminUser` va `.env` (`GOODSIGN_TAX_ID`, `GOODSIGN_PASSWORD`, `GOODSIGN_COMPANY_ID`) ga ko'chirildi. ⚠ Parol git tarixida qolgan — almashtirish kerak. `month-user-stat`: bosh sahifa grafigi, faqat oylik agregat — ochiq qoldi, noto'g'ri `year` endi 500 bermaydi. `submitted-report`: statik namuna, shaxsiy ma'lumot yo'q — ochiq qoldi |

**Ochiq qolganlar (boshqa hujjatda):** scoring tariflarini paketdan berish va sotib olish — KORXONA_SCORING.md KR-41..KR-44 (hozircha admin'da qo'lda).

---|---|---|---|---|
| 1 | 🔴 **Savdo ma'lumotini yuklash endpoint'i login talab qilmaydi** | `POST /api/additional-services/trade-data/upload` (`TradeDataAPIView`, `permission_classes` yo'q → standart `AllowAny`) | Istalgan odam Excel yuklab, tashqi savdo statistikasini qayta ishlashga (`process_file`) yubora oladi va serverdagi `datas/` papkasiga fayl yozadi | Zudlik bilan `IsAdminUser` (yoki xodim roli) qo'yish |
| 2 | Katalogda "pullik", amalda bepul | Tashqi savdo (`ex-trade`), Korxona va tashkilotlar (`organizations`) | Foydalanuvchi "pullik" yozuvini ko'radi, lekin hech narsa to'lamaydi; yoki aksincha, pullik bo'lishi kerak bo'lgan xizmat tekinga berilyapti | Biznes qarori: katalogdagi belgini tuzatish yoki paket limitiga ulash |
| 3 | Katalogda "pullik", amalda faqat login kerak | Sanoat ishlab chiqaruvchilari (`industry`) | 2-band bilan bir xil | 2-band bilan bir xil |
| 4 | Katalogda "tekin", amalda login va paket limiti bor | Korxona to'g'risida ma'lumot (`orginfo`) | Tekin deb kelgan foydalanuvchi limitga uriladi | Katalogni tuzatish |
| 5 | Katalogda "tekin", lekin login kerak | ISN kalkulyatori, statistik tasniflagichlar | Mehmon tugmani bossa kutilmaganda login sahifasiga tushadi | Oldindan "Kirish kerak" deb ko'rsatish yoki API'ni ochiq qilish |
| 6 | `limit = 0` "cheksiz" emas, "ruxsat yo'q" deb o'qiladi | `consume()` va byulleten yuklab olish (`limit <= 0` → rad etiladi) | 4-tarifdagi "Barcha to'plamlar" (limit 0) amalda ishlamasligi mumkin | Cheksiz uchun alohida qiymat (masalan `null` yoki `-1`) va kodda shu holatni qo'llash |
| 7 | Mehmon login talab qiladigan tugmani bossa, sahifadan to'satdan `/login` ga uloqtiriladi | `api/baseUrl.ts` (401 → `clearLocalStorageAndRedirect`) | Noqulay tajriba, kontekst yo'qoladi | Tugma yonida "Kirish kerak" belgisi va login'dan keyin qaytish |
| 8 | Bir nechta servis ochiq: `submitted-report`, `didox/password`, `didox/company-login`, `month-user-stat` | `AllowAny` | Kirish oqimi uchun kerak bo'lishi mumkin (DIDOX), lekin tekshirib chiqish kerak | Har biri bo'yicha xavfsizlik ko'rigi |

---

## 7. Foydalanuvchi turi bo'yicha jamlanma

### Mehmon (ro'yxatdan o'tmagan)
Ko'radi: statistika, demografiya, tashqi savdo, hududlar xaritasi va prognoz, hisobot kalendari, korxonalar ro'yxati, hamkor qidiruvi (eksportsiz), korxona umumiy bali va profilning bepul qismi, bozor tahlili (qisqa), fuqarolar bo'limi (ish haqi, narxlar, maqolalar, ismlar, so'rovnoma natijalari), tariflar, konsultatsiya katalogi, ochiq API hujjati, qidiruv va AI yordamchi.

### Jismoniy shaxs
Mehmon imkoniyatlari, ustiga: ISN kalkulyatori, statistik tasniflagichlar, sanoat ishlab chiqaruvchilari, so'rovnomada qatnashish, savol yuborish ("Savollarim"), sevimli ko'rsatkichlar, obunalar va xabarnomalar, API kalitlari, nashr buyurtmasi (pullik, Click), elektron kitoblar, kredit hamyoni (tarif berilsa).
Ko'rmaydi: shartnoma, paket, benchmark, konsultatsiya band qilish, hisobotlarim, individual ma'lumot.

### Yuridik shaxs
Jismoniy shaxs imkoniyatlari ("Savollarim"dan tashqari), ustiga: shartnoma va tarif paketi (1–4), "Mening xizmatlarim" (byulleten, to'plamlar, tahliliy ma'lumot), xizmat so'rovlari, individual ma'lumot so'rovi, faoliyat rejasi, "Hisobotlarim", tarmoq benchmarki, konsultatsiya band qilish, korxona pasporti va o'z korxona bali (tavsiyalar bilan), hamkorlar eksporti, bozor tahlilining to'liq versiyasi, korxona profilini kredit bilan ochish.

### Xodimlar
So'rovlarga javob berish (`service-response`), navbatlar, faoliyat rejalari, konsultatsiya jadvali, nashrlarni pochtaga biriktirish (bugalter), admin panel (2FA bilan), analitika paneli.
