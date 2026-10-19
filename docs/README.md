# my.stat.uz — vazifalar holati (yagona hujjat)

> **Holat sanasi:** 2026-10-16. Bu fayl barcha reja hujjatlaridagi vazifalarni bir joyga jamlaydi: **bajarilganlar** alohida, **qolgan ishlar** alohida.
> Vazifalarning batafsil tavsifi va qabul mezonlari asl hujjatlarda (pastdagi jadval). Har vazifa yoki vazifalar guruhi alohida git commit'da (`git log --oneline`).

## Hujjatlar

| Fayl | Nima | Holati |
|---|---|---|
| [LOYIHA.md](LOYIHA.md) | Arxitektura, app'lar, sozlamalar, deploy | Ma'lumotnoma |
| [PROEKT_TAHLIL.md](PROEKT_TAHLIL.md) | 2026-10-13 dagi boshlang'ich tahlil | Tarixiy: undagi muammolarning ko'pi tuzatilgan |
| [ISH_REJASI.md](ISH_REJASI.md) | Asosiy reja: F, B, S, U, K, FQ, A, Q vazifalari | ✅ Bajarilgan |
| [SIAT_KARTA_TAHLIL.md](SIAT_KARTA_TAHLIL.md) | SIAT tadqiqoti va hududlar xaritasi: KR-01..KR-14 | ✅ Bajarilgan |
| [SCORING_MODEL.md](SCORING_MODEL.md) | Hududlar salohiyati va prognoz: KR-15..KR-28 | ✅ Bajarilgan |
| [KORXONA_SCORING.md](KORXONA_SCORING.md) | Korxonalar scoringi: KR-29..KR-38 | ✅ Bajarilgan |
| [XIZMATLAR_TAHLILI.md](XIZMATLAR_TAHLILI.md) | Barcha xizmatlar: kirishsiz, ro'yxatdan keyin, pullik, jismoniy/yuridik | Ma'lumotnoma (2026-10-19) |
| [../README.md](../README.md) | Tez ishga tushirish, demo ma'lumot, production qadamlari | Ma'lumotnoma |
| [../backend/README.md](../backend/README.md) | Endpoint'lar ro'yxati | Ma'lumotnoma |

`SIAT_HOLAT.md` shu faylga birlashtirildi.

---

## Yakuniy tekshiruv (2026-10-16)

| Tekshiruv | Natija |
|---|---|
| `manage.py test` (butun backend) | **271 test, hammasi o'tdi** (boshida 6 ta test bor edi va runner yiqilardi) |
| `makemigrations --check` | O'zgarish yo'q |
| `manage.py check` | Faqat CKEditor 4 ogohlantirishi (xavfsizlik, qolgan ishlarda) |
| `npx tsc --noEmit` | 0 xato (boshida 37) |
| `eslint src` | 0 xato, 9 ogohlantirish (Fast Refresh) |
| `vitest` | 23 test, 5 fayl — OK |
| `npm run e2e` (Playwright) | KR-38 ishlari paytida o'tgan (`company-score.spec.ts`, 7 test); bu tekshiruvda qayta ishga tushirilmadi |
| Lokal baza | Korxona ballari: 436 483 qator (65 545 korxona × 5 preset). Hududlar: 12 582 ball, 35 850 prognoz qiymati, 126 model |

---

# ✅ Bajarilgan vazifalar

## 1. ISH_REJASI.md — 0-bosqich: poydevor (F)

| ID | Vazifa | Izoh |
|---|---|---|
| F-01 | Test runner import xatosi | Runner tuzatildi, OneID testlari qayta yozildi |
| F-02 | `core/asgi.py` | `core.settings.production` ga |
| F-03 | Django ogohlantirishlari va takrorlar | `notifications` namespace, takroriy CKEditor sozlamalari |
| F-04 | TypeScript xatolari | 37 → 0 |
| F-05 | ESLint va `console.log` | 85 xato → 0, `console.log` 159 → 0 |

## 2. ISH_REJASI.md — 1-bosqich: buzuq joylar (B)

| ID | Vazifa | Izoh |
|---|---|---|
| B-01 | Token yangilash URL'i | Keyin simplejwt + `IsAuthenticated` 403 bugi ham tuzatildi |
| B-02 | `organizations/` API 500 | |
| B-03 | Shartnomada `branch`/buxgalter yo'qligida 500 | |
| B-04 | `trade-flows` endpoint'i | `trade-flows/` + `dynamics/`, 1 soat kesh |
| B-05 | Xabarnomalar `notifications/me` ga ulandi | `NotificationsContext`, `unread-count/` |
| B-06 | Celery Beat | DIDOX 15 daq., eslatmalar 09:00, SIAT 03:30; `docker-compose` da `beat` servisi |
| B-07 | Paket muddati | `starts_at`/`expires_at`; mavjud 4 paket muddatsiz |
| B-08 | Demografiya lokal dev'da | `seed_demo --demographics` |

