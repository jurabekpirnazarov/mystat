# iHamkor tahlili va my.stat.uz'da korxonalar uchun muqobil xizmat

> **Sana:** 2026-10-20
> **Maqsad:** iHamkor (ihamkor.uz) korxonalar haqida nima beradi, shundan qaysi qismini bizdagi ma'lumot (KTUT, hisobotlar, sanoat, tashqi savdo, SIAT) bilan **o'zimizda** qurish mumkin va qaysi qismi uchun tashqi manba kerak. Natija: `/company/:stir` profilini "kontragent kartasi"ga aylantirish rejasi va vazifalar **IH-01..IH-12**.
> **Asos:** `KORXONA_SCORING.md` (scoring KR-29..KR-38, kreditlar KR-39..KR-44, profil KR-45..KR-46), `ISH_REJASI.md` (K-02, K-03, K-04, K-07, S-10, 3-bo'lim qoidalari), `SIAT_KARTA_TAHLIL.md`, `JAHON_TAJRIBASI_TAKLIFLAR.md` (JT-06, JT-07).
> **Qanday ishlatiladi:** Claude Code'ga "IHAMKOR_MUQOBIL.md dagi `IH-03` ni bajar" deyish yetarli. Tartib 9-bo'limda. `ISH_REJASI.md` 2- va 3-bo'limlaridagi qoidalar (xavfsizlik, `payment/` ga tegmaslik, shaxsiy ma'lumot) shu yerda ham amal qiladi.
> **Cheklov:** ihamkor.uz saytiga bevosita kira olmadim (tarmoq ruxsati yo'q), shuning uchun 1-bo'lim saytning "Biz haqimizda" sahifasi va matbuotdagi maqolalarga tayanadi (manbalar oxirida). Maqolalarning bir qismi reklama ("на правах рекламы"), ulardagi da'volar tekshirilmagan.

---

## 0. Kod va baza bilan tekshiruv (2026-10-20)

Hujjatdagi "bizda bor" degan farazlar lokal baza bilan solishtirildi. Natija rejani o'zgartiradi:

| Faraz | Haqiqat |
|---|---|
| KTUT'da faoliyat holati, OKED, hudud, mulkchilik, sana, manzil, rahbar | **Yo'q.** `Ktut` = faqat `inn`, `okpo`, `name` (65 545). OKED va hudud faqat sintetik `EnterpriseIndicator` da |
| Statistik intizom: "o'z vaqtida topshirilgan %" | **Yo'q.** `submitted-report` — statik namuna (stub). Real: faqat majburiy shakllar ro'yxati (`KtutReportList`, 225 798 bog'lanish) |
| Korxona darajasidagi tashqi savdo | **Yo'q.** `TradeData` da STIR yo'q; faqat HS × davlat × yil agregati (3,58 mln qator) |
| Tashqi reyestr (`REGISTER_BASE_URL`) — ustav fondi, rahbar | Kod bor (`services/api/services.py`), lekin lokal `.env` da manzil yo'q — tekshirib bo'lmadi |
| Rasmiy ma'lumotnoma + `/verify` (IH-04) | **Bajarilgan:** JT-04 (`/stat-codes`, `/stat-codes/verify`) — profilga havola qo'yish qoladi |
| — | **Yangi topilma:** `IndustrialProduct` (sanoat, 53 319 qator) da **real** `inn`, `okpo`, `soato`, `adress`, `phone`: 39 189 ishlab chiqaruvchi korxona (KTUT bilan kesishmasi 5 101). Pasportdagi hudud/manzil va "bir manzilda N korxona" uchun real manba |

| ID | Real ma'lumot bilan | Izoh | Holat |
|---|---|---|---|
| IH-08 `/check` tez tekshiruv | ✅ | KTUT + hisobotlar + mahsulotlar + ball (namuna) | ✅ `/check?stir=` / `?q=`, API `company-card/`, Ctrl+K. Ommaviy XLSX va kuzatuv — KR-43 bilan |
| IH-01 Pasport | ⚠️ Qisman | Hudud va manzil faqat sanoatdagi 39 ming korxona uchun; holat/sana/OKED yo'q | ✅ Kartada; profilda hudud endi real manzildan (namuna o'rniga), OKPO `.0` tozalandi |
| IH-02 Xulosa belgilari | ⚠️ Qisman | Real: majburiy hisobotlar soni, ishlab chiqaruvchi (mahsulot turlari), "ommaviy manzil" | ✅ Karta va profilda. `Ktut` to'liq registr emas — "topilmadi" salbiy belgisi ataylab yo'q |
| IH-03 Statistik intizom | ⚠️ Qisman | Faqat majburiy shakllar ro'yxati va davriyligi; "o'z vaqtida %" uchun real manba kerak (OS-11) | ✅ Qisman (shakllar, davriylik); `timely_share: null` |
| IH-04 Rasmiy ko'chirma | ✅ Bajarilgan (JT-04) | Profilga havola qo'shish kerak | ✅ Karta va profilda havola |
| IH-06 Mahsulot profili `/products/:hs` | ✅ (korxonasiz) | HS bo'yicha hajm, USD/kg, davlatlar; ishtirokchi korxonalar yo'q (STIR yo'q) | ✅ K-03 `/market-report` allaqachon qoplaydi (dinamika, narx, davlatlar, HHI) — takrorlanmadi. Qolgan qism uchun HS↔SKP moslik jadvali kerak |
| IH-12 StatCoin narxlari va metodologiya | ✅ | So'mdagi narx egasining qarori kutilmoqda | ⚠️ Metodologiya `/methodology/company-card` ✅; narxlar — egasining qarori. Yangi `CreditPrice` amallari faqat tegishli bo'lim qurilganda qo'shiladi (hozir bunday bo'lim yo'q) |
| IH-05 Bog'langan korxonalar | ⚠️ | Faqat sanoat korxonalari orasida manzil/telefon bo'yicha; OS-26 (huquqiy) hal bo'lmaguncha boshlanmaydi | Kutilmoqda |
| IH-07 Tarmoq `/industry/:oked` | ⚠️ Namuna | Korxonalarning OKED'i sintetik → faqat SIAT agregatlari real | ⏳ |
| IH-11 Karta xulosasi PDF | ✅ | IH-01..03 dan keyin | ✅ `/check` dagi "Karta xulosasi (PDF)" (mavjud `exportElementToPdf`, namuna ballida suv belgisi) |
| IH-09, IH-10 | ❌ | Tashqi manbalar (OS-25, OS-23) | Bloklangan |

**Tavsiya etilgan 1-to'plam (real ma'lumot, huquqiy savolsiz):** IH-08 → IH-01 (sanoat manbasi bilan) → IH-03 → IH-02 → IH-04 havolasi → IH-06.

---

## 1. Qisqa xulosa

1. **iHamkor asosan soliq ma'lumotiga qurilgan.** Uning kuchi: moliyaviy hisobot, to'langan soliq va qarz, soliq tekshiruvlari, mol-mulk, sud va ijro ishlari, davlat xaridlari, litsenziyalar, "bog'langan kompaniyalar" (umumiy ta'sischi, rahbar, buxgalter, manzil, telefon). Bu ma'lumotlar bizda **yo'q**, ularni nusxalash emas, faqat rasmiy integratsiya orqali olish mumkin (6-bo'lim, 3-bosqich).
2. **Bizning kuchimiz statistik ma'lumot**, iHamkor'da bu deyarli yo'q yoki yuzaki: KTUT (65 540 korxona, faoliyat holati, OKED, hudud, mulkchilik), statistik hisobot intizomi (108 shakl, 225 768 bog'lanish), ishlab chiqarilgan mahsulotlar (53 319), tashqi savdo (3,58 mln yozuv, 7330 HS, 251 davlat, 8 yil), hududiy kontekst (SIAT), tengdoshlar bilan solishtirish va 6 ustunli scoring.
3. **Muqobil = "Kontragent kartasi"**: mavjud `/company/:stir` profili (KR-45) ustiga iHamkor'dagi bo'limlar tartibida, lekin **statistik manbalar bilan** qurilgan karta. Birinchi bosqichda faqat bizdagi ma'lumot (8 bo'lim), keyin ochiq davlat ma'lumotlari (sud, xarid, litsenziya, bankrotlik), oxirida soliq integratsiyasi.
4. Iqtisodiy model tayyor: KR-40 kredit hamyoni va tariflar. Yangi bo'limlar yangi `CreditPrice` amallari sifatida qo'shiladi, to'lov kodi o'zgarmaydi.
5. iHamkor bilan to'g'ridan-to'g'ri raqobat emas, **to'ldiruvchi** pozitsiya to'g'ri: "korxona nima ishlab chiqaradi, kimga eksport qiladi, tarmog'ida qanday o'rinda, statistik intizomi qanday" savollariga faqat qo'mita javob bera oladi. Rasmiy qo'mita ma'lumotnomasi (QR bilan tekshiriladigan PDF) iHamkor bera olmaydigan narsa.

