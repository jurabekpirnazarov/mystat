# my.stat.uz uchun qo'shimcha xizmatlar: jahon tajribasi asosida takliflar

> **Sana:** 2026-10-19
> **Maqsad:** boshqa davlatlarning milliy statistika idoralari (ONS, Statistics Canada, US Census Bureau, ABS, KOSTAT, Destatis, INSEE, Statistics Estonia, Rosstat, Eurostat va boshqalar) portallarida bor, lekin my.stat.uz'da hali yo'q va qo'mita portaliga tabiiy "yarashadigan" xizmatlarni topish.
> **Asos:** `ISH_REJASI.md` (v2), `BARCHA_XIZMATLAR.md`, `XIZMATLAR_BIZ_HAQIMIZDA.docx`, `SIAT_KARTA_TAHLIL.md`, `SCORING_MODEL.md`, `KORXONA_SCORING.md`. Ularda bor narsa (benchmark, bozor tahlili, hamkor qidiruvi, korxona pasporti, scoring, hududlar xaritasi va prognozi, inflyatsiya kalkulyatori, "Mening maoshim", narxlar monitoringi, ismlar statistikasi, ochiq API, PWA, obunalar, konsultatsiya va h.k.) bu yerda **qayta taklif qilinmaydi**. Mavjud vazifani kengaytiradigan takliflar "kengaytma" deb belgilangan.
> **Qanday ishlatiladi:** vazifalar `JT-01..JT-20` deb raqamlangan (JT = jahon tajribasi), `ISH_REJASI.md` uslubida. Rejaga qo'shilganda "`JAHON_TAJRIBASI_TAKLIFLAR.md` dagi `JT-05` ni bajar" deyish yetarli. Ustuvorlik **P1/P2/P3**, ish hajmi **S/M/L**.
> **Muhim:** jahon misollari ochiq manbalardan tekshirildi (oxirida havolalar). my.stat.uz'ga oid "ma'lumot bor/yo'q" degan gaplar loyiha hujjatlariga asoslangan, kodni o'qib tasdiqlanadi.

---

## 0. Kod bilan tekshiruv va bajarilish holati (2026-10-20)

Hujjatdagi "ma'lumot bor" degan farazlar lokal baza va kod bilan solishtirildi.

**Asosiy topilma:** `Ktut` modelida faqat `inn` (STIR), `okpo`, `name` bor (65 545 korxona). **OKED, hudud, mulkchilik, ro'yxatdan o'tgan sana va holat yo'q** (`KORXONA_SCORING.md` 0-bo'limida ham qayd etilgan). OKED va hudud faqat `EnterpriseIndicator` da, **sintetik** (`is_synthetic=True`). Real bog'lanish: `KtutReportList` (225 798 korxona↔hisobot, 108 shakl). `Organization` (ro'yxatdan o'tgan korxonalar) da `district`, `sector`, `organization_type` bor, lekin ular kam.

SIAT katalogida 52 ko'rsatkich (45 manba, 5 hosila, 2 guruh), 51 746 qiymat; mavzular: iqtisodiyot 40, aholi 7, mehnat 4, ijtimoiy 1; hammasi yillik. Har birida `periodicity`, `first_published`, `source_updated_at` bor. Ro'yxat-2026 natijalari bazada **yo'q**. `SiatValue` faqat oxirgi qiymatni saqlaydi (versiya tarixi yo'q).

| ID | Real ma'lumot bilan bajarsa bo'ladimi | Izoh | Holat |
|---|---|---|---|
| JT-04 | ✅ Qisman | OKPO va hisobotlar ro'yxati real. OKED/SOATO KTUT'da yo'q, faqat `Organization` da bo'lsa chiqadi | ✅ `/stat-codes`, `/stat-codes/verify`. QR rasm yo'q (yangi kutubxona qo'shilmadi) — tekshiruv kodi va havola |
| JT-10 | ✅ | SIAT `periodicity` + `source_updated_at` asosida taxminiy sana; admin'da rasmiy sana bilan almashtiriladi (OS-JT-5 default) | ✅ `/release-calendar`, `.ics` obuna, admin: "E'lonlar kalendari" |
| JT-15 | ✅ | Faqat frontend | ✅ Panellardagi har kartochkada; `/embed/indicator/:key` |
| JT-17 | ✅ | SIAT katalogi ustida; "Yoshlar", "Ayollar" panellari uchun ko'rsatkich yo'q (faqat erkaklar ishsizligi va aholi jinsi bor) | ✅ `/dashboards` (iqtisodiyot, mehnat, aholi) |
| JT-02 | ✅ | SIAT aholi soni + o'sish sur'ati (hosila `d-pop-growth`) | ✅ `/dashboards` va bosh sahifada |
| JT-16 | ✅ ehtimol | CPI guruh indekslari (`priceindex_model`) tekshiriladi | ⏳ |
| JT-09 | ✅ | So'rovlar va intervyuer ID'lari admin'da kiritiladi | ⏳ |
| JT-11 | ✅ keyingi sinxronlardan boshlab | Yangi `SiatValueRevision` jadvali, `sync` eski qiymatni yozadi; o'tmish tarixi tiklanmaydi | ⏳ |
| JT-08 | ✅ | FQ-08 so'rovnoma dvigateli bor | ⏳ |
| JT-05 | ⚠️ Faqat namuna | Korxonalarning OKED va hududi sintetik → "Namuna" belgisi bilan | ⏳ |
| JT-06 | ⚠️ Egasining qarori | Ochiq maydonlar faqat nom, STIR, OKPO bo'lardi (OS-JT-2) | ⏳ |
| JT-07 | ❌ | Ro'yxatdan o'tgan va yopilgan sana hech qayerda yo'q. Real manba kerak (soliq yoki adliya reyestri) | Bloklangan |
| JT-01, JT-03, JT-12 | ❌ | Ro'yxat-2026 natijalari bazada yo'q (OS-JT-4) | Bloklangan |
| JT-14 | ⚠️ | JT-07 ga bog'liq; DIDOX — OS-JT-6 | Bloklangan |
| JT-13, JT-18, JT-19, JT-20 | ⚠️ | Huquqiy asos, kontent yoki LLM qarori | Keyinroq |

