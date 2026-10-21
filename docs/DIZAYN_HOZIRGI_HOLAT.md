# my.stat.uz dizayni: hozirgi holat

> ⚠️ **Eskirgan (2026-10-21):** bu hujjat 1-etap dizaynini tasvirlaydi. Shu kuni my.gov.uz uslubidagi 2-etap (MG-00..MG-15) bajarildi — joriy holat [`MYGOV_DIZAYN.md`](MYGOV_DIZAYN.md) 0.5-bo'limida va [`mygov-reference/`](mygov-reference/) da.

> **Sana:** 2026-10-21 · **Kod holati:** commit `efc0d9b` (2026-10-20) + commit qilinmagan o'zgarishlar (2026-10-20 jurnali).
> **Manbalar:** `CLAUDE_HISOBOT.md` (4-bo'lim va 7-bo'lim jurnali), `FEATURELAR_ESKI_VA_HOZIR.md`, `MYGOV_DIZAYN.md` (MG-00..MG-15), `LOYIHA_ESKI_VA_YANGI.md`, `ISH_REJASI.md` (U-vazifalar).
> **Cheklov:** bu hujjat repo kodiga qarab emas, faqat yuqoridagi hujjatlar asosida yozildi. Hujjatlarda yozilmagan narsa **"aniqlanmagan"** deb belgilangan. Ranglar, shriftlar va skrinshotlar hujjatlarda yo'q.

---

## 1. Qisqacha

1. **Sayt dizayni 2026-10-20 da katta yangilandi:** menyu (`Navbar`), bosh sahifa banneri, "O'zbekiston raqamlarda" bloki, xizmatlar, tariflar, hisobot kalendari va xaritalar qayta loyihalandi. Asosiy g'oya: **"statistika portali" uslubi**, bunda faqat real raqamlar ko'rsatiladi, har birining manbasi va davri yoziladi. Eski soxta foizlar ("+12.5%") olib tashlandi.
2. **my.gov.uz ga moslashtirish rejasi (MG-00..MG-15) hali boshlanmagan.** Jurnalda birorta MG vazifasi bajarilgani yozilmagan. Faqat bir nechta bo'lak boshqa vazifalar orqali qisman bor: global qidiruv, xabarnomalar, til va tema, a11y.
3. **Muhim ziddiyat:** 2026-10-20 dagi yangilanish my.gov.uz rejasiga **teskari yo'nalishda** ketgan. Reja header'dagi gorizontal menyuni olib tashlab, o'rniga "sohalar"ni qo'yishni va bosh sahifadan statistik bloklarni olib tashlashni talab qiladi. Hozirgi saytda esa aynan shu ikkalasi kuchaytirilgan. Qaysi yo'nalish tanlanishi kerak, egasining qarori (6-bo'lim).

---

## 2. Sahifalar va umumiy tuzilma