---

## 2. iHamkor nima beradi

**Kim:** DEFEN FINANCIAL MChJ, davlat-xususiy sheriklik shartnomasi (2022-05-24) asosida; soliq to'lovchi ma'lumotini uchinchi shaxslarga berish VM 2021-08-19 dagi 529-son qaroriga tayanadi. Venkon guruhi (1C, Didox) bilan bog'liq; Didox'dagi "Kontragentni tekshirish" funksiyasi iHamkor orqali ishlaydi. 2024-avgustda 5000+ foydalanuvchi deyilgan.

### 2.1. Mahsulotlar

| Mahsulot | Tarkibi |
|---|---|
| **Soliq to'lovchi kartasi** | Ro'yxat, aloqa va statistik rekvizitlar; ta'sischilar va ustav fondi; moliyaviy va buxgalteriya hisoboti (balans); to'langan soliqlar va qarz; soliq tekshiruvlari; mol-mulk va ijara |
| Karta bo'limlari (2025-oktabr yangilanishi) | Sud va ijro ishlari (ishlar soni, roli, undiruv summasi); davlat xaridlari (tender, shartnoma, buyurtmachi, hajm); moliya (tushum, foyda, rentabellik, tarmoq bilan solishtirish); soliqlar (dinamika, hudud/respublika bo'yicha o'rin); aktivlar (qoplash, moliyaviy mustaqillik, ROA, tushum o'sishi); **barqarorlik reytingi** va kredit profili; litsenziya va sertifikatlar |
| **Bog'langan kompaniyalar** (2026-avgust) | Umumiy manzil, telefon, ta'sischi, rahbar, buxgalter orqali bog'lanish grafi; bog'langan korxonaning moliya, soliq, yoshi, holati |
| **Mahsulot profili** | Haqiqiy narx dinamikasi va oralig'i, yetkazib berish geografiyasi, bozor ishtirokchilari (e-faktura ma'lumotiga o'xshaydi) |
| **Tarmoq tahlili** | Bozor hajmi, mijoz segmentlari, raqobat, asosiy mahsulotlar va o'yinchilar, trend hisobotlari |
| **Indeks** | Reyting sahifasi (metodologiyasi ochiq emas) |
| Rejada | Sodiqlik dasturi (cheklar, e-faktura tahlili), markirovka kabineti |
| **API** | Startaplar uchun bepul API dasturi (2025-iyun) |