---

## 1. Qisqa xulosa

Hozirgi reja portalni **korxonalar uchun tijoriy xizmatlar** va **fuqarolar uchun kalkulyatorlar** bilan juda yaxshi to'ldiradi. Jahon tajribasi bilan solishtirganda uchta katta bo'shliq qoladi:

1. **2026-yilgi aholi va qishloq xo'jaligi ro'yxati.** Bu mustaqillikdan keyingi birinchi ro'yxat, aholining 82,3 foizi onlayn qatnashgan, dastlabki natija 39,05 mln kishi. Har bir yirik idora ro'yxatdan keyin alohida "natijalar portali" ochadi (ABS QuickStats, ONS Census maps). my.stat.uz uchun bu yilning eng katta imkoniyati.
2. **Statistikaga ishonch infratuzilmasi.** E'lonlar kalendari, qayta ko'rib chiqishlar jurnali, sifat hisobotlari, "so'rov haqiqiymi?" tekshiruvi. Bular XVJ standartlari (SDDS/e-GDDS) va BMT rasmiy statistika tamoyillari talab qiladigan, deyarli har bir rivojlangan idorada bor narsalar.
3. **Tadqiqotchilar uchun chuqur kirish.** Anonim mikroma'lumotlar, o'zi jadval tuzish (TableBuilder) va xavfsiz laboratoriya. Hozirgi rejada faqat agregat API va qo'lda bajariladigan buyurtma bor.

