# Korxonalar scoringi: sintetik ma'lumot, parametrlar va UI

> **Sana:** 2026-10-16
> **Maqsad:** KTUT'dagi har bir korxonaga (STIR bo'yicha) 0–100 ball va 6 ta ustun bo'yicha baho berish: moliya, o'sish, tashqi savdo, kadrlar, inklyuzivlik (ayollar, yoshlar, nogironligi bo'lgan shaxslar), intizom. Ball ilovada korxona ko'rinadigan **hamma joyda** chiqadi.
> **Asos:** `ISH_REJASI.md` (S-01, S-02, S-09, S-10, K-02, K-04, K-07 qoidalari), `SCORING_MODEL.md` (hududlar scoringi, KR-15..KR-28). Bu fayl uning davomi: vazifalar **KR-29..KR-38**.
> **Qanday ishlatiladi:** Claude Code'ga "KORXONA_SCORING.md dagi `KR-30` ni bajar" deyish yetarli. Tartib 9-bo'limda.
> **Namunaviy kod va ma'lumot:** `korxona_scoring/` papkasida: `generate_companies.py` (generator), `score_companies.py` (hisoblash), `namuna_korxonalar.csv` (3000 ta soxta korxona), `namuna_scoring.csv` (ularning bali). Ilovadagi kod shu ikki skript mantiqini takrorlaydi va natijasi ular bilan solishtiriladi (KR-31 qabul mezoni).
> **Muhim:** ball **rasmiy baho emas**. Sintetik ma'lumotdagi ball faqat `DEBUG=True` muhitda bor va doim "Namuna" belgisi bilan chiqadi (S-09).

---

## 0. Bajarilish holati (2026-10-16)

**KR-29..KR-38 bajarildi.** Tekshiruv natijalari:
- backend: `apps.analytics` (yangi `tests_company_scoring.py` — 21 test), `apps.common.tests_seed_demo`, `apps.organizations`, `apps.additional_services`, `apps.siat` — hammasi OK;
- `npm run e2e` (`frontend/e2e/company-score.spec.ts`, 7 test) — OK;
- `tsc`, `eslint`, `vite build` — xatosiz;
- migratsiyalar `analytics.0002_company_scoring`, `common.0031_company_scoring`.

Lokal bazada: 65 545 KTUT korxonasi, 174 288 ko'rsatkich qatori (2023–2025), 436 483 ball. Sinflar (2025, muvozanatli preset): A 7.1%, B 28.2%, C 42.4%, D 15.5%, E 3.2%, "—" 3.7% — 4.6 jadvaliga mos.

**Ikki qaror (2026-10-16, foydalanuvchi bilan kelishilgan):**
1. **`korxona_scoring/` repoda yo'q edi** — hujjat bo'yicha yozildi. `generate_companies.py` ilova generatorini chaqiradi (`backend/apps/analytics/company_scoring/generator.py`, Django'siz). `score_companies.py` — **mustaqil** sof-Python implementatsiya; ilova dvigateli (pandas) natijasi u bilan solishtiriladi. 3000 korxona × 5 preset bo'yicha farq 0.0, sinf farqi 0. CSV'lar test fixture sifatida `backend/apps/analytics/fixtures/company_scoring/` ga ham ko'chirilgan.
2. **KTUT'da OKED, hudud va mulkchilik yo'q** (faqat STIR, nom, OKPO). Shuning uchun ular ham sintetik (`sources` da `synthetic`) va UI'da "Namuna" belgisi bilan chiqadi. Sanoat jadvalida mahsuloti bor korxona ishlab chiqaruvchi bo'limga (A, B, C) qo'yiladi.

| Vazifa | Holat | Qayerda / izoh |
|---|---|---|
| KR-29 | ✅ | `EnterpriseIndicator` (kengaytirildi, `is_synthetic`, `sources`), `EnterpriseScore`, `CompanyScoringReport`, `SiteSettings.company_score_public`; `apps/analytics/company_scoring.yaml` + `company_scoring/config.py` (validatsiya); YAML'ga yangi ko'rsatkich kodsiz qo'shilishi testi |
| KR-30 | ✅ | `apps/common/seeders/enterprise_scoring.py`. Partiya yozuvi `enterprise_scoring:batch`, `--flush` `is_synthetic` bo'yicha; `seed = 42 + crc32(stir)`; ish haqi bazasi — SIAT 500; tuman — aholiga mutanosib, SIAT tumanlariga mos. Lokal tezlik uchun `ENTERPRISE_SCORING_LIMIT=N` (`--limit` o'rniga, chunki `seed_demo` umumiy komanda). Demo korxonalarning (S-10) mavjud tushumi, xodimlari va eksporti saqlanadi |
| KR-31 | ✅ | `company_scoring/engine.py` (pandas), `service.py` (PostgreSQL `COPY`), `compute_company_scores` va Celery `compute_company_scores_task`, `seed_demo` tugagach avtomatik. 65 545 korxona × 5 preset — **81 s** (talab < 2 daqiqa). Standart preset — har yil, og'ir JSON bilan; qolgan presetlar — oxirgi yil, faqat ball va sinf |
| KR-32 | ✅/qisman | **Real:** majburiy hisobotlar soni (`KtutReportList` + hisobot kalendari), mahsulot turlari (`IndustrialProduct`). **Real manba yo'q (sintetik qoladi):** o'z vaqtida topshirilganlar ulushi (`submitted-report` stub, OS-11); faoliyat davomiyligi (KTUT'da ro'yxatdan o'tgan sana yo'q); tashqi savdo (savdo jadvalida korxona kesimi yo'q). Real maydon bor korxonada `data_source="mixed"`, kartochkada "Real" belgisi |
| KR-33 | ✅ | `company_scoring/api.py`: `company-scores/` (≤100 STIR, keshsiz ~85 ms), `<stir>/`, `me/`, `distribution/` (gistogramma, p25–p75), `methodology/`; kesh 24 soat, hisob tugaganda tozalanadi; OS-18 (`DEBUG=False` va `company_score_public=False` → begona STIR 404, `distribution/` ochiq); OpenAPI |
| KR-34 | ✅ | `frontend/src/components/company-score/`: `CompanyScoreBadge`, `CompanyScoreCard`, `useCompanyScores` (`api/companyScores.ts`), `CompanyQualityBlock`, `ScoreWidgets`. Barcha holatlar — `/company-score/components` sahifasi (Storybook o'rniga), 375px e2e testi |
| KR-35 | ✅ | Hamkorlar `/partners` (ustun, "Faqat A–B", saralash, preset, XLSX'da `ball`/`sinf`/`namuna`; sinf filtri ~330 ms), sanoat `/industry`, global qidiruv (yangi "Korxonalar" guruhi), admin (KTUT va `Organization`: "Ball", "Sinf", sinf filtri). **Qamrov qoidasi bo'yicha qo'shimcha joylar:** `ReportsCalendarDetail` (STIR bo'yicha hisobotlar), kabinetdagi "Hisobotlarim", `/organizations-ktut` |
| KR-36 | ✅ | `/orginfo` (lazy kartochka), `/cabinet/organization` (`mode="own"`: tavsiyalar, o'z qiymatlari va guruh medianasi, 2023–2025 dinamikasi), kabinet bosh paneli (mini kartochka), benchmark (gistogramma va ustunlar p25–p75) |
| KR-37 | ✅ | `/regions?ind=company-score` va `ind=company-score-ab` (`apps/siat/views_company.py`), hudud kartochkasida va hududiy profilda "Korxonalar sifati" bloki, admin analitikada sinflar taqsimoti (demo almashtirgichi bilan) |
| KR-38 | ✅ | `/methodology/company-score`; `validate_company_scoring` — presetlar orasida sinf o'zgarishi, vaznlar ±20% (o'rtacha 6% korxonaning sinfi o'zgaradi), adolat (hudud, OKED, o'lcham — 5 balldan katta farq yo'q), sinflar taqsimoti; natija admin'da |

**Hujjatdagi farazlar kod bilan mos kelmagan joylar:**
- **`/organizations-ktut` ro'yxat emas.** Bu STIR bo'yicha qidiruv formasi edi, yuborish tugmasi hech narsa qilmasdi. Endi qidirilgan STIR bo'yicha ball kartochkasi chiqadi.
- **Global qidiruvda korxona natijalari yo'q edi.** "Korxonalar" guruhi qo'shildi (KTUT nomi yoki STIR bo'yicha).
- **Tashqi savdo / bozor tahlili (K-03).** Savdo ma'lumotida STIR yo'q, shuning uchun 11-band bo'yicha blok chiqmaydi.
- **PNG/PDF "NAMUNA" suv belgisi.** Kartochkaning o'z eksporti yo'q. Pasport PDF'i (unda kartochka ham bor) mavjud suv belgisi mexanizmidan foydalanadi.
- **Shablonlar `_uz`, `_ru`, `_cry` maydonlari bilan emas**, bitta YAML kalitida `{uz, ru, cry}` ko'rinishida. API `?lang=uz|ru|cry` qabul qiladi, frontend esa o'zbekcha (loyihada umumiy i18n yo'q).

---

## 1. Model nimani beradi

Har korxona (STIR) va yil uchun:

1. **Umumiy ball** 0–100 va **sinf**: A (Yuqori), B (Yaxshi), C (O'rta), D (Past), E (Xavf zonasi).
2. **6 ta ustun bahosi** (radar diagramma): qayerda kuchli, qayerda zaif.
3. **Tengdoshlar guruhi**: kim bilan solishtirilgani ("C bo'lim, kichik korxonalar, 412 ta").
4. **Bayroqlar**: soliq qarzi, hisobot intizomi past, zarar bilan ishlagan.
5. **To'liqlik**: qaysi ko'rsatkich yetishmaydi va ball qanchalik ishonchli.
6. **Tavsiyalar** (faqat o'z korxonasi uchun, kabinetda): eng zaif 2–3 ko'rsatkich va guruh medianasi bilan farqi.

Hisob deterministik (LLM yo'q), har ball ko'rsatkichlarga qaytib tushuntiriladi. Mantiq hududlar scoringi (`SCORING_MODEL.md` 3-bo'lim) bilan bir xil uslubda: ko'rsatkich → tengdoshlarga nisbatan baho → ustun → umumiy, to'liqlik va vazn presetlari bilan.

---

## 2. Parametrlar va O'zbekiston kontekstida asoslash

Tanlov mezoni: (1) korxona sifati yoki salohiyati haqida haqiqatan nimadir aytadi; (2) davlat siyosatining ustuvor yo'nalishiga mos (eksport, rasmiy bandlik, ayollar va yoshlar bandligi, hisobot intizomi); (3) kelajakda real manbadan olinadi (8-bo'lim).

### 2.1. Ustunlar va ko'rsatkichlar

| Ustun | Ko'rsatkich (`kod`) | Hisob | Yo'nalish | Tur | Nega foydali (O'zbekiston) |
|---|---|---|---|---|---|
| **M. Moliyaviy holat** | Tushum o'sishi (`m_rev_growth`) | 2 yillik CAGR | + | tengdosh | Nominal, lekin guruh ichida solishtirilgani uchun inflyatsiya (≈10%) barchaga bir xil ta'sir qiladi |
| | Xodim boshiga tushum (`m_rpe`) | tushum ÷ xodimlar | + | tengdosh | Mehnat unumdorligi; tarmoqlar orasida 10 baravar farq, shuning uchun faqat guruh ichida |
| | Sof foyda marjasi (`m_margin`) | foyda ÷ tushum | + | tengdosh | Rentabellik; manfiy bo'lsa "zarar" bayrog'i |
| **O. O'sish va investitsiya** | Xodimlar soni o'sishi (`o_emp_growth`) | 2 yillik CAGR | + | tengdosh | Yangi ish o'rinlari yaratish davlat dasturlarining asosiy ko'rsatkichi |
| | Xodim boshiga investitsiya (`o_invest_pe`) | asosiy kapitalga investitsiya ÷ xodimlar | + | tengdosh | Modernizatsiya; hududlar scoringidagi D ustuni bilan bog'lanadi |
| | Mahsulot turlari (`o_products`) | sanoat jadvalidagi mahsulot turlari soni | + | tengdosh | Faqat A, B, C bo'limlarida; ilovadagi **real** sanoat jadvalidan (53 319 yozuv) olinishi mumkin |
| **T. Tashqi savdo** | Eksport ulushi tushumda | eksport (so'mda) ÷ tushum | + | eksportchilar ichida | Eksportni rag'batlantirish ustuvor; korxona darajasidagi eng muhim "tashqi bozorga chiqqan" signal |
| | Eksport davlatlari soni | | + | eksportchilar ichida | Bozor diversifikatsiyasi: bitta davlatga bog'liqlik xavfi kamayadi |
| | Eksport tovar turlari (HS) | | + | eksportchilar ichida | Mahsulot diversifikatsiyasi |
| | Eksport o'sishi | 2 yillik CAGR | + | eksportchilar ichida | Yangi eksportchida 0.5 deb olinadi (ijobiy) |
| | Savdo balansi | eksport ÷ (eksport + import) | + | eksportchilar ichida | Sof eksportchi valyuta oqimini beradi; import o'z-o'zidan salbiy emas, shuning uchun alohida jazo yo'q |
| **X. Mehnat resurslari** | O'rtacha ish staji shu korxonada (`x_staj`) | yil | + | tengdosh | Kadrlar barqarorligi, tajriba to'planishi |
| | Kadrlar qo'nimsizligi (`x_turnover`) | yil davomida ketganlar ÷ o'rtacha xodimlar | **−** | tengdosh | Yuqori qo'nimsizlik — past ish haqi yoki yomon sharoit belgisi |
| | Nisbiy ish haqi (`x_wage_rel`) | o'rtacha ish haqi ÷ (hudud × OKED bo'limi) medianasi | + | tengdosh | Rasmiy ish haqi: "konvertdagi" ish haqiga qarshi signal; hudud farqi olib tashlanadi |
| | Oliy ma'lumotlilar ulushi (`x_edu`) | | + | tengdosh | Inson kapitali |
| **I. Inklyuzivlik** | Ayollar ulushi (`i_women`) | ayol xodimlar ÷ xodimlar, kichrayish bilan (4.3) | + | tengdosh | Ayollar bandligi davlat siyosatida ustuvor; **faqat o'z tarmog'i ichida** solishtiriladi, shuning uchun qurilish to'qimachilikka qarab jazolanmaydi |
| | Rahbariyatda ayollar (`i_mgmt`) | 0.5 × rahbar ayol + 0.5 × rahbariyatdagi ayollar ulushi | + | tengdosh | Qaror qabul qilishda ishtirok, gender tenglik strategiyasi yo'nalishi |
| | Ayollar va erkaklar ish haqi nisbati (`i_pay_gap`) | 0.5 → 0, 1.0 va undan yuqori → 100 | + | mutlaq | Teng mehnatga teng haq; 6 dan kam xodimda qo'llanilmaydi |
| | Yoshlar ulushi, 18–30 (`i_youth`) | | + | tengdosh | Yoshlar bandligi ("Yoshlar daftari" kabi dasturlar) |
| | Nogironlik kvotasi (`i_disab`) | (nogironligi bor xodimlar ÷ xodimlar) ÷ 3%, 0–100 | + | mutlaq | Qonunchilikda 20+ xodimli ish beruvchiga kvota bor (kamida 3%; aniq foiz va qamrov huquqiy bo'lim bilan tekshirilsin). 20 dan kam xodimda qo'llanilmaydi |
| **S. Intizom va ishonchlilik** | Statistik hisobotlarni o'z vaqtida topshirish (`s_reports`) | o'z vaqtida ÷ majburiy × 100 | + | mutlaq | **Ilovada real manba bor** (`KtutReportList` + `submitted-report`); qo'mita uchun eng tabiiy ko'rsatkich |
| | Soliq qarzi yo'qligi (`s_tax`) | yo'q → 100, bor → 0 | + | mutlaq | Hamkor va bank uchun asosiy xavf signali; bayroq va ballga cheklov (4.5) |
| | Faoliyat davomiyligi (`s_age`) | min(yosh, 10) × 10 | + | mutlaq | Yosh korxonalarda yopilish ehtimoli yuqori; 10 yildan keyin farq qilmaydi |

**"Tengdosh"** = shu tengdoshlar guruhi ichidagi percentil (4.1). **"Mutlaq"** = qiymatning o'zi 0–100 shkalada, chunki u normativga nisbatan o'lchanadi (kvota, muddat, qarz).

### 2.2. Ataylab kiritilmagan parametrlar

| Parametr | Nega bahoga kirmaydi | Qayerda ishlatiladi |
|---|---|---|
| Korxona o'lchami (xodimlar soni, tushum hajmi) | Katta bo'lish o'z-o'zidan "yaxshi" emas; kichik korxona ham A olishi kerak | Tengdoshlar guruhini tuzishda |
| Hudud | Toshkent shahridagi korxona joylashuvi uchun ustun bo'lmasligi kerak | Ish haqi nisbiy hisobida; hududiy kontekst bloki (`SCORING_MODEL.md` indeksi) kartochkada alohida |
| Mulkchilik shakli (davlat ulushi, xorijiy kapital) | Baho emas, xususiyat | Filtr va kontekst |
| Import hajmi | Xomashyo va uskuna importi rivojlanish belgisi bo'lishi mumkin | Faqat savdo balansi orqali, eksportchilar ichida |
| Rahbar yoki ta'sischining shaxsiy ma'lumotlari | Shaxsiy ma'lumot, ISH_REJASI 3-bo'lim 4-qoida | Hech qayerda |
| Energiya samaradorligi, ekologiya (ESG) | Hozircha manba yo'q | Keyingi versiya: `company_scoring.yaml` ga yangi ko'rsatkich sifatida |

---

## 3. Sintetik ma'lumot generatori

`korxona_scoring/generate_companies.py` — namunaviy implementatsiya. Ilovada u `seed_demo` ichidagi seeder'ga ko'chiriladi (KR-30). Farqi: skript o'zi soxta korxonalar yaratadi, ilova esa **mavjud real KTUT korxonalariga** ko'rsatkich yozadi (foydalanuvchi so'ragani shu: "korxonalar bor, shularni to'ldir").

### 3.1. Asosiy qoidalar (ISH_REJASI 8-bo'limdan meros)

1. Faqat `DEBUG=True`. Har yozuv S-01 reyestriga tushadi, `seed_demo --flush --only enterprise_scoring` hammasini tozalaydi.
2. Real KTUT jadvaliga **ustun qo'shilmaydi va qator o'zgartirilmaydi**. Ko'rsatkichlar yangi jadvalga (KR-29) STIR bo'yicha yoziladi.
3. Takrorlanuvchan: `seed = 42 + crc32(stir)`, ya'ni har korxona har ishga tushirishda bir xil qiymat oladi, korxonalar qo'shilsa ham boshqalari o'zgarmaydi.
4. Real korxona nomi va STIR'i yonidagi sintetik qiymat UI'da doim "Namuna" belgisi bilan (S-09). Xom qiymatlar (tushum, foyda, ish haqi) **begona korxona uchun hech qachon ko'rsatilmaydi**, faqat ball va ustunlar (S-10 qoidasi saqlanadi, 6-bo'lim).
5. Real manbasi bor ko'rsatkich (hisobot intizomi, mahsulot turlari, tashkil topgan yil, KTUT OKED/hudud) generatsiya qilinmaydi, real qiymat olinadi (KR-32). Har qiymat yonida `source: real|synthetic`.

### 3.2. Taqsimotlar

| Nima | Qoida | Ilovada manba |
|---|---|---|
| OKED bo'limi va hudud | Skriptda taxminiy ulushlar (savdo ≈32%, sanoat ≈14%, qishloq xo'jaligi ≈9%, qurilish ≈9%; Toshkent sh. ≈20%) va hudud turi bo'yicha siljish (poytaxtda J, K, M ko'p; Navoiyda B ko'p) | KTUT'dagi **real** OKED va hudud (generatsiya qilinmaydi) |
| Yashirin sifat omili `q ~ N(0,1)` | Har korxonaga bitta; o'sish, unumdorlik, marja, ish haqi, staj, intizom, eksport ehtimolini bir yo'nalishda siljitadi | Shu kabi; ko'rsatkichlar o'zaro bog'langan bo'lishi realistik ko'rinish uchun shart |
| Xodimlar | Log-normal, bo'lim medianasi (savdo 4, sanoat 15, energetika 60), σ = 1.05; davlat/xorijiy ulushli korxonalar 1.5–3 baravar katta | KTUT'da xodimlar bo'lsa shu, aks holda generatsiya |
| Xodim boshiga tushum | Log-normal, bo'lim medianasi (mln so'm/yil: ta'lim 80, sanoat 450, savdo 700, moliya 1500), poytaxtda ×1.25 | — |
| Ish haqi | Hudud o'rtachasi × tarmoq koeffitsienti × `exp(0.12q + shovqin)`; 5 dan kam xodimda ×0.82 (rasmiy ish haqi pastroq) | Hudud o'rtachasi **SIAT 500** ko'rsatkichidan (KR-01 orqali bazada) |
| Tashqi savdo | Eksport ehtimoli bo'lim/bo'linma bazasi × o'lcham × xorijiy kapital × `exp(0.35q)`; to'qimachilik va kiyim eng yuqori; ulush Beta(2,4) | Agar savdo jadvalida STIR bo'lsa real (KR-32) |
| Ayollar ulushi | Bo'linma bo'yicha: ta'lim 0.75, sog'liq 0.78, kiyim 0.80, qurilish 0.08; Binomial(xodimlar) | — |
| Staj | `N(bo'lim bazasi + 0.7q, 1.4)`, korxona yoshidan oshmaydi; qo'nimsizlik stajga teskari | — |
| Soliq qarzi | Ehtimol `0.07·exp(−0.7q)` (≈9%) | — |
| Hisobotlar | Majburiy soni `Poisson(3 + 0.8·ln(1+xodimlar))`, o'z vaqtida ulushi `0.86 + 0.07q` | `KtutReportList` dan **real** majburiy soni (KR-32) |
| Bo'shliqlar | ≈6% korxonada mehnat bloki yo'q, ≈3% da moliya yo'q; 2024–2025 da tuzilganlarda o'sish yo'q | Shu nisbatlar saqlanadi, "Ma'lumot yetarli emas" holati UI'da ko'rinishi uchun |

Namunadagi natija (3000 korxona): mediana 7 xodim, 7% eksportchi, 21% importchi, soliq qarzi 9%, o'rtacha ish haqi mediana ≈4,6 mln so'm. Bu qiymatlar **taxminiy** va faqat namunaning ishonarli ko'rinishi uchun; ular rasmiy statistika emas.

---

## 4. Hisoblash usuli

### 4.1. Tengdoshlar guruhi

- Asosiy guruh: **OKED bo'limi × o'lcham sinfi** (mikro 1–10, kichik 11–50, o'rta 51–250, yirik 250+ xodim). Bu sinflar faqat solishtirish uchun, qonundagi tadbirkorlik subyekti toifasi emas.
- Guruhda 30 dan kam korxona bo'lsa → faqat OKED bo'limi; u ham kam bo'lsa → butun respublika. Qaysi daraja ishlatilgani javobda (`peer_group`) va UI'da yoziladi.

### 4.2. Ko'rsatkich bahosi

```
tengdosh tur:  s = 100 · percentil_rank(x, guruh)     # o'rtacha rang, tenglar teng baho oladi
               yo'nalish "−" bo'lsa  s = 100 − s
mutlaq tur:    s = ko'rsatkichning o'z formulasi (2.1 jadval), 0..100
```

Percentil (z-baho emas) tanlangan, chunki korxona ko'rsatkichlari juda qiyshiq (bitta yirik korxona minglab kichigini bosib ketadi) va percentil chetdagi qiymatlarga sezgir emas. Hududlar scoringida 14 hudud bo'lgani uchun z-baho ishlatilgan, bu yerda guruhlar katta.

### 4.3. Kichik korxonalarda ulushlar

5 xodimli korxonada bitta ayol ishga olinsa ulush 20% ga sakraydi. Shuning uchun ulush ko'rsatkichlari (`i_women`, `i_mgmt`) guruh o'rtachasiga tortiladi:

```
x_adj = (n · x + k · m_bo'lim) / (n + k),   k = 10,  n = xodimlar (yoki rahbariyat soni)
```

### 4.4. Ustun va umumiy ball

```
ustun(P)   = mavjud ko'rsatkichlar bahosining o'rtachasi (ustun ichida teng vazn)
umumiy     = Σ W_P · ustun(P) / Σ_{P mavjud} W_P
```

**Tashqi savdo ustuni** alohida:
- faqat savdoga yaroqli tarmoqlarda baholanadi: A, B, C bo'limlari va 46 (ulgurji savdo). Boshqalarida ustun "tegishli emas", vazni qolgan ustunlarga taqsimlanadi (xizmat ko'rsatuvchi korxona eksport qilmagani uchun jazolanmaydi);
- eksportchi: `40 + 60 × (5 ta savdo ko'rsatkichi percentilining o'rtachasi, eksportchilar ichida bo'lim bo'yicha)`;
- eksport qilmaydigan savdoga yaroqli korxona: `30`.

Namunada bu sanoat va qishloq xo'jaligi korxonalarining o'rtacha balini ≈2 ballga pasaytiradi, eksportchilar o'rtacha 60, qolganlar 54. Bu ataylab qilingan kichik rag'bat; kattaroq bo'lishi kerak bo'lsa `eksport` presetidan foydalaniladi.

### 4.5. Bayroqlar va cheklovlar

| Bayroq | Shart | Ta'siri |
|---|---|---|
| `soliq_qarzi` | soliq qarzi bor | Umumiy ball **57 dan oshmaydi** (B sinfining pastki chegarasidan past, ya'ni A va B mumkin emas) |
| `hisobot_intizomi_past` | o'z vaqtida topshirilgan < 50% | Faqat belgi, ball S ustuni orqali allaqachon pasaygan |
| `zarar_bilan_ishlagan` | sof foyda < 0 | Faqat belgi |

### 4.6. Sinflar

| Sinf | Ball | Namunadagi ulush |
|---|---|---|
| A · Yuqori | ≥ 70 | 7.6% |
| B · Yaxshi | 58–70 | 28.1% |
| C · O'rta | 45–58 | 41.6% |
| D · Past | 35–45 | 15.4% |
| E · Xavf zonasi | < 35 | 2.8% |
| — · Ma'lumot yetarli emas | to'liqlik < 0.6 | 4.5% |

Chegaralar `company_scoring.yaml` da. Real ma'lumot ulanganda taqsimot qayta ko'rib chiqiladi (KR-38).

### 4.7. To'liqlik

```
to'liqlik = Σ_P W_P · (P ustunidagi mavjud ko'rsatkichlar ÷ qo'llaniladigan ko'rsatkichlar) / Σ_P W_P
```
- Qo'llanilmaydigan ko'rsatkich (nogironlik kvotasi 20 dan kam xodimda, mahsulot turlari xizmat sohasida, o'sish 2024+ tuzilgan korxonada) maxrajga kirmaydi.
- `< 0.6` → ball yo'q, "Ma'lumot yetarli emas"; `0.6–0.85` → ball "qisman ma'lumot" belgisi bilan.
- **Imputatsiya qilinmaydi** (hududlar scoringidagi kabi): yetishmagan qiymat korxonani sun'iy "o'rtacha" qilib qo'yadi.

### 4.8. Vazn presetlari

| Ustun | Muvozanatli (standart) | Hamkor / investor | Bank / kredit | Eksport | Ijtimoiy ta'sir |
|---|---|---|---|---|---|
| M. Moliyaviy holat | 20 | 30 | 35 | 20 | 5 |
| O. O'sish va investitsiya | 15 | 20 | 15 | 15 | 15 |
| T. Tashqi savdo | 15 | 20 | 5 | 40 | 5 |
| X. Mehnat resurslari | 20 | 10 | 10 | 10 | 30 |
| I. Inklyuzivlik | 15 | 5 | 5 | 5 | 30 |
| S. Intizom va ishonchlilik | 15 | 15 | 30 | 10 | 15 |

Ro'yxat va kartochkalarda standart preset. Preset tanlash KTUT ro'yxati, `/partners` va kartochkada (URL: `&csp=eksport`). Ball barcha presetlar uchun oldindan hisoblanadi (5 × korxona soni, katta emas).

### 4.9. Tavsiyalar (faqat o'z korxonasi)

Qoida: percentili 25 dan past bo'lgan "tengdosh" ko'rsatkichlardan eng pasti 3 tasi, yoki mutlaq ko'rsatkich 60 dan past. Har biri uchun shablon matn va raqam, masalan:
- "Kadrlar qo'nimsizligi 38%, guruhingizda mediana 22%. Ish haqi va ish sharoitini ko'rib chiqing."
- "Statistik hisobotlarning 4 tasidan 2 tasi kechikkan. Hisobot kalendarida eslatmani yoqing" (K-05 ga havola).
- "Eksport yo'q. Mahsulotingiz bo'yicha bozor tahlili hisobotini ko'ring" (K-03 ga havola, korxonaning OKED'iga mos HS bilan).

Shablonlar `_uz`, `_ru`, `_cry` bilan `company_scoring.yaml` da.

---

## 5. Ma'lumot modeli va API

### 5.1. Jadvallar (hammasi yangi, `analytics` app'ida, S-10 bilan bir joyda)

```text
EnterpriseIndicator            # S-10 dagi model, shu ustunlar bilan kengaytiriladi (S-10 hali bajarilmagan bo'lsa, birga yaratiladi)
  stir, year                   unique(stir, year)
  revenue, revenue_prev2, net_profit, employees, employees_prev2, avg_wage
  export_value, export_prev2, import_value, export_countries, export_hs_count
  avg_tenure_years, turnover_rate, higher_edu_share
  women_count, mgmt_count, women_mgmt_count, head_female, gender_pay_ratio, youth_share, disabled_count
  investment, products_count
  reports_due, reports_on_time, tax_debt (bool), tax_debt_amount
  sources       JSONField   # {"reports_due": "real", "revenue": "synthetic", ...}

EnterpriseScore
  stir, year, preset, model_version
  overall (nullable), klass, coverage, peer_group, peer_size
  pillars       JSONField   # {"M": 61.2, "O": 47.0, "T": null, ...}
  indicators    JSONField   # {"m_rpe": {"value": ..., "score": ..., "peer_median": ...}, ...}
  flags         ArrayField / JSONField
  data_source   "real" | "synthetic" | "mixed"
  computed_at
  unique(stir, year, preset, model_version)
```

### 5.2. API

| Endpoint | Kim | Javob |
|---|---|---|
| `GET /api/analytics/company-scores/?stir=a,b,c&preset=` | ochiq | Ro'yxatlar uchun: har STIR'ga `overall`, `klass`, `coverage`, `data_source`, `is_synthetic`. Ko'pi bilan 100 STIR, N+1 yo'q |
| `GET /api/analytics/company-scores/<stir>/?preset=&year=` | ochiq | Kartochka: ustunlar, bayroqlar, tengdoshlar guruhi va hajmi, ustun bo'yicha percentil. **Xom qiymat yo'q** |
| `GET /api/analytics/company-scores/me/` | login, o'z korxonasi | Yuqoridagi + ko'rsatkichlarning o'z qiymati, guruh medianasi, tavsiyalar |
| `GET /api/analytics/company-scores/distribution/?oked=&region=&district=` | ochiq | Agregat: sinflar taqsimoti, o'rtacha ball, ustunlar medianasi (hududiy blok va benchmark uchun) |
| `GET /api/analytics/company-scores/methodology/` | ochiq | Ko'rsatkichlar ro'yxati, vaznlar, chegaralar (`company_scoring.yaml` dan) |

Mavjud ro'yxat endpoint'lari (KTUT, `ktut/search`) serializer'iga `score` obyekti qo'shiladi (bitta `prefetch` bilan). Eski maydonlar o'zgarmaydi.

---

## 6. UI: ball qayerda chiqadi

Ikki komponent, `frontend/src/components/company-score/`:
- **`CompanyScoreBadge`**: sinf harfi rangli doirachada + ball ("B · 63"). Ustiga olib borilganda 6 ustun mini-chizig'i va "Namuna" izohi. To'liqlik < 0.6 bo'lsa kulrang "—" va "Ma'lumot yetarli emas".
- **`CompanyScoreCard`**: ball, sinf, radar (loyihadagi grafik kutubxonasi, ISH_REJASI 3.8 bo'yicha Recharts), tengdoshlar guruhi, bayroqlar, to'liqlik, "Qanday hisoblanadi" havolasi, preset tanlagich. `mode="own"` bo'lsa tavsiyalar va o'z qiymatlari.

Ikkalasi `is_synthetic` bo'lsa S-09 `SampleBadge` ni ko'rsatadi; PNG/PDF eksportda "NAMUNA" suv belgisi.

| # | Joy | Nima chiqadi | Vazifa |
|---|---|---|---|
| 1 | `/organizations-ktut` (KTUT ro'yxati) | Jadvalga "Ball" ustuni (badge), sinf bo'yicha filtr, ball bo'yicha saralash, preset tanlagich | KR-35 |
| 2 | `/orginfo` (STIR bo'yicha korxona ma'lumoti, `OrgInfoPage`) | `CompanyScoreCard` asosiy ma'lumot ostida (lazy-load, Q-02 chunk'ini kattalashtirmaslik uchun) | KR-36 |
| 3 | `/partners` (K-04 hamkor qidiruvi) | Badge ustuni, "Faqat A–B" filtri, saralash, XLSX eksportda `ball`, `sinf`, `namuna` ustunlari | KR-35 |
| 4 | `/industry` (sanoat mahsulotlari) | Ishlab chiqaruvchi korxona ko'rsatilgan joyda badge | KR-35 |
| 5 | Global qidiruv (U-10), korxona natijalari | Badge | KR-35 |
| 6 | `/cabinet/organization` (K-07 pasport) | `CompanyScoreCard mode="own"`: tavsiyalar, o'z qiymatlari, yillar bo'yicha ball dinamikasi | KR-36 |
| 7 | Kabinet bosh paneli (U-02) | Mini kartochka: ball, sinf, eng zaif ustun, pasportga havola | KR-36 |
| 8 | Benchmark (K-02) | Guruhdagi ball taqsimoti (gistogramma) va korxona nuqtasi; ustunlar bo'yicha p25–p75 | KR-36 |
| 9 | `/regions` xaritasi, hudud kartochkasi (KR-20 "Salohiyat" yorlig'i) | Yangi blok "Korxonalar sifati": sinflar taqsimoti, o'rtacha ball, A–B ulushi; ixtiyoriy xarita qatlami `ind=company-score` | KR-37 |
| 10 | Hududiy profil (FQ-02) | Xuddi shu agregat blok | KR-37 |
| 11 | Tashqi savdo / bozor tahlili (K-03) | Savdo ma'lumotida STIR bo'lsa: shu HS bo'yicha eksportchilar ro'yxatida badge; bo'lmasa blok chiqmaydi | KR-37 |
| 12 | Admin: KTUT va `Organization` ro'yxatlari (Jazzmin) | "Ball", "Sinf" ustunlari, sinf filtri | KR-35 |
| 13 | Admin analitika (A-01) | Sinflar taqsimoti, real/sintetik almashtirgich | KR-37 |
| 14 | Metodologiya sahifasi `/methodology/company-score` | 2 va 4-bo'limlar oddiy tilda, "rasmiy baho emas" izohi | KR-38 |

**Qamrov qoidasi:** yuqoridagi ro'yxat hujjatlardan ma'lum sahifalar. KR-35 bajarilayotganda kodda STIR yoki korxona nomi ko'rsatadigan **boshqa** komponentlar qidiriladi (`stir`, `inn`, `ktut`, `organization` bo'yicha) va badge ularga ham qo'shiladi; topilgan joylar PR tavsifida ro'yxat qilinadi.

**Ko'rsatilmaydigan narsalar:** begona korxonaning xom qiymatlari (tushum, foyda, ish haqi, soliq qarzi summasi). Faqat ball, sinf, ustunlar va bayroq nomi. Bu S-10 va K-02 dagi "begona korxona ko'rsatkichi chiqmaydi" qoidasining davomi.

---

## 7. Production va real korxonalar

`DEBUG=False` da sintetik ma'lumot yo'q (S-02), shuning uchun ball faqat real manbali ko'rsatkichlardan hisoblanadi. Hozir real manbasi borlari: hisobot intizomi, faoliyat davomiyligi, mahsulot turlari (va savdo ma'lumotida STIR bo'lsa, tashqi savdo). Bu to'liqlik 0.6 dan past bo'ladi, ya'ni productionda ball real ma'lumot ulanmaguncha (8-bo'lim) **o'z-o'zidan chiqmaydi**.

Real ma'lumot ulanganda ochiq sahifalarda boshqa korxonalar balini ko'rsatish huquqiy va obro' masalasi (past ball korxonaga zarar qilishi mumkin). Bu **OS-18** ga yoziladi:

| ID | Savol | Default | Vazifa |
|---|---|---|---|
| OS-18 | Productionda begona korxona bali ochiq ko'rinsinmi? | Yo'q: ochiq sahifalarda faqat agregat (hudud/tarmoq), ball faqat o'z korxonasiga (kabinet) va qo'mita xodimlari/admin'ga. Demo muhitda hamma joyda "Namuna" bilan | KR-33, KR-35 |

Bu sozlama `SiteSettings.company_score_public` (standart `False`) orqali, kod o'zgarmasdan yoqiladi.

---

## 8. Real manbalar (keyingi bosqich, OS-13 bilan)

| Ko'rsatkichlar | Mumkin bo'lgan real manba | Izoh |
|---|---|---|
| Hisobot intizomi | Ilovaning o'zi: `KtutReportList` (225 768), `submitted-report` | KR-32 da darhol ulanadi |
| Mahsulot turlari | Ilovadagi sanoat jadvali (53 319), STIR bog'lanishi bo'lsa | Kodni o'qib aniqlanadi |
| Faoliyat davomiyligi, OKED, hudud | KTUT | Ro'yxatdan o'tgan sana maydoni borligi aniqlanadi |
| Tashqi savdo | Ilovadagi tashqi savdo jadvali (3,58 mln) STIR bo'yicha bo'lsa; aks holda bojxona ma'lumoti | Kodni o'qib aniqlanadi |
| Tushum, foyda, xodimlar, investitsiya | Qo'mitaning yillik korxona hisobotlari (shakllar `ReportList` dan aniqlanadi), soliq organi ma'lumoti | Qo'mita ichki bazasi |
| Staj, qo'nimsizlik, ish haqi, gender, yosh, nogironlik | Elektron mehnat shartnomalari tizimi (mehnat vazirligi), qo'mitaning mehnat hisobotlari | Shaxsiy ma'lumot emas, faqat korxona agregati olinadi |
| Soliq qarzi | Soliq organining ochiq qarzdorlar ro'yxati | Faqat bor/yo'q va summa |

Import qilinganda qator `sources` da `real` bo'ladi, shu korxona uchun sintetik qiymat `--flush` bilan olib tashlanadi.

---

## 9. Vazifalar (KR-29..KR-38)

Ustuvorlik ISH_REJASI.md dagi kabi. Old shartlar: S-01, S-02, S-09 tayyor. S-10 tayyor bo'lmasa, KR-29 uni ham qamraydi.

### KR-29 · Ko'rsatkichlar modeli va konfiguratsiya · **P1**

1. 5.1 dagi `EnterpriseIndicator` (kengaytirilgan) va `EnterpriseScore` modellari, migratsiya. Real KTUT jadvaliga tegilmaydi.
2. `backend/apps/analytics/company_scoring.yaml`: ko'rsatkichlar (kod, ustun, yo'nalish, tur, qo'llanilish sharti), presetlar (4.8), sinf chegaralari (4.6), `MIN_PEER=30`, `SHRINK_K=10`, `NO_EXPORT_SCORE=30`, `CAP_TAX_DEBT=57`, tavsiya shablonlari 3 tilda.
3. YAML validatsiyasi ishga tushishda (noto'g'ri ustun kodi yoki manfiy vazn → xato).

**Qabul:** `makemigrations --check` toza; YAML'ni o'zgartirib yangi ko'rsatkich qo'shish kod o'zgartirmasdan ishlaydi (test).

### KR-30 · Sintetik seeder: real KTUT korxonalarini to'ldirish · **P1**

1. `backend/apps/common/seeders/enterprise_scoring.py`, `seed_demo --only enterprise_scoring`. Mantiq `korxona_scoring/generate_companies.py` dan, farqi 3-bo'limda: OKED, hudud, yil, mulkchilik KTUT'dan; ish haqi bazasi SIAT 500 dan (bo'lmasa skriptdagi jadval).
2. Qamrov: standart bo'yicha **barcha** KTUT korxonalari (65 540) uchun 2023 va 2025 yil (2024 ikkalasi orasida interpolyatsiya). `--limit N` bayrog'i lokal tezlik uchun. `bulk_create` 5000 tadan.
3. Har korxonaga `seed = 42 + crc32(stir)`. Real manbali maydonlar (KR-32) yozilmaydi, `sources` da belgilanadi.
4. S-01 reyestriga yozish: 65 ming × yozuv uchun reyestrda har qator emas, **bitta partiya yozuvi** (`seed_key="enterprise_scoring:batch"` + jadvalning o'zida `is_synthetic=True` ustuni) ruxsat etiladi, `--flush` shu ustun bo'yicha o'chiradi.

**Qabul:** ikki marta ishga tushirilsa qiymatlar bir xil; `--flush` dan keyin `EnterpriseIndicator` da sintetik qator 0; OKED×hudud bo'yicha ayollar ulushi va eksportchilar ulushi 3.2 jadvaliga mos (test, ±5 p.p.).

### KR-31 · Hisoblash dvigateli · **P1**

1. `backend/apps/analytics/company_scoring.py`: 4-bo'lim formulasi (`score_companies.py` dagi mantiq), pandas yoki SQL window funksiyalari bilan (percentil uchun `PERCENT_RANK() OVER (PARTITION BY peer_group)`).
2. `compute_company_scores` management komandasi va Celery vazifasi: barcha presetlar, `EnterpriseScore` ga upsert, `model_version` bilan. `seed_demo` va real import tugaganda chaqiriladi.
3. Tavsiyalar (4.9) shu yerda hisoblanib `indicators` JSON'iga yoziladi.

**Qabul:** `namuna_korxonalar.csv` ni test fixture sifatida yuklab hisoblanganda natija `namuna_scoring.csv` bilan ±0.5 ball aniqlikda bir xil (test); 65 ming korxona × 5 preset 2 daqiqadan tez.

### KR-32 · Real manbalarni ulash · **P1**

1. Hisobot intizomi: `KtutReportList` dan yil bo'yicha majburiy hisobotlar soni, `submitted-report` dan o'z vaqtida topshirilganlar (muddat `ReportList` dan). `submitted-report` bo'lmasa (OS-11) faqat majburiy soni real, o'z vaqtidagi ulush sintetik.
2. KTUT'da ro'yxatdan o'tgan sana bo'lsa `s_age` real.
3. Sanoat jadvalida STIR bo'lsa `products_count` real.
4. Tashqi savdo jadvalida STIR yoki korxona identifikatori bo'lsa eksport/import, davlatlar va HS soni real. Bo'lmasa shu fakt PR tavsifida yoziladi.
5. Har biri `sources` da `real`. Real maydon bor korxonada `data_source="mixed"`.

**Qabul:** real manbali ko'rsatkich seeder tomonidan qayta yozilmaydi (test); demo muhitda kartochkada real maydon yonida "Real" belgisi.

### KR-33 · Scoring API · **P1**

5.2 dagi endpoint'lar. `stir` ro'yxati ≤ 100; noma'lum preset 400; kesh 24 soat, `compute_company_scores` tugaganda tozalanadi. `me/` faqat `request.user` ning `Organization` STIR'i. OS-18: `company_score_public=False` va `DEBUG=False` bo'lsa ochiq endpoint'lar begona STIR uchun 404, `distribution/` ishlayveradi.

**Qabul:** javoblarda begona korxona xom qiymati yo'q (test); 100 STIR'lik so'rov 200 ms dan tez; `is_synthetic` to'g'ri.

### KR-34 · UI komponentlari · **P1**

6-bo'limdagi `CompanyScoreBadge`, `CompanyScoreCard`, `useCompanyScores(stirs[])` hook'i (sahifadagi barcha STIR'lar uchun bitta batch so'rov). Ranglar: A yashil, B och yashil, C sariq, D to'q sariq, E qizil, "—" kulrang shtrix; rangdan tashqari harf ham bor (rang ajrata olmaydiganlar uchun). Ko'p tillilik loyihaning mavjud mexanizmi bilan.

**Qabul:** Storybook yoki test sahifasida barcha holatlar: A–E, "—", qisman ma'lumot, bayroqlar, namuna; mobil kenglikda (375px) kartochka buzilmaydi.

### KR-35 · Ro'yxatlarga joylash · **P1**

6-bo'lim jadvalidagi 1, 3, 4, 5, 12-bandlar va "Qamrov qoidasi" bo'yicha kodda topilgan qolgan joylar. Filtr va saralash backend'da (`?klass=A,B&ordering=-score`). XLSX eksportlarda `ball`, `sinf`, `namuna` ustunlari.

**Qabul:** har joyda badge ko'rinadi va bitta batch so'rov ketadi (tarmoq logi); sinf filtri bilan 65 ming qatorda javob 500 ms dan tez; PR tavsifida badge qo'shilgan barcha komponentlar ro'yxati.

### KR-36 · Korxona sahifalari va kabinet · **P1**

6-bo'lim 2, 6, 7, 8-bandlar. Pasportda yillar bo'yicha ball dinamikasi (2023–2025) va tavsiyalar; tavsiyadan K-03, K-05 sahifalariga havola. Benchmark'da ball taqsimoti gistogrammasi.

**Qabul:** demo korxona kabinetida hamma blok to'la va "Namuna" belgili; begona korxonaning `/orginfo` sahifasida tavsiya va xom qiymatlar yo'q.

### KR-37 · Hududiy va admin agregatlar · **P2**

6-bo'lim 9, 10, 11, 13-bandlar. Xarita qatlami `ind=company-score`: tuman/viloyat bo'yicha o'rtacha ball yoki A–B ulushi; KR-08 rang shkalasi qoidasi bilan. Tumanda 30 dan kam baholangan korxona bo'lsa "Ma'lumot yetarli emas".

**Qabul:** `/regions?ind=company-score` ochiladi, hudud kartochkasida "Korxonalar sifati" bloki; admin analitikada real/sintetik almashtirgich ishlaydi.

### KR-38 · Metodologiya va tekshiruv · **P2**

1. `/methodology/company-score` sahifasi (6-bo'lim 14-band).
2. `validate_company_scoring` komandasi: (a) presetlar orasida sinf o'zgarishi ulushi; (b) vaznlarni ±20% o'zgartirganda sinfi o'zgaradigan korxonalar ulushi; (c) adolat tekshiruvi: hudud, OKED bo'limi va o'lcham sinfi bo'yicha o'rtacha ball (namunada farq ≤ 3 ball, kattasi faqat "yirik" sinfda, chunki ular kam va kuchli); (d) sinflar taqsimoti 4.6 bilan.
3. Natija admin panelda (KR-22 tekshiruvi yonida).

**Qabul:** komanda hisobot chiqaradi; biror hudud yoki tarmoq o'rtacha bali umumiy o'rtachadan 5 balldan ko'p farq qilsa ogohlantirish.

### Bajarish tartibi

1. KR-29 → KR-30 → KR-31 (backend, UI'ga tegilmaydi; natija `namuna_scoring.csv` bilan solishtiriladi).
2. KR-32 → KR-33.
3. KR-34 → KR-35, KR-36 (parallel).
4. KR-37, KR-38.

Claude Code'ga topshiriq namunasi:
```text
mystat repo'sida KORXONA_SCORING.md dagi KR-30 ni bajar.
ISH_REJASI.md 3-bo'limdagi umumiy qoidalarga va 8-bo'limdagi sintetik ma'lumot tamoyillariga amal qil.
Mantiqni korxona_scoring/generate_companies.py dan ol, lekin OKED, hudud va yilni real KTUT'dan.
Qabul mezonlarini tekshirib, natijasini PR tavsifida yoz.
```

---

## 10. Cheklovlar

1. Vaznlar va sinf chegaralari ekspert bahosi; real ma'lumot kelganda KR-38 bilan qayta kalibrlanadi.
2. Percentil bahosi nisbiy: guruhdagi hamma korxona yomon bo'lsa ham eng yaxshisi yuqori ball oladi. Mutlaq ko'rsatkichlar (intizom, soliq, kvota) buni qisman muvozanatlaydi.
3. 2 yillik o'sish bir martalik sakrashlarga sezgir; real ma'lumotda 3 yilga o'tkaziladi.
4. Tashqi savdo faqat tovarlar bo'yicha (bojxona ma'lumoti); IT va xizmatlar eksporti hisobga olinmaydi. J bo'limi shuning uchun savdoga yaroqli ro'yxatga kiritilmagan.
