# my.stat.uz: lex.uz andozasi va gov.uz tahlili asosida UI qayta tuzilmasi

> **Sana:** 2026-10-30 · **Versiya:** 2 (v1: 2026-10-29, faqat gov.uz)
> **Egasining so'rovlari:** (1) 2026-10-29: `gov.uz/oz`, `gov.uz/oz/uzbmb`, `pm.gov.uz/oz` dizaynini tahlil qilib, UI ni qayta tuzish. (2) **2026-10-30: `lex.uz` ni tahlil qilib, undan andoza olish, "my.stat.uz dizayn jihatidan shunga o'xshab ketsin".**
> **v2 da nima o'zgardi:** ommaviy qismning (S va G zona) asosiy andozasi endi **lex.uz**. gov.uz saytlaridan olingan qoidalar (GV) qoladi, lekin ba'zilari lex.uz andozasiga moslab o'zgardi (3.2-jadval). Kabinet (M zona) o'zgarmaydi.
> **Hozirgi holat manbasi:** `loyiha_umumiy.mmd`, `loyiha_dizayn.mmd`, [`HIBRID_DIZAYN.md`](HIBRID_DIZAYN.md) (Z-01..Z-17, H0..H13).
> **Ustunlik:** bu hujjat `HIBRID_DIZAYN.md` ga delta. Ikkalasi farq qilsa, shu hujjatdagi LX va GV qatorlari to'g'ri. `--ds-*` rang tokenlari, `components/ds/` papkasi, H-qadamlar tartibi va kabinet (`AppShell`) o'zgarmaydi.
> **Kim bajaradi:** foydalanuvchi kompyuteridagi Claude Code, `mystat` repo'sida (8-bo'lim promptlari).
> **Cheklov (halol yozilgan):** to'rtala sayt bu muhitdan brauzerda ochilmadi (proksi to'sdi). Sahifalar **matni, menyu bandlari, bo'limlar tartibi, forma maydonlari va havolalari** WebFetch orqali olindi. **Ranglar, shriftlar, o'lchamlar va skrinshotlar olinmadi.** Ularni o'lchash uchun GV-00 qadami bor (lokal Playwright, endi lex.uz bilan). Hujjatdagi hech bir hex qiymat bu saytlardan olingan emas.

---

## 0. Qisqacha

1. **lex.uz nima beradi:** u "rasmiy ma'lumotlar bazasi" turidagi sayt. Bosh sahifaning markazi **qidiruv paneli** (Universal / Kengaytirilgan, filtrlar chip ko'rinishida), keyin **sohalar ro'yxati** (matnli havolalar), **yangi hujjatlar raqamlangan jadvali**, **bazadagi hujjatlar hisoblagichlari** va **foydali resurslar**. Bezak yo'q, rasm yo'q, hamma narsa ro'yxat va jadval. Hujjat sahifasida **rekvizitlar bloki**, **tahrirlar (versiyalar) navigatsiyasi** `?ONDATE=`, **har bir bandga havola**, "Ko'rinish A A A" va til versiyalari bor.
2. **Bu statistika portaliga juda mos keladi:** ko'rsatkich ham hujjat kabi rekvizitli (manba, davriylik, kod, yangilangan sana), versiyali (ma'lumot qayta ko'rib chiqiladi) va qidiriladigan obyekt. Shuning uchun lex.uz tuzilmasi my.stat.uz ning **ommaviy qismi uchun asosiy andoza** bo'ladi.
3. **Nima o'zgaradi:** ommaviy header (rasmiy to'liq nom, "Ko'rinish A A A", tillar qisqa kod bilan, 6 bandli katta harfli menyu), bosh sahifa (Statista uslubidagi grafik kartochkalar o'rniga **qidiruv paneli + ro'yxat va jadvallar**), ko'rsatkich sahifasi (**lex.uz hujjat sahifasi tuzilmasi + Statista grafigi** ichida), footer (lex.uz kabi ixcham). Batafsil: 7.1-jadval.
4. **Nima o'zgarmaydi:** uch zona (S, G, M) va ularning vazifasi, `--ds-*` ranglari (bizning to'q ko'k brand lex.uz ning rasmiy, sokin ko'rinishiga allaqachon mos), shrift Inter, kabinet my.soliq/my.mehnat uslubida, H0..H13 tartibi, "har raqamda manba va davr" qoidasi.
5. **Yangi qoidalar:** LX-01..LX-14 (lex.uz dan) va GV-00..GV-15 (gov.uz dan, v1). Yangi H-qadam yo'q, hammasi mavjud qadamlar ichida.

---

## Mundarija