**Birinchi navbatda tavsiya:** JT-01 (ro'yxat natijalari), JT-05 (biznes ochish xaritasi), JT-04 (statistik kodlar ma'lumotnomasi), JT-10 (e'lonlar kalendari), JT-07 (korxonalar demografiyasi). Ular ko'p jihatdan mavjud ma'lumotga (KTUT 65 540 korxona, SIAT 3 236 ko'rsatkich, ro'yxat natijalari) tayanadi va yangi manba talab qilmaydi.

---

## 2. Jahon tajribasi: qisqa jadval

| Idora | Xizmat | Nima qiladi | my.stat.uz'da |
|---|---|---|---|
| ABS (Avstraliya) | Census QuickStats, TableBuilder, DataLab | Har hudud uchun ro'yxat sahifasi; o'zi jadval tuzish; xavfsiz mikroma'lumot laboratoriyasi | Yo'q → JT-01, JT-12, JT-13 |
| ONS (Buyuk Britaniya) | Explore local statistics | Har hudud bo'yicha yagona sahifa, qo'shni/o'xshash hududlar bilan solishtirish | FQ-02, KR-21 bor (qisman) |
| ONS | Shopping prices comparison tool, household costs calculator | 650 dan ortiq mahsulot narxi, shaxsiy inflyatsiya, grafiklarni saytga "embed" qilish | FQ-06 bor; shaxsiy vaznlar va embed yo'q → JT-15, JT-16 |
| US Census Bureau | Census Business Builder | Biznes ochuvchi uchun: tarmoq + hudud tanlanadi, talab, raqobat, aholi bir xaritada | Yo'q → JT-05 |
| US Census Bureau | Business Formation Statistics | Yangi ochilayotgan bizneslar soni, haftalik/oylik | Yo'q → JT-07 |
| KOSTAT / Koreya milliy ma'lumotlar idorasi | SGIS "Tarmoq statistikasi xaritasi" (2026-yil iyun, yangilangan) | 80 ta kundalik xizmat turi bo'yicha korxonalar, ochilish, xodimlar xaritada; tadbirkor joy tanlashi uchun | Yo'q → JT-05 |
| Statistics Canada | Real-time Local Business Conditions Index | Tezkor manbalardan hudud biznes faolligi indeksi | Yo'q → JT-14 |
| Statistics Canada | Canadian Survey on Business Conditions | Korxonalar kayfiyati, kutilmalari bo'yicha choraklik qisqa so'rov | Yo'q → JT-08 |
| Destatis (Germaniya) | EXDAT eksperimental statistika | Yangi usul va manbalar alohida belgi bilan e'lon qilinadi | Yo'q → JT-14 |
| INSEE (Fransiya) | Sirene API | Korxonalar reyestri bepul API va ochiq fayl | KTUT bor, ochiq API yo'q → JT-06 |
| Rosstat (Rossiya) | Statistik kodlar haqida ma'lumotnoma (onlayn) | STIR kiritiladi, kodlar va topshiriladigan hisobotlar ro'yxati PDF bilan chiqadi | Yo'q → JT-04 |
| Statistics Estonia | eSTAT, statistika ilovasi, boshqaruv panellari | Respondent kabineti, mobil ilova, mavzuli dashboardlar | Benchmark, PWA bor; mavzuli panellar → JT-17 |
| Eurostat va a'zo davlatlar | European Statistics Competition, Census at School | Maktab o'quvchilari uchun statistika olimpiadasi va dars materiallari | Yo'q → JT-18 |
| XVJ (IMF) | SDDS / e-GDDS, NSDP sahifasi | Oldindan e'lon qilingan kalendar, milliy xulosa ma'lumotlari sahifasi | Yo'q → JT-10 |

---

## 3. Takliflar

### A. 2026-yilgi ro'yxat natijalari

#### JT-01 · Ro'yxat natijalari portali ("har hudud uchun bir sahifa") · **P1 · L**

- **Nima:** viloyat, tuman (keyinchalik ruxsat bo'lsa mahalla) bo'yicha ro'yxat natijalari sahifasi: aholi soni, jins-yosh piramidasi, millat, ona tili, ta'lim, uy-joy sharoiti, xo'jaliklar, qishloq xo'jaligi (ekin maydoni, chorva). Hudud joriy baholash bilan ham solishtiriladi (ro'yxat 810 ming kishiga ko'p chiqqan: bu fuqarolar eng ko'p qiziqadigan raqam).
- **Jahon misoli:** ABS Census QuickStats (har hudud uchun bitta sahifa), ONS Census maps.
- **Nega yarashadi:** ro'yxat qo'mitaning eng katta loyihasi; 82,3 % onlayn qatnashgan fuqaro "natijasini qayerdan ko'raman?" deb so'raydi. Bunday sahifa my.stat.uz'ni birinchi manbaga aylantiradi.
- **Ma'lumot:** qo'mita e'lon qiladigan dastlabki va yakuniy natijalar. Yakuniy natija chiqqunga qadar sahifa dastlabki ma'lumot bilan "Dastlabki" belgisi bilan ishlaydi.
- **MVP:** hudud tanlash → 8–10 ta kartochka + piramida + "joriy baholash bilan farq". Mavjud xarita (KR-06, KR-07) ga "Ro'yxat-2026" qatlami.
- **Bog'liq:** KR-04 (GeoJSON), KR-07 (tumanlar), FQ-02 (hududiy profil: ro'yxat bloki shu sahifaga ham tushadi).

#### JT-02 · "Aholi soati" va ro'yxat infografikasi · **P2 · S**

- **Nima:** bosh sahifada jonli hisoblagich: ro'yxat natijasi + tug'ilish/o'lim/migratsiya sur'ati asosida "hozir O'zbekistonda taxminan N kishi". Yonida "har necha soniyada bir chaqaloq tug'iladi" kabi qisqa faktlar.
- **Jahon misoli:** US Census Bureau Population Clock, Destatis va Statistics Estonia aholi hisoblagichlari.
- **Ma'lumot:** ro'yxat natijasi + SIAT 2.01 demografiya ko'rsatkichlari. Hisob formula bilan, server emas brauzerda.
- **Bog'liq:** U-08 (bosh sahifa jonli ko'rsatkichlari) ichiga blok sifatida.

#### JT-03 · "Siz qanchalik o'xshaysiz?" va hudud viktorinasi · **P3 · M**

- **Nima:** fuqaro yoshi, jinsi, hududini kiritadi va ro'yxat bo'yicha o'zini tengdoshlari bilan solishtiradi (masalan, "sizning yoshingizdagilarning 64 foizi oilali"). Alohida: "O'z tumaningizni qanchalik bilasiz?" 5 savollik viktorina, javobdan keyin to'g'ri raqam va manba.
- **Jahon misoli:** ONS'ning ro'yxat natijalari bo'yicha interaktiv viktorina va "how do you compare" vositalari.
- **Nega:** ijtimoiy tarmoqda tarqaladigan format; FQ-07 ("Statistika oddiy tilda") ga trafik olib keladi.
- **Bog'liq:** JT-01, FQ-05 ("Mening maoshim" uslubida).

### B. Korxonalar va tadbirkorlar

#### JT-04 · Statistik kodlar va hisobotlar ro'yxati haqida ma'lumotnoma · **P1 · S**

- **Nima:** STIR kiritiladi → korxonaning KTUT kodlari (OKED, MHOBT/SOATO, mulkchilik shakli, tashkiliy-huquqiy shakl) va **qaysi statistik hisobotlarni qachon topshirishi kerakligi** PDF ko'rinishida, QR kod bilan. QR orqali hujjat haqiqiyligini tekshirish sahifasi.
- **Jahon misoli:** Rosstat'ning "statistik kodlar haqida ma'lumot" onlayn xizmati (buxgalterlar eng ko'p ishlatadigan xizmatlardan biri).
- **Nega yarashadi:** bank, tender, davlat organlari ko'pincha shunday ma'lumotnoma so'raydi. Ma'lumot to'liq bor: KTUT 65 540 korxona va 225 768 korxona↔hisobot bog'lanishi (`ISH_REJASI.md` 4.1).
- **Kirish:** ma'lumotnoma bepul (yoki ramziy narx, OS-JT-1), PDF yuklash login bilan.
- **Bog'liq:** K-05 (hisobot yordamchisi) va K-07 (korxona pasporti) bilan bir xil ma'lumot, alohida "rasmiy hujjat" ko'rinishi. To'lov bo'lsa `payment/` ga tegilmaydi (2.2-bo'lim), mavjud paket limiti ishlatiladi.