### 2.2. Kirish va narx

- Ochiq ma'lumot bepul; o'z korxonasi haqida ma'lumot bepul.
- Moliya va soliq bloki: 2024-yilda **100 000 so'm**; 2025-oktabrdan obuna (obuna davomida karta cheksiz qayta ochiladi). Aniq tariflar ochiq sahifada ko'rinmadi.
- Yopiq ma'lumot: egasining ruxsati bilan (so'rov ERI bilan imzolanadi, egasi soliq kabineti yoki iHamkor'da tasdiqlaydi).
- Kirish ERI bilan; Didox ichida bazaviy karta bepul.

### 2.3. Bozordagi boshqa o'yinchilar (kontekst)

- **Soliq qo'mitasi**: my3.soliq.uz (holat, QQS guvohnomasi, qarz), Tax Gap koeffitsienti, "Tadbirkorlik subyektlarining barqarorlik reytingi" (AAA–D, 20+ mezon, yashil/sariq/qizil zona).
- **my.gov.uz**: bankrotlik haqida ma'lumotnoma (bepul).
- **stat.uz**: KTYaDR ma'lumotnomasi (ERI bilan, faoliyat holati). Bu bizning o'z xizmatimiz va muqobilning poydevori.
- **Azma Focus**: soliq qarzi va ishonchlilik reytingi (AI tahlil).

---

## 3. Solishtirish: iHamkor bo'limi ↔ bizdagi ma'lumot

Holat: **Bor** = bizda real ma'lumot bor; **Qisman** = bir qismi bor yoki faqat sintetik namuna; **Yo'q** = tashqi manba kerak.