## 3. ISH_REJASI.md — 2-bosqich: sintetik ma'lumot (S)

| ID | Vazifa | Izoh |
|---|---|---|
| S-01, S-02 | `SyntheticRecord` reyestri, `seed_demo` (`--only/--flush/--dry-run`) | `--flush` dan keyin real jadvallar bayt-ma-bayt bir xil |
| S-03 | Klassifikatorlar | Kod daraxti emas, klassifikator hujjatlari: 6 kategoriya, 16 hujjat |
| S-04 | Xizmat so'rovlari va javoblari | |
| S-05, S-06 | Faoliyat rejalari, xabarnomalar | |
| S-07 | Demo foydalanuvchilar | Yuridik, jismoniy, tadqiqotchi, 5 konsultant, buxgalter, xodim |
| S-08 | Obunalar, murojaatlar, reytinglar | |
| S-09 | "Namuna" belgisi | Yorliq, `SampleBanner`, `data_source`, PNG/PDF'da suv belgisi |
| S-10 | Korxona ko'rsatkichlari | Anonim namuna korxonalar (STIR `P…`) |
| S-11 | Hududiy ko'rsatkichlar | 14 hudud × 10 ko'rsatkich, 369 tuman |
| S-12 | Hisobot yo'riqnomalari | 108 shakl, top-20 ga namunaviy PDF |
| S-13 | Buyurtma asosida ma'lumot | 6 tarif, 15 buyurtma |
| S-14 | Konsultantlar va jadval | 5 konsultant, ~700 slot |
| S-15 | Fuqarolar kontenti | Maqolalar, lug'at, ish haqi, narxlar, ismlar, so'rovnomalar |
| S-16 | API kalitlar va obunalar | |

## 4. ISH_REJASI.md — 3-bosqich: UI (U)

| ID | Vazifa | Izoh |
|---|---|---|
| U-01 | Skeleton, bo'sh holat, xato chegarasi | |
| U-02..U-06 | Kabinet: dashboard, xabarnomalar, to'lovlar tarixi (faqat o'qish), so'rovlar, faoliyat rejasi | |
| U-07 | Klassifikatorlar sahifasi | Kategoriyalar, 3 tilda qidiruv, CSV |
| U-08 | Bosh sahifa: jonli ko'rsatkichlar | `random` raqamlar olib tashlandi |
| U-09 | Savdo oqimlari | `/trade-flows`: xarita, top-20, dinamika |
| U-10 | Global qidiruv (Ctrl+K) | Keyin "Korxonalar" guruhi qo'shildi (KR-35) |
| U-11 | "Stat AI" | FAQ asosidagi yordamchi, LLM'siz (OS-06) |
| U-12 | "Operator" chat | Murojaat bazaga yoziladi, javob admin'dan |
| U-13 | Hisobot kalendari | Oy ko'rinishi, eslatma, `.ics` |
| U-14 | Mobil va a11y | Lighthouse: a11y / best practices / SEO **100** |
| U-15 | Profil to'ldirilganligi va onboarding | |
| U-16 | Savdo: taqqoslash, saqlangan filtr, eksport | `/trade-flows` da |
| U-17 | Kitob do'koni: qidiruv, sevimlilar, eng yaqin pochta | |

## 5. ISH_REJASI.md — 4-bosqich: korxonalar uchun (K)

| ID | Vazifa | Izoh |
|---|---|---|
| K-01 | Autofill | `me/prefill/`, `me/registry-diff/` |
| K-02 | Tarmoq benchmarki | Faqat agregat, PDF |
| K-03 | Bozor tahlili | Jahon importi o'rniga O'zbekiston eksporti dinamikasi (OS-20) |
| K-04 | Hamkor/raqobatchi qidiruvi | "O'lcham" filtri yo'q (OS-19) |
| K-05 | Hisobot topshirish yordamchisi | Faqat muddatlar (`submitted-report` stub) |
| K-06 | Buyurtma asosida ma'lumot | Alohida `CustomDataRequest` |
| K-07 | Korxona pasporti | `/cabinet/organization` |
| K-08 | Shartnoma vaqt chizig'i va oldindan ko'rish | `ContractStatusLog` |
| K-09 | Tarif taqqoslash va kalkulyator | `services/pricing.py` — yagona formula |

## 6. ISH_REJASI.md — 5-bosqich: fuqarolar (FQ)