#### JT-05 · "Biznes ochaman": joy va tarmoq tanlash xaritasi · **P1 · M**

- **Nima:** foydalanuvchi faoliyat turini (OKED, masalan "sartaroshxona", "dorixona", "nonvoyxona") va tumanni tanlaydi. Natija: tumandagi shu turdagi faol korxonalar soni, 1 000 aholiga to'g'ri keladigan zichlik, so'nggi 3 yilda ochilgan/yopilganlar, aholi tarkibi (ro'yxatdan), o'rtacha ish haqi, qo'shni tumanlar bilan solishtirish. "Raqobat past, talab yuqori" hududlar xaritada ajratiladi.
- **Jahon misoli:** US Census Business Builder; Koreyaning SGIS "Tarmoq statistikasi xaritasi" (2026-yilda 80 ta kundalik xizmat turi va 40 dan ortiq ko'rsatkich bilan yangilangan).
- **Nega yarashadi:** K-04 (hamkor/raqobatchi qidiruvi) mavjud korxona uchun, bu esa **hali ochilmagan** biznes uchun. Kichik tadbirkorlik va o'zini o'zi band qilish siyosatiga mos, mavjud xarita va KTUT ustiga quriladi.
- **Ma'lumot:** KTUT (OKED, hudud, ro'yxatdan o'tgan sana, holat), SIAT (aholi, ish haqi), JT-01.
- **MVP:** OKED × tuman zichlik xaritasi + kartochka. Pullik qismi (OS-14 bilan): to'liq PDF hisobot va eksport.
- **Bog'liq:** KR-05 (karta API), K-04, KR-18 (tarmoq ixtisosi).

#### JT-06 · Korxonalar reyestrining ochiq to'plami va API'si · **P2 · M**

- **Nima:** KTUT'ning ochiq qismi (nom, STIR, OKED, hudud, holat, ro'yxatdan o'tgan sana) har oy CSV va API orqali, litsenziya bilan. Batafsil maydonlar avvalgidek paket orqali.
- **Jahon misoli:** INSEE Sirene: Fransiya korxonalar reyestri bepul API va ochiq fayl sifatida beriladi.
- **Nega:** buxgalteriya, bank, ERP dasturlari integratsiya qiladi; my.stat.uz rasmiy manba sifatida mustahkamlanadi. Pullik STIR so'rovi (10/100/1 000/10 000 ta) bilan to'qnashmasligi uchun ochiq maydonlar to'plami tor tutiladi.
- **Ochiq savol:** qaysi maydonlar ochiq bo'lishi mumkin (OS-JT-2).
- **Bog'liq:** FQ-01 (API kalitlari va limitlar shu yerda ham ishlaydi).

#### JT-07 · Korxonalar demografiyasi: ochilish va yopilish paneli · **P1 · S**

- **Nima:** oylik/choraklik grafik: yangi ro'yxatdan o'tgan, faoliyatini to'xtatgan va faol korxonalar soni, OKED va hudud kesimida; "omon qolish darajasi" (ochilgandan 1, 3, 5 yildan keyin faol qolganlar ulushi).
- **Jahon misoli:** US Census Business Formation Statistics, Eurostat business demography.
- **Nega:** KTUT'da sana va holat bor, ya'ni panel yangi manbasiz quriladi. Jurnalistlar va vazirliklar muntazam so'raydigan raqam.
- **Bog'liq:** KR-37 (hududiy agregatlar), JT-05 (bir xil hisob).

#### JT-08 · Biznes kayfiyati so'rovi (pulse survey) · **P2 · M**

- **Nima:** kabinetdagi korxonalarga chorakda bir marta 8–10 savollik qisqa so'rov: buyurtmalar, narx kutilmasi, xodim yollash rejasi, asosiy to'siqlar. Natija ochiq "Ishbilarmonlik kayfiyati indeksi" sifatida e'lon qilinadi, qatnashgan korxona o'z javobini tarmoq o'rtachasi bilan ko'radi.
- **Jahon misoli:** Statistics Canada'ning Canadian Survey on Business Conditions; Yevropa Ittifoqidagi business tendency surveys.
- **Nega:** respondent faqat "hisobot topshiruvchi" emas, natija oluvchi ham bo'ladi. FQ-08 (aholi so'rovnomalari) dvigatelini qayta ishlatadi.
- **Bog'liq:** FQ-08, U-02 (kabinet paneli), A-02 (natija chiqqanda xabar).

