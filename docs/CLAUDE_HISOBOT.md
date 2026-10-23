# CLAUDE_HISOBOT — loyiha holati va davom etish yo'riqnomasi

> **Bu fayl Claude (AI yordamchi) uchun.** Har yangi sessiyada ishni boshlashdan oldin shu faylni to'liq o'qing.
> Unda: nima qilingan, nima qolgan, qayerda to'xtalgan va ishni qanday davom ettirish kerak.
> Har ish bosqichi tugagach, **shu faylni yangilang** (7-bo'lim, "Sessiyalar jurnali").
>
> **Oxirgi yangilanish:** 2026-10-21 · **Oxirgi commit:** `f19ca4b` (2026-10-21, GitHub `main` ga push qilingan) — MG-00..MG-15 shu commit'da

---

## 0. Yo'riqnoma: sessiya boshida nima qilish kerak

1. **Shu faylni o'qing** (ayniqsa 4, 5 va 7-bo'limlar).
2. **Haqiqiy holatni tekshiring.** Fayl eskirgan bo'lishi mumkin:
   ```bash
   git log --oneline -10      # 7-bo'limdagi oxirgi commit'dan keyin yangi commit bormi?
   git status                 # tugallanmagan (commit qilinmagan) ish bormi?
   ```
   Agar 7-bo'limdagi oxirgi yozuvdan keyin commit'lar bo'lsa, ularni `git show --stat` bilan ko'rib, shu faylni yangilang.