| ID | Vazifa | Izoh |
|---|---|---|
| FQ-01 | Ochiq ma'lumotlar API'si | `/api/open/v1/`, `/api/open/docs/` |
| FQ-02 | Hududiy profil | Keyin SIAT ma'lumoti bilan almashtirildi |
| FQ-03 | Inflyatsiya kalkulyatori | Maosh, ijara, kredit stsenariylari |
| FQ-04 | Fuqaro kabineti | |
| FQ-05, FQ-06 | "Mening maoshim", narxlar va savat | Maosh brauzerdan chiqmaydi |
| FQ-07 | "Statistika oddiy tilda" | `citizens` app; maqolalar sodda tilda qayta yozildi |
| FQ-08..FQ-10 | So'rovnomalar, ismlar, fuqaro savoli | |
| FQ-11 | PWA | O'z `sw.js`; nginx'da `no-cache` (OS-22) |

## 7. ISH_REJASI.md — 6-bosqich: admin (A)

| ID | Vazifa | Izoh |
|---|---|---|
| A-01 | Admin analitika paneli | `/<admin>/analytics/` |
| A-02 | Ko'rsatkichlarga obuna, email, Telegram | Har soat, oylik dayjest |
| A-03 | Onlayn konsultatsiya | Faqat korxonalar, 24 soat qoidasi (OS-17) |

## 8. ISH_REJASI.md — 7-bosqich: kod sifati (Q)

| ID | Vazifa | Izoh |
|---|---|---|
| Q-02 | `OrgInfoPage` chunk | 635 KB → 19 KB |
| Q-03 | Grafiklar bitta kutubxonada | Chart.js va Highcharts → Recharts |
| Q-04 | Dublikat va ishlatilmaydigan fayllar | 14 fayl o'chirildi |
| Q-05 | Backend testlari | Hozir 271 test |
| Q-06 | CI tekshiruv bosqichlari | check, test, typecheck, eslint, build; deploy testdan keyin |
| Q-01, Q-07 | ⚠️ Qisman | Qolgan qismi pastda, "Qolgan ishlar" 6-bo'limda |

## 9. SIAT hududlar xaritasi — KR-01..KR-14

| ID | Vazifa | Izoh |
|---|---|---|
| KR-01 | SIAT sinxronlash xizmati | `apps/siat`, `sync_siat`, Celery har kuni 03:30 |
| KR-02 | Ko'rsatkichlar katalogi va tasnif | 13 asosiy, 2 guruh, 4 qo'shimcha manba |
| KR-03 | Normallashtirish | Davr nomlari, dublikat ustunlar, soxta nollar |
| KR-04 | SOATO chegaralari (GeoJSON) | `build_map_boundaries`, geoBoundaries asosida |
| KR-05 | Karta API'si | `/api/common/map/`, CSV/XLSX eksport |
| KR-06..KR-09 | Karta, drill-down, yil animatsiyasi, hudud kartochkasi | `pages/Regions.tsx`, `ChoroplethMap.tsx` |
| KR-10 | Hosila ko'rsatkichlar | Zichlik, qishloq ulushi, o'sish, jinsiy nisbat, real ish haqi |
| KR-11 | Ikki hudud / ikki ko'rsatkich (bivariant) | |
| KR-12 | Eksport va manba | PNG/CSV/XLSX |
| KR-13 | Qidiruv (kirillcha ham) va mobil | "Mening hududim" |
| KR-14 | Ma'lumot sifati monitoringi | Staff'ga ogohlantirish |

## 10. Hududlar salohiyati va prognoz — KR-15..KR-28

| ID | Vazifa | Izoh |
|---|---|---|
| KR-15..KR-17 | Scoring konfiguratsiyasi, dvigatel, bo'shliqlar va ishonchlilik | `apps/siat/scoring/`, `compute_scores` |
| KR-18 | Kuchli tomonlar, tarmoq ixtisosi, tavsiyalar | |
| KR-19 | Scoring API | OpenAPI bilan |
| KR-20, KR-21 | Xarita qatlami, kartochka, o'xshash hududlar, solishtirish | |
| KR-22 | Metodologiya va tekshiruv | |
| KR-23..KR-25 | Prognoz to'plami, model tanlash (orqaga sinov), 80% oraliq, ssenariylar | `apps/siat/forecast/`, `train_forecasts` |
| KR-26 | Saqlash, qayta o'rgatish, prognoz API | SIAT sinxronlangandan keyin avtomatik (`refresh_models_task`) |
| KR-27 | Xarita UI: kelajak yillari, fan chart | Playwright e2e |
| KR-28 | Kelajakdagi salohiyat indeksi, prognoz monitoringi | |