#### JT-09 · Respondent sahifasi va "so'rov haqiqiymi?" tekshiruvi · **P1 · S**

- **Nima:** (1) korxona yoki fuqaro intervyuer ID raqamini yoki so'rov nomini kiritadi va bu haqiqiy qo'mita so'rovimi, tekshiradi; (2) har so'rov uchun sahifa: nima uchun so'raladi, qonuniy asos, ma'lumot qanday himoyalanadi, natija qayerda chiqadi.
- **Jahon misoli:** ONS va Statistics Canada'da "survey participants" bo'limlari va so'rovni tekshirish sahifalari bor.
- **Nega:** ro'yxat va uy xo'jaliklari so'rovlari davrida firibgarlar "statistika xodimi" nomidan qo'ng'iroq qiladi. Kam xarajatli, ishonchni oshiradi.
- **Bog'liq:** JT-01, S-12 (hisobot shakllari).

### C. Statistikaga ishonch va ochiqlik

#### JT-10 · E'lonlar kalendari (advance release calendar) · **P1 · S**

- **Nima:** qaysi ko'rsatkich (YaIM, ISN, ish haqi, tashqi savdo, aholi) qaysi kuni soat nechada e'lon qilinishi oldindan, 12 oyga. Kalendardan obuna (iCal), e'lon chiqqanda havola.
- **Diqqat:** bu **hisobot kalendaridan farq qiladi** (U-13, K-05 korxona qachon hisobot topshirishini ko'rsatadi; bu esa qo'mita qachon natija chiqarishini).
- **Jahon misoli:** XVJ SDDS/e-GDDS talabi; ONS, Destatis, Statistics Canada'da standart sahifa. XVJ'ning NSDP (National Summary Data Page) sahifasi ham shu kalendarga bog'lanadi.
- **Ma'lumot:** SIAT pasportlaridagi davriylik va oxirgi yangilanish sanasi (KR-02 katalogi) + qo'mita e'lon rejasi.
- **Bog'liq:** KR-02, A-02 (obuna shu kalendarga ulanadi).

#### JT-11 · Qayta ko'rib chiqishlar va tuzatishlar jurnali, sifat hisobotlari · **P2 · S**

- **Nima:** (1) har ko'rsatkichda "versiya tarixi": qachon qaysi raqam o'zgargan va nima uchun (dastlabki → yakuniy, ro'yxatdan keyingi qayta hisob); (2) xatolar uchun ochiq tuzatish jurnali; (3) har ko'rsatkichga qisqa sifat hisoboti (qamrov, aniqlik, kechikish).
- **Jahon misoli:** ONS "revisions" va quality and methodology information (QMI) sahifalari; Destatis sifat hisobotlari.
- **Nega:** ro'yxat natijasi aholi soni va unga bog'liq ko'plab ko'rsatkichlarni o'zgartiradi. Foydalanuvchi "nega raqam o'zgardi?" deb so'raydi; javob bitta joyda bo'lishi kerak.
- **Ma'lumot:** KR-01 sinxronlash har yangilanishda eski qiymatni saqlaydi (hozir faqat oxirgisi bo'lsa, kichik o'zgarish).
- **Bog'liq:** KR-01, KR-14 (sifat monitoringi), KR-22 va KR-38 (metodologiya sahifalari).

### D. Tadqiqotchilar va mutaxassislar

#### JT-12 · Jadval quruvchi (TableBuilder) · **P2 · L**

- **Nima:** foydalanuvchi o'zgaruvchilarni tanlab (masalan, hudud × yosh guruhi × ta'lim) o'zi jadval tuzadi. Kichik kataklar maxfiylik qoidasi bilan avtomatik yashiriladi yoki yaxlitlanadi. Natija CSV/Excel.
- **Jahon misoli:** ABS TableBuilder, Shimoliy Yevropa idoralaridagi PxWeb.
- **Nega:** hozir bunday so'rov K-06 orqali qo'lda bajariladi. Standart kesimlar o'z-o'ziga xizmatga o'tsa, qo'mita xodimlari faqat murakkab buyurtmalar bilan ishlaydi; K-06 narx jadvali o'zgarmaydi.
- **Ma'lumot:** birinchi navbatda ro'yxat jamlanmalari (JT-01) va KTUT.
- **Bog'liq:** K-06, FQ-01, OS-14 (paketga kiradimi).