1. [Saytlar tahlili](#1-saytlar-tahlili)
2. [Solishtirish jadvali](#2-solishtirish-jadvali)
3. [Qoidalar: LX (lex.uz) va GV (gov.uz)](#3-qoidalar)
4. [Yangilangan UI tuzilmasi](#4-yangilangan-ui-tuzilmasi)
5. [Sahifama-sahifa o'zgarishlar](#5-sahifama-sahifa-ozgarishlar)
6. [Takrorlanmaydigan xatolar](#6-takrorlanmaydigan-xatolar)
7. [O'zgargan qarorlar va ochiq savollar](#7-ozgargan-qarorlar-va-ochiq-savollar)
8. [Migratsiya: H-qadamlarga joylash va Claude Code promptlari](#8-migratsiya)
9. [Tekshiruv ro'yxatiga qo'shimcha](#9-tekshiruv-royxatiga-qoshimcha)

---

## 1. Saytlar tahlili

### 1.1. `lex.uz` — bosh sahifa (asosiy andoza)

**Vazifasi:** O'zbekiston Respublikasi Qonunchilik ma'lumotlari milliy bazasi. Egasi: Adliya vazirligi qoshidagi "Adolat" milliy huquqiy axborot markazi. Foydalanuvchi hujjat **izlaydi**, sohalar bo'yicha **ko'radi**, yangi hujjatlarni **kuzatadi**.

| Qism | Nima bor (aniq matnlar) | Kuzatuv |
|---|---|---|
| **Yuqori qator** | Telegram (2 kanal), Facebook, Instagram, YouTube · **"Ko'rinish"** + uchta "A" tugmasi (matn o'lchami) · tillar **O'ZB · ЎЗБ · РУС · ENG** (qatorda, ochiluvchi ro'yxat emas) · "ONLINE TRANSLATE" · **"Kirish"** | Til va matn o'lchami **bir bosishda**, menyusiz |
| **Logo va nom** | Globus belgisi (ai.lex.uz ga havola) + LEX.UZ logotipi + to'liq rasmiy nom: **"O'zbekiston Respublikasi Qonunchilik ma'lumotlari milliy bazasi"** | Nom qisqartirilmaydi — rasmiylik belgisi |
| **Menyu** | 5 ochiluvchi + 1 havola, **katta harflar bilan**: RASMIY HUJJATLAR (Bugun · Haftalik · Oylik · Kalendar) · TIZIM HAQIDA (qo'llanma, rekvizitlar, izlash rekvizitlari, axborot shartlari, foydalanish shartlari, oflayn versiya) · NASHRLAR (qonunchilik to'plami, xalqaro shartnomalar to'plami, kutubxona) · MA'LUMOTNOMALAR (davlat ramzlari, ensiklopedik lug'at, klassifikator, **hisobotlar shakllari**, BHMS, **LexUz statistikasi**, qo'llanmalar, **BHM kalkulyatori**) · HUQUQIY TUSHUNTIRISHLAR | Menyu **mazmun turi** bo'yicha: hujjatlar (vaqt bo'yicha), tizim, nashrlar, ma'lumotnomalar, tushuntirishlar |
| **Qidiruv paneli** | Ikki tab: **"Universal qidiruv"** · **"Kengaytirilgan qidiruv"**. Oddiy: "Oraliq" (sana), "Hujjat turi" chiplari (Konstitutsiya, Kodekslar, Qonunlar, Prezident hujjatlari, Hukumat qarorlari, Vazirliklar hujjatlari, Xalqaro hujjatlar), "Izlash". Kengaytirilgan: toifa chiplari (Hammasi, Oliy Majlis, Mahalliy hokimiyat, Xalqaro, Texnik, Sud amaliyoti, Sud qarorlari); matn maydonlari (Hujjat raqami, Ro'yxat raqami, Hujjat nomi, Matndagi so'z) har birida **"Aniq mos kelishi"**; "Hujjat holati" (Hammasi · Amaldagi · O'z kuchini yo'qotgan · Amalda emas); uchta sana oralig'i; "Hujjat tili"; "Organ"; "Qonunchilik sohalari"; "Hujjatning yaxlitligi"; **"Izlashni tozalash"** · "Izlash" | Qidiruv — sahifaning yuragi. Filtrlar **chip** ko'rinishida, holat filtri alohida |
| **1. Qonunchilik sohalari** | Sohalar matnli havolalar to'rida (Konstitutsiyaviy tuzum, Davlat boshqaruvi asoslari, Fuqarolik, Oila, Mehnat … Xalqaro huquq), **"Hammasini ochish"** | Ikonkasiz, plitkasiz; zich, skanerlanadigan ro'yxat |
| **2. Qonunchilikdagi yangiliklar** | **Raqamlangan jadval:** № · nom (havola) · organ va hujjat turi · sana yoki ro'yxat raqami · "Qo'shimcha ma'lumotlar" · **PDF** · **MS Word**. "Hammasini ko'rsatish" | Har qatorda yuklab olish to'g'ridan-to'g'ri |
| **3. Milliy bazadagi hujjatlar** | 11 hisoblagich, har biri havola: Qonunlar 1 588 · Oliy Majlis hujjatlari 10 651 · Prezident hujjatlari 5 610 · Hukumat hujjatlari 11 535 · Vazirliklar … 9 272 · Mahalliy … 13 045 · Sud hujjatlari 371 · Xalqaro 1 662 · Texnik 787 · Sud amaliyoti 564 · MSK 65 | Raqamlar bo'shliq bilan (`1 588`) — bizning 3.5 qoidamiz bilan bir xil. Har son filtrlangan qidiruvga olib boradi |
| **4. Foydali resurslar** | prezident.uz, parliament.gov.uz, gov.uz, senat.gov.uz, minjust.uz, strategy.uz | Ekotizim havolalari |
| **Footer** | Markaz haqida · Sayt yangiliklari · Saytda reklama · RSS · Google Play / App Store · ijtimoiy tarmoqlar · © "Adolat" markazi | **Ixcham**, sayt xaritasi emas (navigatsiya menyuda) |
| **Texnik** | Responsiv viewport, `notranslate` | — |

### 1.2. `lex.uz` — hujjat sahifasi (`/uz/docs/-7354510`)

| Qism | Nima bor | my.stat.uz dagi o'xshashi |
|---|---|---|
| **Sarlavha bloki** | Nom · "31.01.2025 yildagi 54-son" · turi ("Vazirlar Mahkamasining qarori") · organ, imzo · joy va sana · **"Kuchga kirish sanasi"** · klassifikatsiya kodlari (OKOZ, TSZ) | Ko'rsatkich: nom · kod · manba (organ) · davriylik · **so'nggi yangilanish** · klassifikator kodlari (OKED, SOATO) |
| **Tahrirlar** | "Oldingi tahrirga havola" · "Keyingi tahrirga havola", tahrir sanalari, URL'da `?ONDATE=01.02.2025` | **Ma'lumot nashri (vintage):** "Oldingi nashr · Keyingi nashr", `?asof=2026-07-15` — statistikada qayta ko'rib chiqilgan raqamlar uchun juda kerak |
| **Manbalar** | "O'zgartirishlar manbasi" · "Rasmiy nashr manbasi" | `SourceNote` + "Birlamchi manba" havolasi |
| **Asboblar** | "Ko'rinish A A A" · til versiyalari (Рус · Eng · Ўзб · O'zb · **O'zb\|Рус** parallel) · "Ulashish" · har element uchun: **"Hujjat elementidan havola olish"**, "Hujjatga taklif yuborish", "Audioni tinglash" | `ToolRail`: havola olish (grafik, jadval qatori), "Xato haqida xabar", ulashish |
| **Tablar** | "Asosiy rekvizitlar" · "Kodifikatsiya" · "Qayta ko'rib chiqilgan hujjatlar" · "… asos bo'lgan hujjatlar" · "Korrespondentlar" · "Respondentlar" | "Asosiy rekvizitlar" · "Metodologiya" · "Qayta ko'rib chiqishlar" · "Bog'liq ko'rsatkichlar" · "Shu ko'rsatkich ishlatilgan" |
| **Tuzilma** | Bob → band (1–40) → kichik band (a, b, v…), ilovalar; har elementda **anchor** (`#-7356544`) | Bo'limlar va jadvallarda anchor (`#jadval-hududlar`) |
| **Izohlar** | Tahrir izohlari qavsda, kulrang **"LexUZ sharhi"** bloklari | Kulrang "Metodologik izoh" bloki |

### 1.3. `gov.uz/oz` — Hukumat portali (v1 dan)

Rasmiy qator (gerb, nom, UTC vaqt, til, `id.egov.uz` kirish — **matnsiz ikonka**), 5 bandli menyu (Ta'lim · Voqealar · Xizmatlar · Hukumat · Oila), **3 slaydli karusel** hero, bo'limlar: Vazirliklar · Hayotiy vaziyatlar bo'yicha savollar (6) · Davlat xizmatlari (8 → my.gov.uz) · Voqealar taqvimi · Hujjatlar (→ lex.uz) · Foydali havolalar · Yangiliklar · Tashkilot turlari. Har bo'lim: sarlavha + "Barcha …". Footer: telefon, email, ijtimoiy tarmoqlar, "Xabar yozish". A11y bayonoti: W3C A/AA, matnli versiya. 5 til.

### 1.4. `gov.uz/oz/uzbmb` — idora shabloni (v1 dan)

2025-03-01 dan barcha davlat organlari rasmiy saytlari shu platformada. Hero yo'q; bo'limlar: Yangiliklar · Faoliyat yo'nalishlari · Interaktiv xizmatlar · Voqealar taqvimi · Foydali havolalar · Hujjatlar (→ lex.uz) · So'rovnomalar · Loyihalar ("BARCHA RAQAMLAR" yozuvi kontaktlarga olib boradi — xato). Footer = 7 guruhli sayt xaritasi, ishonch telefoni 1195.

### 1.5. `pm.gov.uz/oz` — Prezident virtual qabulxonasi (v1 dan)

"Sinov rejimida" xabari; 3 bandli menyu; hero = maqsad; **3 harakat kartasi** (sarlavha + tugma); o'nlab mavzu plitkalari; murojaat usullari (telefon, onlayn); **kirishsiz holat tekshirish** (raqam + kod + captcha); hisoblagichlar (yuklanishda **0** ko'rsatadi — xato); foydali havolalar; **hududlar kartalari: jami 222 + 14 hudud**; footer: huquqiy havolalar, `Ctrl+Enter`, "Saytning eski talqini".

---

## 2. Solishtirish jadvali

| Mezon | **lex.uz** | gov.uz | uzbmb | pm.gov.uz | my.stat.uz hozir (HIBRID) | **v2 qaror** |
|---|---|---|---|---|---|---|
| Yuqori qator | Ijtimoiy · **Ko'rinish A A A** · O'ZB ЎЗБ РУС ENG · Kirish | Gerb, vaqt, til, kirish | gov.uz qobig'i | Sinov xabari | Agentlik · hisobot kalendari · ☎ · qayta aloqa · til ▾ | **lex.uz tartibi** (LX-01) |
| Nom | To'liq rasmiy nom | To'liq rasmiy nom | Idora nomi | Qabulxona nomi | Logo + qisqa nom | **To'liq nom** logo yonida (LX-02) |
| Menyu | 5 ochiluvchi + 1 havola, KATTA HARF, mazmun turi bo'yicha | 5 band | Footer xaritasi | 3 band | 5 band, auditoriya bo'yicha | **6 band, lex.uz uslubida** (LX-03) |
| Bosh sahifa markazi | **Qidiruv paneli** (2 tab, chiplar) | Karusel | Yangiliklar | Harakat kartalari | Katta qidiruv + trend grafik kartochkalari | **lex.uz qidiruv paneli** (LX-04) |
| Bo'limlar ko'rinishi | Matnli ro'yxat, raqamlangan jadval | Ro'yxat + "Barcha" | Ro'yxat | Kartalar | Kartochka va plitkalar | **Ro'yxat va jadval** (LX-05, LX-06) |
| Hisoblagichlar | 11 ta, har biri filtrga havola | — | — | 3 ta (0 bilan) | `StatCard` | **"Portaldagi ma'lumotlar"** hisoblagichlari (LX-07) |
| Asosiy obyekt sahifasi | Hujjat: rekvizitlar, tahrirlar, tablar, anchor | — | — | — | Ko'rsatkich: Statista grafigi | **lex.uz tuzilmasi + Statista grafigi** (LX-08..LX-11) |
| Footer | Ixcham + ilovalar + RSS | Ixcham + aloqa | Sayt xaritasi | Huquqiy + eski versiya | 3 ustun | **lex.uz ixcham footer** (LX-12), xarita `/sitemap` da |
| Matn o'lchami | A A A yuqorida va hujjatda | Brauzer orqali | — | — | Yo'q | **A A A** (LX-01, GV-06 o'rniga) |
| Tillar | 4 + parallel ko'rinish | 5 | 5 | 2 | 3 | 3 qoladi; ENG — OS-GV-02 |
| Yuklab olish | Har qatorda PDF, Word | — | — | — | `DownloadPanel` | Ro'yxat qatorida **CSV · XLSX · PDF** (LX-06) |

---

## 3. Qoidalar

Umumiy qoida (HIBRID 1-bo'lim): lex.uz va gov.uz saytlaridan **logo, globus belgisi, gerb tasviri, ikonka, rasm, shrift fayli, matn ko'chirilmaydi**. Faqat tuzilma, joylashuv va xatti-harakat olinadi.

### 3.1. LX: lex.uz andozasi

| ID | Qoida | Qadam |
|---|---|---|
| **LX-01** | **`TopBar` v2** (chapdan o'ngga): ijtimoiy tarmoqlar ikonkalari (`aria-label` bilan, `config/contacts.ts` dan) · "Hisobot kalendari (N)" (kirgan yuridik shaxsga) · ☎ ishonch telefoni · o'ngda **"Ko'rinish" + A A A** (100 / 115 / 130 %, `aria-pressed`) · kontrast tugmasi (◐) · **til kodlari qatorda: O'ZB · ЎЗБ · РУС** (joriysi qalin, `lang` va `hreflang` atributlari bilan) · "Kirish". Mobilda: A A A va tillar `MobileMenu` ichida | H10 (A A A tokenlari H1 da) |
| **LX-02** | **`PublicHeader` v2:** logo (o'zimizniki) + **ikki qatorli rasmiy nom**: 1-qator "O'zbekiston Respublikasi Statistika agentligi" (Z-17 kaliti), 2-qator "Statistik ma'lumotlar va xizmatlar portali" (`--ds-on-brand-muted`). O'ng tomonda qidiruv ikonkasi va kabinet tugmasi. Mobilda faqat 1-qator qisqartmasi | H10 |
| **LX-03** | **Menyu v2:** 5 ochiluvchi + 1 havola, **katta harflar** (`text-transform: uppercase`, `letter-spacing: .04em`, `--ds-font-small` 13/600), ochiluvchi panel 1–2 ustunli **matnli ro'yxat**, ikonkasiz. Bandlar 4.3 da. Bosish bilan ochiladi (HIBRID 7.1 a11y qoidasi o'zgarmaydi) | H10 |
| **LX-04** | **`SearchPanel`** bosh sahifa markazida: tablar **"Tezkor qidiruv"** · **"Kengaytirilgan qidiruv"**. Tezkor: matn maydoni + "Ma'lumot turi" chiplari (Hammasi · Ko'rsatkichlar · Jadvallar · Nashrlar · Xizmatlar · Korxonalar · Savollar) + "Izlash". Kengaytirilgan: Ko'rsatkich nomi / kodi (har birida "Aniq mos kelishi"), Mavzu (12, chip), Hudud (Respublika + 14), Davriylik (oylik · choraklik · yillik), Davr oralig'i, Manba (organ), **Holati** (Hammasi · Amaldagi · Yangilangan · To'xtatilgan), Til, **"Filtrlarni tozalash"** · "Izlash". Hamma filtr URL'da (`/search?type=indicator&topic=prices&period=2020..2025`). `GlobalSearch` (`Ctrl+K`) va `/search` sahifasi shu panelni ishlatadi | H9 (panel), H10 (bosh sahifa) |
| **LX-05** | **`LinkGrid`**: mavzular va sohalar **matnli havolalar to'ri** (3 ustun desktop, 2 planshet, 1 mobil), har havola yonida son ("Narxlar va inflyatsiya · 46"), dastlab 12 ta, **"Hammasini ochish"** (`aria-expanded`). `TopicTile` va `SphereCard` plitkalari bosh sahifada ishlatilmaydi | H2, H10 |
| **LX-06** | **`DocList`** (raqamlangan ro'yxat-jadval): № · nom (havola) · meta qatori (mavzu · hudud · davr · manba) · sana · amallar (**CSV · XLSX · PDF**, cheklovi bor bo'lsa `AccessBadge`). Desktopda jadval, mobilda raqamli kartochka-ro'yxat. "Hammasini ko'rsatish →". Ishlatiladi: "Yangi e'lon qilingan ma'lumotlar", e'lonlar kalendari, nashrlar, mavzu sahifasidagi ko'rsatkichlar ro'yxati, qidiruv natijalari | H2 |
| **LX-07** | **`CountGrid`** "Portaldagi ma'lumotlar": 6–10 hisoblagich (Ko'rsatkichlar · Jadvallar · Mavzular · Hududlar · Nashrlar · Xizmatlar · Korxonalar (kontragent bazasi) · Ochiq API to'plamlari), har biri filtrlangan qidiruvga havola. Faqat API qaytargan haqiqiy son; yuklanishda `Skeleton` (GV-03 qoidasi) | H2, H10 |
| **LX-08** | **`RequisitesBlock`** ko'rsatkich sahifasi tepasida (lex.uz sarlavha bloki kabi): nom (H1) · kod · manba (organ) · davriylik · birlik · **so'nggi yangilanish** · **keyingi e'lon** · klassifikator kodlari · **holat belgisi** (Amaldagi · Yangilangan · Metodologiya o'zgargan · To'xtatilgan). Hammasi `<dl>` | H5 |
| **LX-09** | **Ma'lumot nashrlari (vintage):** "← Oldingi nashr · Keyingi nashr →", nashr sanasi, URL `?asof=YYYY-MM-DD`. Eski nashr ochilganda tepada `AlertStrip` "Siz 2026-07-15 dagi nashrni ko'ryapsiz. **Amaldagi nashr →**". Backend'da nashrlar tarixi bo'lmasa, blok ko'rinmaydi (yangi maydon qo'shilmaydi, OS-LX-02) | H5 |
| **LX-10** | **Ko'rsatkich tablari** (`Tabs`, URL'da `#tab=`): Ma'lumot (grafik + jadval, Statista `ChartCard`) · Asosiy rekvizitlar · Metodologiya · Qayta ko'rib chiqishlar · Bog'liq ko'rsatkichlar. "Metodologik izoh" kulrang blok (`--ds-bg`, chap chegarasi `--ds-border` 3 px) | H5 |
| **LX-11** | **Element havolasi:** grafik, jadval va jadval qatorlarida "Havolani nusxalash" (🔗, `aria-label`), anchor `#jadval-<id>` yoki `#qator-<id>`. `ToolRail` ga "Xato haqida xabar" (mavjud `Ctrl+Enter` oqimi) | H5 |
| **LX-12** | **`Footer` v2 (ixcham):** 1-qator havolalar: Portal haqida · Sayt yangiliklari · Foydalanish shartlari · Maxfiylik siyosati · Portal xaritasi · Ochiq API · **RSS** (e'lonlar uchun, OS-LX-03); 2-qator: mobil ilova nishonlari (faqat ilova do'konda bo'lsa, `MOBIL_ILOVA.md`) · ijtimoiy tarmoqlar · ☎ · email; 3-qator: © Statistika agentligi · `Ctrl+Enter` izohi · vaqtincha `LegacyLink`. To'liq sayt xaritasi `/sitemap` sahifasida | H9 |
| **LX-13** | **Zichlik:** ommaviy zonada ro'yxatlar va jadvallar uchun `data-density="list"`: qator balandligi 44 px, matn 15/22, bo'limlar orasi 32 px (desktop 40). Uzun matn (`InfoPage`, metodologiya) `body-lg` da qoladi. Ommaviy sahifalarda soyalar yo'q, faqat `--ds-border` chiziqlari (HIBRID 3.3 bilan bir xil) | H1 |
| **LX-14** | **Til ko'rinishi:** `/methodology/*` va ko'rsatkich metodologiya tabida *(ixtiyoriy)* "O'zb \| Рус" yonma-yon ko'rinish (lex.uz parallel versiyasi). Default o'chiq (OS-LX-04) | H12 |

### 3.2. GV: gov.uz qoidalari (v1 dan, v2 dagi holati)

| ID | Qoida (qisqa) | v2 dagi holati |
|---|---|---|
| GV-00 | Saytlarni lokal o'lchash (Playwright) | **Kengaydi:** lex.uz bosh va hujjat sahifasi qo'shildi |
| GV-01 | `SectionHeader`: H2 + "Barchasi →" (manzilni aytadigan matn) | Qoladi; lex.uz uslubida "Hammasini ko'rsatish →" |
| GV-02 | `ActionCard` (pm.gov.uz) | **Bosh sahifadan chiqdi**; `/contact`, 404, `/reporting` da qoladi |
| GV-03 | Yuklanishda 0 emas, `Skeleton` | Qoladi, `CountGrid` ga ham |
| GV-04 | `RegionCountList` (jami + 14 hudud) | Qoladi (`/regions`) |
| GV-05 | Hayotiy vaziyatlar | **Bosh sahifadan chiqdi**; "TUSHUNTIRISHLAR" menyu bandi va `/situations` (lex.uz "Huquqiy tushuntirishlar" analogi) |
| GV-06 | `A11yPanel` (dialog) | **Soddalashdi:** LX-01 dagi A A A + kontrast tugmasi `TopBar` da. Rangsiz va animatsiyasiz rejim kontrast tugmasi yonidagi kichik menyuda |
| GV-07 | Sayt xaritasi footer | **Bekor**, o'rniga LX-12. Xarita `/sitemap` da |
| GV-08 | Bosh sahifa v2 | **O'rniga 4.4 (v3)** |
| GV-09 | `ExternalLink` (lex.uz, my.gov.uz) | Qoladi |
| GV-10 | `/contact` kanal kartalari | Qoladi |
| GV-11 | `LegacyLink` "Eski ko'rinish" | Qoladi |
| GV-12 | `/about` tuzilmasi | Qoladi |
| GV-13 | Kirishsiz holat tekshirish (backend kerak) | Qoladi, taklif |
| GV-14 | Karusel yo'q | Qoladi |
| GV-15 | Ikonkali tugma matnsiz/`aria-label`siz emas | Qoladi (ijtimoiy ikonkalar, A A A, 🔗 ga ham) |

---

## 4. Yangilangan UI tuzilmasi

### 4.1. Zonalar

| Zona | Uslub manbasi (v2) | Qolip | O'zgarish |
|---|---|---|---|
| **Ommaviy qobiq** (S + G) | **lex.uz** (header, menyu, footer) + gov.uz qoidalari | `PublicLayout` | LX-01, 02, 03, 12 |
| **S · Statistika** | **lex.uz** (ro'yxatlar, rekvizitlar, versiyalar, qidiruv) + **Statista** (faqat grafik ichi: `ChartCard`, `ToolRail`, `DownloadPanel`) | `DataPage` | Bosh sahifa va ko'rsatkich sahifasi qayta tuzildi |
| **G · Katalog** | my.gov.uz (xizmat pasporti, soha sahifasi) + lex.uz ro'yxat uslubi | `CatalogPage`, `ServicePage`, `InfoPage` | Soha ro'yxatida `LinkGrid`; pasport o'zgarmaydi |
| **M · Kabinet** | my.soliq / my.mehnat | `AppShell` | O'zgarmaydi (faqat A A A tokenlari ishlaydi) |

Nima uchun pasport my.gov.uz da qoladi: lex.uz da xizmat obyekti yo'q, my.gov.uz pasporti foydalanuvchiga tanish va davlat xizmatlari standartiga yaqin.

### 4.2. Ommaviy qobiq v2

```
PublicLayout v2 (lex.uz andozasi)
┌──────────────────────────────────────────────────────────────────────────┐
│ SkipLink · TestModeBar ("Sayt sinov rejimida")                           │
│ TopBar (--ds-ink, 36 px)                                                 │
│  TG FB IG YT · Hisobot kalendari (3) · ☎ 71 …   Ko'rinish A A A ◐ ·      │
│                                                 O'ZB ЎЗБ РУС · Kirish    │
│ PublicHeader (--ds-brand, 72 px)                                         │
│  [logo] O'ZBEKISTON RESPUBLIKASI STATISTIKA AGENTLIGI          🔍 [Kabinet]│
│         Statistik ma'lumotlar va xizmatlar portali                       │
│ MainNav (--ds-brand, pastki chiziq --ds-accent 2 px faol bandda, 48 px)  │
│  STATISTIK MA'LUMOTLAR ▾ · XIZMATLAR ▾ · HISOBOT TOPSHIRUVCHILARGA ▾ ·   │
│  MA'LUMOTNOMALAR ▾ · PORTAL HAQIDA ▾ · TUSHUNTIRISHLAR                   │
├──────────────────────────────────────────────────────────────────────────┤
│ <main id="main"> qolip (1200 px)                                         │
│ PageFeedback ("Sahifa foydali bo'ldimi?" · Ctrl+Enter)                   │
├──────────────────────────────────────────────────────────────────────────┤
│ Footer v2 (--ds-ink, ixcham)                                             │
│  Portal haqida · Sayt yangiliklari · Shartlar · Maxfiylik · Xarita ·     │
│  Ochiq API · RSS                                                         │
│  [Google Play] [App Store]   TG FB IG YT   ☎ · ✉                         │
│  © 2026 Statistika agentligi · Xato ko'rsangiz: Ctrl+Enter · Eski ko'rinish│
└──────────────────────────────────────────────────────────────────────────┘
```

- Header balandligi: `TopBar` 36 + `PublicHeader` 72 + `MainNav` 48 = 156 px (desktop). Skroll qilinganda faqat `MainNav` yopishib qoladi (`position: sticky`), 48 px.
- Mobil (< 1024): `TopBar` yashirin; `PublicHeader` 56 px (logo + qisqa nom + 🔍 + ☰); ☰ ichida menyu (accordion), A A A, tillar, ijtimoiy tarmoqlar.
- Gerb tasviri yo'q (OS-GV-01).

### 4.3. Menyu v2 (`config/publicMenu.ts`, HIBRID 7.1 o'rniga)

| Band | Ochiluvchi ro'yxat | HIBRID 7.1 dagi joyi |
|---|---|---|
| **STATISTIK MA'LUMOTLAR** | *Yangi e'lonlar:* Bugun · Haftalik · Oylik · E'lonlar kalendari (lex.uz "Rasmiy hujjatlar" kabi vaqt bo'yicha) · *Bo'limlar:* Mavzular (12) · Barcha ko'rsatkichlar · Panellar · Hududlar · Tashqi savdo · Nashrlar | Statistika |
| **XIZMATLAR** | Sohalar (14) · Ommabop xizmatlar (6) · Tariflar · Kontragent kartasi · Konsultatsiya · "Barcha xizmatlar →" | Xizmatlar |
| **HISOBOT TOPSHIRUVCHILARGA** | Hisobot kalendari · Hisobot shakllari · Reglamentlar · Statistik kodlar · "Kabinetga kirish" | Hisobot topshiruvchilarga |
| **MA'LUMOTNOMALAR** | Klassifikatorlar · Statistik kodlar ma'lumotnomasi · Metodologiya · Glossariy · ISN kalkulyatori · Maosh kalkulyatori · Ism statistikasi · Ochiq API | Fuqarolarga (kalkulyatorlar) + Statistika (API) |
| **PORTAL HAQIDA** | Portal haqida · Foydalanuvchi qo'llanmasi · Foydalanish shartlari · Maxfiylik · Portal statistikasi (`/statistics`) · Sayt yangiliklari · Aloqa | Yordam + footer |
| **TUSHUNTIRISHLAR** (havola) | `/situations`: hayotiy vaziyatlar, ko'p beriladigan savollar, "Statistika oddiy tilda", Stat AI | Fuqarolarga + Yordam |

"Fuqarolarga" alohida band sifatida yo'qoladi: uning bandlari MA'LUMOTNOMALAR (kalkulyatorlar) va TUSHUNTIRISHLAR (savollar) ga bo'linadi; so'rovnomalar PORTAL HAQIDA ga. Bu lex.uz ning "mazmun turi bo'yicha" tamoyili. URL'lar o'zgarmaydi.

### 4.4. Bosh sahifa `/` v3 (HIBRID 6.2 va v1 dagi GV-08 o'rniga)

| # | Blok | Komponent | lex.uz analogi |
|---|---|---|---|
| 0 | `TopBar`, `PublicHeader`, `MainNav` | ds | yuqori qism |
| 1 | **Qidiruv paneli**: H1 (ko'rinadigan, ixcham: "Rasmiy statistik ma'lumotlarni izlash"), `SearchPanel` (Tezkor / Kengaytirilgan), pastida bir qator "Ommabop so'rovlar:" 6 ta matnli havola. O'ng tomonda (≥ 1024) kichik `StatCard`: jonli aholi soni + `SourceNote` | `SearchPanel`, `StatCard` | Universal / Kengaytirilgan qidiruv |
| 2 | Kirgan foydalanuvchiga **bir qatorli** `AlertStrip`: "Muddati yaqin 2 ta hisobot · 1 ta yangi javob — Kabinetga o'tish →". Mehmonga ko'rinmaydi | `AlertStrip` | — |
| 3 | **Statistika mavzulari** (12, son bilan) · "Hammasini ochish" | `LinkGrid` | Qonunchilik sohalari |
| 4 | **Yangi e'lon qilingan ma'lumotlar**: tablar "E'lon qilingan" (10 qator) · "Kutilayotgan" (e'lonlar kalendaridan, 10 qator) · "Hammasini ko'rsatish →" | `Tabs` + `DocList` | Qonunchilikdagi yangiliklar |
| 5 | **Portaldagi ma'lumotlar** (8 hisoblagich) | `CountGrid` | Milliy bazadagi hujjatlar |
| 6 | **Ommabop xizmatlar**: 8 qatorli ro'yxat (`#raqam` · nom · narx belgisi), 2 ustun · "Barcha xizmatlar →" | `ServiceCard variant="row"` (ixcham) | — (gov.uz "Davlat xizmatlari" 8) |
| 7 | **Foydali resurslar**: stat.uz · SIAT · my.gov.uz · lex.uz · data.egov.uz · gov.uz (matnli, logosiz) | `ExternalLink` | Foydali resurslar |
| 8 | `PageFeedback`, Footer v2 | ds | footer |

**Bosh sahifadan chiqadi (o'chirilmaydi, joyi o'zgaradi):**

| Blok | Yangi joyi |
|---|---|
| Trend `IndicatorCard` (mini grafiklar) | `/topics/:slug` sahifasining tepasi (har mavzuda 3 ta) va `/indicators` |
| Mavzu plitkalari `TopicTile` | `/topics` (plitka varianti) |
| "Nima qilmoqchisiz?" `ActionCard` | `/reporting` va 404 |
| Hayotiy vaziyatlar | TUSHUNTIRISHLAR (`/situations`) |
| Tariflar | XIZMATLAR → Tariflar (`/tariffs`) |
| "Nega my.stat.uz" | `/about` |

**Tezlik:** 1 (panel statik, aholi soni bitta so'rov), 3 va 7 statik konfiguratsiyadan, 4 va 5 bitta yengil so'rov (grafiksiz). Grafik kutubxonasi bosh sahifada **umuman yuklanmaydi** — mobil LCP ≤ 2,5 s maqsadi realga aylanadi (hozir 5–8 s).

### 4.5. Ko'rsatkich sahifasi `/indicators/:key` v2 (lex.uz hujjat sahifasi + Statista grafigi)

```
Breadcrumb: Bosh sahifa › Statistik ma'lumotlar › Narxlar va inflyatsiya
┌──────────────────────────────────────────────────────────────┬──────────┐
│ RequisitesBlock                                              │ ToolRail │
│  H1 Iste'mol narxlari indeksi, O'zbekiston, 2017–2026        │  ★ ⤓ ❝   │
│  [Amaldagi]  Kod: 05.01.001 · Manba: Statistika agentligi ·  │  🔗 ↗ AI │
│  Davriylik: oylik · Birlik: % · Yangilangan: 15.10.2026 ·    │  ⚠ xato  │
│  Keyingi e'lon: 15.11.2026                                   │          │
│  ← Oldingi nashr (15.09.2026)  ·  Keyingi nashr →            │          │
├──────────────────────────────────────────────────────────────┤          │
│ Tabs: Ma'lumot | Asosiy rekvizitlar | Metodologiya |         │          │
│       Qayta ko'rib chiqishlar | Bog'liq ko'rsatkichlar       │          │
│ [Ma'lumot] ChartCard (Statista: Grafik/Jadval, Ustun/Chiziq) │          │
│            SourceNote · 🔗 havola                            │          │
│            DownloadPanel: CSV · XLSX · PDF                   │          │
│ ┃ Metodologik izoh (kulrang blok)                            │          │
└──────────────────────────────────────────────────────────────┴──────────┘
Shu mavzudagi boshqa ko'rsatkichlar (DocList, 10 qator)
```

HIBRID 5.2 (`DataPage`) dagi bloklar saqlanadi, faqat tartib va ko'rinish shu sxemaga keladi: o'ng ustundagi "so'nggi qiymat" `StatCard` `RequisitesBlock` ichiga katta raqam sifatida o'tadi; `MetaBlock` "Asosiy rekvizitlar" tabiga; `RelatedList` "Bog'liq ko'rsatkichlar" tabiga va sahifa pastidagi `DocList` ga.

### 4.6. Komponentlar (`components/ds/`)

| Komponent | Holat | Manba | Qadam |
|---|---|---|---|
| `SearchPanel` | ✚ | LX-04 | H9 |
| `LinkGrid` | ✚ | LX-05 | H2 |
| `DocList` | ✚ | LX-06 | H2 |
| `CountGrid` | ✚ (`CounterPanel` o'rnida, bitta komponent) | LX-07, GV-03 | H2 |
| `RequisitesBlock` | ✚ | LX-08 | H5 |
| `VintageNav` | ✚ | LX-09 | H5 |
| `ViewControls` (A A A + kontrast) | ✚ (`A11yPanel` o'rnida) | LX-01, GV-06 | H10 (tokenlar H1) |
| `LanguageSwitcher` | ✎ `variant="inline"` (O'ZB ЎЗБ РУС) | LX-01 | H10 |
| `MainNav` | ✎ (`MegaMenu` o'rnida, katta harf, matnli) | LX-03 | H10 |
| `Footer` | ✎ ixcham (LX-12), `SitemapFooter` kerak emas | LX-12 | H9 |
| `SectionHeader`, `ExternalLink`, `LegacyLink`, `ActionCard`, `SituationTile`, `RegionCountList` | v1 dagi kabi | GV | H2, H7, H10, H12 |
| `TopicTile`, `IndicatorCard`, `SphereCard` | Qoladi, faqat ichki sahifalarda | HIBRID | — |

Konfiguratsiya: `config/publicMenu.ts` (4.3), ✚ `config/contacts.ts`, ✚ `config/usefulLinks.ts`, ✚ `config/situations.ts`, ✚ `config/searchFilters.ts` (LX-04 dagi ma'lumot turi, holat, davriylik ro'yxatlari — `/search`, bosh sahifa va `Ctrl+K` uchun bitta manba).

### 4.7. Tokenlar (ranglar o'zgarmaydi)

| Token | Qiymat | Nima uchun |
|---|---|---|
| `--ds-font-scale` | `1` · `1.15` · `1.3` (`<html data-font-scale>`) | A A A (LX-01). 1,3 dan katta qilinmaydi: 360 px da gorizontal skroll chiqadi; undan kattasi brauzer zoom orqali |
| `[data-contrast="high"]` | `--ds-text: #000`, `--ds-text-muted: #1F2937`, `--ds-border: #6B7280`, `--ds-primary: #0B3D91`, fokus 3 px; tungida `#FFF` / `#E5E7EB` | Kontrast tugmasi ◐ |
| `[data-grayscale]`, `[data-motion="reduce"]` | v1 dagi kabi | ◐ yonidagi menyu |
| `--ds-nav-height` | 48 px | `MainNav` |
| `--ds-header-height` | 72 px (mobil 56) | `PublicHeader` v2 (HIBRID 3.3 dagi 64 o'rniga) |
| `--ds-nav-case` | `uppercase`, `letter-spacing: .04em` | LX-03 |
| `[data-density="list"]` | qator 44 px, matn 15/22, bo'lim orasi 32/40 px | LX-13 |
| `--ds-note-bg` / `--ds-note-border` | `= --ds-bg` / `= --ds-border` (3 px chap) | "Metodologik izoh" bloki |

**Rang haqida:** bizning `--ds-brand #0E2647` (to'q ko'k) va oq kontent foni lex.uz ning rasmiy, sokin ko'rinishiga mos keladi, shuning uchun palitra o'zgarmaydi. lex.uz ning aniq ranglari o'lchanmadi. GV-00 skrinshotlaridan keyin brend rangini yaqinlashtirish kerak bo'lsa, bu OS-H-02 doirasida alohida qaror (lex.uz rangi **ko'chirilmaydi**, faqat ohang yaqinlashadi).

---

## 5. Sahifama-sahifa o'zgarishlar

Ko'rsatilmagan sahifalar HIBRID 6.1 dagi kabi.

| Sahifa | Zona | O'zgarish | Qoidalar | Qadam |
|---|---|---|---|---|
| `/` | S | 4.4 v3 | LX-04..07, GV-01, 09 | H10 |
| `/indicators/:key` | S | 4.5: rekvizitlar, nashrlar, tablar, element havolasi | LX-08..11 | H5 |
| ✚ `/indicators` | S | Barcha ko'rsatkichlar: chapda kengaytirilgan filtr (LX-04 maydonlari), o'ngda `DocList`, tartiblash (nom · yangilangan · mavzu) | LX-04, 06 | H5 |
| `/topics` | S | `LinkGrid` + plitka/ro'yxat almashtirgich | LX-05 | H8 |
| `/topics/:slug` | S | Tepada 3 `IndicatorCard` (trend), keyin mavzu ko'rsatkichlari `DocList`, "Shu mavzudagi xizmatlar" | LX-06 | H8 |
| `/release-calendar` | S | Tablar "Bugun · Haftalik · Oylik · Kalendar" (lex.uz "Rasmiy hujjatlar"), ro'yxat `DocList`; RSS havolasi | LX-06, 12 | H12 |
| `/search` | G | `SearchPanel` (kengaytirilgan ochiq) + guruhlangan natijalar (HIBRID 5.5 tartibi), har guruh `DocList` | LX-04 | H9 |
| `/spheres`, `/spheres/:id` | G | `/spheres` = `LinkGrid` (14 soha, xizmatlar soni bilan); soha sahifasi HIBRID 5.3 dagi kabi | LX-05 | H7 |
| `/service/:number` | G | Huquqiy asos → lex.uz `ExternalLink` | GV-09 | H7 |
| `/situations`, `/situations/:slug` | G | TUSHUNTIRISHLAR bandi; v1 dagi tuzilma | GV-05 | H7 |
| `/regions` | S | "Xarita / Ro'yxat", `RegionCountList` | GV-04 | H12 |
| `/statistics` | S | `CountGrid` "Portal faoliyati" | LX-07 | H8 |
| `/reports`, `/reglaments`, `/stat-codes` | G | `DocList` (№ · nom · shakl kodi · davriylik · muddat · PDF/XLSX), normativ hujjat → lex.uz | LX-06, GV-09 | H12 |
| `/methodology/*` | S | `InfoPage` + anchorlar har bo'limda + "O'zb \| Рус" (ixtiyoriy) | LX-11, 14 | H12 |
| ✚ `/sitemap` | G | To'liq sayt xaritasi `publicMenu.ts` dan (footer o'rniga) | LX-12 | H9 |
| ✚ `/news` | G | "Sayt yangiliklari" (`DocList`), RSS | LX-12 | H12 |
| `/contact`, `/about`, 404 | G | v1 dagi kabi (GV-10, GV-12, `ActionCard`) | GV | H9 |
| `/cabinet/*` | M | O'zgarmaydi | — | — |

---

## 6. Takrorlanmaydigan xatolar

| # | Xato | Qayerda | Bizdagi qoida |
|---|---|---|---|
| X-1 | Yuklanayotgan hisoblagich "0" | pm.gov.uz | `Skeleton`; 0 faqat haqiqiy 0 |
| X-2 | Hero karusel | gov.uz | Karusel yo'q |
| X-3 | Matnsiz kirish ikonkasi | gov.uz, uzbmb | `aria-label` yoki matn majburiy |
| X-4 | Mazmunli rasmda bo'sh `alt` | pm.gov.uz | `alt` majburiy |
| X-5 | Havola matni manziliga mos emas | uzbmb | `moreLabel` manzildan |
| X-6 | Faqat joriy til ko'rinadi | gov.uz | Tillar qatorda (LX-01) |
| X-7 | Menyu markupi ikki marta | gov.uz | Yopiq mobil menyu `inert` |
| X-8 | Bir sahifada bir nechta "Batafsil" | gov.uz, pm.gov.uz | Har havola manzilini aytadi |
| **X-9** | **Imlo xatolari va yozuvlar aralashuvi** ("Hujjat tusi", "Maxalliy"; bir sahifada lotin, kirill va inglizcha) | lex.uz | i18n kalitlari to'liq; lotin sahifada kirill matn yo'q (test: `uz` lokalida `[А-Яа-я]` qidiruvi, nomlar istisno) |
| **X-10** | **Juda uzun filtr formasi** bitta ekranda (kengaytirilgan qidiruvda 15+ maydon) | lex.uz | Kengaytirilgan qidiruvda maydonlar 3 guruhda (Nima · Qayerda/qachon · Holat), mobilda `Drawer`; tanlangan filtrlar chip bilan tepada |
| **X-11** | Har qatorda turli amallar to'plami (ba'zisida Word bor, ba'zisida yo'q) | lex.uz | `DocList` da ustunlar doim bir xil; yo'q format "—" bilan emas, tugmasiz bo'sh katak va `aria-label` "mavjud emas" |

---

## 7. O'zgargan qarorlar va ochiq savollar

### 7.1. HIBRID_DIZAYN.md va v1 dagi o'zgarishlar

| Qator | Edi | v2 | Sabab |
|---|---|---|---|
| **HIBRID 1 / Z-03, Z-04** | Ommaviy qismning yuzi Statista: grafik kartochkali bosh sahifa, 5 bandli menyu | **Yuz — lex.uz:** qidiruv paneli, ro'yxatlar, 6 bandli katta harfli menyu. Statista faqat grafik ichida (`ChartCard`, `ToolRail`) | Egasining so'rovi (2026-10-30) |
| **HIBRID 6.2** | Statista bosh sahifasi (trend grafiklar, mavzu plitkalari, tariflar) | 4.4 v3 | lex.uz andozasi; grafiksiz bosh sahifa tezroq |
| **HIBRID 5.2 / ST-04** | Statista ko'rsatkich sahifasi | 4.5: lex.uz rekvizitlari + nashrlar + tablar, ichida Statista grafigi | Statistikada versiya va rekvizitlar muhim |
| **HIBRID 7.1** | 5 band (Statistika · Xizmatlar · Hisobot topshiruvchilarga · Fuqarolarga · Yordam) | 4.3: 6 band (… · Ma'lumotnomalar · Portal haqida · Tushuntirishlar) | lex.uz mazmun turi tamoyili |
| **HIBRID Z-11 / v1 GV-07** | 3 ustun (HIBRID) / sayt xaritasi (v1) | Ixcham footer (LX-12) + `/sitemap` | lex.uz |
| **HIBRID 3.3** | `PublicHeader` 64 px | 72 + `MainNav` 48 | Ikki qatorli rasmiy nom va alohida menyu qatori |
| **v1 GV-06** | `A11yPanel` dialog | A A A + ◐ `TopBar` da | lex.uz, kamroq bosish |
| **v1 GV-02, GV-05, GV-08** | Bosh sahifada | Ichki sahifalarda | lex.uz bosh sahifasi ixcham |
| **AI Community uslubi** | Qaror kutilmoqda | **Tavsiya etilmaydi** ommaviy qismga; lex.uz andozasi bilan butunlay zid (iliq fon, ornament, display shrift) | Egasi lex.uz ni tanladi; ikkalasi birga bo'lmaydi |
| **O'zgarmaydi** | Z-01 (tokenlar), Z-02 (Inter), Z-06 (mavzu va soha), Z-07, Z-08 (kabinet), Z-09 (breadcrumb), Z-10, Z-12..Z-17 | — | — |

### 7.2. Ochiq savollar

Javob bo'lmasa default bilan ishlanadi.

| # | Savol | Default | To'xtatadi |
|---|---|---|---|
| **OS-LX-01** | Header'dagi rasmiy nom: "Statistika agentligi" mi, "qo'mitasi" mi; 2-qator matni ma'qulmi? | Z-17 kaliti; 2-qator "Statistik ma'lumotlar va xizmatlar portali" | — |
| **OS-LX-02** | Backend'da ko'rsatkich nashrlari tarixi (vintage) saqlanadimi? | H5 da koddan tekshiriladi; yo'q bo'lsa `VintageNav` ko'rinmaydi | LX-09 |
| **OS-LX-03** | E'lonlar uchun RSS kerakmi? | Ha, faqat o'qish uchun endpoint (`/api/releases.rss`) — backend o'zgarishi, alohida "ha" bilan | LX-12 RSS qismi |
| **OS-LX-04** | "O'zb \| Рус" parallel ko'rinish kerakmi? | Yo'q | LX-14 |
| **OS-LX-05** | Bosh sahifadan trend grafiklarni olib tashlash ma'qulmi (ular `/topics` ga ko'chadi)? | Ha (lex.uz andozasi) | H10 |
| OS-GV-01 | Gerb / gov.uz havolasi | Yo'q | — |
| OS-GV-02 | Ingliz tili (lex.uz va gov.uz da bor) | Yo'q, 3 til | — |
| OS-GV-03 | Kirishsiz holat tekshirish | Yo'q | GV-13 |
| OS-GV-05 | Qisqa ishonch raqami | `/contact` dagi | — |
| OS-GV-06 | Hayotiy vaziyatlar matnlarini kim tasdiqlaydi | Statistika bo'limi; ungacha production'da yashirin | GV-05 |

---

## 8. Migratsiya

### 8.1. H-qadamlarga joylash

| Qadam | HIBRID'dagi ish | + v2 qo'shimchasi |
|---|---|---|
| H1 | Tokenlar, shrift, tema | 4.7 tokenlari, `data-density="list"`, GV-00 (lex.uz bilan) |
| H2 | Umumiy komponentlar | `LinkGrid`, `DocList`, `CountGrid`, `SectionHeader`, `ExternalLink`, `ActionCard`, `SituationTile`; GV-15 lint |
| H4 | Kabinet ichi | `SectionHeader` bloklarda |
| H5 | Ko'rsatkich sahifasi | 4.5: `RequisitesBlock`, `VintageNav`, tablar, element havolasi; ✚ `/indicators` ro'yxati |
| H7 | Katalog, sohalar, pasport | `/spheres` `LinkGrid`; `/situations`; lex.uz `ExternalLink` |
| H8 | Mavzular, panellar, `/statistics` | `/topics` `LinkGrid`, mavzu sahifasi tepasida trend kartochkalar, `/statistics` `CountGrid` |
| H9 | Qidiruv, footer, huquqiy | `SearchPanel` + `config/searchFilters.ts`, `/search`, Footer v2, `/sitemap`, `/contact`, `/about` |
| H10 | Ommaviy layout, header, bosh sahifa | `TopBar` v2, `PublicHeader` v2, `MainNav`, `ViewControls`, `LanguageSwitcher inline`, menyu v2, bosh sahifa v3, `LegacyLink` |
| H11 | Mobil va a11y | X-1..X-11 tekshiruvi, A A A 360 px da |
| H12 | Qolgan sahifalar | `/release-calendar` tablari, `/reports`/`/reglaments` `DocList`, `/regions` ro'yxati, `/news`, `LegacyLink` olib tashlanadi |

### 8.2. Claude Code uchun promptlar

Har biri tegishli H-qadam promptidan keyin, o'sha branch'da beriladi.

**GV-00 (ixtiyoriy, H1 bilan):**

```text
mystat repo'sida mystat/UI_QAYTA_TUZISH.md dagi GV-00 ni bajar.
tools/design-reference/capture-gov.ts yoz (Playwright): https://lex.uz/, https://lex.uz/uz/docs/-7354510,
https://gov.uz/oz, https://gov.uz/oz/uzbmb, https://pm.gov.uz/oz sahifalarini 360, 768, 1280 kenglikda
och, to'liq sahifa skrinshotini docs/design-reference/gov/<sayt>-<kenglik>.png ga saqla. Har sahifada
body, header, nav, h1, h2, a, button, input, table, footer uchun getComputedStyle dan color,
background-color, font-family, font-size, font-weight, line-height, letter-spacing, text-transform,
height, max-width ni docs/design-reference/gov/<sayt>.json ga yoz. --ds-* tokenlarini O'ZGARTIRMA.
docs/design-reference/gov/README.md da lex.uz o'lchovlarini UI_QAYTA_TUZISH.md 4.7 bilan solishtir.
Logo, rasm, shrift fayllarini repo'ga ko'chirma (faqat skrinshot).
```

**H1 qo'shimchasi:**

```text
mystat/UI_QAYTA_TUZISH.md 4.7 dagi tokenlarni qo'sh: --ds-font-scale (1 / 1.15 / 1.3, barcha
--ds-font-* shunga ko'paytiriladi), data-contrast="high", data-grayscale, data-motion="reduce",
--ds-nav-height, --ds-header-height, --ds-nav-case, data-density="list" (LX-13), --ds-note-*.
Rang qiymatlarini o'zgartirma. UiKit sahifasida uchala font-scale va kontrast rejimini ko'rsat. PR.
```

**H2 qo'shimchasi:**

```text
mystat/UI_QAYTA_TUZISH.md 4.6 dagi LinkGrid, DocList, CountGrid, SectionHeader, ExternalLink,
ActionCard, SituationTile komponentlarini components/ds/ ga qo'sh (LX-05, LX-06, LX-07, GV qoidalari).
DocList: desktopda <table> (№, nom, meta, sana, CSV/XLSX/PDF), < 768 da raqamli ro'yxat, ustunlar
doim bir xil (X-11). CountGrid yuklanishda Skeleton, hech qachon 0 emas. LinkGrid "Hammasini ochish"
aria-expanded bilan. Faqat --ds-* tokenlari. Hammasi UiKit da. Ikonkali tugmalar uchun aria-label
lint/test (GV-15). 9.1 testlari, 360/768/1280 skrinshot, PR.
```

**H5 qo'shimchasi:**

```text
mystat/UI_QAYTA_TUZISH.md 4.5 bo'yicha /indicators/:key ni qayta yig': RequisitesBlock (LX-08,
<dl>), VintageNav (LX-09; backend'da nashrlar tarixi bo'lmasa ko'rsatma, yangi maydon qo'shma, PR'da
yoz), tablar URL'da (LX-10), grafik/jadval/qatorga "Havolani nusxalash" anchor bilan (LX-11).
ChartCard, ToolRail, DownloadPanel ichi o'zgarmaydi. /indicators ro'yxat sahifasi: chapda filtr
(config/searchFilters.ts), o'ngda DocList. PR.
```

**H9 qo'shimchasi:**

```text
mystat/UI_QAYTA_TUZISH.md LX-04 va LX-12 ni bajar. config/searchFilters.ts va SearchPanel
(Tezkor / Kengaytirilgan tablar, chip filtrlar, hammasi URL'da, "Filtrlarni tozalash"; X-10 bo'yicha
3 guruh, mobilda Drawer). /search sahifasi va Ctrl+K oynasi shu panel va filtrlardan foydalanadi.
Footer v2 (ixcham, 3 qator), /sitemap sahifasi publicMenu.ts dan, config/contacts.ts (telefon, email,
ijtimoiy tarmoqlar bitta joyda). /contact va /about v1 dagi GV-10, GV-12 bo'yicha. PR.
```

**H10 qo'shimchasi:**

```text
mystat/UI_QAYTA_TUZISH.md 4.2, 4.3, 4.4 bo'yicha ommaviy qobiq va bosh sahifani VITE_PUBLIC_V2
bayrog'i ichida qur: TopBar v2 (LX-01: ijtimoiy, hisobot kalendari, telefon, ViewControls A A A + ◐,
LanguageSwitcher variant="inline" O'ZB ЎЗБ РУС, Kirish), PublicHeader v2 (ikki qatorli rasmiy nom,
LX-02), MainNav (6 band, katta harf, sticky, LX-03, config/publicMenu.ts 4.3 jadvali; URL'lar
o'zgarmaydi). Bosh sahifa v3: SearchPanel + aholi soni, kirganlarga AlertStrip, LinkGrid mavzular,
Tabs + DocList (E'lon qilingan / Kutilayotgan), CountGrid, ServiceCard row ×8, foydali resurslar.
Bosh sahifada grafik kutubxonasi import qilinmasin (bundle tahlili PR'da). Chiqqan bloklarni 4.4
jadvalidagi yangi joylariga ko'chir, o'chirma. LegacyLink (GV-11). Lighthouse mobil LCP va CLS ni PR'ga
yoz. PR.
```

**H12 qo'shimchasi:**

```text
mystat/UI_QAYTA_TUZISH.md 5-bo'limdagi H12 qatorlarini bajar: /release-calendar tablari
(Bugun/Haftalik/Oylik/Kalendar) DocList bilan, /reports, /reglaments, /stat-codes DocList bilan va
lex.uz ExternalLink, /regions "Xarita / Ro'yxat" (RegionCountList), /news. X-9 testi (uz lokalida
kirill matn yo'q). LegacyLink va VITE_PUBLIC_V2 ni olib tashla. PR.
```

---

## 9. Tekshiruv ro'yxatiga qo'shimcha

HIBRID 9.3 ga qo'shiladi:

- [ ] Bosh sahifada grafik kutubxonasi yuklanmaydi (Network yoki bundle tahlili); mobil LCP raqami PR'da.
- [ ] A A A: 130 % da 360 / 768 / 1280 da gorizontal skroll yo'q; tanlov sahifalar orasida saqlanadi.
- [ ] Til kodlari qatorda, joriysi `aria-current="true"`, har birida `lang` atributi.
- [ ] `MainNav` bandlari `publicMenu.ts` dan; `/sitemap` bandlari menyu bilan bir xil (birlik testi).
- [ ] `SearchPanel` filtrlari URL'da; sahifani yangilaganda filtrlar saqlanadi; "Filtrlarni tozalash" hammasini tozalaydi.
- [ ] `DocList` jadvalida `<th scope="col">`, mobil ko'rinishda raqamlar `<ol>`.
- [ ] `CountGrid` sonlari API bilan bir xil, yuklanishda 0 yo'q (X-1).
- [ ] Ko'rsatkich sahifasida har jadval va grafikda anchor, "Havolani nusxalash" ishlaydi.
- [ ] Eski nashr ochilganda `AlertStrip` "Amaldagi nashr →" ko'rinadi (LX-09 yoqilgan bo'lsa).
- [ ] X-1..X-11 ro'yxati butun saytda tekshirildi.
- [ ] `config/contacts.ts` dan tashqarida telefon raqami yozilmagan (grep).

---

### Manbalar

- [lex.uz](https://lex.uz/) va [lex.uz hujjat sahifasi namunasi (VMQ-54, 31.01.2025)](https://lex.uz/uz/docs/-7354510) — 2026-10-30 da matn ko'rinishida o'qildi.
- [gov.uz/oz](https://gov.uz/oz), [gov.uz/oz/uzbmb](https://gov.uz/oz/uzbmb), [pm.gov.uz/oz](https://pm.gov.uz/oz) — 2026-10-29 da matn ko'rinishida o'qildi.
- [Portal haqida (gov.uz)](https://gov.uz/oz/pages/about_portal), [Uzinfocom: Hukumat portali](https://uzinfocom.uz/projects/o-zbekistan-respublikasi-hukumat-portali-uz-latin-42), [Kursiv: davlat idoralari saytlari yagona platformaga](https://uz.kursiv.media/uz/2025-02-04/ozbekistonda-davlat-idoralari-saytlari-yagona-platformaga-otkaziladi/).
