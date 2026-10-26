# Hisobot topshiruvchi korxonalar: tuzatishlar va yangi funksiyalar (Claude Code uchun topshiriq)

> **Sana:** 2026-10-26
> **Asos:** `ISH_REJASI.md` (K-05, S-12, U-13, B-06, OS-11), `HIBRID_DIZAYN.md` (Z-16, 7.1, OS-H-11, OS-H-14), `MEHNAT_SOLIQ_DIZAYN.md` (5.1–5.3), `IHAMKOR_MUQOBIL.md` (IH-03, IH-04), `KORXONA_SCORING.md` (`s_reports`), `JAHON_TAJRIBASI_TAKLIFLAR.md` (JT-04, JT-09), `stat-hisobot/ANALIZ.md`, hamda yuklangan `CLAUDE_HISOBOT.md`, `FEATURELAR_ESKI_VA_HOZIR.md`, `XIZMATLAR_TAHLILI.md`, `PROEKT_TAHLIL.md`.
> **Muhim:** bu hujjat kodni ko'rmasdan, faqat yuqoridagi hujjatlar asosida yozilgan. "Hujjatda shunday yozilgan" degan joylarni Claude Code avval koddan tekshiradi; band allaqachon tuzatilgan bo'lsa, PR'da "bor edi" deb belgilaydi.
> **Raqamlash:** **HT-xx** = hisobot topshirish oqimidagi tuzatish, **YF-xx** = rejada yo'q yangi funksiya. Ustuvorlik **P0/P1/P2/P3**, hajm **S/M/L**. `ISH_REJASI.md` 2–3-bo'limlaridagi umumiy qoidalar (xavfsizlik, `backend/apps/payment/` ga tegilmaydi, sintetik ma'lumot faqat "Namuna" belgisi bilan) shu yerda ham amal qiladi.

---

## 1. Qisqa xulosa

1. **Hisobot topshiruvchilar uchun asosiy muammo bitta: muddatlar noto'g'ri.** `ReportList.deadline` 2025-yilda qotib qolgan (`CLAUDE_HISOBOT` 5.6). Hisobot kalendari, "Hisobotlarim", bosh paneldagi `AlertStrip`, `TopBar` dagi son, eslatmalar, kontragent kartasidagi "statistik intizom" va korxona balidagi `s_reports` hammasi shu maydonga tayanadi. Demak hozir ularning hammasi eskirgan yoki noto'g'ri sanani ko'rsatadi. Bu birinchi tuzatiladi (HT-01).
2. **Ikkinchi muammo: "davr" tushunchasi yo'q.** `KtutReportList` faqat "korxona ↔ shakl" bog'lanishi. Choraklik shakl yiliga 4 marta topshiriladi, lekin ro'yxatda bitta qator. "Hisobotlarim" jadvalidagi "Davr" va "Holat" ustunlari (`MEHNAT_SOLIQ_DIZAYN` 5.3) shu sabab to'g'ri to'ldirilmaydi (HT-02, HT-03).
3. **Xavfsizlik:** `submitted-report` endpoint'i `AllowAny` va faqat `stir_number` so'raydi (`XIZMATLAR_TAHLILI` 8-band). Istalgan odam istalgan korxonaning topshirish tarixini ko'ra oladi (HT-04, P0).
4. **Qolganlari tartibga solish:** yo'riqnomalar (S-12) production'da yo'q, eslatmalar Celery Beat serverda ishga tushmaguncha ishlamaydi, bir xil ma'lumot 5–6 ta sahifada takrorlanadi, buxgalter bir nechta korxonani bitta joyda ko'ra olmaydi.
5. **Yangi funksiyalardan eng foydalilari:** buxgalter uchun "Mijozlarim" paneli (YF-01), kalendarga doimiy obuna havolasi (YF-02), "Statistik hisobotlar bo'yicha qarzi yo'qligi" ma'lumotnomasi QR bilan (YF-03), Telegram orqali muddat eslatmasi (YF-04). Ular mavjud ma'lumot va mavjud kod (JT-04 imzosi, B-06, A-02) ustiga quriladi.

---

## 2. Hisobot topshiruvchilar uchun hozir nima bor

| Joy | Nima qiladi | Ma'lumot | Holat (hujjatlar bo'yicha) |
|---|---|---|---|
| `/report-calendar` | Hamma shakllar muddati, kalendar ko'rinishi | `ReportList` (108 shakl) | ✅ ishlaydi, ⚠️ muddat 2025 da qotgan, "Рѕylik" kodlash xatosi (`DIZAYN_HOZIRGI_HOLAT` 6-qator) |
| `/reports` | STIR bo'yicha majburiy shakllar, mehmonga ochiq | `KtutReportList` (225 768) | ✅ |
| `/reglaments` | Reglament matnlari | admin | ✅ |
| `/stat-codes`, `/stat-codes/verify` | Statistik kodlar ma'lumotnomasi PDF va uni tekshirish (JT-04) | `Ktut`, `KtutReportList`, `django.core.signing` | ✅, QR rasm yo'q |
| Kabinet → "Hisobotlarim" | O'z STIR'i bo'yicha shakllar | `KtutReportList` | ✅ ro'yxat, ⚠️ davr va holat yo'q |
| Eslatma ("Meni ogohlantir") | Muddatdan oldin in-app xabar | `remind` API (login), `send_report_notifications` | ⚠️ Celery Beat production'da hali ko'tarilmagan (`CLAUDE_HISOBOT` 5.3) |
| Yo'riqnoma va namuna (S-12) | Har shakl uchun qadamlar, xatolar, namuna PDF | `ReportGuide` | ⚠️ faqat demo'da namuna, production'da yo'q |
| `/check` → "Statistik intizom" (IH-03) | O'z vaqtida topshirilgan ulush | `KtutReportList` + `submitted-report` | ⚠️ muddatga bog'liq (HT-01) |
| Korxona bali `s_reports` | Intizom ko'rsatkichi | xuddi shu | ⚠️ xuddi shu |
| **stat-hisobot (alohida demo)** | Shaklni to'ldirish, tekshirish, imzo, kvitansiya, inspektor | o'z bazasi, sintetik | `ANALIZ.md` bo'yicha reja; kod holati bu hujjatda tekshirilmagan |