## 11. Korxonalar scoringi — KR-29..KR-38

| ID | Vazifa | Izoh |
|---|---|---|
| KR-29 | Model va YAML konfiguratsiya | `EnterpriseScore`, `company_scoring.yaml`, validatsiya |
| KR-30 | Sintetik seeder (barcha KTUT korxonalari) | `seed = 42 + crc32(stir)`, faqat `DEBUG=True` |
| KR-31 | Hisoblash dvigateli | pandas + `COPY`, 65 545 × 5 preset — 81 s; `korxona_scoring/` skripti bilan farq 0.0 |
| KR-32 | ⚠️ Real manbalar (qisman) | Real: hisobotlar soni, mahsulot turlari. Qolganlari uchun real manba yo'q — "Qolgan ishlar" 4-bo'limda |
| KR-33 | Scoring API | `company-scores/`, `me/`, `distribution/`, `methodology/` |
| KR-34 | UI komponentlari | Badge, kartochka, `/company-score/components` |
| KR-35 | Ro'yxatlarga joylash | Hamkorlar, sanoat, global qidiruv, admin |
| KR-36 | Pasport va kabinet | Dinamika, tavsiyalar, benchmark gistogrammasi |
| KR-37 | Hududiy va admin agregatlar | `/regions?ind=company-score` |
| KR-38 | Metodologiya va `validate_company_scoring` | `/methodology/company-score` |

## 12. Hal bo'lgan ochiq savollar

OS-01..OS-17 ko'rsatilgan **default** bilan bajarildi (ISH_REJASI 14-bo'lim). Alohida yopilganlari: OS-10 (`TradeData.value` — ming AQSh $), OS-14 (`setup_service_limits`), OS-21 (`check --deploy` ogohlantiradi), OS-22 (nginx `no-cache`).

---

# ⏳ Qolgan ishlar

## 1. Production'ga chiqarish (majburiy)

1. GitLab remote'ni sozlash (manzilini egasi beradi) va push qilish. `main` ga push deploy'ni ishga tushiradi.
2. Serverni monorepo'ga ko'chirish: [../README.md](../README.md), "Production" bo'limi, 1–6-qadamlar.
3. Celery **worker** va **beat** uchun systemd unitlari. Ularsiz DIDOX, eslatmalar, SIAT sinxronlash va prognoz ishlamaydi.
4. `migrate` → `setup_service_limits` → `check --deploy` → `sync_siat`. SIAT 429 qaytarsa, `--ids` bilan qayta ishga tushiriladi. Serverdan `api.siat.stat.uz` ga ulanish bo'lmasa, JSON admin orqali qo'lda yuklanadi.
5. Serverda `TELEGRAM_BOT_TOKEN` va `EMAIL_HOST` borligini tekshirish.
6. Serverdagi nginx'ga `location = /sw.js { add_header Cache-Control "no-cache"; }` qo'shish.

## 2. Xavfsizlik (ataylab qoldirilgan — ISH_REJASI 2.1)

| Muammo | Daraja |
|---|---|
| `trade-data/upload` — mehmon fayl yuklay oladi | 🔴 Kritik |
| `accounts/update/email/<username>/` — `DELETE` va `GET` da egasi tekshirilmaydi | 🔴 Kritik |
| `common/information/` — yozish va o'chirishda ruxsat tekshiruvi yo'q | 🔴 Yuqori |
| `services/service-request/` GET `?package_item=`/`?contract=` bilan begona so'rovlar qaytadi | 🔴 Yuqori |
| `service-response/<pk>/` PATCH — mijoz o'ziga "admin javobi" yoza oladi | 🟠 O'rta |
| OneID view'lari PINFL va kodni `print()` bilan log'ga chiqaradi | 🟠 O'rta |
| `ALLOWED_HOSTS=['*']`, CORS hamma uchun + credentials | 🟠 O'rta |
| `__debug__/` production'da ulangan | 🟠 O'rta |
| Rate limit yo'q (login, parol tiklash, murojaat) | 🟠 O'rta |
| CKEditor 4 eskirgan | 🟠 O'rta |
| Parol tiklashda email mavjudligi oshkor; `SECRET_KEY` default; `CSRF_COOKIE_SECURE=False`; 500 MB upload | 🟡 Past |
| JWT `localStorage` da | 🟡 Past |

## 3. Onlayn to'lov va biznes oqimi (ataylab qoldirilgan — ISH_REJASI 2.2)