3. **Qayerda to'xtaganimizni aniqlang:** 7-bo'limdagi oxirgi yozuvning "Keyingi qadam" qatori.
4. **Foydalanuvchi aniq vazifa bermagan bo'lsa**, 5-bo'limdagi tartib bo'yicha keyingi vazifani taklif qiling. O'zingiz boshlab yubormang, avval tasdiqlating.
5. **Vazifa tafsilotlari** shu yerda emas, asl hujjatlarda (3-bo'lim). Vazifa ID'si (masalan `KR-41`) bo'yicha `grep` qiling.
6. **Ishni tugatgach:**
   - testlar (6-bo'lim) o'tishini tekshiring;
   - tegishli hujjatdagi holatni yangilang (`docs/README.md` va vazifa hujjati);
   - **shu faylning 4, 5 va 7-bo'limlarini yangilang**;
   - commit faqat foydalanuvchi so'rasa. Uslub: o'zbekcha, vazifa ID'lari bilan (`KR-41: ...`).

**Qoidalar (avvalgi sessiyalarda kelishilgan):**
- Javoblar va hujjatlar **o'zbek tilida** (lotin).
- Real yozuvlarni o'zgartirmang va o'chirmang. Sintetik ma'lumot faqat `seed_demo` orqali, `SyntheticRecord` reyestri bilan, faqat `DEBUG=True` da (production'da faqat `.env` `SYNTHETIC_DATA=True` bilan, 2026-10-23 qarori).
- Mavjud 4 tarif paketi va `payment` app'iga tegilmaydi (KR-41 da ham "faqat yangi yozuvlar").
- Egasining qarorini talab qiladigan masalalarda (4.4-bo'lim) o'zingiz hal qilmang. Hujjatdagi **default** bilan ishlang yoki so'rang.
- **Atama: "StatCoin"** (2026-10-20, foydalanuvchi qarori). Scoring hamyonidagi birlik foydalanuvchiga va admin'da doim "StatCoin" deb yoziladi ("1 StatCoin", "StatCoin hamyoni", "StatCoin'lar muddati"). Kod nomlari o'zgarmaydi: `apps/credits`, `CreditWallet`, `/api/credits/`, `formatCredits`. Hujjatlardagi (KORXONA_SCORING 11–14) "kredit" = StatCoin. Bank krediti ma'nosidagi "kredit" (inflyatsiya kalkulyatori, "Bank / kredit" preseti) o'zgarmaydi.
- Yangi ochiq savollar `OS-23` dan raqamlanadi (`OS-18..OS-22` ID'lari ikki hujjatda to'qnashgan).

---

## 1. Loyiha qisqacha

**my.stat.uz** — Statistika agentligining konsalting platformasi (monorepo).

| Qism | Texnologiya | Joyi |
|---|---|---|
| Backend | Django 5 + DRF, Celery, PostgreSQL 14, Redis | `backend/` (`core/` sozlamalar, `apps/` 18 ta app) |
| Frontend | React 18 + Vite + TypeScript, Recharts | `frontend/src/` (`pages/`, `components/`) |
| Baza | PostgreSQL dump | `db/dump/consult.dump` (git'da yo'q) |
| Proxy | nginx | `nginx/default.conf.template` |
| Deploy | GitLab CI (systemd + venv, Docker'siz) | `.gitlab-ci.yml` |

Asosiy app'lar: `accounts`, `services` (tariflar, paketlar), `contracts`, `payment` (Click), `analytics` (korxona scoringi), `siat` (hududlar xaritasi, scoring, prognoz), `credits` (kredit hamyoni), `portal` (xizmat katalogi bo'yicha foydalanish, baho, sahifa fikri — MG-10/11), `citizens`, `consultations`, `open_api`, `common` (seed_demo, qidiruv), `book_market`, `notifications`, `organizations`, `additional_services`. Tegilmagan: `chat`, `monitoring` (OS-07).

## 2. Lokal muhit (bu mashina)

- **Docker yo'q.** Portativ Postgres, port **5433**:
  ```bash
  C:/Users/j.pirnazarov/tools/pgsql/bin/pg_ctl.exe -D C:/Users/j.pirnazarov/tools/pgdata-mystat -l C:/Users/j.pirnazarov/tools/pg-mystat.log -o "-p 5433" start   # background'da
  C:/Users/j.pirnazarov/tools/pgsql/bin/pg_isready.exe -h 127.0.0.1 -p 5433
  ```
  `connection refused 127.0.0.1:5433` — server ishlamayapti degani.
- Backend: `backend/venv` (Python 3.12), `python manage.py runserver`.
- Frontend: `cd frontend && npm run dev` (`VITE_API_URL=/`, Vite `:8000` ga proxy qiladi).
- Demo akkauntga parolsiz kirish: `manage.py shell` da `user.tokens` → brauzer `localStorage` (`access_token`, `refresh_token`, `user`).
- Demo akkauntlar: `demo_yuridik_1..5`, `demo_jismoniy_1..3`, `demo_tadqiqotchi`, `demo_konsultant_1..5`, `demo_bugalter`, `demo_employee`.

## 3. Hujjatlar xaritasi

| Fayl | Nima uchun o'qiladi |
|---|---|
| `docs/README.md` | **Yagona holat jadvali:** barcha vazifalar, bajarilgan va qolganlar (2026-10-16 holati, KR-39..46 kiritilmagan) |
| `docs/LOYIHA.md` | Arxitektura, app'lar, sozlamalar |
| `docs/ISH_REJASI.md` | Asosiy reja: F, B, S, U, K, FQ, A, Q vazifalari, OS-01..OS-22 savollari, xavfsizlik ro'yxati (2.1), to'lov muammolari (2.2) |
| `docs/SIAT_KARTA_TAHLIL.md` | KR-01..KR-14 (hududlar xaritasi) |
| `docs/SCORING_MODEL.md` | KR-15..KR-28 (hududlar salohiyati, prognoz) |
| `docs/KORXONA_SCORING.md` | KR-29..KR-46 (korxona scoringi, kreditlar, profil). **0-bo'limda bajarilish holati**, 12-bo'limda KR-41..KR-44 tavsifi |
| `docs/XIZMATLAR_TAHLILI.md` | Xizmatlar katalogi: kim, qanday shartda; 6-bo'limdagi muammolar yopilgan |
| `IHAMKOR_MUQOBIL.md` (repo ildizida) | iHamkor muqobili — "Kontragent kartasi", IH-01..IH-12. **0-bo'limda kod bilan tekshiruv va holat jadvali**; 1-to'plam bajarildi (2026-10-20) |
| `docs/JAHON_TAJRIBASI_TAKLIFLAR.md` | JT-01..JT-20: jahon tajribasi asosida yangi xizmatlar. **0-bo'limda kod bilan tekshiruv va holat jadvali** |
| `docs/PROEKT_TAHLIL.md` | Boshlang'ich tahlil (tarixiy) |
| `docs/MYGOV_DIZAYN.md` | my.gov.uz uslubidagi dizayn (2-etap, MG-00..MG-15). **0.5-bo'limda bajarilish holati** |
| `docs/mygov-reference/` | MG-00 natijasi: o'lchangan tokenlar, skrinshotlar, jonli saytdan farqlar (`README.md`), 98% tekshiruvi (`checklist.md`) |
| `docs/DIZAYN_HOZIRGI_HOLAT.md` | 1-etap dizayni (eskirgan, tarixiy) |
| `docs/LOGO.md` | my.stat.uz portal belgisi: nega yangi, qanday tuzilgan, qayerda ishlatiladi |
| `docs/FEATURELAR_ESKI_VA_HOZIR.md` | Feature'lar: eski (`1e4e61e`) va hozirgi holat, kim uchun, har birining ma'lumot manbasi (real / SIAT / namuna) |
| `README.md`, `backend/README.md` | Ishga tushirish, seed_demo, production qadamlari, endpoint'lar |
| `korxona_scoring/` | Namunaviy generator va scoring skripti, CSV'lar (KR-31 solishtirish manbai) |

## 4. Bajarilgan ishlar (2026-10-20 holati)

### 4.1. Asosiy reja (ISH_REJASI.md) — ✅ hammasi
- **F** (poydevor): test runner, TS 37→0 xato, ESLint 0 xato, `console.log` olib tashlandi.
- **B** (buzuq joylar): token yangilash, 500 xatolar, trade-flows, xabarnomalar, Celery Beat, paket muddati.
- **S** (sintetik ma'lumot): `seed_demo` (`--only/--flush/--dry-run`), `SyntheticRecord`, "Namuna" belgisi, barcha bo'limlar uchun demo.
- **U** (UI): kabinet, klassifikatorlar, global qidiruv Ctrl+K, Stat AI, kalendar, PWA, Lighthouse a11y/SEO 100.
- **K** (korxonalar): autofill, benchmark, bozor tahlili, hamkor qidiruvi, pasport, shartnoma holati, tarif kalkulyatori.
- **FQ** (fuqarolar): ochiq API, inflyatsiya kalkulyatori, maosh, narxlar, "Statistika oddiy tilda", so'rovnomalar.
- **A** (admin): analitika paneli, obunalar, onlayn konsultatsiya.
- **Q** (sifat): chunk 635→19 KB, Recharts'ga o'tish, CI. Q-01, Q-07 **qisman**.

### 4.2. SIAT va hududlar — ✅ KR-01..KR-28
- SIAT sinxronlash (`apps/siat`, `sync_siat`, har kuni 03:30), SOATO chegaralari, `/regions` xaritasi (drill-down, animatsiya, bivariant, eksport).
- Hududlar salohiyati scoringi (`apps/siat/scoring/`, `compute_scores`) va prognoz (`apps/siat/forecast/`, `train_forecasts`, 80% oraliq, ssenariylar).

### 4.3. Korxonalar scoringi — ✅ KR-29..KR-38, KR-39, KR-40, KR-45, KR-46; ⚠️ KR-42 qisman
- `EnterpriseScore`, `company_scoring.yaml`, pandas dvigatel (65 545 korxona × 5 preset ≈ 81 s), API, badge/kartochka, ro'yxatlarga joylash, metodologiya sahifasi.
- **2026-10-19 (`d5d6629`):** kirish darajalari (`credits.service.can_view`), `apps/credits` (hamyon, ledger, unlock, narxlar), korxona profili `/company/:stir` (ball tarkibi, sezgirlik, o'xshash korxonalar, qulflangan bo'limlar, PDF), profilga havolalar.
- XIZMATLAR_TAHLILI 6-bo'lim yopildi: `trade-data/upload` va GoodSign `IsAdminUser`, GoodSign login/parol `.env` ga, limit `-1` = cheksiz, `Service.requires_login`, login'dan keyin `?next=` bilan qaytish.

### 4.4. Jahon tajribasi (JAHON_TAJRIBASI_TAKLIFLAR.md) — ✅ JT-02, JT-04, JT-10, JT-15, JT-17 (2026-10-20)
- **JT-10 e'lonlar kalendari:** `/release-calendar`, `/api/common/map/releases/` va `releases.ics`. Yangi model `siat.ReleaseEvent` (migratsiya `siat.0005`), admin'da rasmiy sana kiritiladi. Kiritilmasa SIAT `source_updated_at` + davriylikdan taxminiy sana. Kod: `apps/siat/public.py`, `views_public.py`.
- **JT-17 mavzuli panellar:** `/dashboards/:slug` (iqtisodiyot, mehnat, aholi), `/api/common/map/dashboards/`. Panel ro'yxati `public.py` dagi `PANELS` da.
- **JT-02 aholi soati:** panellarda va bosh sahifada (`HomeHighlights` → `PopulationRow`). Brauzerda hisoblanadi.
  - **stat.uz bilan bir xil (2026-10-20):** `PopulationAnchor` (migratsiyalar `siat.0006`, `0007`) stat.uz hisoblagichining boshlang'ich nuqtasi va "har N soniyada" parametrlarini (tug'ilish/o'lim/kelish/ketish) saqlaydi; soat chiziqli: N0 + t·sof_o'sish. `python manage.py sync_population_clock [--dry-run]` (`apps/siat/population_sync.py`) stat.uz sahifasidagi JS o'zgaruvchilarni o'qiydi, o'zgargan bo'lsa yangi nuqta qo'shadi; Celery Beat har 6 soatda (`population-clock-sync`). Avvalgi xato: raqam 1-oktabr holatiga, 19-oktabr deb olingan edi (−46 ming).
- **JT-15 ulashish:** `components/share/ShareBar.tsx` (havola, embed, APA/GOST iqtibos, PNG). Embed sahifasi `/embed/indicator/:key` navbar'siz chiqadi (`App.tsx` → `Shell`), API `/api/common/map/card/<key>/`.
- **JT-04 statistik kodlar ma'lumotnomasi:** `/stat-codes?stir=` (login bilan, PDF) va `/stat-codes/verify?code=` (ochiq). Kod: `additional_services/api_endpoints/KtutReportAPI/certificate.py`. Imzo `django.core.signing`, bazaga yozilmaydi.
- Ctrl+K'da 4 ta yangi yozuv. Sof funksiyalar: `frontend/src/utils/statPublic.ts`.
- Testlar: `apps/siat/tests/test_public.py` (8), `apps/additional_services/tests_jt04.py` (3), `utils/statPublic.test.ts` (6). Butun backend: **308 test OK**; `tsc` 0, `eslint` 0 xato; brauzerda 5 sahifa tekshirildi.
- **Bloklangan (real manba yo'q):** JT-07 va JT-14 uchun korxonaning ochilish va yopilish sanasi kerak, KTUT'da yo'q. JT-01, JT-03, JT-12 uchun ro'yxat-2026 natijalari bazada yo'q.

### 4.4a. iHamkor muqobili (IHAMKOR_MUQOBIL.md) — ✅ IH-01..IH-04, IH-08, IH-11, IH-12 (metodologiya); IH-06 K-03 bilan qoplangan (2026-10-20)
- **Kontragent kartasi:** `GET /api/analytics/company-card/<stir>/`, `company-card/search/?q=` (ochiq, mehmonga 120/soat, kesh 1 soat). Kod: `apps/analytics/company_card.py`, `views_card.py`.
- **Manbalar (real):**
  - `Ktut` — STIR, OKPO, nom. Bu to'liq registr emas, ~65 ming hisobot topshiruvchi;
  - `KtutReportList` — majburiy shakllar;
  - `IndustrialProduct` — ~39 ming ishlab chiqaruvchining tumani, manzili va mahsulotlari.
  Telefon javobga kirmaydi.
- **Frontend:**
  - `/check` — `pages/company/CompanyCheck.tsx`;
  - bloklar `components/company-card/CardBlocks.tsx`;
  - profil "Umumiy ma'lumot" yorlig'ida `ProfileCardExtras`;
  - Ctrl+K.
- **Profil tuzatildi:**
  - hudud sanoat reyestrida real bo'lsa sintetik namuna o'rniga real chiqadi (`region_is_real`);
  - OKPO `.0` tozalandi (`clean_okpo`, ma'lumotnomada ham).
- IH-11: `/check` da "Karta xulosasi (PDF)". IH-12: `/methodology/company-card` (`pages/company/CompanyCardMethodology.tsx`).
- Testlar: `apps/analytics/tests_company_card.py` (6).
- **Qolgan:**
  - IH-05 (OS-26 huquqiy savol);
  - IH-07 (OKED sintetik);
  - IH-12 narxlari (StatCoin narxi — egasining qarori);
  - IH-09, IH-10 bloklangan.

### 4.4b. my.gov.uz uslubi — 2-etap (MYGOV_DIZAYN.md) — ✅ MG-00..MG-13; ⚠️ MG-02, MG-14, MG-15 qisman (2026-10-21)
- **Layout:** `frontend/src/components/layout/` — chap ko'k sidebar, header (hisobot muddati, telefon, til, maxsus imkoniyatlar, Kirish), breadcrumb, fikr vidjeti, Ctrl+Enter, footer. Eski `Navbar.tsx`, `Footer.tsx`, `Interactive.tsx`, `AllServices.tsx`, `NewServices.tsx` o'chirildi.
- **Tokenlar:** `theme/tokens.ts`, `index.css` (`--mg-*`), `tailwind.config.js` (`mg-*`); shrift Montserrat. Qiymatlar jonli my.gov.uz dan o'lchangan (`tools/mygov-reference/capture.ts`).
- **Katalog:** `config/spheres.ts` (14), `serviceCatalog.ts` (50 xizmat, raqam = soha×100+tartib), `situations.ts`, `navigation.ts`. Sahifalar: `/spheres`, `/spheres/:id`, `/service/:n`, `/search`, `/popular`, `/situations`, `/privacy`, `/terms`, `/ai-usage`, `/sitemap`; `/services` → `/spheres`; `/statistics` = banner + "O'zbekiston raqamlarda" + top xizmatlar.
- **Til:** `i18n/` — uz, cry (lotindan avtomatik), ru; faqat qobiq va katalog matnlari. `/ru/...` prefiksi tilni o'rnatadi va prefikssiz manzilga o'tadi.
- **Backend `apps/portal`:** `ServiceUsage`, `ServiceReview` (sharh moderatsiyadan keyin), `ServiceReviewVote`, `PageFeedback`, `TypoReport`; `/api/portal/...`; seeder `portal` (18 329 foydalanish, 3 344 baho, faqat DEBUG). Sevimlilarga `kind="service"` (`citizens.0002`). Admin analitikada katalog bo'yicha foydalanish.
- **Kabinet:** MG-12 menyu tartibi, "Tanlanganlar" (`cabinet/FavoritesTab.tsx`), `/cabinet?tab=` havolalari.
- **Eski sahifalar:** 44 ta sahifadan to'liq ekran fon va markaziy konteyner olib tashlandi; `PageHeader` breadcrumb chizmaydi (layout'da bitta).
- Testlar: `apps/portal/tests.py` (8), `config/serviceCatalog.test.ts` (5), `i18n/translit.test.ts` (3), `e2e/mygov.spec.ts` (7); vitest 46 OK, e2e 19 + 7 OK, `tsc` 0, `eslint` 0 xato, `vite build` OK.
- **Checklist: 95,7%** (`docs/mygov-reference/checklist.md`), maqsad 98%.

### 4.5. Oxirgi tekshiruv natijalari
- 2026-10-16: backend 271 test OK, `tsc` 0, `eslint` 0 xato, vitest 23 OK.
- 2026-10-19: yangi testlar (credits, company_profile) OK, `npm run e2e` 19 test OK, `tsc`, `eslint`, `vite build` xatosiz.
- 2026-10-20 (bu tahlil): testlar qayta ishga tushirilmadi. Kod tekshirildi: 5.1-bo'limdagi xavfsizlik muammolari **hali ham bor** (`ALLOWED_HOSTS=['*']`, `CORS_ALLOW_ALL_ORIGINS=True`, `__debug__/` ulangan, OneID'da `print()`).

## 5. Qolgan ishlar (tavsiya etilgan tartibda)

### 5.1. Xavfsizlik (ISH_REJASI 2.1) — 2026-10-20 da asosiy qismi yopildi
| # | Muammo | Holat |
|---|---|---|
| 1 | `accounts/update/email/<email>/` — begona hisob, `DELETE` | ✅ Faqat o'z hisobi (403), `DELETE` olib tashlandi |
| 2 | `common/information/` — yozish/o'chirish ochiq | ✅ `IsStaffOrReadOnly` (`apps/accounts/permissions.py`) |
| 3 | `service-request/` filtrlari begona so'rovlarni qaytarardi | ✅ Filtrlar faqat o'z so'rovlari ichida; begona detail 403/404 |
| 4 | `service-response/<pk>/` — mijoz "admin javobi" yozardi | ✅ `IsAssignedEmployee`: staff, employee/manager/admin roli yoki biriktirilgan foydalanuvchi |
| 5 | OneID `print()` — kod, **client_secret**, auth javobi log'ga | ✅ `print` olib tashlandi, xatoda faqat HTTP status log'ga |
| 6 | `ALLOWED_HOSTS=['*']`, CORS hamma uchun | ⚠️ `.env` dan sozlanadi (`ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`); standart avvalgicha ochiq (serverni buzmaslik uchun) — `check --deploy` W003/W004. **Serverda `.env` ga yozish kerak** |
| 7 | `__debug__/` production'da | ✅ `production.py` toolbar middleware'ni olib tashlaydi, `urls.py` faqat middleware bo'lsa ulaydi |
| 8 | Rate limit yo'q | ✅ `apps/accounts/throttles.py`: login, Token, parol tiklash — 20/min; murojaat formasi — 30/soat (IP bo'yicha, `.env` da o'zgaradi) |
| 9 | CKEditor 4 eskirgan | ⏳ Admin'dagi rich-text maydonlar; almashtirish — alohida ish |
| 10 | Past: email mavjudligi oshkor, `SECRET_KEY` default, `CSRF_COOKIE_SECURE=False`, 500 MB upload, JWT `localStorage` da | ⏳ |
| 11 | ⚠ GoodSign paroli git tarixida | ⏳ **Egasi parolni almashtirishi kerak** |

Testlar: `apps/services/tests_security.py` (6). `trade-data/upload` — 2026-10-19 da yopilgan.

### 5.2. Korxona scoringi: tariflar va kreditlar (KORXONA_SCORING.md 12-bo'lim)
1. **KR-41** — Tariflar va paketdan kredit berish (P1): "Scoring krediti" servisi, Scoring 50/60/90 va Korporativ paketlari, `UserServicePackage` signali → idempotent `grant`, oylik grant, `auto_activate_on_payment` bayrog'i. Hozir `CreditWallet.plan` va grant admin'da qo'lda.
2. **KR-42 (qolgan qismi)** — `/tariffs` dagi scoring bloki, korporativ forma, bosh paneldagi 20% balans ogohlantirishi.
3. **KR-43** — Korporativ: `OrganizationMember`, yo'nalishlar, ommaviy XLSX tekshiruv (≤5000 STIR), monitoring (`WatchItem`).
4. **KR-44** — API kalitlari orqali scoring, admin analitikada kredit sarfi (P2).

### 5.2a. Jahon tajribasi — qolgan JT vazifalari (JAHON_TAJRIBASI_TAKLIFLAR.md 0-bo'lim)
1. **Real ma'lumot bilan bajarsa bo'ladiganlar:**
   - JT-16 — shaxsiy inflyatsiya (avval CPI guruh indekslarini tekshirish kerak);
   - JT-09 — respondent sahifasi va so'rovni tekshirish;
   - JT-11 — qayta ko'rib chiqishlar jurnali (yangi `SiatValueRevision` jadvali, `sync` ichida);
   - JT-08 — biznes kayfiyati so'rovi (FQ-08 dvigateli asosida).
2. **Faqat "Namuna" belgisi bilan:** JT-05 (biznes ochish xaritasi). **Egasining qarori kerak:** JT-06 (OS-JT-2).
3. **Bloklangan:** JT-07, JT-14 (korxona sanalari), JT-01, JT-03, JT-12 (ro'yxat-2026 natijalari), JT-13, JT-18..JT-20.
4. Kichik qarzlar:
   - JT-04 PDF'ida QR rasm yo'q (kutubxona qo'shish ruxsati kerak);
   - JT-17 "Yoshlar" va "Ayollar" panellari uchun SIAT'dan ko'rsatkichlar katalogga qo'shilishi kerak;
   - JT-10 rasmiy sanalarni admin kiritishi kerak.

### 5.2b. my.gov.uz uslubi — qolganlari (MYGOV_DIZAYN.md 0.5)
1. 98% uchun (birortasi yetarli): to'liq til prefiksli URL (`useLangPath()`), `@axe-core/playwright` (bog'liqlik qo'shish ruxsati kerak).
2. Eski sahifalarning ichki ranglari (kulrang/ko'k Tailwind) hali tokenlarga o'tkazilmagan — har sahifa alohida (MG-15).
3. Sahifa matnlari faqat o'zbekcha: ru/cry faqat qobiq va katalogda.
4. Egasidan: OS-MG-08 (bosh sahifadan statistik bloklarni olib tashlashni rahbariyat tasdiqlashi), OS-MG-09 (my.gov.uz kabineti skrinshotlari), OS-MG-01 (ishonch telefoni raqami).

### 5.3. Production'ga chiqarish (README.md "Production")
GitLab remote → push; serverni monorepo'ga ko'chirish; Celery worker/beat systemd unitlari; `migrate` → `setup_service_limits` → `check --deploy` → `sync_siat`; `TELEGRAM_BOT_TOKEN`, `EMAIL_HOST`; nginx'da `sw.js` `no-cache`.

### 5.4. To'lov va biznes oqimi (ISH_REJASI 2.2)
Kitob to'lov havolasi qattiq yozilgan; `Order` summasi 0; to'langan shartnoma paketni avtomatik faollashtirmaydi; shartnomani Click orqali to'lab bo'lmaydi; Payme yo'q; `PaymentMerchantRequestLog` yozilmaydi; `UserServicePackage...first()` tasodifiy paket; OneID callback POST/GET nomuvofiqligi.

### 5.5. Egasining qarori kerak (o'zingiz hal qilmang)
- OS-13 / KR-32: korxona, hudud, ish haqi, narxlar uchun **real manba**. Ungacha korxona bali production'da chiqmaydi.
- OS-19: xodimlar soni manbai. OS-20: jahon savdosi. OS-18: shartnoma shablonidagi "Sirdaryo viloyati", "2025-yil".
- OS-07: begona jadvallar (`test`, `uz`, `my_stat_uz_platforma_uchun`), `chat`, `monitoring` app'lari.
- 38-xizmat (klassifikatorlar) `is_active=False`.

### 5.6. SIAT ma'lumot muammolari (admin orqali)
Investitsiya 2601/2603 ikkalasi "Qashqadaryo" (`group_region_override`); Buxoro investitsiya jadvali yo'q; 7 yangi tuman chegarasi yo'q (`data/boundary_overrides.json`); tashqi savdo 2023 ~16 marta kichik; `ReportList.deadline` 2025 da qotgan.

### 5.7. Sifat va unumdorlik
Lighthouse performance 59–76, LCP 5–8 s, `/services` CLS 0.30; Q-01: `BookStore.tsx` (~1750 qator), `ExternalTrade.tsx` (~1390) bo'linmagan (avval test); Q-07: `drf-yasg` qolgan; media zaxira rejasi yo'q; konsultatsiyalarda keraksiz 403 so'rov.

### 5.8. Hujjat ishlari (mayda)
- `docs/README.md` ni yangilash: KR-39..KR-46 holati, `trade-data/upload` yopilgani, holat sanasi.
- Repo ildizidagi git'ga kirmagan `korxona_scoring/KORXONA_SCORING (1).md` — `docs/KORXONA_SCORING.md` ning **eski versiyasi** (holat bo'limlarisiz, 646 qator). Foydalanuvchidan so'rab o'chirish yoki e'tiborsiz qoldirish.

## 6. Tekshiruv buyruqlari

```bash
cd backend && venv/Scripts/python manage.py test                 # Postgres 5433 ishlab turishi kerak
cd backend && venv/Scripts/python manage.py makemigrations --check
cd frontend && npx tsc --noEmit && npx eslint src && npm test
cd frontend && npm run e2e                                         # Playwright (backend va frontend ishlab turishi kerak)
node tools/mygov-reference/capture.ts                             # MG-00: my.gov.uz tokenlari va skrinshotlarini qayta olish (proksi HTTPS_PROXY dan)
```

## 7. Sessiyalar jurnali (yangi yozuv pastga qo'shiladi)

| Sana | Nima qilindi | Commit | Keyingi qadam |
|---|---|---|---|
| 2026-10-13..16 | ISH_REJASI (F..Q), SIAT KR-01..KR-28, korxona scoringi KR-29..KR-38 | `fe941cb`..`f0554ea` | — |
| 2026-10-19 | KR-39, KR-40, KR-45, KR-46, KR-42 qisman; XIZMATLAR_TAHLILI 6-bo'lim; hujjatlar `docs/` ga | `d5d6629` | — |
| 2026-10-20 | Loyiha tahlil qilindi, shu hisobot fayli va `CLAUDE.md` yozildi. Kod o'zgarmadi | — | — |
| 2026-10-20 | `JAHON_TAJRIBASI_TAKLIFLAR.md` kod bilan tekshirildi (0-bo'lim). JT-02, JT-04, JT-10, JT-15, JT-17 bajarildi (4.4-bo'lim). Aholi soati qo'mitaning rasmiy raqamidan yuradi (`siat.PopulationAnchor`, migratsiya 0006: 2026-10-19 09:00 — 39 535 225). Kabinet "Kredit hamyoni" (`cabinet/Credits.tsx`) qayta joylashtirildi. "Mening xizmatlarim" (`cabinet/ServicesTab.tsx`): nomlar HTML'dan tozalandi, `limit=0` — "Paketda bor" (hisoblanmaydigan imkoniyat), "O'tish" 404 bermaydi (`PersonalCabinet.tsx` → `SLUG_TARGETS`). Kredit → **StatCoin** (UI, admin, xato xabarlari, e2e; migratsiya `credits.0003`). `consult.dump` tekshirildi: baza to'liq, `backend/media` fayllari yo'q (serverdan olish kerak) | commit qilinmagan | Foydalanuvchi bilan tanlash: **(a)** JT-16 → JT-09 → JT-11 → JT-08 (5.2a), **(b)** 5.1 xavfsizlik, **(c)** KR-41. Production'dan oldin 5.1 majburiy |
| 2026-10-20 | Tariflar: nomlar HTML'dan tozalandi (API `PlainNameMixin`, `common.text.rich_to_plain`), soxta imkoniyatlar olib tashlandi. Raqobatchi narxlari yig'ildi (iHamkor, MyOrg, kredit byurosi). `IHAMKOR_MUQOBIL.md` tekshirildi va IH-01..IH-04, IH-08 bajarildi (4.4a) | commit qilinmagan | Egasining javobi kerak: StatCoin narxi (taklif 0,04 BHM) → IH-12 va KR-41. Keyin: IH-11 PDF yoki xavfsizlik (5.1) |
| 2026-10-20 | IH-11 (karta PDF), IH-12 metodologiya. Xavfsizlik 5.1: 1–5, 7, 8 yopildi, 6 `.env` orqali (4.5 testlar: 321 OK) | commit qilinmagan | Egasidan: StatCoin narxi; serverdagi `.env` (`ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`); GoodSign parolini almashtirish. Keyin: KR-41 yoki 5.1 qolganlari (CKEditor, past daraja) |
| 2026-10-20 | Aholi soati stat.uz bilan sinxron (`sync_population_clock`, Beat har 6 soat; farq 0). Bosh sahifa `HomeHighlights.tsx` qayta loyihalandi: "O'zbekiston raqamlarda" (aholi paneli, asosiy ko'rsatkichlar, tashqi savdo, e'lonlar kalendari, ochiq ma'lumotlar bazasi — to'liq raqamlar, manba va davr bilan) va "Portal faoliyati"; chalg'ituvchi "oylik yangi foydalanuvchilar" grafigi olib tashlandi | commit qilinmagan | Egasidan: StatCoin narxi, server `.env`, GoodSign paroli |
| 2026-10-20 | Kartalar: `ChoroplethMap` — to'q chegaralar, mamlakat soyasi (`.stat-map` CSS), viloyat nomlari (`labelPoint`, kichik hududlarda yo'q); `RegionBubbleMap` — maydon ∝ qiymat (ilgari radiusga +4), pufakcha hudud markazida (markaziy shahar emas), rang shkalasi, qiymat yorliqlari (to'qnashuvsiz), o'lcham izohi. `utils/mapGeo.ts` `labelPoint` + test | commit qilinmagan | — |
| 2026-10-20 | Bosh sahifa banneri (`Banner.tsx`) qayta loyihalandi: statistika uslubi, xarita siluetti, global qidiruv (`open-global-search` hodisasi → Navbar), tezkor havolalar, jonli aholi soni, portal faoliyati faqat haqiqiy raqamlar bilan (ilgari "+12.5%" kabi soxta o'zgarishlar kodda edi). "O'zbekiston raqamlarda" (`HomeHighlights.tsx`): 4 ta ko'rsatkich kartochkasi 10 yillik dinamika bilan, tashqi savdo (aylanma, eksport/import ulushi, saldo), e'lonlar kalendari sanalar bo'yicha guruhlangan, ochiq ma'lumotlar qatori. `fetchDashboards` 5 daqiqa kesh | commit qilinmagan | — |
| 2026-10-20 | Bosh sahifa qolgan bo'limlari yagona uslubda: `Interactive.tsx` (haqiqiy havolalar, slug bo'yicha ikonka, toza tavsif, ishlatilmaydigan modallar olib tashlandi), `TariffComponent.tsx` (haqiqiy narx oralig'i — API `price_range`, `ServicePackageSerializer.get_price_range`; xizmat yo'nalishlari), `CalendarReport.tsx` (hafta dushanbadan, o'tgan muddatlar xira, yaqin muddatlar sana bo'yicha, "Рѕylik" kodlash xatosi tozalanadi) | commit qilinmagan | — |
| 2026-10-20 | `Navbar.tsx` qayta loyihalandi: rasmiy qator (qo'mita, Portal haqida, Reglamentlar, Portal statistikasi, stat.uz, SIAT), statistikaga yo'naltirilgan menyu (Ko'rsatkichlar, Hududlar, Korxonalar, Fuqarolar uchun, Xizmatlar, Savol-javob, Aloqa; faol bo'lim tag chizig'i bilan), avatar-profil menyusi (Escape bilan yopiladi), qizil yuguruvchi qator o'rniga sokin "test rejimi" xabari. Ko'rsatkich kartochkalari grafiklari: yil o'qi, oxirgi nuqta, izoh oynasi, ma'lumotga mos shkala, davr xulosasi | commit qilinmagan | — |
| 2026-10-21 | `docs/FEATURELAR_ESKI_VA_HOZIR.md` yozildi: eski va hozirgi feature'lar, foydalanuvchi turlari, ma'lumot manbalari xaritasi, production'da bo'sh qoladigan bo'limlar. Hisobot sarlavhasidagi commit `efc0d9b` ga yangilandi. Kod o'zgarmadi | commit qilinmagan | Avvalgi tanlov: KR-41, 5.1 qolganlari yoki JT (5.2a) |
| 2026-10-21 | Bosh sahifa "Interaktiv xizmatlar" (`Interactive.tsx`): kartochkalardan tavsif olib tashlandi, faqat nom (kattaroq, `text-lg`), belgilar va havola qoldi | commit qilinmagan | — |
| 2026-10-21 | **my.gov.uz uslubi, 2-etap (MYGOV_DIZAYN.md MG-00..MG-15)** — 4.4b-bo'lim. Jonli my.gov.uz o'lchandi (hujjat taxminlaridan farqlar: chap sidebar, breadcrumb, "Hayotiy vaziyatlar" va boshqa bloklar — `mygov-reference/README.md`). Yangi layout, tokenlar, katalog (14 soha, 50 xizmat), soha/pasport/qidiruv/statistika sahifalari, `apps/portal` (baho, foydalanish, fikr), kabinet MG-12. Checklist 95,7%. `MYGOV_DIZAYN (1).md` → `docs/MYGOV_DIZAYN.md` | `f19ca4b` (push) | Foydalanuvchi bilan: commit (MG bosqichlari bo'yicha bo'lish mumkin); 98% uchun 5.2b-1; eski sahifalar ichki ranglari (MG-15) |
| 2026-10-21 | Yangi portal belgisi (`docs/LOGO.md`): `components/brand/Logo.tsx` (ikki kartochka + o'suvchi ustunlar, my.gov.uz oilasiga mos), `favicon.svg`, PWA ikonkalari, manifest rangi, SW kesh `v2`. UZSTAT emblemi footer'da stat.uz havolasi bilan qoldi | commit qilinmagan | Egasidan: belgini rahbariyat bilan kelishish |
| 2026-10-21 | Logo davlat tashkilotiga moslandi: yozuv shrifti Literata 700 (`font-brand`, 8 ta serif solishtirildi), orqa kartochka bayroq yashili, rasmiy lockup "MILLIY STATISTIKA QO'MITASI" (sidebar, footer). `docs/LOGO.md` yangilandi | commit qilinmagan | Egasidan: belgi va shriftni tasdiqlash |
| 2026-10-21 | **Tashqi savdo (`/ex-trade`) tahlili ishlamasdi** — tuzatildi: (1) frontend `lang` yubormasdi, serializer majburiy deb 400 qaytarardi — har so'rov; (2) HS/SITC, hudud va davlat guruhi filtrlari kod/SOATO o'rniga bazadagi `id` yuborardi; (3) xato yashirinib "Ma'lumot topilmadi" chiqardi — endi xabar ko'rsatiladi; (4) natija sahifasi yangi API maydonlarini (`qiymat_…`, `hs2_nomi`) tanimasdi, "Jami" qatori yig'indini ikki barobar qilardi; (5) backend HS2/HS4/SITC1–3 nomini quyi mahsulotdan olardi, nom ustuni "Qiymat" deb yozilardi. Fayllar: `pages/ExternalTrade.tsx`, `components/ServiceResultsStep.tsx`, `ExternalTradeAPI/newviews.py` | commit qilinmagan | — |
| 2026-10-21 | Chap sidebar desktopda doim ochiq (268px, foydalanuvchi talabi; my.gov.uz da yopiq/hover — ataylab farq). Kontent `lg:pl-[290px]`; 1024–1279px da header'dagi portal nomi yashiriladi (sidebar lockup'ida bor), soha sahifasining ichki "Sohalar" ro'yxati `xl` dan boshlab, undan torroqda chip'lar | commit qilinmagan | — |
| 2026-10-21 | Bosh sahifa plitkalariga 12 ta ma'noli SVG sahna (`components/home/TileArt.tsx`, my.gov.uz "story" uslubida: pastel fon, qurilma va kartochkalar, pastdan ko'k gradient). Checklist 97,1% | commit qilinmagan | — |
| 2026-10-21 | Header qayta loyihalandi: yordamchi panel (qidiruv, hisobot muddati, telefon, til, maxsus imkoniyatlar) bitta oq "pill" ichida, StatCoin / xabarnoma / profil bir xil uslubda, matnlar bo'linmaydi (kirganda yozuvlar `2xl` dan). `/check`: STIR manbada yo'q bo'lsa (masalan 306210288 — KTUT va sanoat reyestrida yo'q) sabablar va keyingi qadamlar (`company-card/NotFoundCard.tsx`). Bepul kartaga tashqi reyestrni (#101, pullik) ulash — egasining qarori | push qilindi | Egasidan: `/check` ga tashqi STIR reyestrini ulash kerakmi |
| 2026-10-21 | `/ex-trade` sozlamalari tekshirildi va tuzatildi: (1) oylar bazada jamlanma (M2 = yanvar–fevral) — menyu nomlari "Yanvar–Fevral"… deb o'zgartirildi; (2) yillar ro'yxatida faqat ma'lumoti bor yillar (2021, 2026 yashirildi); (3) "Million AQSh dollari" tanlovi endi ishlaydi (`applyMeasurement`); (4) "Jami" davlat guruhlari kesishganda (IHT va MO bir davlatni qamraydi) ikki marta sanalardi — endi unique jami (`_unique_totals`), guruhsiz davlatlar "Boshqa davlatlar" deb nomlanadi. **Ochiq (ma'lumot manbasi kerak):** 2022 faqat `M1` — qiymat butun yilga o'xshaydi; 2023 ~16 marta kichik (5.6); chorak (`quarters`) API'da jamlanma qiymatlarni qo'shadi (UI'da o'chirilgan) | push qilindi | Egasidan: 2022 va 2023 uchun to'g'ri fayl |
| 2026-10-21 | **`/industry` (#901) ma'lumotlari to'ldirildi:** (1) ishlab chiqaruvchilar quyi toifalarga bog'langan, so'rov esa faqat tanlangan toifaning o'zini qidirardi — 31 ta toifa bo'sh chiqardi; endi toifa va barcha quyi toifalari (`descendant_ids`); (2) sahifa eski maydonlarni (`adress`, `soato`, `skp.name`) o'qirdi, API `adress_uz`… qaytaradi — manzil, hudud, SKP nomi bo'sh edi; endi `?lang=` bo'yicha (uz/ru/cry); (3) toifa nomlari ruscha chiqardi — endi tanlangan tilda; (4) faqat dastlabki 20 ta ko'rinardi — sahifalash va nom/STIR/OKPO bo'yicha qidiruv; (5) toifalarda korxonalar soni (`product_count`, jami 53 319), bo'sh toifalar yashirinadi, quyi toifa tugmalari. Testlar: `tests_industry.py` (5). Fayllar: `IndustrialProductAPI/views.py`, `serializers.py`, `pages/Industry.tsx`, `api/industrialProducts.ts` | push qilindi | — |
| 2026-10-22 | **Gradientlar yagona tizimga keltirildi:** eski sahifalardagi 90 ga yaqin Tailwind gradienti (`blue-600→blue-700/indigo`, yashil, sariq va h.k.) 24 faylda portal tokenlariga o'tkazildi — ko'k `mg-primary` (`#0068E0`), hover `mg-primary-dark`, yumshoq fonlar `mg-info`, yashil tugma `green-700` (oq matn kontrasti 5:1; ilgari 2,3:1), `Banner` (`/statistics`) brend ko'ki. Shaffoflik (fade) va rasm ustidagi qatlamlar qoldirildi. Xizmat bosqichli sahifalarida muddat kodi (`now`, `to_1_2_day`) o'rniga matn (`durationLabel`). Bosh sahifa (`HomeHero`) gradienti ataylab qoldi | push qilindi | Ketma-ket qadam: tekis `bg-blue-600` tugmalar ham `mg-primary` ga o'tkazilishi mumkin (alohida ish) |
| 2026-10-22 | **Tashqi savdo TI-01..TI-09** (`TRADEINT_DIZAYN.md`): yagona qidiruv (`TradeSearch`), Eksport/Import/Aylanma tugmasi (`FlowToggle`, `?flow=`), raqamlar qatori (`/external-trade/summary/`), ma'lumot sifati ogohlantirishlari, `ResultCard`, standart grafiklar, namuna PDF (`?sample=1`), `/ex-trade`, `/trade-flows`, `/market-report` qayta qurildi. Commit `3b55da5`, teg `dizayn-1-etap` (HIBRID H0). **Yangi asosiy dizayn hujjati: `HIBRID_DIZAYN.md`** (H0..H13). **H1 (tokenlar):** `theme/tokens.css` (`--ds-*`, kunduzgi/tungi), `--mg-*` nomlari ularga ulandi, Tailwind `ds.*`, Inter shrifti (`@fontsource-variable/inter`), eski brend hexlari almashtirildi. Qolgan: H2 (umumiy komponentlar), H3.. | H0 commit; H1 commit qilinmagan | Keyingi: H2; H10 dan oldin egasiga skrinshot |
| 2026-10-23 | Logo (`brand/Logo.tsx`) panel tokenlariga (grafit/kulrang-ko'k) o'tkazildi. **Production'da sintetik ma'lumot ko'rinmasligi sababi:** `seed_demo` faqat `DEBUG=True` da ishlardi, ma'lumot bazada (git'da yo'q). Egasi qarori bilan yangi sozlama `SYNTHETIC_DATA` (`.env`, standart False; `common.synthetic.synthetic_enabled()` = DEBUG yoki SYNTHETIC_DATA) — `seed_demo`, korxona scoringi ochiqligi/"Namuna", demografiya parquet shunga bog'landi. 0-bo'limdagi "faqat DEBUG=True" qoidasi shu bilan yumshatildi. Testlar: common/analytics/additional_services/citizens 123 OK | commit qilinmagan | Serverda: `.env` ga `SYNTHETIC_DATA=True`, `DEMO_USER_PASSWORD`, so'ng `seed_demo` (narxlar `ConsumerPrice` shu orqali) |
| 2026-10-23 | **KR-41 + `/tariffs` StatCoin bloki.** `ServicePackage`: `statcoin_kind` (monthly/topup), `statcoin_amount`, `statcoin_plan` (migratsiya `services.0047`; mavjud paketlar bo'sh — o'zgarmaydi). `0048`: 6 ta yangi paket (Scoring 50/60/90, StatCoin +20/+50/+100) **nofaol** va vaqtinchalik BHM narxi bilan — narx egasining qarori, admin'da tasdiqlab faollashtiriladi. `apps/credits/packages.py`: `UserServicePackage` yaratilganda signal → idempotent grant (`source_package_id = usp.id*100 + oy`), xabarnoma, hamyon tarifi (`sync_plan`; paket muddati o'tsa tarif tushadi); oylik grant Celery Beat `credits-monthly-grant` (02:30), oy ichida amal qiladi, keyingi oyga o'tmaydi (OS-19 default). API: `tariff-compare` paketlarda `statcoin`; frontend `TariffCompare.tsx` — "StatCoin tariflari" bloki, jadvalda StatCoin qatori, korporativ kartochka (`/contact`). Testlar: `credits/tests_packages.py` (9), credits+services+contracts+common OK. Korporativ paket yaratilmadi (individual shartnoma) | commit qilinmagan | Egasidan: StatCoin narxi → paket BHM narxlarini tasdiqlash; KR-42 qolgani (20% balans ogohlantirishi), KR-43, KR-44 |
| 2026-10-23 | **Eski xizmatlar StatCoin'ga (OS-21 yopildi — egasi qarori).** Benchmark, bozor tahlili, hamkor eksporti, konsultatsiya endi StatCoin bilan: `services/limits.consume` — faol `CreditPrice` bo'lsa StatCoin yechadi (standart 1/3/2/5, `credits.0004`, admin'da o'zgaradi); eski paketda limit qolgan bo'lsa avval o'sha, tugagan/paketsizga StatCoin; balans yetmasa 402 (`StatCoinRequired`, frontend `ApiErrorState` → `/tariffs`). Narx nofaol qilinsa eski limit tartibi. Konsultatsiya bekor qilinsa (≥24 soat) StatCoin qaytadi; `credits.service.refund` idempotent qilindi. `/tariffs`: eski paketlar jadvali va 'Menga qaysi paket mos?' olib tashlandi; qoldi: StatCoin tariflari, 'StatCoin bilan to'lanadigan xizmatlar', 'Rasmiy xizmatlar (shartnoma asosida)' (KTYaDR, byulleten, to'plam va h.k.), kalkulyator. Eski 4 paket bazada va `/tariff/:id`, bosh sahifada qoldi. Testlar: `credits/tests_services.py` (8), eski limit testlariga `use_package_limits()`; analytics/consultations/additional_services/services/credits 139 OK | commit qilinmagan | Egasidan: StatCoin va xizmat narxlarini tasdiqlash, 6 ta yangi paketni faollashtirish; **production'da narxlar faol — paketsiz foydalanuvchi StatCoin'siz bu 4 xizmatni ishlata olmaydi** |
| 2026-10-23 | **`/tariffs` ixchamlandi (3 oylik tarif + korporativ = 4 kartochka, qo'shimcha StatCoin bitta qatorda).** `/tariff/:id`: `StatCoinPackagePanel` — paket nima berishi, StatCoin bilan nimalar ochilishi (narx, necha marta yetishi; API `statcoin.opens`) va faollashtirish holati. **OS-20 (egasi: 'xizmatdan foydalanish yoqilsin'):** to'liq to'langan StatCoin shartnomasi paketni avtomatik faollashtiradi — `credits/packages.activate_paid_contracts` (Celery har 10 daqiqa, `GET/POST /api/credits/activation/` 'tekshirish' tugmasi), idempotent (`UserServicePackage.contract`, `services.0049`), bayroq `SiteSettings.statcoin_auto_activate` (standart True, `common.0032`), faqat StatCoin paketlari, `payment` faqat o'qiladi. Topilma: qo'shimcha paket tarif bermaydi — profil bo'limlari uchun Scoring tarifi kerak (xizmatlar uchun shart emas). Testlar: `tests_activation.py` (6); credits+services+contracts+common+consultations+analytics OK | commit qilinmagan | Egasidan: narxlar; bank o'tkazmasini kim `Transaction(PAID)` qilib yozadi (Click shartnomaga ulanmagan, 5.4) |

| 2026-10-23 | **Bosh sahifa: karta pastga tushdi, o'rniga "Asosiy yo'nalishlar" qatori.** Yangi `components/home/TopSpheres.tsx` — 6 ta top soha (korxonalar, hisobot, biznes tahlili, narxlar, tashqi savdo, hududlar) ixcham plitkalarda: ikonka, nom, xizmatlar soni, hover'da to'lgan ikonka va strelka. `HomePage`da hero → TopSpheres → karta; `HomeMap` min-balandligi 360 → 320px. `tsc` toza. Commit qilinmagan. |
| 2026-10-23 | **Bosh sahifa soddalashtirildi:** qidiruv tagida `HomeHero`da "Asosiy xizmatlar" (8 ta ommabop xizmat, oddiy tugmalar); karta (`HomeDashboard`) Sohalar blokidan keyinga tushirildi; `TopSpheres` o'chirildi. `tsc` toza. Commit qilinmagan. |
| 2026-10-23 | **Yorug' rejim ranglari "o'zbek klassikasi" uslubida:** `theme/tokens.css` (faqat `:root`, tungi rejim o'zgarmadi) — iliq fil suyagi fon, qum rangli panellar, lojuvard-ko'k (`brand` 20 52 96), Samarqand firuza-ko'ki (`primary` 16 92 148), oltin accent. Hardcode ranglar tegilmadi. `tsc` toza. Commit qilinmagan. |
| 2026-10-23 | Yorug' rejim palitrasi 2-variant: Xiva-Buxoro zumrad-yashil (brand 15 76 66, primary 13 112 98), pista-krem panellar, oltin accent. Faqat `tokens.css` `:root`. Commit qilinmagan. |
| 2026-10-23 | Yorug' rejim palitrasi 3-variant: ikat-bordo (brand 98 28 44, primary 146 38 58), shaftoli-krem panellar, oltin accent. Faqat `tokens.css` `:root`. |
| 2026-10-23 | Yorug' rejim palitrasi (yakuniy, xalqaro standart): neytral sovuq oq/kulrang fon, tungi-ko'k brand (17 43 82), WCAG AA ko'k primary (0 94 184), kulrang-ko'k panellar, amber accent. Faqat `tokens.css` `:root`. |
| 2026-10-23 | **`SpheresGrid` ixchamlashtirildi:** 260px kartochka o'rniga ~130px; ikonka-belgi + soha nomi (butun sarlavha havola, hover'da strelka), 2 xizmat chiziqli ro'yxatda; "Barchasi" va katta doira olib tashlandi; 4 ustun (2xl). `tsc` toza. |
| 2026-10-23 | Bosh sahifa: "Ommabop xizmatlar" va "Sohalar" o'rni almashtirildi (ommabop — shaxsiy bloklardan keyin, Sohalar — eng pastda). |
| 2026-10-23 | Bosh sahifa tartibi: hero → Ommabop xizmatlar → shaxsiy bloklar → vaziyatlar → imkoniyatlar → raqamlar → karta → Sohalar. |
| 2026-10-23 | Bosh sahifa: karta ("Hududlar kesimida") eng pastga, Sohalardan keyin. |