#### JT-13 · Mikroma'lumotlarga kirish: anonim fayllar va xavfsiz laboratoriya · **P3 · L**

- **Nima:** ikki daraja. (1) **Ochiq anonim fayl** (public use file): uy xo'jaliklari so'rovlari va ro'yxatning kichik tanlanmasi, shaxsni aniqlab bo'lmaydigan darajada. (2) **Xavfsiz laboratoriya**: akkreditatsiyadan o'tgan tadqiqotchi loyiha arizasi beradi, ma'lumot serverdan chiqmaydi, natija chiqishdan oldin tekshiriladi.
- **Jahon misoli:** ABS DataLab, Stats NZ IDI, KOSTAT MDIS.
- **Nega:** universitetlar va xalqaro tashkilotlar uchun asosiy talab; ilmiy maqolalarda qo'mita ma'lumoti ko'proq ishlatiladi. Portalda faqat **ariza, akkreditatsiya va katalog** qismi quriladi, laboratoriya alohida infratuzilma.
- **Ochiq savol:** huquqiy asos va maxfiylik qoidalari (OS-JT-3). Shu sabab P3.
- **Bog'liq:** FQ-04 (OneID bilan tadqiqotchi profili), S-04 (ariza oqimi).

#### JT-14 · Eksperimental statistika va tezkor indikatorlar · **P2 · M**

- **Nima:** "Eksperimental" belgisi bilan alohida bo'lim: yangi usul yoki manbadan olingan ko'rsatkichlar. Birinchi nomzodlar: korxona ochilishlari bo'yicha haftalik indeks (JT-07 dan), elektron hisob-fakturalar hajmi bo'yicha biznes faolligi (DIDOX allaqachon integratsiyada, ruxsat bo'lsa), onlayn narxlar.
- **Jahon misoli:** Destatis EXDAT; Statistics Canada Real-time Local Business Conditions Index; ONS "official statistics in development" belgisi.
- **Nega:** qo'mitaga yangi usullarni xavfsiz sinash joyi beradi. KR-23..KR-28 (prognoz) bilan farqi: bu kelajakni emas, **hozirni** tezroq ko'rsatadi (nowcasting).
- **Bog'liq:** KR-28, JT-07.

#### JT-15 · Ulashiladigan grafiklar, doimiy havola va iqtibos · **P2 · S**

- **Nima:** har grafik va jadval ostida: "Saytingizga qo'yish" (`<iframe>` embed kodi), doimiy havola (tanlangan filtrlar URL'da), "Iqtibos keltirish" (APA/GOST formatida manba, ko'rsatkich kodi va yuklab olingan sana), PNG/SVG yuklash.
- **Jahon misoli:** ONS grafiklaridagi embed kodi; ko'plab idoralar ko'rsatkichlarga DOI yoki doimiy identifikator beradi.
- **Nega:** jurnalistlar va bloggerlar skrinshot o'rniga jonli grafik qo'yadi, har qo'yilgan grafik my.stat.uz'ga havola olib keladi. Kichik ish, hamma sahifaga foyda.
- **Bog'liq:** KR-12 (karta eksporti va manba), U-16 (saqlangan filtrlar), U-01 (umumiy komponent).

### E. Fuqarolar, ta'lim va jamoatchilik

#### JT-16 · Shaxsiy inflyatsiya: "mening savatim" (kengaytma) · **P2 · S**

- **Nima:** FQ-03 kalkulyatoriga qo'shimcha: foydalanuvchi o'z xarajat ulushlarini (oziq-ovqat, ijara, transport, kommunal, ta'lim) kiritadi va **o'zining** inflyatsiyasini rasmiy ISN bilan solishtiradi.
- **Jahon misoli:** ONS household costs / personal inflation calculator.
- **Ma'lumot:** ISN guruh indekslari (CPI 311 yozuv, OS-15 ga ko'ra agregat ochiq).
- **Bog'liq:** FQ-03, FQ-06.

#### JT-17 · Mavzuli panellar (dashboard) · **P2 · M**

- **Nima:** 5–6 ta tayyor panel, har biri bitta sahifada 8–12 ta asosiy ko'rsatkich: "Iqtisodiyot bir qarashda", "Mehnat bozori", "Narxlar", "Yoshlar", "Ayollar" (gender.stat.uz bilan bog'lanadi), "Barqaror rivojlanish maqsadlari" (milliy BRM platformasiga havola). Har ko'rsatkich: oxirgi qiymat, o'zgarish, sparkline, SIAT pasportiga havola.
- **Jahon misoli:** Statistics Estonia boshqaruv panellari (juhtimislauad.stat.ee), Destatis "Dashboard Deutschland".
- **Nega:** hozir ko'rsatkichlar mavzu bo'yicha tarqoq. Panellar SIAT katalogi (KR-02) ustidagi konfiguratsiya, yangi ma'lumot kerak emas.
- **Bog'liq:** KR-02, U-08.

#### JT-18 · "Statistika maktabda": o'quvchi va o'qituvchilar uchun · **P3 · M**