| iHamkor bo'limi | Bizdagi manba | Holat | Bizda qanday bo'ladi | Vazifa |
|---|---|---|---|---|
| Ro'yxat rekvizitlari (nomi, STIR, OKPO, shakl, OKED, manzil) | KTUT | **Bor** | Profil 1-bo'limi (KR-45), bepul | IH-01 |
| Faoliyat holati (faol / tugatilgan) | KTUT (KTYaDR) | **Bor** (maydon nomi aniqlash kerak) | Rangli holat belgisi, tugatilgan sanasi | IH-01 |
| Ta'sischilar, ustav fondi, rahbar | Tashqi reyestr (`REGISTER_BASE_URL`), KTUT | **Qisman** | Ustav fondi va rahbar **lavozimi** ko'rsatiladi, F.I.Sh. va PINFL yo'q (7-bo'lim). Ta'sischi korxonalar (yuridik shaxs bo'lsa) havola bilan | IH-01, IH-05 |
| Moliyaviy hisobot (tushum, foyda, balans) | Qo'mitaning yillik korxona hisobotlari (shakllar `ReportList` da); hozir S-10 sintetik | **Qisman** | Xom raqam emas, **tengdoshlardagi o'rin** (OS-22 default); o'z korxonasiga to'liq | KR-31, IH-02 |
| Rentabellik, ROA, tarmoq bilan solishtirish | S-10 + KTUT guruhlari | **Qisman** | Scoring M ustuni, K-02 benchmark taqsimoti | KR-31 |
| Soliq to'lovlari, qarz | Soliq qo'mitasi | **Yo'q** | 3-bosqich: faqat "qarz bor/yo'q" bayrog'i (S-ustun allaqachon kutadi) | IH-10 |
| Soliq tekshiruvlari, mol-mulk, ijara | Soliq qo'mitasi | **Yo'q** | Qilinmaydi (bizning vakolat emas) | — |
| Sud va ijro ishlari | Sud portali, MIB | **Yo'q** | 2-bosqich: ishlar soni va roli, ochiq manbadan | IH-09 |
| Davlat xaridlari | Davlat xaridlari portali (ochiq) | **Yo'q** | 2-bosqich: ishtirok soni, g'oliblik, hajm | IH-09 |
| Litsenziya va sertifikatlar | Litsenziyalar reyestri (ochiq) | **Yo'q** | 2-bosqich: ro'yxat va amal qilish muddati | IH-09 |
| Barqarorlik reytingi | Soliq qo'mitasi reytingi | **Yo'q** | Biz o'z scoringimizni beramiz (6 ustun, ochiq metodologiya); rasmiy reyting ruxsat bo'lsa yonida manba bilan | KR-31, IH-10 |
| Bog'langan kompaniyalar | KTUT (manzil, rahbar, ta'sischi), `Organization` | **Qisman** (maydonlar aniqlash kerak) | Graf: umumiy manzil, umumiy rahbar (xeshlangan), yuridik shaxs ta'sischi. Shaxs nomi chiqmaydi | IH-05 |
| Mahsulot profili (narx, geografiya, o'yinchilar) | Tashqi savdo (3,58 mln, HS, davlat, og'irlik), sanoat (53 319) | **Bor** (eksport-import bo'yicha) | HS bo'yicha eksport narxi (USD/kg), davlatlar, eksportchilar ro'yxati; ichki narx yo'q | IH-06, K-03 |
| Tarmoq tahlili | KTUT (OKED × hudud), sanoat, tashqi savdo, SIAT | **Bor** | Tarmoq sahifasi: korxonalar soni va dinamikasi, hududlar, eksport, sinflar taqsimoti | IH-07 |
| Indeks (reyting) | Scoring (KR-31), hudud indeksi (`SCORING_MODEL.md`) | **Bor** (namuna) | Tarmoq/hudud bo'yicha **agregat** reytinglar; korxona reytingi OS-18 ga bog'liq | IH-07, KR-37 |
| Kuzatuv (monitoring) | KR-43 | **Bor** (rejada) | Holat, sinf, bayroq, sud/xarid hodisalari bo'yicha xabarnoma | IH-08 |
| Ommaviy tekshiruv, API | KR-43, KR-44 | **Bor** (rejada) | STIR ro'yxati → karta xulosasi | IH-08 |

**Faqat bizda bor, iHamkor'da yo'q:**

| Bizning blok | Manba | Kim uchun qadrli |
|---|---|---|
| Statistik hisobot intizomi (o'z vaqtida topshirish %) | `KtutReportList` + `submitted-report` (real) | Banklar, ta'minot bo'limlari: "davlat oldidagi majburiyatlarga munosabati" signali |
| Ishlab chiqarilgan mahsulotlar ro'yxati | Sanoat jadvali (real) | Xaridor: "bu korxona haqiqatan ishlab chiqaruvchimi yoki vositachimi" |
| Korxona darajasidagi tashqi savdo | Tashqi savdo (real, STIR bog'lanishi bo'lsa) | Eksport hamkori qidiruvchi, bank (valyuta tushumi) |
| Tengdoshlar guruhidagi o'rin (6 ustun) | Scoring | Hamma: xom raqam o'rniga solishtirma |
| Inklyuzivlik (ayollar, yoshlar, nogironlik kvotasi) | Scoring I ustuni | Xalqaro tashkilotlar, ESG talabi bor xaridorlar |
| Hududiy kontekst | SIAT, hudud indeksi | Investor, lizing |
| Rasmiy qo'mita ma'lumotnomasi (QR) | KTUT | Tender hujjatlari, bank: rasmiy manbadan hujjat |

---

## 4. Muqobil: "Kontragent kartasi" (`/company/:stir` kengaytmasi)

Yangi sahifa ochilmaydi: KR-45 dagi profil kengaytiriladi, bo'limlar iHamkor foydalanuvchisiga tanish tartibda. Hamma bo'lim bitta `GET /api/analytics/company-profile/<stir>/` javobida, har biri `{locked, unlock_price, source, as_of}` bilan (KR-39 darvozasi).

### 4.1. Bo'limlar

| # | Bo'lim | Tarkibi | Manba | Kirish |
|---|---|---|---|---|
| 1 | **Pasport** | Nomi, STIR, OKPO, tashkiliy-huquqiy shakl, OKED (bo'lim, bo'linma, nomi), hudud/tuman, mulkchilik, tashkil topgan sana va yoshi, **faoliyat holati**, ustav fondi, xodimlar oralig'i ("11–50") | KTUT, reyestr, S-10 | Bepul |
| 2 | **Xulosa (bir qarashda)** | Umumiy ball va sinf; 3–5 ta svetofor belgisi: "Faol · 9 yil", "Hisobot intizomi 100%", "Eksportchi · 4 davlat", "Ishlab chiqaruvchi · 12 mahsulot", "Bog'langan 3 korxona"; to'liqlik | Hamma bloklardan | Bepul (belgilar); batafsil pullik |
| 3 | **Ball nimaga asoslangan** | KR-45 dagi 6 ustun, waterfall, bayroqlar, tengdoshlar o'rni | Scoring | 1 kredit |
| 4 | **Statistik intizom** | Majburiy shakllar soni, so'nggi 12 oyda o'z vaqtida topshirilgan ulush, kechikishlar oylar bo'yicha (shakl nomi bilan, summasiz) | `KtutReportList`, `submitted-report` | Ulush bepul, tarix 1-bo'lim krediti ichida |
| 5 | **Faoliyat: mahsulot va savdo** | Ishlab chiqarilgan mahsulot turlari (sanoat jadvali); eksport/import: HS guruhlari, davlatlar, yillar dinamikasi (hajm **oraliq** ko'rinishida yoki tarmoqdagi o'rin) | Sanoat, tashqi savdo | Ro'yxat bepul, dinamika 1 kredit |
| 6 | **Bog'langan korxonalar** | Graf va ro'yxat: umumiy manzil, umumiy rahbar, ta'sischi-korxona; har tugunda nom, holat, ball, sinf, profilga havola; "bog'lanish o'z-o'zidan qoidabuzarlik emas" izohi | KTUT, reyestr | 2 kredit |
| 7 | **Tarmoq va hudud konteksti** | Shu OKED × hududdagi korxonalar soni va o'sishi, ochilish/yopilish (JT-07), sinflar taqsimoti, hudud indeksi, korxonaning tarmoqdagi o'rni | KTUT, SIAT, scoring agregat | Chuqur tahlil (3 kredit) ichida |
| 8 | **Tashqi ma'lumotlar** (2-bosqich) | Sud ishlari soni va roli, davlat xaridlari (ishtirok, g'oliblik, hajm), litsenziyalar, bankrotlik belgisi; har biri manba havolasi va sana bilan | Ochiq davlat portallari | 1 kredit |
| 9 | **Soliq signali** (3-bosqich) | Faqat "qarz bor/yo'q", QQS guvohnomasi holati, rasmiy barqarorlik reytingi (ruxsat bo'lsa) | Soliq qo'mitasi | 1 kredit |
| 10 | **Rasmiy ma'lumotnoma** | KTUT ko'chirmasi PDF: qo'mita rekvizitlari, sana, QR va `/verify` havolasi; demo muhitda "NAMUNA" | KTUT | 1 kredit (o'z korxonasiga bepul) |
| 11 | **Kuzatuv** | Holat, sinf, bayroq, yangi bog'lanish, sud/xarid hodisasi bo'yicha xabarnoma | Hammasi | Tarif 90, korporativ |

### 4.2. Qoidalar

- **Har raqam yonida manba va sana**: "KTUT, 2026-10-14", "Tashqi savdo, 2025". Real/namuna belgisi (S-09) saqlanadi.
- **Xom moliyaviy raqamlar begona korxona uchun chiqmaydi** (KORXONA_SCORING 6-bo'lim, OS-22). iHamkor ularni soliq qaroriga asosan ko'rsatadi; bizda bunday huquqiy asos yo'q, shuning uchun solishtirma (percentil, oraliq) beriladi.
- **Ochilmagan bo'lim ma'lumoti backend'dan kelmaydi** (KR-39).
- **"Karta xulosasi" PDF** (bank va ta'minot bo'limi uchun): 1-sahifada pasport, xulosa belgilar, ball, bayroqlar; keyin ochilgan bo'limlar. KR-43 dagi "Kredit xulosasi" shu shablon asosida.

### 4.3. Bog'langan korxonalar algoritmi (IH-05)

```text
Tugunlar: KTUT korxonalari (STIR)
Qirralar (tur, og'irlik):
  same_address   normallashtirilgan manzil (hudud+tuman+ko'cha+uy) teng      0.5
  same_head      rahbar PINFL'i teng  -> faqat sha256(PINFL + maxfiy tuz) taqqoslanadi   1.0
  founder_org    A korxona B ning ta'sischisi (yuridik shaxs, reyestrdan)   1.0
  same_phone     telefon teng (xeshlangan)                                   0.5
Chegaralar:
  - bitta manzilda 30+ korxona (biznes-markaz, "ommaviy manzil") -> same_address qirrasi tuzilmaydi, belgi "ommaviy manzil"
  - grafda 2 qadamgacha, ko'pi bilan 50 tugun
Chiqish: tugun -> nom, holat, OKED, ball/sinf; qirra -> bog'lanish turi (matn), shaxs ma'lumoti YO'Q
```

- Xesh jadvali `CompanyLink(stir_a, stir_b, kind, weight, computed_at)` haftalik Celery vazifasi bilan qayta hisoblanadi; PINFL va telefon xom holda yangi jadvalga yozilmaydi.
- Xulosa belgilari: "Ommaviy manzil", "Rahbar yana 12 korxonada", "Bog'langan korxonalardan 2 tasi tugatilgan" (xavf signali, ballga ta'sir qilmaydi; scoringga kiritish OS-24).

---

## 5. Korxona darajasidagi qo'shimcha modullar

### 5.1. Mahsulot profili (IH-06): iHamkor "Продукция" muqobili

`/products/:hs` (yoki K-03 `/market-report` ning korxonalar yorlig'i):
- HS kodi bo'yicha: eksport va import hajmi, o'rtacha narx USD/kg yillar bo'yicha, narx oralig'i (p10–p90), asosiy davlatlar, konsentratsiya (Herfindahl, K-03 da bor).
- **Ishtirokchilar**: shu HS bo'yicha eksportchi/importchi korxonalar (savdo ma'lumotida STIR bo'lsa), har biri ball badge'i va profil havolasi bilan, ulushi oraliqda.
- Ichki ishlab chiqaruvchilar: sanoat jadvalidagi mos mahsulot (HS ↔ mahsulot klassifikatori moslashtirish jadvali kerak, aniqlash kerak).
- Ichki narx (e-faktura) bizda yo'q: blok "Ichki bozor narxi: manba ulanmagan" deb yashirinadi.

### 5.2. Tarmoq tahlili (IH-07): iHamkor "Отраслевой анализ" muqobili

`/industry/:oked` sahifasi (mavjud `/industry` dan farqli: OKED kesimi):
- Korxonalar soni va dinamikasi, ochilish/yopilish (JT-07), hududlar bo'yicha xarita (KR-05 karta API'si).
- O'lcham tarkibi (oraliqlar), mulkchilik tarkibi.
- Sinflar taqsimoti va ustunlar medianasi (KR-37 agregatlari).
- Tarmoq eksporti: HS guruhlari, davlatlar (tashqi savdo × OKED bog'lanishi orqali).
- SIAT dagi tarmoq ko'rsatkichlari (ishlab chiqarish hajmi, ish haqi).
- "Top korxonalar" ro'yxati faqat ball bo'yicha va faqat OS-18 ruxsat bersa; aks holda faqat agregat.
- PDF "Tarmoq hisoboti" (3 kredit) — iHamkor trend hisobotlariga muqobil.

### 5.3. Kontragent tekshiruvi (IH-08): ommaviy va kuzatuv

KR-43 ni kontragent stsenariysiga moslash:
- **Tez tekshiruv** `/check`: bitta qidiruv maydoni (STIR yoki nom), natija 4.1 dagi 1–2 bo'lim (bepul). Bosh sahifa va `/all-services` katalogiga (XS-01) yangi yozuv.
- **Ommaviy**: XLSX (STIR ustuni) → holat, yosh, intizom %, sinf, bayroqlar, bog'langanlar soni; 0,5 kredit/qator (KR-43 narxi).
- **Kuzatuv hodisalari**: holat o'zgardi (tugatildi), sinf o'zgardi, yangi bayroq, yangi bog'lanish, hisobot kechikdi, (2-bosqich) yangi sud ishi.
- Didox/1C bilan integratsiya **qilinmaydi** (raqobatchi guruh); o'rniga ochiq API (KR-44) va XLSX.

### 5.4. Rasmiy ma'lumotnoma (IH-04)

stat.uz dagi KTYaDR ma'lumotnomasining my.stat.uz dagi davomi: STIR → PDF ko'chirma (rekvizitlar, faoliyat holati, sana), QR → `/verify/<hash>` ochiq sahifa (hujjat haqiqiyligini tekshirish, `stat-hisobot/ANALIZ.md` D4 yondashuvi). Bu iHamkor bera olmaydigan, qo'mitaga xos qiymat: tender va bank uchun rasmiy manbadan hujjat.

---

## 6. Ma'lumot manbalari va bosqichlar

| Bosqich | Manbalar | Nima ochiladi | Bog'liqlik |
|---|---|---|---|
| **1. Faqat bizdagi** | KTUT, `KtutReportList`, sanoat, tashqi savdo, SIAT, S-10/scoring (demo'da namuna) | 4.1 dagi 1–7, 10, 11-bo'limlar; IH-06, IH-07 | KR-31, KR-39, KR-40, KR-45 |
| **2. Ochiq davlat ma'lumotlari** | Davlat xaridlari portali, sud qarorlari portali, litsenziyalar reyestri, bankrotlik (my.gov.uz), data.gov.uz | 8-bo'lim; kuzatuv hodisalari | Har manba uchun foydalanish shartlari va API mavjudligi tekshiriladi (OS-25); skreyping faqat ruxsat bilan |
| **3. Idoralararo integratsiya** | Soliq qo'mitasi (qarz, QQS, barqarorlik reytingi), MIB, adliya (ta'sischilar) | 9-bo'lim; S-ustundagi `s_tax` real bo'ladi | Qo'mita rahbariyati darajasida kelishuv (OS-23); VM 529-son qaror bo'yicha huquqiy asos |

Har import qilingan qator `sources` maydonida `real` deb belgilanadi (KORXONA_SCORING 8-bo'lim qoidasi), sintetik qiymat `--flush` bilan olib tashlanadi.

---

## 7. Huquqiy va shaxsiy ma'lumot cheklovlari

| Masala | Qaror |
|---|---|
| Rahbar va ta'sischi (jismoniy shaxs) F.I.Sh., PINFL, telefon | **Chiqmaydi**, eksportga kirmaydi (ISH_REJASI 3-bo'lim 4-qoida, K-04). Bog'lanish faqat xesh bilan hisoblanadi |
| Begona korxonaning xom moliyaviy raqamlari | Chiqmaydi (OS-22); percentil va oraliq |
| Begona korxona bali ochiq sahifada | OS-18 (default: productionda faqat agregat). Kontragent kartasi pullik bo'lsa ham shu sozlama amal qiladi |
| Bog'langan korxonalar | "Bog'lanish qoidabuzarlik emas" izohi har doim; ommaviy manzillar filtrlanadi |
| Tashqi manbalar | Har blokda manba havolasi va sana; manba ishlamasa blok yashirinadi, xato emas |
| Rasmiy ma'lumotnoma | Faqat KTUT maydonlari; demo'da "NAMUNA" suv belgisi, rasmiy logotip yo'q |

---

## 8. Tariflar: iHamkor bilan solishtirish

| | iHamkor | my.stat.uz (taklif) |
|---|---|---|
| Bazaviy karta | Bepul | Bepul: pasport, holat, ball, xulosa belgilari, intizom % |
| Moliya/soliq bloki | 100 000 so'm (2024), keyin obuna | Soliq bloki 3-bosqichda; moliya solishtirma ko'rinishda ball tarkibi ichida (1 kredit) |
| Chuqur tahlil | Obuna | 3 kredit (KR-45), Tarif 60+ |
| Bog'langan korxonalar | Obuna ichida | 2 kredit |
| Rasmiy ma'lumotnoma | Yo'q | 1 kredit |
| Ommaviy, API, kuzatuv | API startaplarga bepul | Korporativ tarif (KR-43, KR-44) |
| O'z korxonasi | Bepul | Hammasi bepul + tavsiyalar |

Yangi `CreditPrice` amallari: `profile_links` = 2, `profile_external` = 1, `profile_tax` = 1, `official_extract` = 1, `industry_report` = 3, `product_report` = 3 (K-03 PDF bilan birlashtirish OS-21 da). Hammasi admin qiymati; kredit narxi so'mda K-09 kalkulyatoridan, iHamkor narxidan past bo'lishi tavsiya etiladi (bizda soliq bloki yo'q).

---

## 9. Vazifalar (IH-01..IH-12)

Old shartlar: KR-31 (scoring), KR-39 (darvoza), KR-40 (hamyon), KR-45 (profil). Har vazifa uchun `ISH_REJASI.md` 3-bo'lim qoidalari, demo muhitda S-09 belgisi.

### IH-01 · Pasport bo'limini kengaytirish · **P1**
1. KTUT modelidan faoliyat holati, tashkil topgan/tugatilgan sana, OKPO, tashkiliy-huquqiy shakl maydonlarini topish (aniqlash kerak; yo'q bo'lsa PR'da yoziladi).
2. Reyestrdan (`REGISTER_BASE_URL`) ustav fondi va rahbar lavozimi; 3 s timeout, ishlamasa blok yashirinadi.
3. Xodimlar oralig'i S-10 dan.
**Qabul:** tugatilgan korxonada qizil "Tugatilgan" belgisi; javobda PINFL, telefon, F.I.Sh. yo'q (test).

### IH-02 · Xulosa belgilari · **P1**
Backend `summary_badges` ro'yxati (kod, matn, rang, manba). Qoidalar `company_card.yaml` da (yosh, intizom, eksport, mahsulot, bog'lanish, ommaviy manzil). **Qabul:** har belgi tooltip'da manba va sana; ma'lumot yo'q belgi chiqmaydi.

### IH-03 · Statistik intizom bloki · **P1**
`KtutReportList` va `submitted-report` dan 12 oylik jadval. **Qabul:** real ma'lumotda ishlaydi (sintetik kerak emas); topshirish kalendari yo'q korxonada "Majburiy hisobot yo'q".

### IH-04 · Rasmiy KTUT ko'chirmasi va `/verify` · **P1**
PDF (reportlab yoki mavjud PDF vositasi), QR, `OfficialExtract(hash, stir, created_at, created_by)`; `/verify/<hash>` ochiq sahifa faqat nom, STIR, sana, holat. **Qabul:** o'zgartirilgan PDF xeshi "mos emas"; demo'da "NAMUNA".

### IH-05 · Bog'langan korxonalar · **P1**
4.3 algoritmi; `CompanyLink` jadvali, haftalik Celery Beat; frontend graf (loyiha kutubxonasi, yo'q bo'lsa ro'yxat ko'rinishi). **Qabul:** 30+ korxonali manzil qirra bermaydi (test); API javobida xom PINFL/telefon yo'q (test); 2 kredit bilan ochiladi.

### IH-06 · Mahsulot profili `/products/:hs` · **P2**
5.1; K-03 bilan umumiy servis. **Qabul:** narx faqat og'irligi bor yozuvlardan; ishtirokchilar faqat STIR bog'lanishi bo'lsa, aks holda blok yo'q.

### IH-07 · Tarmoq tahlili `/industry/:oked` · **P2**
5.2; KR-37 agregatlari, JT-07 demografiyasi. **Qabul:** guruhda 10 dan kam korxona bo'lsa agregat ko'rsatilmaydi (maxfiylik); OS-18 o'chiq bo'lsa "top korxonalar" yo'q.

### IH-08 · Tez tekshiruv `/check`, ommaviy tekshiruv va kuzatuv hodisalari · **P1**
5.3; KR-43 ga yangi hodisa turlari; XS-01 katalogiga yozuv. **Qabul:** ommaviy XLSX natijasida shaxsiy ustun yo'q; holat o'zgarishi xabarnomasi test bilan.

### IH-09 · Tashqi ochiq manbalar (2-bosqich) · **P2**
Har manba uchun alohida konnektor (`external_sources/<manba>.py`), kesh 24 soat, manba sanasi. Avval OS-25 bo'yicha foydalanish shartlari. **Qabul:** manba o'chiq bo'lsa sahifa ishlaydi, blok yashirin.

### IH-10 · Soliq signali (3-bosqich) · **P3**
OS-23 kelishuvidan keyin. `s_tax` real manbaga o'tadi, scoring qayta hisoblanadi.

### IH-11 · "Karta xulosasi" PDF · **P2**
4.2 shabloni; KR-43 "Kredit xulosasi" bilan bitta shablon. **Qabul:** faqat ochilgan bo'limlar kiradi; "rasmiy baho emas" izohi.

### IH-12 · Kreditlar, katalog va metodologiya · **P1**
8-bo'limdagi `CreditPrice` amallari (migratsiya bilan, admin'da tahrirlanadi), `/tariffs` jadvaliga qatorlar, `/methodology/company-card` sahifasi (bo'limlar, manbalar, cheklovlar). **Qabul:** narxlar kodda qattiq yozilmagan.

### Bajarish tartibi

```text
KR-31, KR-39, KR-40, KR-45 (old shart)
   └─ IH-01 → IH-02 → IH-03 → IH-12        (1-bosqich yadrosi, real ma'lumot)
   └─ IH-04                                 (mustaqil)
   └─ IH-05 → IH-08 → IH-11
   └─ IH-06, IH-07                          (K-03, KR-37 dan keyin)
   └─ IH-09 (OS-25) → IH-10 (OS-23)
```

---

## 10. Ochiq savollar

| ID | Savol | Default | Vazifa |
|---|---|---|---|
| OS-23 | Soliq qo'mitasidan qarz/QQS/barqarorlik reytingini olish bo'yicha kelishuvga boriladimi? | Hozircha yo'q; 1–2-bosqich bilan boshlanadi | IH-10 |
| OS-24 | Bog'langan korxonalar signali ("tugatilgan bog'langanlar") scoringga kirsinmi? | Yo'q, faqat xulosa belgisi | IH-05 |
| OS-25 | Ochiq davlat portallari (xarid, sud, litsenziya) ma'lumotini avtomatik olishga ruxsat va API bormi? | Har manba alohida tekshiriladi; ruxsatsiz skreyping yo'q | IH-09 |
| OS-26 | KTUT'da rahbar PINFL'i, ta'sischilar va to'liq manzil maydonlari bormi va ulardan bog'lanish hisoblash huquqiy jihatdan mumkinmi? | Xesh bilan, faqat korxona-korxona bog'lanishi; huquqiy bo'lim tasdig'i kerak | IH-05 |
| OS-27 | Rasmiy ko'chirma my.stat.uz'da pullik bo'lishi stat.uz dagi bepul KTYaDR ma'lumotnomasi bilan ziddiyat emasmi? | O'z korxonasiga bepul, boshqalarga 1 kredit; stat.uz xizmati o'zgarmaydi | IH-04 |

---

## Manbalar

- iHamkor, "Информация о платформе": https://ihamkor.uz/ru/about ; bosh sahifa: https://ihamkor.uz/ru
- Gazeta.uz, "Карточка компании в один клик" (2025-10-03, reklama): https://www.gazeta.uz/ru/2025/10/03/ihamkor/
- Spot.uz, "iHamkor начал предоставлять сведения о связанных компаниях" (2026-08-18, reklama): https://www.spot.uz/ru/2026/08/18/ihamkor/ ; teg sahifasi: https://www.spot.uz/ru/tag/ihamkor/
- Uznews.uz, iHamkor haqida (2024-08-14, reklama, narx 100 000 so'm): https://uznews.uz/ru/news/75758
- Buxgalter.uz, "Kontragentning to'lov qobiliyatini qanday tekshirish mumkin: 3 ta xizmat": https://buxgalter.uz/oz/publish/doc/text189551_kontragentning_moliyaviy_holatini_qanday_tekshirish_mumkin
- Azma.uz, "Как проверять контрагента в Узбекистане в 2026": https://azma.uz/tpost/vkxx3yier1-kak-proveryat-kontragenta-v-uzbekistane