Qaror (OS-H-14 / OS-MS-07): my.stat.uz kabinetida **shakl to'ldirilmaydi**, faqat muddat va holat ko'rsatiladi. Shakl to'ldirish rasmiy tizimda (eStat 4.0) yoki demo sifatida stat-hisobot'da. Quyidagi takliflar shu qarorni o'zgartirmaydi.

---

## 3. Hisobot topshirish oqimidagi tuzatishlar (HT)

### Jamlanma

| ID | Nima | Ustuvorlik | Hajm | Dizayn hujjatiga bog'lanish |
|---|---|---|---|---|
| HT-01 | Muddatni har davr uchun qoidadan hisoblash | **P0** | M | H4 (kabinet jadvallari), H12 (`/report-calendar`) |
| HT-02 | "Majburiyat × davr" qatorlari | **P0** | M | MS 5.3 "Hisobotlarim" ustunlari |
| HT-03 | Yagona holat lug'ati va manbasi | P1 | S | MS 3.x holat belgilari, ANALIZ 7.3 |
| HT-04 | `submitted-report` ni yopish | **P0** | S | ISH_REJASI 2.1 (xavfsizlik) |
| HT-05 | STIR KTUT'da yo'q yoki ro'yxat eskirgan holatlar | P1 | S | `EmptyState` (U-01) |
| HT-06 | Eslatmalarni haqiqatan ishlatish | P1 | S | B-06, H11 |
| HT-07 | "Qayerda va qanday topshiriladi" bloki | P1 | S | MS 5.3 tafsilot sahifasi |
| HT-08 | Yo'riqnomalarning minimal real versiyasi (S-12) | P1 | M | `InfoSection` (HIBRID 4.x) |
| HT-09 | Takroriy sahifalarni bitta "Hisobot topshiruvchilarga" markaziga yig'ish | P2 | M | HIBRID 7.1 menyu guruhi, Z-16 |
| HT-10 | Muddat dam olish yoki bayram kuniga tushsa | P2 | S | HT-01 ichida |
| HT-11 | Intizom ko'rsatkichini muddat tuzalguncha yashirish | P1 | S | IH-03, KR-32 |
| HT-12 | Mayda frontend xatolari | P2 | S | Q-04, F-04 |
| HT-13 | stat-hisobot ↔ my.stat.uz moslashuvi | P2 | M | ANALIZ 7.2, 7.3 |

### HT-01 · Muddatni har davr uchun hisoblash · **P0 · M**

**Muammo:** `ReportList.deadline` bitta qat'iy sana va 2025 da qotgan. Har yili admin qo'lda yangilashi kerak, qilinmagan.