- **Nima:** (1) maktab o'quvchilari uchun yillik statistika olimpiadasi yoki "ma'lumotdan hikoya" tanlovi; (2) o'qituvchilar uchun tayyor dars ishlanmalari (matematika, geografiya, iqtisod) va real ma'lumot to'plamlari; (3) sinf o'z so'rovini o'tkazib, natijani butun mamlakat bilan solishtiradigan "Ro'yxat maktabda" vositasi.
- **Jahon misoli:** Eurostat va a'zo davlatlarning European Statistics Competition; Census at School (Buyuk Britaniya, Yangi Zelandiya va boshqalar).
- **Nega:** statistik savodxonlik, qo'mita uchun ijobiy imidj, Xalq ta'limi vazirligi bilan hamkorlik. Portalda kontent bo'limi + FQ-08 so'rovnoma dvigateli.
- **Bog'liq:** FQ-07, FQ-08.

#### JT-19 · Jurnalistlar uchun matbuot xonasi · **P3 · S**

- **Nima:** e'lonlar uchun press-reliz, asosiy raqamlar va tayyor grafiklar (JT-15), akkreditatsiyalangan jurnalistlarga **embargo** ostida oldindan kirish (masalan, e'londan 30 daqiqa oldin), matbuot xizmati kontakti.
- **Jahon misoli:** ONS, Statistics Canada ("The Daily" va media lock-up), Eurostat media.
- **Bog'liq:** JT-10, JT-15.

### F. Sun'iy intellekt

#### JT-20 · Raqam bilan javob beradigan savol-javob (Stat AI kengaytmasi) · **P3 · M**

- **Nima:** "2025-yilda Samarqandda o'rtacha ish haqi qancha?" kabi savolga SIAT katalogidan topilgan **aniq ko'rsatkich qiymati**, kodi va havolasi bilan javob. Model raqam o'ylab topmaydi: faqat katalogdan qidiradi, topmasa "topilmadi" deydi va FQ-10 orqali savol yuborishni taklif qiladi.
- **Nega:** U-11 hozir FAQ asosida (OS-06: haqiqiy LLM ulanmaydi). Bu taklif OS-06 qarori o'zgarsa keyingi qadam sifatida yoziladi.
- **Bog'liq:** U-11, KR-02, FQ-10, OS-06.

---

## 4. Ustuvorlik va bajarish tartibi

| ID | Nima | Ustuvorlik | Hajm | Yangi manba kerakmi | Bog'liq |
|---|---|---|---|---|---|
| JT-01 | Ro'yxat natijalari portali | P1 | L | Ro'yxat natijalari | KR-04, KR-07, FQ-02 |
| JT-04 | Statistik kodlar ma'lumotnomasi | P1 | S | Yo'q (KTUT) | K-05, K-07 |
| JT-05 | Biznes ochish xaritasi | P1 | M | Yo'q (KTUT, SIAT) | KR-05, K-04 |
| JT-07 | Korxonalar demografiyasi | P1 | S | Yo'q (KTUT) | KR-37 |
| JT-09 | Respondent sahifasi, so'rovni tekshirish | P1 | S | Intervyuerlar ro'yxati | JT-01 |
| JT-10 | E'lonlar kalendari | P1 | S | E'lon rejasi | KR-02, A-02 |
| JT-02 | Aholi soati | P2 | S | Yo'q | U-08 |
| JT-06 | Reyestrning ochiq API'si | P2 | M | Yo'q | FQ-01 |
| JT-08 | Biznes kayfiyati so'rovi | P2 | M | So'rov o'zi | FQ-08 |
| JT-11 | Qayta ko'rib chiqishlar jurnali | P2 | S | Yo'q | KR-01, KR-14 |
| JT-12 | Jadval quruvchi | P2 | L | Ro'yxat jamlanmalari | K-06 |
| JT-14 | Eksperimental statistika | P2 | M | Qisman | JT-07, KR-28 |
| JT-15 | Embed, havola, iqtibos | P2 | S | Yo'q | KR-12, U-01 |
| JT-16 | Shaxsiy inflyatsiya | P2 | S | Yo'q | FQ-03 |
| JT-17 | Mavzuli panellar | P2 | M | Yo'q | KR-02 |
| JT-03 | "Siz qanchalik o'xshaysiz?" | P3 | M | Ro'yxat natijalari | JT-01 |
| JT-13 | Mikroma'lumotlar | P3 | L | Huquqiy asos | FQ-04 |
| JT-18 | Statistika maktabda | P3 | M | Kontent | FQ-07, FQ-08 |
| JT-19 | Matbuot xonasi | P3 | S | Yo'q | JT-10, JT-15 |
| JT-20 | Raqamli savol-javob | P3 | M | LLM qarori | U-11, OS-06 |

**Tavsiya etilgan tartib:**