| Ko'rsatkich | Eskida (2026-10-13) | Hozir (2026-10-20) |
|---|---|---|
| Frontend sahifalari | 25 | 59 + 404 sahifa |
| Kabinet bo'limlari | 7, hammaga bir xil | 18, foydalanuvchi turiga qarab (`all` / `legal` / `citizen`) |
| Grafik kutubxonasi | aralash | Recharts (yagona) |
| Tillar | uz / cry / ru | uz / cry / ru (o'zgarmagan) |
| Tema | kunduzgi / tungi | kunduzgi / tungi (`ThemeContext`) |

**Sahifa guruhlari (asosiylari):**

- **Ommaviy statistika:** `/` bosh sahifa, `/dashboards/:slug` mavzuli panellar (iqtisodiyot, mehnat, aholi), `/release-calendar` e'lonlar kalendari, `/regions` va `/regions/:id` hududlar, `/ex-trade`, `/trade-flows` tashqi savdo, `/demographics`, `/report-calendar`, `/reports`, `/reglaments`, `/cpi-calculator`, `/statistical-classifications`, `/statistics` portal statistikasi, `/developers` ochiq API, `/stat-codes`.
- **Korxonalar:** `/organizations`, `/orginfo`, `/industry`, `/check` kontragent kartasi, `/partners`, `/market-report`, `/company/:stir` korxona profili, `/methodology/...` sahifalari, `/tariffs`, `/services`, `/consultation`.
- **Fuqarolar:** `/citizens`, `/my-salary`, `/prices`, `/names`, `/surveys`, `/learn`, `/glossary`, `/answers`.
- **Boshqa:** `/books` kitob do'koni, `/questions`, `/about`, `/contact`, `/cabinet`.
- **Navbar'siz sahifa:** `/embed/indicator/:key` (boshqa saytga joylash uchun, `App.tsx` → `Shell`).

Barcha sahifalarda umumiy elementlar: Navbar, global qidiruv (`Ctrl+K`), Stat AI yordamchisi va operator chat (endi haqiqiy bazaga ulangan), PWA. Footer qanday ko'rinishda ekani **aniqlanmagan** (hujjatlarda Footer qayta loyihalangani yozilmagan).

---

## 3. Menyu (Navbar) — 2026-10-20 da qayta qilingan

Fayl: `frontend/src/components/.../Navbar.tsx` (aniq papka aniqlanmagan).

| Qism | Hozir nima bor |
|---|---|
| **Rasmiy yuqori qator** | Qo'mita nomi · Portal haqida · Reglamentlar · Portal statistikasi · stat.uz · SIAT havolalari |
| **Asosiy menyu** (gorizontal) | Ko'rsatkichlar · Hududlar · Korxonalar · Fuqarolar uchun · Xizmatlar · Savol-javob · Aloqa. Faol bo'lim ostida chiziq bilan belgilanadi |
| **Profil** | Avatar bosilganda profil menyusi ochiladi, `Escape` bilan yopiladi |
| **Qidiruv** | Global qidiruv (`Ctrl+K`). Bosh sahifa banneridagi qidiruv ham shu oynani ochadi (`open-global-search` hodisasi) |
| **Ogohlantirish qatori** | Avvalgi qizil yuguruvchi qator o'rniga sokin "test rejimi" xabari |

Aniqlanmagan: til almashtirgich va xabarnoma qo'ng'iroqchasi Navbar'ning qaysi joyida turgani, mobil (burger) menyu ko'rinishi.

---

## 4. Bosh sahifa — yuqoridan pastga

Hozirgi tartib jurnal bo'yicha shunday (bloklar orasidagi aniq tartib qisman taxmin, `Home` faylining o'zi ko'rilmagan):

| # | Blok | Fayl | Nima ko'rsatadi |
|---|---|---|---|
| 1 | **Banner** | `Banner.tsx` | Statistika uslubi, O'zbekiston xaritasi siluetti fonda, global qidiruv maydoni, tezkor havolalar, jonli aholi soni, portal faoliyati (faqat haqiqiy raqamlar) |
| 2 | **"O'zbekiston raqamlarda"** | `HomeHighlights.tsx` | Aholi paneli va aholi soati (stat.uz bilan sinxron) · 4 ta ko'rsatkich kartochkasi, har birida 10 yillik grafik (yil o'qi, oxirgi nuqta, izoh oynasi, ma'lumotga mos shkala, davr xulosasi) · tashqi savdo (aylanma, eksport/import ulushi, saldo) · e'lonlar kalendari sanalar bo'yicha guruhlangan · ochiq ma'lumotlar qatori. Har raqam to'liq, manba va davr bilan |
| 3 | **"Portal faoliyati"** | `HomeHighlights.tsx` | Foydalanuvchi, xizmat, shartnoma sonlari (real). Chalg'ituvchi "oylik yangi foydalanuvchilar" grafigi olib tashlangan |
| 4 | **Interaktiv xizmatlar** | `Interactive.tsx` | Xizmatlarga haqiqiy havolalar, slug bo'yicha ikonka, toza tavsif. Ishlatilmaydigan modallar olib tashlangan |
| 5 | **Tariflar** | `TariffComponent.tsx` | Haqiqiy narx oralig'i (API `price_range`), xizmat yo'nalishlari |
| 6 | **Hisobot kalendari** | `CalendarReport.tsx` | Hafta dushanbadan boshlanadi, o'tgan muddatlar xira, yaqin muddatlar sana bo'yicha. "Рѕylik" kodlash xatosi tozalanadi |

Ma'lumot `fetchDashboards` orqali keladi va 5 daqiqa keshlanadi.

---

## 5. Boshqa sahifalardagi dizayn

### 5.1. Xaritalar (`/regions`, hudud profillari)

- `ChoroplethMap`: to'q chegaralar, mamlakat soyasi (`.stat-map` CSS), viloyat nomlari (kichik hududlarda yozilmaydi, `labelPoint`).
- `RegionBubbleMap`: pufakcha maydoni qiymatga proporsional (ilgari xato edi), pufakcha hudud markazida, rang shkalasi, bir-biriga to'qnashmaydigan qiymat yorliqlari, o'lcham izohi.
- Drill-down, animatsiya, bivariant xarita, eksport (KR-01..KR-14 dan).

### 5.2. Kabinet

18 bo'lim, foydalanuvchi turiga qarab: bosh panel, to'lovlar, xabarnomalar, xizmatlarim ("Paketda bor" yorlig'i, "O'tish" tugmasi endi 404 bermaydi), shartnomalar, buyurtmalar, xizmat so'rovlari, individual ma'lumot, faoliyat rejasi, "Hisobotlarim", API kalitlari, StatCoin hamyoni (qayta joylashtirilgan), "Savollarim", obunalar, sevimlilar, korxona pasporti va boshqalar.

Aniqlanmagan: kabinet chap menyusining aniq tartibi va ko'rinishi, kabinet umumiy layout bilan bir xil header/footer ishlatadimi.

### 5.3. Ulashish va embed

`ShareBar.tsx`: havola, embed kodi, APA/GOST iqtibos, PNG yuklab olish. Panellar va ko'rsatkichlarda.

### 5.4. Sintetik ma'lumot belgisi

Demo muhitda namuna ma'lumot "Namuna" belgisi bilan ko'rsatiladi (`DEBUG=True` da). Production'da bunday bo'limlar bo'sh yoki yashirin.

### 5.5. Sifat ko'rsatkichlari

| Ko'rsatkich | Holat |
|---|---|
| Lighthouse a11y va SEO | 100 |
| Lighthouse performance | 59–76 (past) |
| LCP | 5–8 s (sekin) |
| `/services` CLS | 0,30 (sahifa "sakraydi") |
| Katta fayllar bo'linmagan | `BookStore.tsx` ~1750 qator, `ExternalTrade.tsx` ~1390 qator |

### 5.6. Vizual uslub (ranglar, shrift, kartochkalar)

**Aniqlanmagan.** Hujjatlarda hozirgi asosiy rang, shrift nomi, radius, soya qiymatlari yozilmagan. Yagona dizayn tokenlari fayli (`theme/tokens.ts`) yo'q, chunki u MG-01 vazifasida rejalashtirilgan va bajarilmagan. Komponentlarda qattiq yozilgan ranglar (`#...`) qolgan bo'lishi ehtimoli bor (MG-01 shuni nazarda tutadi), lekin kod bilan tekshirilmagan.

---

## 6. my.gov.uz rejasi (MYGOV_DIZAYN.md): nima bajarilgan, nima qolgan

Belgilar: ✅ bajarilgan · 🟡 qisman (boshqa vazifa orqali) · ❌ bajarilmagan · ⚠️ hozirgi dizayn rejaga zid.

| Vazifa | Nima qilinishi kerak | Holat | Izoh |
|---|---|---|---|
| **MG-00** · my.gov.uz dan namuna va tokenlarni o'lchash | Playwright skripti, `tokens.json`, `checklist.md` | ❌ | `docs/mygov-reference/` yaratilgani jurnalda yo'q |
| **MG-01** · Dizayn tokenlari va tema | `tokens.ts`, CSS o'zgaruvchilar | 🟡 | Tungi/kunduzgi rejim bor, lekin my.gov.uz tokenlari yo'q (MG-00 ga bog'liq) |
| **MG-02** · Umumiy layout skeleti | SkipLink → TopBar → Header → main → fikr vidjeti → Footer; `/uz/...` til prefiksli URL | ❌ | Til prefiksli URL yo'q. Skip-link bor-yo'qligi aniqlanmagan (a11y 100 bo'lgani uchun ehtimol bor) |
| **MG-03** · Top bar, header, til almashtirgich | Gorizontal menyuni olib tashlash, top bar: hisobot kalendari · ishonch telefoni · qayta aloqa · til · kirish | ⚠️ | Navbar 2026-10-20 da **boshqa uslubda** qayta qilindi: rasmiy qator bor, lekin gorizontal menyu saqlangan va kuchaytirilgan. Profil menyusi va `Escape` rejaga mos |
| **MG-04** · Katalog va 14 soha | `spheres.ts`, xizmatlarga doimiy raqam (`#101`) | ❌ | Sohalar va xizmat raqamlari yo'q |
| **MG-05** · Bosh sahifa my.gov.uz tartibida | Ommabop plitkalar → shaxsiy bloklar → sohalar → fikr vidjeti | ⚠️ | Hozirgi bosh sahifa banner va statistik bloklarga qurilgan, reja esa ularni olib tashlashni talab qiladi |
| **MG-06** · Soha sahifasi, "Barcha xizmatlar" | `/spheres`, `/spheres/:id`, sidebar, filtrlar | ❌ | |
| **MG-07** · Xizmat pasporti `/service/:id` | Bajarish vaqti, foydalanish soni, reyting, "Ariza yuborish" | ❌ | |
| **MG-08** · Qidiruv va `/search` | Header qidiruvi, `/search` sahifasi, `#raqam` bo'yicha | 🟡 | Global qidiruv (`Ctrl+K`, U-10) bor. Alohida `/search` sahifasi va raqam bo'yicha qidiruv yo'q |
| **MG-09** · Footer | 3 ustun, `/privacy`, `/terms`, `/ai-usage`, `/sitemap` | ❌ / aniqlanmagan | Footer o'zgarishi jurnalda yo'q |
| **MG-10** · Foydalanish soni va baholar | `ServiceUsage`, `ServiceRating` | ❌ | |
| **MG-11** · Fikr vidjeti va Ctrl+Enter | "Sahifa ma'qul keldimi?" | ❌ | |
| **MG-12** · Kabinet my.gov.uz uslubida | Bir xil layout, yangi chap menyu tartibi | 🟡 | Kabinet foydalanuvchi turiga qarab bo'lingan (18 bo'lim), lekin MG-12 dagi tartib va layout bo'yicha emas |
| **MG-13** · "Statistika" sahifasi | Bosh sahifadagi ko'rsatkichlar `/statistics` ga ko'chadi | 🟡 | `/statistics` real ma'lumotga o'tgan, lekin ko'rsatkichlar bosh sahifada qolgan |
| **MG-14** · Mobil va a11y | 360/768/1280, axe CI'da | 🟡 | Lighthouse a11y 100. 360/768/1280 taqqoslash va axe CI yo'q |
| **MG-15** · Qolgan sahifalar, 98% tekshiruvi | Barcha sahifalar yangi layoutda, checklist ≥ 98% | ❌ | |

**Jami:** 16 vazifadan **0 tasi to'liq**, 5 tasi qisman (MG-01, 08, 12, 13, 14), 2 tasida hozirgi dizayn rejaga zid (MG-03, MG-05). "98% o'xshashlik" o'lchovi uchun asos (`checklist.md`) hali yo'q, shuning uchun foiz hisoblab bo'lmaydi.

### 6.1. Ochiq savollar (MYGOV_DIZAYN 7-bo'lim) — hammasi javobsiz

OS-MG-01 (ishonch telefoni raqami), OS-MG-02 (English BETA), OS-MG-03 (portalning rasmiy nomi), OS-MG-04 (katalogni admin boshqaradimi), OS-MG-05 (plitkalar "story" ochsinmi), OS-MG-06 (maxfiylik va shartlar matni), OS-MG-07 (baholar ochiqmi), OS-MG-08 (bosh sahifadan statistikani olib tashlash rahbariyat bilan kelishilganmi), OS-MG-09 (my.gov.uz kabineti skrinshotlari).

---

## 7. Egasi hal qilishi kerak bo'lgan asosiy savol

**Bosh sahifa va menyu qaysi yo'nalishda bo'ladi?**

| Variant | Nima bo'ladi | Nima yo'qotiladi |
|---|---|---|
| **A. Hozirgi "statistika portali" uslubi qoladi** | MYGOV rejasidan faqat zid bo'lmagan qismlar olinadi: tokenlar (MG-01), sohalar va xizmat pasportlari (MG-04, 06, 07), `/search` (MG-08), footer (MG-09), baholar (MG-10), fikr vidjeti (MG-11), kabinet (MG-12) | my.gov.uz bilan "98% o'xshashlik" maqsadi bajarilmaydi |
| **B. my.gov.uz rejasi to'liq bajariladi** | Navbar'dagi gorizontal menyu sohalarga almashtiriladi, bosh sahifadagi banner va "O'zbekiston raqamlarda" `/statistics` ga ko'chadi | 2026-10-20 da bosh sahifa va Navbar uchun qilingan ishning katta qismi boshqa joyga ko'chiriladi yoki qayta yoziladi (OS-MG-08) |

Bu hujjat tavsiya bermaydi, faqat ziddiyatni ko'rsatadi. Qaror bo'lmaguncha MG-00 (namuna va tokenlarni o'lchash) har ikki variantda ham foydali, chunki u faqat ma'lumot yig'adi.

---

## 8. Aniqlanmagan narsalar (kod bilan tekshirish kerak)

- Hozirgi ranglar, shrift, kartochka uslubi (radius, soya).
- Footer'ning hozirgi tuzilishi.
- Til almashtirgich, qo'ng'iroqcha va mobil menyuning Navbar'dagi joyi.
- Kabinet chap menyusining aniq tartibi.
- Bosh sahifa bloklarining aniq ketma-ketligi (`Home` fayli ko'rilmagan).
- Skip-link bormi.
- 2026-10-20 dagi dizayn o'zgarishlari hali **commit qilinmagan** (jurnalda "commit qilinmagan"). Ular yo'qolmasligi uchun commit kerak.