**Yechim:**
1. `ReportList` ga `periodicity` (`M`, `Q`, `H`, `Y`, mavjud maydon bo'lsa o'sha) va `deadline_rule` maydoni. Sintaksis stat-hisobot bilan bir xil (ANALIZ V2): `<P>+<N>d`, masalan `Q+25d` = chorak tugagandan keyin 25 kun.
2. Data migratsiya: mavjud `deadline` sanasidan qoidani chiqarish (masalan 2025-04-25 choraklik shakl uchun → `Q+25d`). Chiqarib bo'lmaganlari admin ro'yxatida "Qoida kiritilmagan" filtri bilan chiqadi, eski `deadline` ular uchun zaxira sifatida qoladi.
3. Bitta servis funksiya `deadlines_for(report, year)` → davrlar va sanalar. Kalendar, "Hisobotlarim", eslatma, `/check`, scoring hammasi shu funksiyadan foydalanadi; boshqa joyda `deadline` to'g'ridan-to'g'ri o'qilmaydi.
4. Admin'da bitta shakl uchun qo'lda istisno sana (`ReportDeadlineOverride(report, period, date, reason)`), chunki rasmiy muddat ba'zan buyruq bilan o'zgaradi.

**Qabul:** 2026 va 2027 yil uchun kalendar to'g'ri sanalarni ko'rsatadi; `deadline` maydoniga to'g'ridan-to'g'ri murojaat qolmagan (grep); har periodicity uchun test.

### HT-02 · "Majburiyat × davr" qatorlari · **P0 · M**

**Muammo:** "Hisobotlarim" jadvalidagi "Davr" ustuni uchun ma'lumot yo'q. Choraklik shakl bitta qator bo'lib chiqadi.

**Yechim:** yangi jadval shart emas. "Hisobotlarim" API'si `KtutReportList` × HT-01 davrlari bo'yicha qatorlarni hisoblab beradi: joriy yil + o'tgan yil, kelajakdagi davrlar faqat keyingi bittasi. Har qator: shakl kodi va nomi, davr (`2026 Q3`), muddat, qolgan kun, holat (HT-03), topshirilgan sana (bo'lsa).

**Qabul:** choraklik shakli bor demo korxonada 2026 yil uchun 4 qator; filtrlar (holat, shakl turi, yil/davr) MS 5.3 dagidek ishlaydi; kabinet bosh panelidagi "Yaqin hisobotlar" (5 qator) shu API'dan.

### HT-03 · Yagona holat lug'ati · **P1 · S**

my.stat.uz va stat-hisobot bir xil holat nomlarini ishlatsin (ANALIZ 7.3 dan):

| Kod | Matn | Rang (`--ds-*`) | my.stat.uz'da qachon |
|---|---|---|---|
| `not_started` | Topshirilmagan | kulrang | topshirish haqida ma'lumot yo'q, muddat hali bor |
| `due_soon` | Muddati yaqin | warning | 0–5 kun qoldi (MS 5.2 `AlertStrip` bilan bir xil chegara) |
| `overdue` | Muddati o'tgan | danger | muddat o'tdi, topshirilgani ma'lum emas |
| `submitted` | Topshirilgan | info | `submitted-report` da bor |
| `accepted` / `rejected` | Qabul qilingan / Rad etilgan | success / danger | faqat manba bu holatni bersa |
| `unknown` | Ma'lumot yo'q | kulrang, kursiv | holat manbasi ulanmagan (OS-11) |

`due_soon` va `overdue` holat emas, hisoblanadigan belgi (ANALIZ bilan bir xil). OS-11 hal bo'lmaguncha my.stat.uz `submitted` dan nariga o'tmaydi va **"Topshirilmagan" deb yozmaydi**: manba bo'lmasa `unknown`. Aks holda korxona topshirgan hisobotini "o'tgan" deb ko'rib, qo'ng'iroq qiladi.

### HT-04 · `submitted-report` ni yopish · **P0 · S**

**Muammo:** endpoint `AllowAny`, `stir_number` bilan istalgan korxonaning topshirish tarixini beradi.