1. **Tez natija (yangi manbasiz):** JT-04, JT-07, JT-15, JT-10. Har biri kichik va mavjud KTUT/SIAT ma'lumotidan foydalanadi.
2. **Ro'yxat to'lqini:** JT-01 → JT-02 → JT-09 → JT-03. Qo'mita yakuniy natijalarni e'lon qila boshlaganda tayyor turishi kerak.
3. **Tadbirkorlar uchun:** JT-05 → JT-08 → JT-06.
4. **Ishonch va chuqur kirish:** JT-11 → JT-17 → JT-12 → JT-14.
5. **Keyinroq, qarorlarga bog'liq:** JT-13, JT-16, JT-18, JT-19, JT-20.

Sintetik ma'lumot qoidalari (`ISH_REJASI.md` 8-bo'lim, S-09 "Namuna" belgisi) bu yerda ham amal qiladi: ro'yxat natijasi, biznes kayfiyati so'rovi kabi real ma'lumoti hali yo'q bloklar lokalda namuna bilan quriladi.

---

## 5. Ochiq savollar

| ID | Savol | Taklif qilingan standart | Vazifa |
|---|---|---|---|
| OS-JT-1 | Statistik kodlar ma'lumotnomasi bepulmi yoki pullik? | Ko'rish bepul, QR'li PDF login bilan, bepul | JT-04 |
| OS-JT-2 | KTUT'ning qaysi maydonlari ochiq to'plamga chiqadi? | Nom, STIR, OKED, hudud, holat, sana | JT-06 |
| OS-JT-3 | Mikroma'lumotlarni berishning huquqiy asosi va maxfiylik qoidalari bormi? | Bo'lmaguncha faqat katalog va ariza | JT-13 |
| OS-JT-4 | Ro'yxat natijalari qaysi darajada (tuman, mahalla) va qachon e'lon qilinadi? | Avval viloyat/tuman, dastlabki belgisi bilan | JT-01, JT-12 |
| OS-JT-5 | E'lonlar rejasi qo'mitada mashina o'qiy oladigan shaklda bormi? | Admin'da qo'lda kiritiladi | JT-10 |
| OS-JT-6 | DIDOX hisob-faktura agregatlarini eksperimental indeksda ishlatish mumkinmi? | Yo'q, faqat KTUT asosidagi indeks | JT-14 |
| OS-JT-7 | Intervyuerlar ro'yxatini tekshiruv uchun ochish mumkinmi (faqat ID → ha/yo'q)? | Ha, shaxsiy ma'lumotsiz | JT-09 |

---

## Manbalar

- O'zbekiston ro'yxati: [yep.uz: dastlabki natijalar](https://yep.uz/?p=67445), [kun.uz: ro'yxat boshlandi](https://kun.uz/en/news/2026/01/15/uzbekistan-begins-first-nationwide-population-and-agricultural-census), [aholi.stat.uz](https://aholi.stat.uz/en/64-news-eng/6236-a-conference-was-held-dedicated-to-the-preliminary-results-of-the-population-and-agricultural-census)
- ABS: [Accessing integrated data (DataLab)](https://www.abs.gov.au/statistics/data-integration/accessing-integrated-data), [Microdata and TableBuilder FAQ](https://www.abs.gov.au/statistics/microdata-tablebuilder/frequently-asked-questions)
- ONS: [Explore local statistics](https://ons.gov.uk/explore-local-statistics/), [Shopping prices comparison tool](https://www.ons.gov.uk/economy/inflationandpriceindices/articles/shoppingpricescomparisontool/latest), [Household costs (embed kodi bilan)](https://www.ons.gov.uk/economy/inflationandpriceindices/articles/howisinflationaffectingyourhouseholdcosts/latest)
- US Census Bureau: [Census Business Builder](https://www.census.gov/newsroom/blogs/director/2015/09/expanding-small-business-owners-access-to-our-data-with-census-business-builder.html)
- Koreya: [SGIS tarmoq statistikasi xaritasi, 2026](https://www.dailian.co.kr/news/view/1660254/)
- Statistics Canada: [Real-time Local Business Conditions Index](https://www150.statcan.gc.ca/n1/pub/71-607-x/71-607-x2021017-eng.htm)
- Destatis: [EXDAT eksperimental ma'lumotlar](https://destatis.de/EN/Service/EXDAT/_node.html)
- INSEE: [Sirene API](https://www.insee.fr/fr/information/3587074)
- Rosstat: [statistik kodlar onlayn xizmati](https://buh.ru/news/kody-statistiki-i-perechen-statisticheskikh-otchetov-onlayn-servis-rosstata-smenil-adres.html)
- Statistics Estonia: [boshqaruv panellari](https://juhtimislauad.stat.ee/en), [eSTAT'da korxonalar o'zini solishtiradi](https://stat.ee/en/uudised/news-release-2019-061), [statistika ilovasi](https://ec.europa.eu/eurostat/de/web/european-statistical-system/-/estonian-statistics-app)
- Eurostat: [European Statistics Competition](https://ec.europa.eu/eurostat/web/education-corner/european-statistics-competition)
- O'zbekiston: [gender.stat.uz](https://gender.stat.uz/en/component/search/), [stat.uz](https://stat.uz/en/)