- Kitob uchun to'lov havolasi qattiq yozilgan.
- `Order` summasi doim 0.
- Shartnoma imzolanib to'langanda paket avtomatik faollashmaydi (admin qo'lda).
- Shartnomani Click orqali to'lab bo'lmaydi. Payme ulanmagan. `PaymentMerchantRequestLog` ga yozilmaydi.
- Bir nechta paketi bor foydalanuvchida `UserServicePackage...first()` tasodifiy paketni oladi.
- OneID: frontend callback'ga POST yuboradi, backend faqat GET qabul qiladi (egov.uz kalitlarisiz tekshirilmagan).

## 4. Real ma'lumot manbalari va egasining qarorlari

| ID | Masala | Hozirgi holat |
|---|---|---|
| OS-13 | Korxona, hudud, ish haqi va narxlar uchun real manba | Sintetik namuna. **Korxonalar bali production'da real ma'lumot ulanmaguncha chiqmaydi** (to'liqlik < 0.6) |
| KR-32 | O'z vaqtida topshirilgan hisobotlar, faoliyat davomiyligi, tashqi savdo STIR bo'yicha | Real manba yo'q (`submitted-report` stub, KTUT'da sana yo'q, savdo jadvalida STIR yo'q) |
| OS-19 | Korxona o'lchami (xodimlar soni) | Real manba yo'q, K-04 da filtr yo'q |
| OS-20 | Jahon savdosi ma'lumoti | O'rniga O'zbekiston eksporti |
| OS-18 (shartnoma) | Shablondagi "Sirdaryo viloyati" va "2025-yil" | Yuristlar ko'rib chiqishi kerak |
| OS-18 (scoring) | Begona korxona bali ochiq ko'rinsinmi | Yo'q: `SiteSettings.company_score_public=False` |
| OS-07 | Begona jadvallar (`test`, `uz`, `my_stat_uz_platforma_uchun`), `chat`, `monitoring` app'lari | Tegilmagan, egasining ruxsati kerak |
| — | 38-xizmat (klassifikatorlar) `is_active=False` | `/statistical-classifications` "topilmadi" ko'rsatadi. Admin qarori |

> ID to'qnashuvi: `OS-18` ikki xil savol uchun ishlatilgan (ISH_REJASI — shartnoma shabloni, KORXONA_SCORING — ball ochiqligi). Yangi savollarni OS-23 dan boshlab raqamlash kerak.

## 5. SIAT ma'lumot muammolari (admin orqali)

- **Investitsiyalar guruhi:** SIAT'da 2601 va 2603 jadvallarining ikkalasi "Qashqadaryo" deb nomlangan, shuning uchun Qashqadaryo kartada yashirilgan. Admin'da `group_region_override` ga to'g'ri viloyatni qo'yish kerak.
- **Buxoro** investitsiya jadvali SIAT'da topilmadi.
- **7 ta yangi tumanning chegarasi yo'q:** Ko'kdala, G'ozg'on, Bandixon, Yangihayot, Tuproqqal'a, Bo'zatov, Taxiatosh. Rasmiy chegara topilsa `data/boundary_overrides.json` orqali qo'shiladi.
- Tashqi savdo: 2023-yil qiymatlari boshqa yillardan ~16 marta kichik. 2021-yil yo'q, 2022-yil faqat `M1`.
- Hisobot muddatlari (`ReportList.deadline`) 2025-yilda qotib qolgan.

## 6. Sifat va unumdorlik

- **Performance:** Lighthouse 59–76, LCP 5–8 s (ishlatilmagan JS, rasmlar), `/services` da CLS 0.30.
- **Q-01 (qolgan qism):** `BookStore.tsx` (~1 750 qator) va `ExternalTrade.tsx` (~1 390 qator) bo'linmagan. Ularda to'lov oqimi bor, shuning uchun avval test kerak.
- **Q-07 (qolgan qism):** `drf-yasg` qolgan (Click view'lari ishlatadi).
- CI test job'lari uchun GitLab'da Docker executor kerak. Bo'lmasa `CI_TESTS_DISABLED=true`.
- Media fayllar (rasm, PDF, demografiya parquet) uchun zaxira rejasi yo'q.
- Mayda kuzatuvlar: konsultatsiyalar sahifasi `/consultations/schedule/` ga keraksiz so'rov yuborib 403 oladi; konsultant akkauntiga korxona tanishtiruvi chiqadi.

## Tavsiya etilgan tartib

1. **Xavfsizlik** (2-bo'lim, avval 🔴 lar) — production'dan oldin.
2. **Production** (1-bo'lim).
3. **To'lov oqimi** (3-bo'lim).
4. Real manbalar va egasining qarorlari (4–5-bo'lim) — egasining javobiga qarab.
5. Unumdorlik (6-bo'lim).