**Yechim:**
1. Endpoint faqat kirgan foydalanuvchiga va faqat unga bog'langan tashkilot STIR'i uchun (`Organization` bog'lanishi orqali). Begona STIR → 404.
2. `/check` va korxona bali uchun alohida ichki servis: faqat **agregat** (12 oylik ulush, kechikishlar soni), shakl va sana ro'yxatisiz. IH-03 da "ulush bepul, tarix kredit bilan" deyilgan; tarix ham faqat oylar bo'yicha son sifatida.
3. Agar DIDOX yoki boshqa ichki oqim bu endpoint'ni ochiq chaqirsa (XIZMATLAR_TAHLILI shunday taxmin qiladi), u servis tokeni yoki IP ro'yxati bilan qoladi.

**Qabul:** mehmon va boshqa korxona foydalanuvchisi uchun 401/404 testlari; `/check` avvalgidek ulushni ko'rsatadi.

### HT-05 · STIR KTUT'da yo'q yoki ro'yxat eskirgan · **P1 · S**

`Ktut` to'liq registr emas, ~65 ming hisobot topshiruvchi (`CLAUDE_HISOBOT` 4.4a). IH-03 qabul mezonida "kalendar yo'q korxonada «Majburiy hisobot yo'q»" yozuvi bor. Bu **noto'g'ri xulosa** bo'lishi mumkin: yangi korxona yoki ro'yxatga hali tushmagan korxona hisobot topshirishi shart bo'lishi mumkin.

**Yechim:**
- Matn: "Bizning ro'yxatda sizning STIR bo'yicha majburiy hisobot topilmadi. Ro'yxat holati: <sana>. Yangi ro'yxatdan o'tgan bo'lsangiz yoki shubha bo'lsa, hududiy statistika bo'limiga murojaat qiling" + "Murojaat yuborish" (mavjud murojaat oqimi).
- `KtutReportList` oxirgi yangilangan sana "Hisobotlarim", `/reports` va `/stat-codes` PDF'ida ko'rinadi. Sana bazada bo'lmasa, admin import buyrug'i yozadi (aniqlash kerak).
- IH-03 dagi "Majburiy hisobot yo'q" yozuvi shu matnga almashtiriladi.

### HT-06 · Eslatmalarni haqiqatan ishlatish · **P1 · S**

1. Production'ga Celery worker va beat chiqarish (`CLAUDE_HISOBOT` 5.3 dagi qadam). Busiz eslatma tugmasi foydalanuvchini aldaydi.
2. Yuridik shaxs uchun eslatma **standart yoqilgan** (muddatdan 5 va 1 kun oldin), sozlamalarda o'chiriladi. Hozir har shakl uchun alohida "Meni ogohlantir" bosish kerak, 10 ta shakli bor korxona buni qilmaydi.
3. Eslatma HT-01 dagi hisoblangan sanadan; muddat o'tgan kuni bitta "muddati o'tdi" xabari (`unknown` holatda yumshoq matn bilan).
4. Kanallar: in-app hozir; email va Telegram A-02 tayyor bo'lganda (YF-04).

**Qabul:** vaqt mock qilingan testda standart sozlamali korxonaga 2 ta xabar yaratiladi; o'chirilganiga yaratilmaydi; bitta xabar ikki marta yaratilmaydi.

### HT-07 · "Qayerda va qanday topshiriladi" bloki · **P1 · S**

Kabinetda shakl to'ldirilmagani uchun (OS-H-14) foydalanuvchi "Topshirish" tugmasini qidiradi va topmaydi. "Hisobotlarim" tafsilot sahifasida va `/reports` qatorida:
- "Bu hisobot <tizim nomi> orqali topshiriladi" + tashqi havola (yangi oynada, `rel="noopener"`). Tizim nomi va URL admin sozlamasida, kodda qattiq yozilmaydi.
- Qisqa qadamlar (HT-08 dagi yo'riqnomadan), nol hisobot bo'lsa nima qilish.
- Demo muhitda havola stat-hisobot demo'siga (HT-13).

### HT-08 · Yo'riqnomalarning minimal real versiyasi · **P1 · M**

S-12 da `ReportGuide` modeli bor, lekin production'da bo'sh. Sintetik matn production'ga chiqmaydi. Minimal real variant, sohalar bo'yicha statistika bo'limi yozmaguncha:
- Har shakl uchun **avtomatik** to'ldiriladigan qism: kim topshiradi (shu shaklga biriktirilgan korxonalar soni va eng ko'p OKED bo'limlari, `KtutReportList` dan), davriylik, muddat qoidasi, reglament havolasi (`/reglaments`).
- Qo'lda yoziladigan qism (qadamlar, keng tarqalgan xatolar, namuna PDF): eng ko'p korxonaga biriktirilgan 20 ta shakldan boshlab, statistika bo'limi tasdiqlagandan keyin. Tasdiqlanmagan matn ko'rsatilmaydi.

### HT-09 · Bitta "Hisobot topshiruvchilarga" markazi · **P2 · M**

Hozir bir xil ma'lumot 6 joyda: `/report-calendar`, `/reports`, `/reglaments`, `/stat-codes`, kabinet "Hisobotlarim", `/cabinet/reports/calendar`. HIBRID 7.1 da menyu guruhi bor, lekin kirish sahifasi yo'q.

**Taklif:** `/reporting` sahifasi (`InfoPage` qolipi, H12):
1. Yuqorida STIR maydoni → shu sahifada shu korxonaning kalendari (mehmonga ham, chunki `/reports` allaqachon ochiq). Kirgan yuridik shaxsga avtomatik o'z STIR'i va "Hisobotlarim"ga havola.
2. Pastda plitkalar: Hisobot kalendari · Shakllar · Reglamentlar · Statistik kodlar ma'lumotnomasi · Qarzi yo'qligi ma'lumotnomasi (YF-03) · Yo'riqnomalar · Savol berish.
3. Eski route'lar saqlanadi, faqat menyu bandi markazga olib boradi.

### HT-10 · Dam olish va bayram kunlari · **P2 · S**

Demo uchun ANALIZ V2 dam olish kunlarini hisobga olmaydi. Real my.stat.uz'da muddat shanba, yakshanba yoki bayramga tushsa nima bo'lishi qonun bilan belgilanadi (odatda keyingi ish kuniga ko'chadi, tasdiqlash kerak, 6-bo'lim). Admin'da `Holiday(date, name)` jadvali va `deadlines_for` da bitta bayroq (`shift_to_workday`). Bayroq standart o'chiq, egasi tasdiqlagandan keyin yoqiladi.

### HT-11 · Intizom ko'rsatkichini vaqtincha yashirish · **P1 · S**

HT-01 va HT-04 tugaguncha `/check` dagi "Statistik intizom" bloki va `s_reports` noto'g'ri muddatga tayanadi. Korxona haqida noto'g'ri salbiy signal obro'ga tegadi. Bayroq `reporting_discipline_public=False` (xuddi `company_score_public` kabi), HT-01 dan keyin yoqiladi.

### HT-12 · Mayda frontend xatolari · **P2 · S**

Hujjatlarda qayd qilingan, kodda tekshirilsin: `CalendarReport.tsx` dagi "Рѕylik" kodlash xatosi; `ReportsCard.tsx`/`ReportsTable.tsx` ikki papkada dublikat (Q-04); `ReportData` tipida `name`/`deadline` yo'qligi (F-04, ehtimol tuzatilgan). Hafta dushanbadan boshlanishi va `Asia/Tashkent` vaqt zonasi hamma kalendarda bir xil.

### HT-13 · stat-hisobot ↔ my.stat.uz moslashuvi · **P2 · M**

`stat-hisobot/ANALIZ.md` o'zi yaxshi ishlangan (25 ta bo'shliqqa qaror, 9-bo'lim `CLAUDE.md` ga tayyor blok). Qo'shimcha qilinadigani faqat ikki loyiha orasidagi ko'prik:
1. **Bir xil lug'at:** holatlar (HT-03), `deadline_rule` sintaksisi (HT-01), STIR/OKPO formati. Ikkala repo'da bir xil `docs/` bo'limi yoki umumiy JSON.
2. **Demo havola:** my.stat.uz demo'sida HT-07 dagi "Topshirish" havolasi stat-hisobot'ning `/reports/:id` sahifasiga, STIR bilan.
3. **Holatni qaytarish:** stat-hisobot `GET /api/compat/reportlist/{stir}` adapteri (ANALIZ 7.2 da taklif qilingan) my.stat.uz "Hisobotlarim" uchun OS-11 ning demo javobi bo'ladi: `submitted`, `accepted`, `rejected` real holatlar bilan ko'rinadi.
4. **Tekshirish kerak:** ANALIZ 9-bo'limi stat-hisobot'ning `CLAUDE.md` iga qo'shilganmi va qaysi bosqichgacha kod yozilgan. Bu hujjatda tekshirilmadi (repo ulanmagan).

stat-hisobot ichiga ANALIZ'da yo'q, lekin foydali 3 ta kichik qo'shimcha:
- **Vakolat berish:** asosiy foydalanuvchi buxgalterga shu korxona hisobotlarini to'ldirish huquqini beradi va qaytarib oladi (`UserOrganization` ga `role: owner | accountant | viewer`).
- **Inspektor bilan katak bo'yicha yozishma:** rad etishdagi `rejection_cells` izohiga korxona javob yozadi (bitta darajali thread), qayta yuborishda inspektorga ko'rinadi.
- **Buxgalteriya dasturidan import:** Excel'dan tashqari 1C eksport formati yoki oddiy CSV (`row_code, col_code, value`). Excel import (D5) bilan bitta xaritalash mantig'i.

---

## 4. Rejada yo'q yangi funksiyalar (YF)

Mavjud rejalardagi narsalar (benchmark, bozor tahlili, scoring, kontragent kartasi, JT-01..JT-20, IH-01..IH-12, FQ, A-02 obunalar) qayta taklif qilinmaydi. Har bir taklif mavjud ma'lumot va mavjud kodga tayanadi.

### Jamlanma

| ID | Nima | Kim uchun | Ustuvorlik | Hajm | Tayanadi |
|---|---|---|---|---|---|
| YF-01 | "Mijozlarim": buxgalter bir nechta korxonaning muddatlarini bitta jadvalda ko'radi | Buxgalter, autsorsing firmasi | **P1** | M | HT-02, OS-H-11 |
| YF-02 | Shaxsiy kalendar obunasi (doimiy `.ics` havola) | Korxona | **P1** | S | HT-01, U-13 |
| YF-03 | "Statistik hisobotlar bo'yicha qarzi yo'qligi" ma'lumotnomasi, QR bilan | Korxona, bank, tender | **P1** | S | JT-04 imzosi, HT-03, OS-11 |
| YF-04 | Telegram bot: muddat eslatmasi va STIR bo'yicha qisqa javob | Korxona | **P1** | M | HT-06, A-02 |
| YF-05 | O'z vaqtida topshirganga bepul imkoniyat (masalan, yiliga 1 marta benchmark) | Korxona | P2 | S | K-02, HT-03 |
| YF-06 | "Nega bu shakl menga tushdi?" va hisobot yuklamasi | Korxona | P2 | S | `KtutReportList`, HT-08 |
| YF-07 | Shakl o'zgarishlari jurnali va obuna | Korxona, buxgalter | P2 | S | `ReportList` versiyalari, A-02 |
| YF-08 | Kirishlar tarixi va faol seanslar | Hamma kirgan foydalanuvchi | P2 | S | JWT, `AuditLog` |
| YF-09 | "Mening ma'lumotlarim": eksport va hisobni o'chirish so'rovi | Hamma kirgan foydalanuvchi | P2 | S | Shaxsiy ma'lumotlar qonuni |
| YF-10 | Holat sahifasi: tizim ishlayaptimi, rejalashtirilgan ishlar | Hamma | P2 | S | admin e'lonlari |
| YF-11 | Hududlar bo'yicha topshirish intizomi (admin va hududiy bo'limlar uchun) | Admin, hududiy bo'lim | P3 | S | A-01, HT-02 |

### YF-01 · "Mijozlarim" paneli · **P1 · M**

Buxgalterlar va autsorsing firmalari 5–50 ta korxona hisobotini topshiradi. Hozir har birida alohida kirish va tashkilot almashtirish kerak. my.soliq.uz'da ham eng ko'p so'raladigan narsa shu.
- Kabinet → "Mijozlarim": foydalanuvchiga bog'langan barcha tashkilotlar bo'yicha bitta `DataTable`: Korxona · Shakl · Davr · Muddat · Holat. Filtr: "Shu hafta", "Muddati o'tgan", korxona.
- Yuqorida korxonalar bo'yicha kichik xulosa (har birida muddati yaqin va o'tgan soni).
- Bitta tugma bilan barchasini `.ics` ga (YF-02) va eslatmalar sozlamasi butun ro'yxatga.
- **Cheklov (OS-H-11):** HIBRID'da "faqat mavjud bog'lanish, yangi model yo'q" defaulti bor. Panel faqat mavjud foydalanuvchi ↔ tashkilot bog'lanishlarini ko'rsatadi. Korxona egasi buxgalterni o'zi qo'shishi (vakolat) uchun yangi model kerak, bu egasining qarori (6-bo'lim).

### YF-02 · Shaxsiy kalendar obunasi · **P1 · S**

U-13 bir martalik `.ics` faylni beradi: muddat o'zgarsa yoki yangi shakl qo'shilsa, fayl eskiradi. Taklif: kabinetda "Kalendarga ulash" → shaxsiy maxfiy havola `/api/calendar/<token>.ics` (Google, Outlook, iPhone kalendari o'zi yangilab turadi). Token qayta yaratiladi va o'chiriladi. Ichida faqat shakl kodi, nomi, davr va muddat; korxona nomi ixtiyoriy. JT-10 dagi `releases.ics` bilan bir xil generator.

### YF-03 · "Qarzi yo'qligi" ma'lumotnomasi · **P1 · S**

Banklar, tenderlar va davlat organlari korxonadan "hisobotlarini vaqtida topshiradimi" degan tasdiq so'raydi. JT-04 ma'lumotnomasi kodlar va shakllar ro'yxatini beradi, lekin holatni emas.
- STIR → PDF: sana holatiga ko'ra muddati o'tgan topshirilmagan hisobot bor yoki yo'q, oxirgi 12 oyda kechikishlar soni. QR → `/stat-codes/verify` (mavjud imzo mexanizmi).
- Faqat korxona o'zi (kirgan, o'z STIR'i) oladi va kimga berishini o'zi hal qiladi. Uchinchi shaxs uchun ochiq emas (HT-04 bilan bir mantiq).
- **Shart:** OS-11 real holat manbasi bilan hal bo'lishi kerak. Busiz bu hujjat yolg'on bo'lishi mumkin, shuning uchun manba bo'lmaguncha xizmat menyuda "Tez orada".

### YF-04 · Telegram bot · **P1 · M**

O'zbekistonda buxgalterlar uchun eng tez kanal. A-02 Telegram'ni ko'rsatkich obunalari uchun rejalashtirgan; shu bot hisobotlarga kengaytiriladi:
- Kabinetda "Telegram'ni ulash" (bir martalik kod bilan bog'lash, telefon raqami so'ralmaydi).
- Xabarlar: HT-06 eslatmalari, "rad etildi" (manba bo'lsa), shakl o'zgarishi (YF-07).
- Buyruqlar: `/hisobotlar` (shu hafta va o'tganlar), `/kalendar` (YF-02 havolasi). Boshqa STIR'lar bo'yicha so'rov yo'q.

### YF-05 · O'z vaqtida topshirganga rag'bat · **P2 · S**

Statistics Estonia'da respondent topshirgan ma'lumoti asosida o'zini tarmoq bilan solishtiradi. Bizda benchmark (K-02) pullik. Taklif: oxirgi 12 oyda hamma hisobotini o'z vaqtida topshirgan korxonaga yiliga 1 marta benchmark hisoboti yoki N StatCoin bepul. Hisobot intizomini oshiradi va pullik xizmatni tanishtiradi. Narx va miqdor egasining qarori; texnik qismi paket limiti yoki StatCoin `grant` (`KORXONA_SCORING` 12-bo'lim) bilan.

### YF-06 · "Nega bu shakl menga tushdi?" · **P2 · S**

Hisobot tafsilotida: shakl qaysi belgiga ko'ra biriktirilgan (OKED bo'limi, o'lcham, mulk shakli; manba bo'lsa), shu shaklni yana nechta korxona topshiradi, yiliga jami nechta topshirish. Kabinet bosh panelida bitta qator: "Siz yiliga 14 ta hisobot topshirasiz". Biriktirish mezoni bazada bo'lmasa, faqat sanoq qismi.

### YF-07 · Shakl o'zgarishlari jurnali · **P2 · S**

Yangi yil shakli chiqsa yoki ko'rsatkich qo'shilsa, buxgalter buni oldindan bilishi kerak. `ReportList` ga o'zgarishlar yozuvi (sana, nima o'zgardi, qaysi davrdan), shakl sahifasida "O'zgarishlar" bo'limi va obuna (A-02 mexanizmi). JT-11 (ko'rsatkichlar qayta ko'rib chiqilishi) bilan bir xil UI uslubi.

### YF-08 · Kirishlar tarixi va faol seanslar · **P2 · S**

Korxona kabinetiga bir nechta odam kiradi. Sozlamalarda: oxirgi 20 ta kirish (sana, usul OneID/ERI/parol, brauzer, taxminiy shahar), "Boshqa barcha seanslardan chiqish". Refresh token'larni bekor qilish (SimpleJWT blacklist) kerak bo'ladi.

### YF-09 · "Mening ma'lumotlarim" · **P2 · S**

Shaxsiy ma'lumotlar to'g'risidagi qonun subyektga o'z ma'lumotini bilish va o'chirishni so'rash huquqini beradi. Sozlamalarda: profil, obunalar, savollar, so'rovnoma javoblarini JSON/PDF qilib olish; "Hisobni o'chirish" so'rovi (darhol emas, admin ko'rib chiqadi, shartnoma va to'lovlar qonun bo'yicha saqlanadi). Matn yuridik tekshiruvdan o'tguncha "namuna" belgisi bilan (OS-H-17 kabi).

### YF-10 · Holat sahifasi · **P2 · S**

Muddat oxirgi kunlarida tizim sekinlashsa yoki ishlamasa, korxonalar "kechikkanim mening aybimmi" deb so'raydi. `/status`: my.stat.uz, ochiq API, SIAT sinxroni holati (mavjud admin ma'lumotidan), rejalashtirilgan texnik ishlar (admin e'loni), oxirgi hodisalar. `TopBar` da ogohlantirish chizig'i faqat faol hodisa bo'lsa.

### YF-11 · Hududlar bo'yicha topshirish intizomi · **P3 · S**

A-01 admin analitikasiga: hudud va shakl kesimida muddati o'tganlar ulushi, haftalik dinamika. Ochiq e'lon qilinmaydi, faqat admin va hududiy bo'lim. HT-02 va real holat manbasidan keyin.

---

## 5. Bajarish tartibi

| Qadam | Vazifalar | Natija | Dizayn qadamiga bog'liqlik |
|---|---|---|---|
| 1 | HT-04, HT-11 | Ma'lumot oqishi yopildi, noto'g'ri signal yashirildi | Yo'q, darhol |
| 2 | HT-01, HT-10 (bayroq o'chiq), HT-02, HT-03 | Muddat va davrlar to'g'ri, holat lug'ati bitta | Backend; H4 dan oldin |
| 3 | HT-05, HT-06, HT-07, HT-12 | "Hisobotlarim" foydalanuvchiga to'g'ri gapiradi, eslatmalar ishlaydi | H4 jadvallari bilan birga |
| 4 | YF-02, YF-01 | Kalendar obunasi, buxgalter paneli | H4 |
| 5 | HT-08, HT-09 | Yo'riqnomalar, "Hisobot topshiruvchilarga" markazi | H12 |
| 6 | YF-04, YF-07 | Telegram, shakl o'zgarishlari | H11 (xabarnomalar), A-02 |
| 7 | YF-03, YF-05 | Qarzi yo'qligi ma'lumotnomasi, rag'bat | OS-11 hal bo'lgach |
| 8 | YF-06, YF-08, YF-09, YF-10, YF-11, HT-13 | Qolganlari | Har biri mustaqil |

Har qadamda: `manage.py test`, `makemigrations --check`, `tsc`, `eslint`, `vite build`; muddat bilan bog'liq testlarda sana mock qilinadi; `backend/apps/payment/` da diff yo'q.

Claude Code'ga topshiriq namunasi:

```text
mystat repo'sida mystat/HISOBOT_TOPSHIRISH_VA_YANGI_FUNKSIYALAR.md dagi 1- va 2-qadamni bajar
(HT-04, HT-11, keyin HT-01, HT-02, HT-03). Har ID uchun alohida branch va PR.
ISH_REJASI.md ning 2- va 3-bo'limlaridagi qoidalarga amal qil.
Hujjatda "aniqlash kerak" yoki koddan farq qiladigan joyni PR tavsifida yoz.
```

---

## 6. Ochiq savollar

Javob bo'lmaguncha **default** bilan ishlanadi.

| # | Savol | Default | To'xtatadi |
|---|---|---|---|
| OS-HT-01 | Topshirilgan / qabul qilingan holat uchun real manba bormi (eStat 4.0 dan eksport yoki API)? `submitted-report` qayerdan to'ladi? (OS-11 ning davomi) | Faqat `submitted`, bo'lmasa `unknown` | YF-03, YF-05, YF-11 |
| OS-HT-02 | Muddat dam olish yoki bayram kuniga tushsa keyingi ish kuniga ko'chadimi? Bayramlar ro'yxatini kim kiritadi? | Ko'chmaydi (bayroq o'chiq), admin kiritadi | HT-10 |
| OS-HT-03 | Rasmiy topshirish tizimining nomi va havolasi (eStat 4.0 manzili)? | Admin sozlamasi, bo'sh bo'lsa blok ko'rinmaydi | HT-07 |
| OS-HT-04 | Korxona egasi buxgalterga vakolat berishi uchun yangi model qo'shamizmi (OS-H-11 ni o'zgartirish)? | Yo'q, faqat mavjud bog'lanishlar | YF-01 ning vakolat qismi |
| OS-HT-05 | "Qarzi yo'qligi" ma'lumotnomasi rasmiy hujjat sifatida chiqarilishiga qo'mita roziligi kerakmi? | Ha, rozilikkacha "Tez orada" | YF-03 |
| OS-HT-06 | O'z vaqtida topshirganga rag'bat: nima va qancha (benchmark, StatCoin)? | Bajarilmaydi | YF-05 |
| OS-HT-07 | Yo'riqnomalarni qaysi bo'lim yozadi va tasdiqlaydi? | Faqat avtomatik qism chiqadi | HT-08 qo'lda qismi |
| OS-HT-08 | stat-hisobot qaysi bosqichgacha yozilgan va ANALIZ 9-bo'limi qo'shilganmi? | Tekshirilmagan | HT-13 |
