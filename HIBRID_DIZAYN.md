# my.stat.uz: yagona gibrid dizayn (Claude Code uchun asosiy hujjat)

> **Sana:** 2026-10-22 · **Versiya:** 1
> **Egasining qarori (2026-10-22):** "Gibrid" yo'nalish. Ommaviy statistika qismi **Statista** uslubida, shaxsiy kabinet **my.soliq.uz / my.mehnat.uz** uslubida, xizmatlar katalogi, sohalar va xizmat pasporti **my.gov.uz** uslubida.
> **Bu hujjat nimani almashtiradi:** dizayn bo'yicha endi **shu hujjat ustun turadi**. Eski hujjatlar o'zgartirilmadi, ular tafsilot manbasi sifatida qoladi. Eski hujjat bilan bu hujjat farq qilsa, shu hujjatdagi yozuv to'g'ri.
> **Manbalar:** [`STATISTA_DIZAYN.md`](STATISTA_DIZAYN.md) (ST-01..ST-07, [maket](https://claude.ai/artifact/5vmmVEDxu1BA5cHiZYMkTc)), [`MEHNAT_SOLIQ_DIZAYN.md`](MEHNAT_SOLIQ_DIZAYN.md) (MS-00..MS-12), [`MYGOV_DIZAYN.md`](MYGOV_DIZAYN.md) (MG-00..MG-15), [`MYGOV_JORIY_ETISH.md`](MYGOV_JORIY_ETISH.md) (katalog `#101..#1404`, 2A..2G), [`TRADEINT_DIZAYN.md`](TRADEINT_DIZAYN.md) (TI-01..TI-12), [`DIZAYN_HOZIRGI_HOLAT.md`](DIZAYN_HOZIRGI_HOLAT.md) (1-etap).
> **Kim bajaradi:** foydalanuvchi kompyuteridagi Claude Code, `mystat` repo'sida. Repo bu hujjat yozilgan muhitda yo'q edi, shuning uchun fayl yo'llari eski hujjatlardan olingan, "(aniqlash kerak)" joylar koddan topiladi.

---

## 0. Qisqacha

1. **Bitta dizayn tizimi, uchta sahifa qolipi.** Butun sayt bitta tokenlar to'plami (`--ds-*`) va bitta komponentlar papkasini (`components/ds/`) ishlatadi. Uslublar farqi faqat **sahifa qolipida**: Statista qolipi (ma'lumot sahifasi), my.gov.uz qolipi (katalog va pasport), my.soliq qolipi (kabinet, ish stoli).
2. **Ommaviy sahifalarda bitta header va bitta footer.** Statista va my.gov.uz zonalari bir xil `TopBar` + `PublicHeader` + `Footer` ichida. Foydalanuvchi zonalar o'rtasida o'tganda "boshqa saytga o'tdim" deb sezmaydi. Kabinetning o'z karkasi bor (`AppShell`, chap menyu, footer yo'q).
3. **Bosh sahifadan statistika olib tashlanmaydi.** Bosh sahifa Statista uslubida (katta qidiruv, trend ko'rsatkichlar, mavzular). Shuning uchun eski ziddiyat (OS-MG-08, rahbariyat kelishuvi) yopildi. "my.gov.uz ga 98% o'xshash" maqsadi ham bekor: o'rniga har zona o'z tekshiruv ro'yxati bilan o'lchanadi (9-bo'lim).
4. **Kod tartibi 14 qadam (H0..H13).** Avval tokenlar va komponentlar, keyin kabinet (u ommaviy qismga bog'liq emas), keyin yangi ommaviy sahifalar (ko'rsatkich, katalog, mavzular), **header va bosh sahifa eng oxirida** almashadi, yangi sahifalar tayyor bo'lgach. Har qadam alohida PR va qaytarib olinadi.
5. **Ochiq savollar 10-bo'limda,** har birida default bor. Hech biri birinchi 6 qadamni to'xtatmaydi.

---

## Mundarija

1. [Uch zona: qaysi uslub qayerda](#1-uch-zona)
2. [Ziddiyatlar va qarorlar](#2-ziddiyatlar-va-qarorlar)
3. [Dizayn tokenlari](#3-dizayn-tokenlari)
4. [Komponentlar](#4-komponentlar)
5. [Layoutlar va sahifa qoliplari](#5-layoutlar-va-sahifa-qoliplari)
6. [Sahifalar xaritasi](#6-sahifalar-xaritasi)
7. [Navigatsiya: header, footer, kabinet menyusi](#7-navigatsiya)
8. [Kod etaplari H0..H13](#8-kod-etaplari)
9. [Tekshiruv](#9-tekshiruv)
10. [Ochiq savollar](#10-ochiq-savollar)
11. [Eski vazifalar qayerga tushdi](#11-eski-vazifalar-qayerga-tushdi)

---

## 1. Uch zona

| Zona | Uslub manbasi | Nima uchun | Asosiy birlik | Qolip |
|---|---|---|---|---|
| **S · Statistika** | Statista ([STATISTA_DIZAYN.md](STATISTA_DIZAYN.md) 2, 4-bo'lim) | Raqam izlayotgan mehmon: qidiruv, ko'rsatkich, mavzu, xarita, panel | Ko'rsatkich sahifasi `/indicators/:key` | `DataPage` |
| **G · Katalog** | my.gov.uz ([MYGOV_DIZAYN.md](MYGOV_DIZAYN.md) 1.5–1.9) | Xizmat izlayotgan foydalanuvchi: sohalar, xizmat pasporti, qidiruv, yordam va ma'lumot sahifalari | Xizmat pasporti `/service/:number` | `CatalogPage`, `ServicePage`, `InfoPage` |
| **M · Kabinet** | my.soliq.uz / my.mehnat.uz ([MEHNAT_SOLIQ_DIZAYN.md](MEHNAT_SOLIQ_DIZAYN.md) 2, 5-bo'lim) | Kirgan foydalanuvchi: hisobotlar muddati, arizalar, shartnomalar, to'lovlar | Jadval ro'yxat + tafsilot | `AppShell` |

**Umumiy qoidalar (hamma zonada):**

- Faqat haqiqiy raqam, har birida manba va davr (1-etap qoidasi). Demo ma'lumot "Namuna" belgisi bilan, faqat `DEBUG=True` da.
- 3 til: uz / cry / ru. Kunduzgi va tungi rejim (`ThemeContext`).
- 360 / 768 / 1280 px da gorizontal skroll yo'q (jadval va plitkalar qatoridan tashqari).
- Lighthouse a11y ≥ 95 (hozir 100, tushmasin).
- Statista, my.gov.uz, my.soliq, my.mehnat va tradeint dan logo, ikonka, rasm, shrift fayli, matn ko'chirilmaydi. Faqat tuzilma va xatti-harakat olinadi.
- `backend/apps/payment/` va xavfsizlik sozlamalariga tegilmaydi (`ISH_REJASI.md` 2–3-bo'lim).

---

## 2. Ziddiyatlar va qarorlar

Eski hujjatlar bir-biriga zid edi. Quyidagi jadval har birini hal qiladi. Qaror ustidan savol bo'lsa, 10-bo'limdagi tegishli `OS-H` qatoriga qarang.

| # | Masala | Variantlar (eski hujjatlarda) | **Qaror** | Sabab |
|---|---|---|---|---|
| **Z-01** | Tokenlar to'plami | ST: `--c-*` (navy + ko'k + to'q sariq) · MS: `--ms-*` (ko'k, holat ranglari) · MG: my.gov.uz dan o'lchanadi | **Bitta `--ds-*` to'plami** (3-bo'lim). Navy va to'q sariq urg'u ST dan, holat ranglari va o'lchamlar MS dan. MG-00/MS-00 o'lchovi faqat solishtirish uchun, qiymatlarni almashtirmaydi | 98% maqsadi yo'q, uchta palitra bitta saytda bo'lmaydi |
| **Z-02** | Shrift | ST maketi: IBM Plex Sans · MS: Inter · MG: o'lchanadi | **Inter** (`@fontsource-variable/inter`), zaxira `system-ui, "Segoe UI", Roboto, Arial` | Kabinetdagi zich jadvallar uchun `tabular-nums` yaxshi, bitta variable fayl, lotin va kirill. Maketni almashtirish oson (OS-H-01) |
| **Z-03** | Ommaviy header | ST: 7 bandli gorizontal menyu, to'q ko'k · MS: 5 bandli menyu · MG: menyusiz, faqat top bar + qidiruv | **To'q ko'k header, 5 bandli menyu** (7.1), ustida rasmiy `TopBar` (MG top bar elementlari shu qatorga). Katalog sahifalarida ham shu header | Ommaviy qismning yuzi Statista; sohalar menyusi "Xizmatlar" bandi ichida |
| **Z-04** | Bosh sahifa | ST: qidiruv + trend + mavzular · MS: kirish banneri + plitkalar + muddatlar · MG: plitkalar + shaxsiy bloklar + sohalar, statistika yo'q | **Statista tartibi**, o'rtada my.gov.uz uslubidagi "Ommabop xizmatlar" plitkalari, kirgan foydalanuvchiga qisqa kabinet qatori (6.2) | Egasining qarori: bosh sahifa Statista uslubida |
| **Z-05** | Statistika bloklari | MG-05/MG-13: bosh sahifadan `/statistics` ga ko'chadi | **Bosh sahifada qoladi** (trend lenta ichida). `/statistics` faqat "Portal faoliyati" va to'liq "O'zbekiston raqamlarda" | OS-MG-08 endi kerak emas |
| **Z-06** | Ikki taksonomiya | ST: 12 **mavzu** (`/topics`) · MG: 14 **soha** (`/spheres`) | **Ikkalasi qoladi, vazifasi har xil:** mavzu = ma'lumot nima haqida (S zona), soha = qanday xizmat olish mumkin (G zona). Kesishgan 6 tasida `slug` bir xil va ikki tomonlama havola (6.4) | Bitta ro'yxatga siqilsa yo xizmatlar, yo ko'rsatkichlar yo'qoladi |
| **Z-07** | Asosiy birlik | ST: ko'rsatkich sahifasi · MG: xizmat pasporti | **Ikkalasi:** ko'rsatkich S zonada, pasport G zonada. Qidiruvda ikkalasi ham chiqadi | Har biri o'z zonasining markazi |
| **Z-08** | Kabinet | MG-12: ommaviy layout ichida, footer bilan · MS-03: alohida `AppShell`, footer yo'q, tashkilot almashtirgich | **MS-03** (`AppShell`) | Egasining qarori: kabinet my.soliq/my.mehnat uslubida |
| **Z-09** | Breadcrumb | ST va MS: bor · MG / U-01: olib tashlanadi | **Bor**, bosh sahifadan boshqa hamma joyda. Soha sahifasida breadcrumb va sidebar birga | 98% maqsadi yo'q, breadcrumb chuqur sahifalarda foydali |
| **Z-10** | Til prefiksli URL `/uz/...` | MG-02, S-4: ha (istisnolar bilan) | **Hozircha yo'q.** H13 ixtiyoriy qadam, alohida "ha" bilan (OS-H-04) | OneID callback, `?next=`, PWA, embed, `.ics` ga tegadi; hech bir uslub buni talab qilmaydi |
| **Z-11** | Footer | ST: 4 ustun · MG-09: 3 ustun + huquqiy qator | **MG-09** (3 ustun, 7.2), ichiga 1-etap rasmiy qatoridagi havolalar | Huquqiy sahifalar, sitemap, AI sahifasi MG-09 da to'liq |
| **Z-12** | Xizmat plitkasi / kartochkasi | MS: `ServiceTile` · MG: `PopularTiles`, `ServiceListItem` · TI-05 / XS: `ServiceCard` | **Bitta `ServiceCard`**, 3 ko'rinish: `tile`, `card`, `row` (4.3) | Ikki nusxa bo'lmasin |
| **Z-13** | Qidiruv natijalari tartibi | ST-07: ko'rsatkichlar birinchi · MG-08: xizmatlar (`#raqam`) birinchi | **So'rovga qarab:** `#302` yoki `302` → pasport; aks holda bo'limlar tartibi: Ko'rsatkichlar · Xizmatlar · Mavzular · Korxonalar · Savollar · Maqolalar (5.5) | Saytga kelganlarning ko'pi raqam izlaydi |
| **Z-14** | Tarif kartalari | ST-06: 4 karta · TI-11: 3 karta, "Eng yaxshi taklif" | **4 karta** (mavjud 4 paket), bittasida "Tavsiya etiladi", limitlar aniq raqam bilan, chizilgan narx va taymer yo'q | Paketlar soni 4 (`payment/` o'zgarmaydi) |
| **Z-15** | Tashqi savdo sahifalari uslubi | TI: "uslub my.gov.uz da qoladi" | **S zona** (`DataPage`) va TI komponentlari. Faqat `/service/301`, `/service/302` pasportlari G zonada | `/ex-trade` ma'lumot sahifasi, xizmat emas |
| **Z-16** | Hisobot kalendari vs e'lonlar kalendari | 1-etap bosh sahifada `CalendarReport` · ST: "Yaqin e'lonlar" | Bosh sahifada **"Yaqin e'lonlar"** (`/release-calendar`, ST). Hisobot topshirish muddatlari: `TopBar` havolasi (son bilan), kabinet bosh paneli, `/report-calendar` | Mehmonga e'lonlar, korxonaga muddatlar |
| **Z-17** | Tashkilot nomi | "Statistika qo'mitasi" (MG) · "Statistika agentligi" (CLAUDE_HISOBOT) | Hozirgi `Navbar.tsx` rasmiy qatorida qanday yozilgan bo'lsa (S-2 default), bitta i18n kalitida | Bir joyda o'zgartirish uchun |

---

## 3. Dizayn tokenlari

**Fayllar:** `frontend/src/theme/tokens.ts` (TS obyekt) va `frontend/src/theme/tokens.css` (CSS o'zgaruvchilar). UI kutubxona temasi (MUI bo'lsa `createTheme`, Tailwind bo'lsa `tailwind.config`) shulardan quriladi. Komponentlarda `#hex` yozilmaydi.

### 3.1. Ranglar

Kontrast qiymatlari WCAG formulasi bilan hisoblandi (2026-10-22). Eski MS qiymatlaridan uchtasi (success, warning, info matni) 4,5:1 dan past chiqqani uchun to'qroq qilindi.

| Token | Kunduzgi | Tungi | Qayerda | Kontrast (kunduzgi) |
|---|---|---|---|---|
| `--ds-ink` | `#08172C` | `#060E1C` | `TopBar`, footer foni | — |
| `--ds-brand` | `#0E2647` | `#0B1A33` | `PublicHeader`, hero, faol chip | oq matn 15,1:1 |
| `--ds-on-brand` | `#FFFFFF` | `#FFFFFF` | Brand fon ustidagi matn | — |
| `--ds-on-brand-muted` | `#C9D6EA` | `#B8C4D6` | Brand fon ustidagi ikkinchi matn | 10,3:1 |
| `--ds-primary` | `#1D5FBF` | `#5B8DEF` | Asosiy tugma, havola, faol menyu, grafikning asosiy seriyasi | oq fonda 6,1:1; tungi surface'da 5,2:1 |
| `--ds-primary-hover` | `#174CA8` | `#7AA4F3` | Hover, bosilgan | 8,0:1 |
| `--ds-primary-soft` | `#EEF4FE` | `#1B2A45` | Faol menyu foni, tanlangan qator | — |
| `--ds-on-primary` | `#FFFFFF` | `#0F1520` | Asosiy tugma matni | 6,1:1 / 5,7:1 |
| `--ds-accent` | `#F0A14A` | `#F0A14A` | CTA tugma **foni** (matni `--ds-text`), brand fondagi urg'u | `#18212F` matn bilan 7,6:1 |
| `--ds-accent-strong` | `#C07A2A` | `#F0A14A` | Grafikdagi oxirgi qiymat nuqtasi/ustuni (oq fonda) | 3,5:1 (grafik belgisi uchun ≥ 3:1) |
| `--ds-bg` | `#F4F6FA` | `#0F1520` | Sahifa foni | — |
| `--ds-surface` | `#FFFFFF` | `#161E2C` | Kartochka, jadval, sidebar | — |
| `--ds-border` | `#DDE3EB` | `#26324A` | Chegaralar, jadval chiziqlari | — |
| `--ds-text` | `#18212F` | `#E6EAF2` | Asosiy matn | tungi 13,9:1 |
| `--ds-text-muted` | `#4A5668` | `#9AA6BC` | Ikkinchi matn, manba yozuvi | 6,9:1 (bg) / 7,4:1 (surface) |
| `--ds-success` / `-bg` | `#18794A` / `#E8F6EE` | `#4CC38A` / `#12301F` | Qabul qilindi, to'landi, bepul | 4,9:1 |
| `--ds-warning` / `-bg` | `#8A5300` / `#FFF4E0` | `#F0B45A` / `#33250D` | Muddati yaqin, kutilmoqda | 5,8:1 |
| `--ds-danger` / `-bg` | `#C62828` / `#FDECEC` | `#F27070` / `#3A1616` | Muddati o'tgan, rad etildi, qarz | 4,9:1 |
| `--ds-info` / `-bg` | `#0A5FB4` / `#E7F1FB` | `#6AA8F0` / `#122A44` | Yuborildi, ko'rib chiqilmoqda | 5,6:1 |
| `--ds-new` | `#D32F2F` | `#F27070` | "Yangi" belgisi | 5,0:1 |
| `--ds-focus` | `#1D5FBF` | `#7AA4F3` | Fokus halqasi | — |

Tungi ustunidagi holat ranglari yangi taklif, MS-01 / H1 da axe bilan tekshiriladi.

**Ma'lumot ranglari** (grafik seriyalari, xarita shkalasi): xarita palitralari (`ChoroplethMap`, bivariant) tokenga **o'tkazilmaydi** (MYGOV_JORIY_ETISH 2A qoidasi). Tokenga faqat quyidagilar o'tadi:

| Token | Kunduzgi | Qayerda |
|---|---|---|
| `--ds-series-1` | `= --ds-primary` | Asosiy seriya |
| `--ds-series-highlight` | `= --ds-accent-strong` | Oxirgi qiymat, tanlangan nuqta |
| `--ds-series-export` | `#1D5FBF` | Eksport (TI-02, hamma savdo grafiklarida) |
| `--ds-series-import` | `#C07A2A` | Import |
| `--ds-series-total` | `#6B7A90` | Aylanma (neytral) |
| `--ds-chart-grid`, `--ds-chart-axis`, `--ds-chart-tooltip-bg` | `--ds-border`, `--ds-text-muted`, `--ds-surface` | Grafik "chrome"i |

Ko'k va to'q sariq juftligi rang ko'rmaslikda ham farqlanadi. Grafikda faqat rangga tayanilmaydi: izoh (legend) va ▲/▼ belgilar matn bilan.

### 3.2. Shrift va matn o'lchamlari

Shrift: **Inter** (variable), `font-feature-settings: "tnum"` raqamli kataklarda.

| Token | O'lcham / qator / qalinlik | Qayerda |
|---|---|---|
| `--ds-font-display` | 40 / 48 / 700 (mobil 28 / 36) | Faqat bosh sahifa hero H1 (birinchi so'z qalin, qolgani 500) |
| `--ds-font-h1` | 28 / 36 / 600 (kabinetda 24 / 32) | Sahifa sarlavhasi |
| `--ds-font-h2` | 20 / 28 / 600 | Bo'lim sarlavhasi |
| `--ds-font-h3` | 16 / 24 / 600 | Kartochka sarlavhasi |
| `--ds-font-body-lg` | 16 / 24 / 400 | Ommaviy sahifalar matni |
| `--ds-font-body` | 14 / 22 / 400 | Kabinet matni, jadval |
| `--ds-font-small` | 12 / 16 / 500 | Belgi, manba yozuvi, jadval sarlavhasi |
| `--ds-font-kpi` | 28 / 32 / 700, `tabular-nums` | `StatCard`, ko'rsatkichning so'nggi qiymati |

### 3.3. O'lchamlar

| Token | Qiymat |
|---|---|
| Bo'sh joy | 4, 8, 12, 16, 20, 24, 32, 40, 48 px (`--ds-space-1..9`) |
| Radius | 6 (input, tugma), 10 (kartochka), 999 (chip, belgi) |
| Soya | `0 1px 2px rgba(16,24,40,.06)` kartochka; `0 8px 24px rgba(16,24,40,.12)` ochiluvchi oyna. Ommaviy kartochkalarda soya o'rniga chegara (ST 2.3) |
| Kontent kengligi | ommaviy: 1200 px; kabinet: to'liq, ichki `max-width: 1440px` |
| Breakpoint | 360, 768, 1024, 1280, 1440 |
| Balandliklar | `TopBar` 36 px · `PublicHeader` 64 px · kabinet `TopHeader` 64 px · sidebar 264 px (yig'ilganda 72 px) |
| Tugma | 40 (oddiy), 32 (jadval ichida), 48 (mobil asosiy) |
| Fokus halqasi | 2 px `--ds-focus` + 2 px oq oraliq |

### 3.4. Zichlik (zonaga qarab)

Bitta token to'plami, lekin `data-density` atributi bilan ikki rejim: `comfortable` (S va G zona: `body-lg`, kartochka ichida 24 px) va `compact` (M zona: `body`, 16 px, jadval qatori 44 px). Layout o'zi qo'yadi, komponent ichida shart yozilmaydi.

### 3.5. Matn uslubi

- Qisqa, rasmiy, ikkinchi shaxsda: "Hisobotlaringiz", "Sizdan harakat kerak".
- Tugma = fe'l ("Ariza yuborish", "Yuklab olish"), menyu bandi = ot ("Shartnomalar"), plitka nomi = 1–3 so'z, fe'lsiz ("Kontragent kartasi").
- Raqamlar to'liq, bo'shliq bilan (`7 525 717`), o'nlik vergul bilan (`2,85`).
- Ko'rsatkich sarlavhasi: "nima, qayerda, qachon" ("Iste'mol narxlari indeksi, O'zbekiston, 2017–2025").

---

## 4. Komponentlar

Papkalar: `frontend/src/components/ds/` (umumiy), `components/data/` (S zona), `components/catalog/` (G zona), `components/cabinet/` (M zona), `components/home/`, `components/externalTrade/`. Konfiguratsiya: `frontend/src/config/`. Loyihada U-01 komponentlari (`StatCard`, `EmptyState` va h.k.) bor bo'lsa, ular shu yerga ko'chiriladi yoki qayta eksport qilinadi, ikkinchi nusxa yaratilmaydi.

### 4.1. Umumiy (`components/ds/`)

| Komponent | Vazifasi | Manba | Zona |
|---|---|---|---|
| `SkipLink` | "Asosiy kontentga o'tish" | MG-02 | hamma |
| `TestModeBar` | "Test rejimi" xabari, production'gacha | 1-etap | S, G, M |
| `TopBar` | Rasmiy qator (7.1) | 1-etap + MG-03 | S, G |
| `PublicHeader` + `MegaMenu` + `MobileMenu` | Ommaviy header, menyu bosish bilan ochiladi | MS-05, ST 4.1 | S, G |
| `LanguageSwitcher` | O'zbekcha · Ўзбекча · Русский | MG-03 | hamma |
| `UserMenu` | Kabinet · Hisobotlarim/Savollarim · Xabarnomalar · Chiqish, `Escape` | 1-etap mantiqi | hamma |
| `NotificationBell` | Son belgisi, `NotificationPanel` ochadi | MS-10, U-03 | hamma |
| `GlobalSearch` | Mavjud `Ctrl+K` oynasi, `open-global-search` hodisasi | U-10 | hamma |
| `PageHeader` | Breadcrumb · H1 · qisqa izoh · o'ngda amallar | MS 3.3 | hamma |
| `Breadcrumbs` | `nav aria-label` | MS 3.3 | hamma (bosh sahifadan tashqari) |
| `Footer` | 3 ustun + pastki qator (7.2) | MG-09 | S, G |
| `PageFeedback` | "Sahifadagi kontent sizga ma'qul keldimi?" + `Ctrl+Enter` | MG-11 | S, G |
| `Button`, `Chip`, `SegmentedControl`, `Tabs`, `Dialog`, `Drawer`, `Tooltip` | Asosiy elementlar (UI kutubxonada bor bo'lsa, faqat tema) | — | hamma |
| `StatusBadge` | 3.4 lug'atidan rang va matn | MS 3.4 | G, M |
| `AccessBadge` | "Bepul" · "Kirish kerak" · "Paket" · "Alohida narx" · "Tez orada" | MG-06, TI-05, ST-04 | hamma |
| `SampleBadge` | "Namuna" | S-09 | hamma |
| `SourceNote` | "Manba: … · Davr: … · Yangilangan: …". Har raqam ostida | ST 4.2, TI-03 | S, G, M |
| `StatCard` | Sarlavha, katta raqam, izoh, holat, havola. Ma'lumot yo'q bo'lsa ko'rsatilmaydi | MS 3.3 | S, M |
| `EmptyState`, `ErrorState`, `Skeleton` | Holatlar | U-01 | hamma |
| `LimitDialog` | Limit tugadi | XS-02 | hamma |
| `HelpLink` | "Yo'riqnoma" va Stat AI | MS 3.3 | M, G |

### 4.2. S zona (`components/data/`)

| Komponent | Vazifasi | Manba |
|---|---|---|
| `HeroSearch` | Katta qidiruv maydoni, ostida "Ommabop" chiplar. `GlobalSearch` ni ochadi, alohida qidiruv mantiqi yo'q | ST-02 |
| `IndicatorCard` | Trend lenta kartochkasi: mini grafik, sana · mavzu, sarlavha, 1–2 jumla, "Ko'rsatkichni ochish →" | ST-03 |
| `ChartCard` | "Grafik / Jadval" tablari, "Ustun / Chiziq" tanlovi, oxirgi qiymat `--ds-series-highlight`, ostida `SourceNote` | ST-04 |
| `ToolRail` | Vertikal asboblar: sevimli, yuklab olish, iqtibos, ulashish/embed, Stat AI. Ichida mavjud `ShareBar` mantiqi (`orientation="vertical"` prop) | ST-04 |
| `DownloadPanel` | CSV, PNG bepul; XLSX kirish bilan; PDF paket limiti. Cheklov tugma yonida yoziladi | ST-04 |
| `MetaBlock` | "Manba va metodologiya" (ochiladigan): manba, nashr sanasi, hudud, davriylik, keyingi yangilanish | ST-04 |
| `RelatedList` | Bog'liq ko'rsatkichlar | ST-04 |
| `TopicTile` | Mavzu plitkasi (nom + ko'rsatkichlar soni) | ST-05 |
| `ReleaseList` | Yaqin e'lonlar (4 ta sana kartochkasi) | ST-03 |
| `KpiStrip` | Raqamlar qatori (masalan savdo: yozuvlar, HS, davlatlar, davr) + `SourceNote` | TI-03 |
| `FlowToggle` | Eksport · Import · Aylanma, `?flow=`, `role="radiogroup"` | TI-02 |
| `TradeSearch` | Mahsulot, HS yoki davlat qidiruvi, guruhlangan takliflar | TI-01 |
| `ResultCard` | Davlat yoki korxona natija qatori | TI-08 |
| Xaritalar (`ChoroplethMap`, `RegionBubbleMap`) | O'zgarmaydi, faqat chrome tokenlarga | 1-etap |

### 4.3. G zona (`components/catalog/`)

| Komponent | Vazifasi | Manba |
|---|---|---|
| `ServiceCard` | **Yagona xizmat komponenti**, `variant`: `tile` (ikonka + nom + `#raqam` + "Yangi"; bosh sahifa va kabinet tezkor amallari), `card` (bir jumla + prevyu + `AccessBadge`; soha sahifasi tepasi, TI-05), `row` (ro'yxat qatori: `#raqam`, nom, tavsif, kim uchun, kirish sharti, bajarish vaqti) | MS `ServiceTile`, MG `PopularTiles`/`ServiceListItem`, TI-05 |
| `TileRow` | Gorizontal skroll qatori (sudrash, o'q tugmalari) | MG-05 |
| `SphereCard` | Ikonka, nom, 2 ta featured xizmat, "Barchasi" | MG-05 |
| `SphereSidebar` | 14 soha, joriysi ajratilgan; mobilda chiplar | MG-06 |
| `CatalogFilters` | Foydalanuvchi turi · Narx, URL'da (`?user=legal&price=free`) | MG-06 |
| `ServiceSummary` | Bajarish vaqti · necha marta foydalanilgan · reyting · "Tanlanganlarga qo'shish" · asosiy tugma | MG-07 |
| `InfoSection` | Ikonkali ma'lumot kartochkasi (narx, huquqiy asos, muddat, hujjatlar, foydalanuvchilar, aloqa, mas'ul bo'linma; TI-04 "Ma'lumot haqida") | MG-07, TI-04 |
| `HowItWorks` | 2–4 raqamlangan qadam | MG-07 |
| `ServiceStats`, `ServiceRatings` | Foydalanish soni va baholar | MG-07, MG-10 |
| `FaqList` | Xizmat savol-javobi | TI-12 |
| `PassportBackLink` | Ish sahifasi tepasida "← #302 Bozor tahlili haqida" | MG-07.2 |

### 4.4. M zona (`components/cabinet/`)

`AppShell`, `Sidebar`, `TopHeader`, `OrgSwitcher`, `OrgPickerPage`, `LoginPage`, `AlertStrip`, `DataTable`, `FilterBar`, `Stepper`, `Timeline`, `NotificationPanel`, `Inbox`, `SignDialog` (faqat mavjud ERI imzo integratsiyasi bo'lsa). Tafsiloti: [MEHNAT_SOLIQ_DIZAYN.md 3.3](MEHNAT_SOLIQ_DIZAYN.md). Bitta farq: ular `components/ms/` emas, `components/cabinet/` (layout) va `components/ds/` (`DataTable`, `FilterBar`, `Stepper`, `Timeline`, chunki G zonada ham ishlatiladi) papkalarida.

### 4.5. Holatlar lug'ati

`frontend/src/config/statusDictionary.ts`: [MEHNAT_SOLIQ_DIZAYN.md 3.4](MEHNAT_SOLIQ_DIZAYN.md) jadvali o'zgarishsiz (`draft`, `submitted`, `in_review`, `needs_action`, `approved`, `rejected`, `cancelled`, `paid`, `unpaid`, `due_soon`, `overdue`, `active`, `expired`). Backend holatlari frontendda `mapStatus()` bilan moslanadi, backend modeli o'zgarmaydi.

### 4.6. Konfiguratsiya fayllari

| Fayl | Nima | Manba |
|---|---|---|
| `config/serviceCatalog.ts` | Xizmatlar katalogi (`#101..#1404`), `status`, `actionType`, `popularOrder`, `featuredInSphere` | MG-04, [MYGOV_JORIY_ETISH 4.1](MYGOV_JORIY_ETISH.md) |
| `config/spheres.ts` | 14 soha | MG-04 |
| `config/topics.ts` | 12 mavzu, har birida `slug`, ko'rsatkich kalitlari, `dashboardSlug?`, `sphereId?` | ST-05, Z-06 |
| `config/publicMenu.ts` | Header menyusi (7.1), katalog va mavzulardan quriladi | MS-05 |
| `config/cabinetMenu.ts`, `config/staffMenu.ts` | Kabinet menyusi (7.3) | MS 5.1 |
| `config/statusDictionary.ts` | 4.5 | MS 3.4 |

Menyu, bosh sahifa, soha sahifasi, qidiruv va sitemap faqat shu fayllardan o'qiydi. Takroriy ro'yxat yo'q.

---

## 5. Layoutlar va sahifa qoliplari

### 5.1. Ikki layout

```
PublicLayout (S va G zona)                    CabinetLayout (M zona)
┌────────────────────────────────────────┐    ┌────────┬───────────────────────────────┐
│ SkipLink · TestModeBar                 │    │ Logo   │ TopHeader: ☰ · qidiruv ·       │
│ TopBar (ink): agentlik · Hisobot       │    │        │ tashkilot ▾ · 🔔 · til · 👤    │
│   kalendari (3) · ☎ · Qayta aloqa · til│    │ Side-  ├───────────────────────────────┤
│ PublicHeader (brand): logo · 5 bandli  │    │ bar    │ PageHeader (breadcrumb, H1,   │
│   menyu · qidiruv · [Kirish]/[Kabinet] │    │ (guruh │   amallar, HelpLink)          │
├────────────────────────────────────────┤    │ lar,   │ AlertStrip                    │
│ <main id="main">  ← qolip shu yerda    │    │ son    │ <main> kontent (compact)      │
│ PageFeedback                           │    │ belgi) │                               │
│ Footer (ink)                           │    │        │ yordam · versiya              │
└────────────────────────────────────────┘    └────────┴───────────────────────────────┘
```

- `/embed/indicator/:key` hech qaysi layoutsiz (`Shell`), faqat tokenlar.
- Stat AI va operator chat suzuvchi tugmalari ikkala layoutda qoladi (S-8).
- Mobil (< 1024): kabinetda sidebar `Drawer`; ommaviyda menyu `MobileMenu` (sohalar va mavzular ro'yxati ichida).

### 5.2. `DataPage` qolipi (S zona)

Breadcrumb → mavzu belgisi → H1 (nima, qayerda, qachon) → birlik izohi → **asosiy blok** (chapda `ChartCard` + o'ngda `ToolRail`; yoki xarita; yoki panel) → `DownloadPanel`/iqtibos/ulashish paneli (asbob bosilganda) → tavsif → `MetaBlock` → o'ng ustun (so'nggi qiymat `StatCard`, `RelatedList`, mavzu paneli havolasi, Stat AI savol maydoni) → "Shu mavzudagi boshqa ko'rsatkichlar". Mobilda o'ng ustun va `ToolRail` pastga tushadi, jadval gorizontal skroll qiladi. Tafsilot: [STATISTA_DIZAYN.md 4.2](STATISTA_DIZAYN.md) va maket.

Xizmat ish sahifalari (`/check`, `/market-report`, `/partners`, `/orginfo`, `/company/:stir`) ham shu qolipda: tepasida `PassportBackLink`, natijalar `ResultCard` bilan.

### 5.3. `CatalogPage` qolipi (G zona)

Breadcrumb → H1 (soha nomi) → chapda `SphereSidebar`, o'ngda `CatalogFilters` va kichik toifalar bo'yicha `ServiceCard variant="row"` ro'yxati (Tashqi savdo va Biznes tahlili sohalarida tepada `variant="card"` modul kartalari, TI-05). Tafsilot: [MYGOV_DIZAYN.md MG-06](MYGOV_DIZAYN.md).

### 5.4. `ServicePage` qolipi (G zona, `/service/:number`)

H1 → `ServiceSummary` → `InfoSection` lar (narx · huquqiy asos · muddat · hujjatlar · foydalanuvchilar · aloqa · mas'ul bo'linma; savdo xizmatlarida "Ma'lumot haqida") → `HowItWorks` → `FaqList` (bor bo'lsa) → `ServiceStats` → `ServiceRatings`. Tafsilot: [MYGOV_DIZAYN.md 1.7 va MG-07](MYGOV_DIZAYN.md). Farqi: breadcrumb bor (Z-09).

### 5.5. `/search` sahifasi (G zona)

H1 "Izlash" → qidiruv maydoni → filtr (soha, foydalanuvchi turi, narx) → bo'limlar: **Ko'rsatkichlar** (`/indicators/:key`) · **Xizmatlar** (`#raqam`, nom, bajarish vaqti) · Mavzular · Korxonalar (`company-card/search/`, telefonsiz) · Ko'p beriladigan savollar · Maqolalar (`/learn`). Har bo'limda "Barchasini ko'rish". `#302` yoki faqat `302` → to'g'ridan-to'g'ri pasport. `Ctrl+K` oynasi xuddi shu tartibda guruhlaydi.

### 5.6. `InfoPage` qolipi (G zona)

Ma'lumot, yordam va huquqiy sahifalar: breadcrumb → H1 → matn (`body-lg`, 720 px kenglik) → o'ngda "Bu bo'limda" havolalar. Hisobot topshiruvchilar sahifalari (`/reports`, `/reglaments`, `/stat-codes`) ham shu qolipda, jadvallari `DataTable` bilan.

---

## 6. Sahifalar xaritasi

### 6.1. Hamma sahifa qaysi zonada

"Hozir" ustuni [DIZAYN_HOZIRGI_HOLAT.md 2-bo'lim](DIZAYN_HOZIRGI_HOLAT.md) dan. ✚ = yangi sahifa.

| Sahifa | Zona | Qolip | Qadam | Izoh |
|---|---|---|---|---|
| `/` bosh sahifa | S | o'ziniki (6.2) | H10 | |
| ✚ `/indicators/:key` | S | `DataPage` | H5 | Asosiy birlik |
| ✚ `/topics`, `/topics/:slug` | S | `DataPage` (mavzu varianti) | H8 | 6.4 |
| `/dashboards/:slug` | S | `DataPage` (panel) | H8 | Mavzu sahifasidan "To'liq panel" |
| `/statistics` | S | `DataPage` | H8 | "O'zbekiston raqamlarda" (to'liq) + "Portal faoliyati" (S-15) |
| `/regions`, `/regions/:id` | S | `DataPage` (xarita) | H12 | Xaritalar o'zgarmaydi |
| `/ex-trade`, `/trade-flows` | S | `DataPage` + TI | H6 | [TRADEINT_DIZAYN.md 5](TRADEINT_DIZAYN.md) |
| `/market-report` | S | `DataPage` + TI | H6 | Xizmat ish sahifasi, `PassportBackLink` #302 |
| `/demographics`, `/cpi-calculator`, `/prices`, `/names`, `/my-salary` | S | `DataPage` | H12 | ⛔ bo'lganlari production'da yashirin (S-6) |
| `/release-calendar` | S | `DataPage` | H12 | |
| `/developers`, `/stat-codes` | S | `DataPage` | H12 | |
| `/learn`, `/glossary`, `/statistical-classifications`, `/methodology/*` | S | `DataPage` / `InfoPage` | H12 | Matnli bo'lsa `InfoPage` |
| `/check`, `/orginfo`, `/organizations`, `/industry`, `/partners`, `/company/:stir` | S | `DataPage` + `ResultCard` | H6, H12 | `PassportBackLink` |
| `/tariffs`, `/tariff/:id`, `/services` | S | `DataPage` (tariflar) | H10 | 4 karta (Z-14). `/services` CLS 0,30 shu yerda tuzatiladi |
| ✚ `/spheres`, `/spheres/:id` | G | `CatalogPage` | H7 | `/all-services` → `/spheres` redirect |
| ✚ `/service/:number` | G | `ServicePage` | H7 | Katalogdagi har `live` xizmat |
| ✚ `/search` | G | 5.5 | H9 | |
| `/report-calendar`, `/reports`, `/reglaments` | G | `InfoPage` + `DataTable` | H12 | Hisobot topshiruvchilarga |
| `/citizens`, `/surveys`, `/answers`, `/questions` | G | `InfoPage` | H12 | |
| `/consultation` | G | `ServicePage` ish sahifasi | H12 | ⛔ production'da "Tez orada" |
| `/books`, `/book-order/map` | G | `CatalogPage` (do'kon varianti) | H12 | `BookStore.tsx` faqat tokenlar, refaktor yo'q |
| `/about`, `/contact` | G | `InfoPage` | H9 | |
| ✚ `/privacy`, `/terms`, `/ai-usage`, `/sitemap` | G | `InfoPage` | H9 | Namuna matn belgisi (OS-H-17) |
| `/login` | M | `LoginPage` (layoutsiz, markazda kartochka) | H3 | |
| ✚ `/cabinet/select-org` | M | `OrgPickerPage` | H3 | Bitta profil bo'lsa ko'rinmaydi |
| `/cabinet/*` (18 bo'lim) | M | `AppShell` | H3, H4 | 7.3 |
| Xodim, menejer, konsultant sahifalari | M | `AppShell` (`staffMenu.ts`) | H3 | Django admin o'zgarmaydi |
| `/embed/indicator/:key` | — | layoutsiz | H5 | Tokenlarga o'tadi |
| 404 | G | `InfoPage` | H9 | Qidiruv maydoni bilan |

### 6.2. Bosh sahifa `/` (S zona)

| # | Blok | Komponent | Hozirgi komponent (qayta ishlatiladi) |
|---|---|---|---|
| 0 | `TopBar`, `PublicHeader` | ds | `Navbar.tsx` o'rnini bosadi |
| 1 | **Hero:** H1 "**Ishonchli** statistika: O'zbekiston raqamlarda, bitta qidiruvda", katta qidiruv, 8 ta "Ommabop" chip (4 ko'rsatkich + 4 xizmat), yonida jonli aholi soni | `HeroSearch`, `StatCard` | `Banner.tsx` qidiruvi va aholi soni |
| 2 | Kirgan foydalanuvchiga: **"Kabinetingiz" qatori** (2 ta `StatCard`: muddati yaqin hisobotlar / javob kelgan savollar, o'qilmagan xabarnomalar + "Kabinetga o'tish"). Mehmonga ko'rinmaydi | `StatCard` | MS 4.2 (1-blok o'ng qismi) |
| 3 | **Manbalar qatori:** Statistika agentligi/qo'mitasi, SIAT, ochiq ma'lumotlar, bojxona + "[N] ko'rsatkich" (haqiqiy son) | `SourceNote` uslubi | — |
| 4 | **Trend ko'rsatkichlar:** mavzu chiplari (`?topic=`), 6 ta `IndicatorCard` (birinchisi aholi soati), "Barcha ko'rsatkichlar →" | `IndicatorCard` | `HomeHighlights.tsx` kartochkalari va grafiklari |
| 5 | **Yaqin e'lonlar** (4 ta) + "E'lonlar kalendari →" | `ReleaseList` | `HomeHighlights.tsx` e'lonlar qismi |
| 6 | **Mavzular** (12 plitka) | `TopicTile` | — |
| 7 | **Ommabop xizmatlar** (12 plitka, my.gov.uz uslubi, [MYGOV_JORIY_ETISH 4.2](MYGOV_JORIY_ETISH.md) ro'yxati) + "Barcha xizmatlar → `/spheres`" | `TileRow` + `ServiceCard tile` | `Interactive.tsx` ikonka moslamasi |
| 8 | **Tariflar** (4 karta, bittasi "Tavsiya etiladi") | tarif kartasi | `TariffComponent.tsx` (`price_range`) |
| 9 | **Nega my.stat.uz** (3 afzallik: rasmiy manba, uch tilda, konsultant yordami) | — | — |
| 10 | `PageFeedback`, `Footer` | ds | — |

Bosh sahifadan chiqadiganlar: "Portal faoliyati" → `/statistics`; `CalendarReport` (hisobot muddatlari) → `TopBar` havolasi va kabinet; tashqi savdo bloki → trend lentadagi bitta kartochka + `/ex-trade`; ochiq ma'lumotlar qatori → "Mavzular" ostidagi bitta havola qatori. Hech bir komponent o'chirilmaydi, faqat joyi o'zgaradi.

**Tezlik:** 1–3 bloklar birinchi so'rovda; 4–5 grafiklari ko'rinish zonasiga kirganda (lazy); 6–7 statik konfiguratsiyadan. Maqsad: CLS ≤ 0,1, mobil LCP ≤ 4 s (hozir 5–8 s; bajarilmasa qadamni to'xtatmaydi, raqam PR'da).

### 6.3. Kabinet bosh paneli `/cabinet` (M zona)

[MEHNAT_SOLIQ_DIZAYN.md 5.2](MEHNAT_SOLIQ_DIZAYN.md) o'zgarishsiz: `AlertStrip` → 4 ta `StatCard` (muddati yaqin hisobotlar, faol paket va qolgan limit, ochiq arizalar, StatCoin balansi) → yaqin hisobotlar jadvali + xabarnomalar → tezkor amallar (`ServiceCard tile`, 6 ta) → oxirgi arizalar. Jismoniy shaxs uchun ham 5.2 dagi variant.

### 6.4. Mavzular va sohalar bog'lanishi (Z-06)

| Mavzu (`/topics/:slug`, S) | Soha (`/spheres/:id`, G) | Umumiy `slug` |
|---|---|---|
| Aholi | 6 · Aholi va demografiya | `population` |
| Narxlar va inflyatsiya | 5 · Narxlar va inflyatsiya | `prices` |
| Mehnat | 7 · Mehnat va ish haqi | `labour` |
| Tashqi savdo | 3 · Tashqi savdo | `trade` |
| Sanoat | 9 · Sanoat | `industry` |
| Hududlar | 8 · Hududlar | `regions` |
| Milliy hisoblar, Qishloq xo'jaligi, Qurilish, Savdo va xizmatlar, Korxonalar, Ta'lim va sog'liq | — (bog'langan soha yo'q; "Korxonalar" mavzusi 1-sohaga havola beradi) | o'ziniki |
| — | 1, 2, 4, 10, 11, 12, 13, 14 (xizmat sohalari) | o'ziniki |

Qoida: mavzu sahifasining pastida "Shu mavzudagi xizmatlar" (katalogdan, `sphereId` bo'yicha); soha sahifasining tepasida "Shu mavzudagi ko'rsatkichlar →" havolasi. 12 mavzu ro'yxati OS-H-09.

---

## 7. Navigatsiya

### 7.1. `TopBar` va `PublicHeader`

**`TopBar`** (to'q `--ds-ink`, chapdan o'ngga): agentlik nomi (Z-17) · "Hisobot kalendari" (kirgan yuridik shaxsga muddati yaqin hisobotlar soni bilan) · ishonch telefoni (`tel:`, OS-H-06) · "Qayta aloqa" (`/contact`) · `LanguageSwitcher`. Mobilda `MobileMenu` ichiga.

**`PublicHeader`** (`--ds-brand`): logo + qisqa nom · menyu · qidiruv ikonkasi (`Ctrl+K`) · "Kirish" (kirgan bo'lsa 🔔 + "Kabinet" + `UserMenu`). "Ro'yxatdan o'tish" tugmasi `--ds-accent` fonda.

| Menyu bandi | Ochiluvchi panel (2 ustun) | 1-etapdagi band |
|---|---|---|
| **Statistika** | Mavzular (12) · Barcha ko'rsatkichlar · Panellar · Hududlar xaritasi · Tashqi savdo · E'lonlar kalendari · Ochiq API · Statistika (`/statistics`) | Ko'rsatkichlar, Hududlar |
| **Xizmatlar** | Sohalar (14) · Ommabop 6 xizmat · "Barcha xizmatlar →" | Xizmatlar, Korxonalar |
| **Hisobot topshiruvchilarga** | Hisobot kalendari · Shakllar · Reglamentlar · Statistik kodlar · Kontragent kartasi · Tariflar · "Kabinetga kirish" | (yangi guruh) |
| **Fuqarolarga** | Fuqarolar markazi · Statistika oddiy tilda · ISN kalkulyatori · So'rovnomalar · Savol bering | Fuqarolar uchun |
| **Yordam** | Ko'p beriladigan savollar · Aloqa · Yo'riqnomalar · Stat AI | Savol-javob, Aloqa |

Panel **bosish** bilan ochiladi (hover emas): `Enter`/`Space`, strelkalar, `Escape`. Bandlar `publicMenu.ts` dan, ular esa `topics.ts`, `spheres.ts`, `serviceCatalog.ts` dan quriladi.

### 7.2. `Footer`

[MYGOV_DIZAYN.md 2.2](MYGOV_DIZAYN.md) dagi 3 ustun (Ma'lumot · Foydalanuvchilar uchun · Aloqa va qo'llab-quvvatlash) + pastki qator (ijtimoiy tarmoqlar · Maxfiylik siyosati · Foydalanish shartlari · Portal xaritasi · Sun'iy intellektdan foydalanish · stat.uz). 1-etap rasmiy qatoridagi havolalar (Portal haqida, Reglamentlar, Portal statistikasi, stat.uz, SIAT) "Ma'lumot" ustuniga. Mobilda ustunlar accordion.

### 7.3. Kabinet menyusi

[MEHNAT_SOLIQ_DIZAYN.md 5.1](MEHNAT_SOLIQ_DIZAYN.md) jadvali o'zgarishsiz: yuridik shaxs uchun 7 guruh (Hisobotlar · Xizmatlar · Tahlil · Moliya · Korxona · Murojaatlar · Ma'lumotlar), jismoniy shaxs uchun qisqa variant, xodimlar uchun `staffMenu.ts`. 18 bo'limning hammasi saqlanadi, mavjud URL'lar asosiy qoladi (yangi yo'l keyinroq, redirect bilan). Production'da ⛔ bandlar ko'rinmaydi.

---

## 8. Kod etaplari

### 8.0. Hamma qadam uchun qoidalar

1. Sessiya boshida `CLAUDE_HISOBOT.md` ni o'qing. Branch: `task/H<raqam>-<qisqa-nom>` (masalan `task/H1-tokens`). Har qadam alohida PR. Bitta qadam tugamasdan keyingisiga o'tilmaydi.
2. Mavjud funksiya o'zgarmaydi: faqat layout, navigatsiya, uslub. Ustun ma'lumoti API'da bo'lmasa, ustun ko'rsatilmaydi, yangi backend maydon qo'shilmaydi (PR'da yoziladi). Istisno: H5, H7 da aniq yozilgan endpoint'lar.
3. "(aniqlash kerak)" fayl yo'llari mavjud koddan topiladi. Topilmasa, PR tavsifida yoziladi, parallel tuzilma yaratilmaydi.
4. Bayroqlar `.env` da: `VITE_CABINET_V2` (H3 dan), `VITE_PUBLIC_V2` (H10 dan). Default `true` faqat qadam qabul qilingandan keyin. Bayroqlar H12 da olib tashlanadi.
5. Har qadam oxirida: 9.1 dagi buyruqlar, 9.2 dagi qo'lda tekshiruv, PR'da 360/768/1280 skrinshotlari (demo foydalanuvchi, shaxsiy ma'lumotsiz), `CLAUDE_HISOBOT.md` 7-bo'lim jurnaliga yozuv.

### 8.1. Tartib (yig'ma)

| Qadam | Nima | Eski vazifalar | Foydalanuvchiga ko'rinadimi | Bog'liq |
|---|---|---|---|---|
| **H0** | 1-etapni commit + `dizayn-1-etap` tegi | MYGOV_JORIY 0-qadam | Yo'q | — |
| **H1** | Tokenlar, shrift, tema | ST-01, MS-01, MG-01 (+ ixtiyoriy MS-00/MG-00) | Ozgina (rang, shrift) | H0 |
| **H2** | Umumiy komponentlar va UiKit | MS-02, U-01 | Yo'q (dev sahifa) | H1 |
| **H3** | Kabinet karkasi, kirish, tashkilot tanlash | MS-03, MS-04 | **Ha, kabinet** (bayroq bilan) | H2 |
| **H4** | Kabinet ichi: bosh panel, jadvallar, bosqichli arizalar | MS-07, MS-08, MS-09 | Ha, kabinet | H3 |
| **H5** | Ko'rsatkich sahifasi `/indicators/:key` | ST-04 | Ha, yangi sahifa | H2 |
| **H6** | Tashqi savdo va korxona sahifalari | TI-01..03, TI-06..09 | Ha | H2 (H5 qolipi) |
| **H7** | Katalog, sohalar, xizmat pasporti, baholar | MG-04, MG-06, MG-07, MG-10, TI-04, TI-05, TI-12 | Ha, yangi sahifalar | H2 |
| **H8** | Mavzular, panellar, `/statistics` | ST-05, MG-13 | Ha | H5, H7 |
| **H9** | `/search`, footer, fikr vidjeti, huquqiy sahifalar | MG-08, ST-07, MG-09, MG-11 | Ha | H5, H7 |
| **H10** | Ommaviy layout, header, bosh sahifa, tariflar | MS-05, MG-02 (prefikssiz), ST-02, ST-03, ST-06, TI-11 | **Ha, asosiy o'zgarish** (bayroq bilan) | H5..H9 |
| **H11** | Xabarnomalar paneli, murojaatlar, obunalar, mobil va a11y | MS-10, TI-10, MS-11, MG-14 | Ha | H4, H10 |
| **H12** | Qolgan sahifalar, bayroqlarni olib tashlash, yakuniy tekshiruv | MS-12, MG-15 (98% siz) | Ha | H11 |
| **H13** | *(ixtiyoriy)* Til prefiksli URL | MG-02.3, S-4 | Ha (URL'lar) | OS-H-04 "ha" |

**Nega shu tartib:** H3–H4 (kabinet) ommaviy qismga bog'liq emas va H2 komponentlarini darhol real sahifada sinaydi. H5–H9 faqat **yangi** sahifalar qo'shadi, eski menyu va bosh sahifa hali o'z joyida. H10 da header va bosh sahifa almashganda, menyudagi har band (mavzular, sohalar, pasportlar, qidiruv) allaqachon ishlaydi, shuning uchun sayt hech bir qadamda yarim tayyor ko'rinmaydi. H5..H9 o'zaro parallel bo'lishi mumkin, lekin bitta PR'da birlashtirilmaydi.

---

### H0 · 1-etapni saqlash

- **Fayllar:** yo'q (faqat git).
- **Qadamlar:** `git status` → 2026-10-20 dagi commit qilinmagan o'zgarishlar bitta commit: `Dizayn 1-etap: Navbar, bosh sahifa, xaritalar, kartochkalar`. Testlar (9.1) yashil bo'lsa `git tag dizayn-1-etap`. Qizil bo'lsa, H1 boshlanmaydi, sababi yoziladi.
- **Tekshiruv:** `git status` toza, teg bor.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H0 ni bajar. CLAUDE_HISOBOT.md ni o'qi.
Commit qilinmagan 1-etap dizayn o'zgarishlarini bitta commit qil, 9.1 dagi testlarni o'tkaz,
yashil bo'lsa dizayn-1-etap tegini qo'y. Natijani qisqa yoz, H1 ga o'zing o'tma.
```

### H1 · Tokenlar va tema

- **Fayllar:** ✚ `frontend/src/theme/tokens.ts`, ✚ `frontend/src/theme/tokens.css` (yoki mavjud global CSS ichida), ✎ `ThemeContext` fayli (aniqlash kerak), ✎ UI kutubxona temasi (aniqlash kerak), ✎ `package.json` (`@fontsource-variable/inter`), ✎ 1-etap komponentlari: `Navbar.tsx`, `Banner.tsx`, `HomeHighlights.tsx`, `Interactive.tsx`, `TariffComponent.tsx`, `CalendarReport.tsx`, `ShareBar.tsx`, ko'rsatkich kartochkalari. Ixtiyoriy: ✚ `tools/design-reference/capture.ts`, ✚ `docs/design-reference/{tokens.json,README.md}`.
- **Qadamlar:**
  1. 3-bo'limdagi barcha tokenlar (kunduzgi va tungi) CSS o'zgaruvchi va TS obyekt sifatida. Tungi rejim `[data-theme="dark"]` va mavjud `ThemeContext` bilan.
  2. `data-density` (3.4) ikkala qiymati.
  3. Inter npm orqali; boshqa shrift ulangan bo'lsa, shu PR'da almashtiriladi va PR'da yoziladi.
  4. 1-etap komponentlaridagi qattiq ranglar tokenlarga. Xarita va grafik **ma'lumot** ranglari tegilmaydi, faqat chrome (3.1).
  5. *(ixtiyoriy, OS-H-15)* `capture.ts`: my.gov.uz, my.soliq.uz, my.mehnat.uz, statista.com ning login'siz sahifalaridan `getComputedStyle` qiymatlari `tokens.json` ga "solishtirish uchun". Skrinshotlar repo'ga qo'yilmaydi (`.gitignore`). Ularning serveridan shrift, ikonka, rasm yuklanmaydi.
- **Tekshiruv:** 9.1; `grep -nE "#[0-9a-fA-F]{3,8}\b"` ro'yxatdagi komponentlarda faqat ma'lumot ranglari qolgan (natija PR'da); axe ikkala rejimda kontrast xatosiz; bosh sahifa, `/regions`, `/dashboards/*` skrinshotlari (oldin/keyin).

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H1 ni bajar (3-bo'lim tokenlari).
ThemeContext va UI kutubxona temasini koddan top. Tokenlarni faqat H1 da sanalgan
1-etap komponentlariga qo'lla, xarita va grafik ma'lumot ranglariga tegma.
Branch task/H1-tokens, alohida PR, 9.1 tekshiruvi va oldin/keyin skrinshotlari bilan.
```

### H2 · Umumiy komponentlar

- **Fayllar:** ✚ `components/ds/{PageHeader,Breadcrumbs,StatCard,StatusBadge,AccessBadge,SampleBadge,SourceNote,FilterBar,DataTable,Stepper,Timeline,EmptyState,ErrorState,Skeleton,Chip,SegmentedControl}.tsx`, ✚ `components/ds/index.ts`, ✚ `components/catalog/ServiceCard.tsx` (3 variant), ✚ `config/statusDictionary.ts`, ✚ `pages/dev/UiKit.tsx` (faqat dev build route'i). U-01 komponentlari bor bo'lsa, ko'chiriladi yoki qayta eksport.
- **Qadamlar:** 4-bo'lim bo'yicha. `DataTable`: filtr URL'da, saralash (`aria-sort`), sahifalash 10/25/50, bo'sh holat, skelet, mobilda (< 768) kartochka ro'yxati, CSV/XLSX eksport faqat ruxsat bo'lsa. `ServiceCard` katalog obyektini qabul qiladi (H7 gacha vaqtinchalik tur bilan).
- **Tekshiruv:** 9.1; Vitest bor bo'lsa `mapStatus`, `StatusBadge`, `DataTable` filtr-URL testlari; UiKit sahifasi 3 kenglik × 2 rejim skrinshotlari.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H2 ni bajar (4-bo'lim).
Avval mavjud U-01 komponentlarini top va hisobot ber: qaysilari bor, qaysilari yangi.
Ikki nusxa qoldirma. UiKit sahifasi faqat dev build'da ochilsin. Branch task/H2-components.
```

### H3 · Kabinet karkasi, kirish, tashkilot tanlash

- **Fayllar:** ✚ `layouts/CabinetLayout.tsx`, ✚ `components/cabinet/{AppShell,Sidebar,TopHeader,OrgSwitcher}.tsx`, ✚ `components/ds/{UserMenu,LanguageSwitcher,NotificationBell}.tsx`, ✚ `config/cabinetMenu.ts`, ✚ `config/staffMenu.ts`, ✚ `pages/cabinet/SelectOrg.tsx`, ✎ login sahifasi (aniqlash kerak), ✎ `App.tsx`, ✎ `PersonalCabinet.tsx` (ichki menyu va `SLUG_TARGETS`).
- **Qadamlar:** [MEHNAT_SOLIQ_DIZAYN.md MS-03 va MS-04](MEHNAT_SOLIQ_DIZAYN.md) bo'yicha. Kabinet sahifalari o'zgarmasdan yangi layout ichiga qo'yiladi. Kirish usullari tablarda (mavjudlari), autentifikatsiya mantiqi va callback'lar o'zgarmaydi, `?next=` saqlanadi. Tashkilot tanlash faqat backend'da mavjud bog'lanish bo'lsa (OS-H-11). `VITE_CABINET_V2=false` eski layoutni qaytaradi.
- **Tekshiruv:** 9.1; har roldagi demo akkaunt (`demo_yuridik_1`, `demo_jismoniy_1`, `demo_konsultant_1`, `demo_bugalter`, `demo_employee`) bilan 18 bo'limning hammasi menyudan 1 bosishda ochiladi; eski kabinet havolalari 404 bermaydi; `Ctrl+K`, `Escape`, Stat AI ishlaydi; mobil Drawer klaviatura bilan.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H3 ni bajar. Tafsilot MEHNAT_SOLIQ_DIZAYN.md
MS-03 va MS-04 da, lekin papka nomlari HIBRID_DIZAYN 4-bo'limdagidek (components/cabinet, components/ds).
Autentifikatsiya mantiqiga va payment/ ga tegma. Yangi model yaratma. VITE_CABINET_V2 bayrog'i bilan.
```

### H4 · Kabinet ichi

- **Fayllar:** ✎ kabinet bosh paneli, Hisobotlarim, Arizalarim (xizmat so'rovlari + individual ma'lumot + buyurtmalar), Shartnomalar, To'lovlar, Xabarnomalar sahifalari, individual ma'lumot / xizmat so'rovi / konsultatsiya formalari (hammasi aniqlash kerak), ✚ `components/cabinet/dashboard/*`, ✚ `components/cabinet/AlertStrip.tsx`.
- **Qadamlar:** [MS-07, MS-08, MS-09](MEHNAT_SOLIQ_DIZAYN.md) bo'yicha (6.3). Har sahifa alohida commit. Raqamlar faqat mavjud API'dan, ma'lumot yo'q `StatCard` ko'rsatilmaydi. "Arizalarim" uch endpoint'ni frontendda birlashtiradi (har biri > 200 yozuv bo'lsa tablar). Individual ma'lumot formasining 1-qadamida TI-12 maydonlari (oqim, davlatlar, HS) H6 komponentlari tayyor bo'lgach qo'shiladi. Shartnoma oqimi va `payment/` ga tegilmaydi.
- **Tekshiruv:** 9.1; har ro'yxatda filtr, saralash, sahifalash, bo'sh holat; har forma oxirigacha yuboriladi, sahifa yangilansa qoralama tiklanadi.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H4 ni bajar (MEHNAT_SOLIQ_DIZAYN.md MS-07, MS-08, MS-09).
Avval har sahifa uchun mavjud API maydonlarini sanab chiq; API'da yo'q ustunni ko'rsatma,
yangi backend maydon qo'shma. Har sahifa alohida commit, payment/ ga tegma.
```

### H5 · Ko'rsatkich sahifasi

- **Fayllar:** ✚ `pages/Indicator.tsx` (`/indicators/:key`), ✚ `components/data/{ChartCard,ToolRail,DownloadPanel,MetaBlock,RelatedList}.tsx`, ✎ `ShareBar.tsx` (`orientation` prop), ✎ `/embed/indicator/:key` (tokenlar), ✎ `App.tsx`. Backend: mavjud ko'rsatkich va metadata API (aniqlash kerak, OS-H-07); yo'q bo'lsa faqat o'qish uchun `GET /api/indicators/:key/` (keshlangan).
- **Qadamlar:** [STATISTA_DIZAYN.md ST-04](STATISTA_DIZAYN.md) va 5.2 qolipi. Recharts qoladi. SEO: `<title>`, meta tavsif, `Dataset` JSON-LD. Yuklab olish cheklovlari OS-H-08 bo'yicha. Stat AI bloki joriy ko'rsatkich kontekstini uzatadi.
- **Tekshiruv:** 9.1; kamida 10 ta ko'rsatkich ochiladi; "Grafik/Jadval" va "Ustun/Chiziq" ishlaydi; CSV va PNG mehmonga, XLSX kirish bilan; embed kodi `/embed/indicator/:key` ni ochadi; JSON-LD validatordan o'tadi.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H5 ni bajar (STATISTA_DIZAYN.md ST-04, maket havolasi bor).
Avval mavjud ko'rsatkich API'sini va /embed/indicator/:key qanday ma'lumot olishini top va hisobot ber.
ShareBar.tsx ni qayta ishlat, yangi grafik kutubxonasi qo'shma. Branch task/H5-indicator.
```

### H6 · Tashqi savdo va korxona sahifalari

- **Fayllar:** ✚ `components/externalTrade/{TradeSearch,FlowToggle,TradeStats}.tsx`, ✚ `components/data/{KpiStrip,ResultCard}.tsx`, ✚ `components/catalog/PassportBackLink.tsx`, ✎ `ExternalTrade.tsx`, `MarketReport`, `TradeFlows`, `/partners`, `/check` sahifalari (aniqlash kerak), ✚ `public/samples/market-report-sample.pdf` (yoki keshlangan generatsiya). Backend: `external-trade/summary/` yo'q bo'lsa (24 soat kesh).
- **Qadamlar:** [TRADEINT_DIZAYN.md](TRADEINT_DIZAYN.md) TI-01, TI-02, TI-03, TI-06, TI-07 (faqat davlatlar), TI-08, TI-09; sahifa tartiblari uning 5-bo'limida. Uslub: `DataPage` (Z-15). Savdo grafiklari `--ds-series-export/import/total`. `ExternalTrade.tsx` refaktor qilinmaydi, faqat yangi komponentlar ulanadi. `PassportBackLink` pasportlar H7 da paydo bo'lgach ko'rinadi (bayroq: katalogda `live`).
- **Tekshiruv:** 9.1; "paxta", "5205", "Xitoy" to'g'ri guruhda; `?flow=` uch sahifada bir xil; raqamlar API'dan, ostida `SourceNote`.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H6 ni bajar (TRADEINT_DIZAYN.md TI-01..03, TI-06..09).
Uslub my.gov.uz emas, HIBRID_DIZAYN 5.2 DataPage qolipi (Z-15). Avval uch sahifadagi mavjud
oqim tanlovi va HS qidiruvini o'qi. Korxona kesimini qilma (TI-07 faqat davlatlar).
```

### H7 · Katalog, sohalar, xizmat pasporti, baholar

- **Fayllar:** ✚/✎ `config/serviceCatalog.ts`, ✚ `config/spheres.ts`, ✚ `pages/{AllSpheres,Sphere,ServicePage}.tsx`, ✚ `components/catalog/{SphereSidebar,SphereCard,CatalogFilters,ServiceSummary,InfoSection,HowItWorks,ServiceStats,ServiceRatings,FaqList,TileRow}.tsx`, ✎ `App.tsx`, ✎ `Navbar.tsx` (faqat "Xizmatlar" → `/spheres`). Backend: ✚ `ServiceUsage`, `ServiceRating` (`apps/services` ichida), migratsiya, endpoint'lar, `seed_demo --only service_stats`.
- **Qadamlar:** [MYGOV_DIZAYN.md MG-04, MG-06, MG-07, MG-10](MYGOV_DIZAYN.md) va [MYGOV_JORIY_ETISH.md 2B](MYGOV_JORIY_ETISH.md) bo'yicha; katalog ro'yxati MYGOV_JORIY_ETISH 4.1 dan. Qo'shimcha: breadcrumb bor (Z-09); savdo pasportlarida TI-04 "Ma'lumot haqida" va TI-12 savol-javob; Tashqi savdo va Biznes tahlili sohalarida TI-05 modul kartalari (`ServiceCard variant="card"`, GIF yo'q). Production'da ⛔ xizmatlar `status: 'soon'` (S-6), mavjud bayroqlardan. `/all-services` → `/spheres`.
- **Tekshiruv:** 9.1; katalog testi (raqam takrorlanmaydi, har `route` router'da bor, `App.tsx` dagi har ommaviy route katalogda yoki "xizmat emas" ro'yxatida); `ServiceRating` testlari; 14 soha va har `live` pasport ochiladi; filtr URL'dan tiklanadi.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H7 ni bajar. Tafsilot MYGOV_DIZAYN.md MG-04, MG-06,
MG-07, MG-10 va MYGOV_JORIY_ETISH.md 2B, 4.1 da. Farqlar HIBRID_DIZAYN 5.3–5.4 da (breadcrumb bor,
TI-04/05/12 qo'shiladi). Header'ni almashtirma, faqat "Xizmatlar" bandini /spheres ga yo'naltir.
```

### H8 · Mavzular, panellar, `/statistics`

- **Fayllar:** ✚ `config/topics.ts`, ✚ `pages/{Topics,Topic}.tsx`, ✚ `components/data/TopicTile.tsx`, ✎ `/dashboards/:slug` sahifasi (tokenlar, `DataPage`), ✎ `pages/Statistics.tsx`, ✚ `components/home/LiveFigures.tsx` (`Banner.tsx` dan ajratilgan aholi soni va portal faoliyati).
- **Qadamlar:** [ST-05](STATISTA_DIZAYN.md) va 6.4 (umumiy `slug`, ikki tomonlama havolalar). `/statistics` S-15 tartibida: yuqorida to'liq "O'zbekiston raqamlarda" (`HomeHighlights.tsx` import, qayta yozilmaydi), pastda "Portal faoliyati" va eng ko'p ishlatilgan 10 xizmat (H7 hisoblagichidan). Bosh sahifa hali o'zgarmaydi.
- **Tekshiruv:** 9.1; 12 mavzu ochiladi; har mavzudan kamida bitta `/indicators/:key` va (bor bo'lsa) panelga o'tiladi; aholi soati `/` va `/statistics` da bir xil.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H8 ni bajar (STATISTA_DIZAYN.md ST-05, MYGOV_DIZAYN.md MG-13).
HomeHighlights.tsx va banner raqamlarini qayta yozma, faqat import qil. Mavzu va soha slug'lari
HIBRID_DIZAYN 6.4 jadvalidagidek bir xil bo'lsin. Bosh sahifaga tegma.
```

### H9 · Qidiruv, footer, fikr vidjeti, huquqiy sahifalar

- **Fayllar:** ✚ `pages/Search.tsx`, ✎ `GlobalSearch` (`Ctrl+K`, aniqlash kerak) va `apps/common` search backend, ✚ `components/ds/{Footer,PageFeedback}.tsx`, ✚ `pages/{Privacy,Terms,AiUsage,Sitemap}.tsx`, ✎ `/about`, `/contact`, 404. Backend: ✚ `page-feedback/`, `typo-report/` (`apps/common`) + admin + throttle.
- **Qadamlar:** 5.5 (bo'limlar tartibi Z-13), [MG-08, MG-09, MG-11](MYGOV_DIZAYN.md). Footer va fikr vidjeti hozirgi layoutga qo'shiladi (H10 gacha eski Navbar bilan birga). 1-etap rasmiy qatoridagi havolalar footer'ga **nusxa**, Navbar'dan hali o'chirilmaydi. Embed'da footer va vidjet yo'q.
- **Tekshiruv:** 9.1; `#302` va `302` → pasport; lotin/kirill aralash so'rov topadi; footer havolalari 404 bermaydi (e2e); fikr vidjeti rate limit testi; qidiruv javobida telefon va PINFL yo'q.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H9 ni bajar (MG-08, MG-09, MG-11 + 5.5 bo'limlar tartibi).
Ctrl+K oynasini va open-global-search hodisasini saqla, /search unga qo'shimcha.
Navbar'dan hech narsa o'chirma, bu H10 da bo'ladi.
```

### H10 · Ommaviy layout, header, bosh sahifa

> Bu eng ko'zga ko'rinadigan qadam. Alohida branch, `VITE_PUBLIC_V2` bayrog'i bilan. Merge'dan oldin egasiga staging skrinshotlari ko'rsatiladi.

- **Fayllar:** ✚ `layouts/PublicLayout.tsx`, ✚ `components/ds/{SkipLink,TestModeBar,TopBar,PublicHeader,MegaMenu,MobileMenu}.tsx`, ✚ `config/publicMenu.ts`, ✚ `components/data/{HeroSearch,IndicatorCard,ReleaseList}.tsx`, ✚ `components/home/{CabinetStrip,SourcesRow,WhyUs}.tsx`, ✎ bosh sahifa fayli (aniqlash kerak), ✎ `Banner.tsx`, `HomeHighlights.tsx`, `Interactive.tsx`, `TariffComponent.tsx`, `CalendarReport.tsx` (joyi o'zgaradi, 6.2), ✎ `Navbar.tsx` (yangi komponentlarni qayta eksport qiladi, H12 da o'chiriladi), ✎ `App.tsx`.
- **Qadamlar:**
  1. `PublicLayout` (5.1) barcha S va G sahifalarga. Til prefiksi **yo'q** (Z-10).
  2. `TopBar` va `PublicHeader` 7.1 bo'yicha. 1-etap menyusidagi har band yangi menyuda yoki footer'da (moslik jadvali PR'da).
  3. Bosh sahifa 6.2 tartibida. `HomeHighlights` kartochkalari `IndicatorCard` ga o'tadi (ma'lumot manbasi va `fetchDashboards` keshi o'sha).
  4. Tariflar 4 karta (Z-14), `/tariffs` va `/services` ham shu kartalarda; `/services` CLS 0,30 tuzatiladi.
- **Tekshiruv:** 9.1; bosh sahifa bloklari 6.2 tartibida; 3 rolda (mehmon, yuridik, jismoniy) "Kabinetingiz" qatori to'g'ri; 1-etapdagi har sahifaga yangi navigatsiyadan ≤ 2 bosishda yetiladi; 360 px da gorizontal skroll faqat plitkalar qatorida; CLS ≤ 0,1; Lighthouse raqamlari PR'da.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H10 ni bajar (5.1, 6.2, 7.1). VITE_PUBLIC_V2 bayrog'i bilan,
til prefiksi qo'shma. Mavjud bosh sahifa komponentlarini o'chirma, 6.2 jadvalidagi joyiga ko'chir.
1-etap Navbar bandlari → yangi menyu/footer moslik jadvalini PR'ga yoz. Merge qilma, egasining ko'rishini kut.
```

### H11 · Xabarnomalar, murojaatlar, obunalar, mobil va a11y

- **Fayllar:** ✚ `components/cabinet/{NotificationPanel,Inbox}.tsx`, ✎ "Savollarim", profil sozlamalari, "Obunalar" (HS bo'yicha obuna turi, TI-10), ✎ `/market-report` ("Kuzatish" tugmasi), ✎ e2e konfiguratsiyasi (`@axe-core/playwright`, yangi dev-paket uchun ruxsat so'raladi).
- **Qadamlar:** [MS-10, MS-11](MEHNAT_SOLIQ_DIZAYN.md), [MG-14](MYGOV_DIZAYN.md), TI-10. Xabarnoma kanallari faqat backend'da borlari (OS-H-12). Celery Beat mavjud bo'lsa TI-10 shu orqali, bo'lmasa TI-10 keyinga qoldiriladi va PR'da yoziladi.
- **Tekshiruv:** 9.1; axe (`serious`/`critical` yo'q): bosh sahifa, `/indicators/:key`, `/spheres/:id`, `/service/:number`, `/search`, kabinet bosh paneli, Hisobotlarim, Arizalarim; klaviatura: SkipLink, mega menyu, sidebar, `DataTable`, `Stepper`, dialoglar; 360/768/1024/1280.

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H11 ni bajar (MS-10, MS-11, MG-14, TI-10).
Yangi xabarnoma kanali integratsiyasini yozma, faqat backend'da borlarini ko'rsat.
@axe-core/playwright qo'shishdan oldin ruxsat so'ra.
```

### H12 · Qolgan sahifalar va yakuniy tekshiruv

- **Fayllar:** 6.1 dagi "H12" belgili sahifalar, har biri alohida kichik commit (`task/H12-<sahifa>`). Avval eng ko'p ishlatiladiganlar: `/check`, `/ex-trade`, `/regions`, `/report-calendar`, `/cpi-calculator`, `/demographics`, `/market-report`, `/partners`.
- **Qadamlar:** har sahifa o'z qolipiga (6.1), `PageHeader` bilan, qattiq ranglar tokenlarga. `BookStore.tsx` va `ExternalTrade.tsx` refaktor qilinmaydi (avval test kerak, alohida vazifa). `VITE_CABINET_V2`, `VITE_PUBLIC_V2` va eski `Navbar.tsx`, eski kabinet layouti olib tashlanadi. `docs/design-reference/checklist.md` to'liq (9.3). `DIZAYN_HOZIRGI_HOLAT.md` yangilanadi.
- **Tekshiruv:** 9.1–9.3 to'liq; 59 ommaviy sahifa + 18 kabinet bo'limi qo'lda ochilgan (ro'yxat PR'da).

```text
mystat repo'sida mystat/HIBRID_DIZAYN.md dagi H12 ni bajar. 6.1 jadvalidagi H12 sahifalarini
ko'rsatilgan tartibda, har birini alohida commit qilib o'z qolipiga o'tkaz. Katta fayllarni refaktor qilma.
Oxirida bayroqlarni olib tashla va 9.3 checklist'ini to'ldir.
```

### H13 · *(ixtiyoriy)* Til prefiksli URL

Faqat OS-H-04 ga "ha" javobi bo'lsa. [MYGOV_DIZAYN.md MG-02.3](MYGOV_DIZAYN.md) va [MYGOV_JORIY_ETISH.md S-4, 2E](MYGOV_JORIY_ETISH.md) bo'yicha: `/:lang(uz|cry|ru)/*`; prefikssiz qoladi: `/embed/*`, `/api/*`, OneID va Click callback'lar, `sw.js`, `manifest`, `releases.ics`, `/stat-codes/verify`. Eski URL → `/uz/...` redirect, `?next=` prefiks bilan.

---

## 9. Tekshiruv

### 9.1. Har qadamdan keyin (buyruqlar)

```bash
cd backend && venv/Scripts/python manage.py test
cd backend && venv/Scripts/python manage.py makemigrations --check
cd frontend && npx tsc --noEmit && npx eslint src && npm test && npx vite build
cd frontend && npm run e2e      # backend va frontend ishlab turishi kerak
git diff --stat main -- backend/apps/payment backend/core   # bo'sh bo'lishi shart
```

### 9.2. Qo'lda tekshiruv (regressiya)

- [ ] `App.tsx` dagi barcha sahifalar ochiladi, 404 ishlaydi
- [ ] `Ctrl+K`, Stat AI, operator chat ishlaydi
- [ ] `/embed/indicator/:key` header va footer'siz
- [ ] Login (parol, OneID, ERI), `?next=` bilan qaytish
- [ ] Kunduzgi/tungi rejim, uz / cry / ru
- [ ] Aholi soati yuradi, hamma joyda bir xil raqam
- [ ] `/check` PDF, `/stat-codes` PDF va `verify` havolasi
- [ ] `DEBUG=True` da "Namuna" belgisi, `DEBUG=False` da namuna xizmatlar "Tez orada"
- [ ] 360 / 768 / 1280 px skrinshotlar PR'da

### 9.3. Yakuniy tekshiruv ro'yxati (`docs/design-reference/checklist.md`, H12)

"98% o'xshashlik" o'rniga zona bo'yicha bandlar. Har band: tavsif, sahifa, holat (bor / yo'q / istisno + sabab). Maqsad: istisnolardan tashqari 100%.

| Guruh | Bandlar manbasi |
|---|---|
| **S zona** | [STATISTA_DIZAYN.md 2.2–2.3](STATISTA_DIZAYN.md): qidiruv markazda; har ko'rsatkichning o'z sahifasi; grafik/jadval tablari; asboblar paneli; manba va metodologiya bloki; bog'liq ko'rsatkichlar; cheklov tugma yonida yozilgan; bosh sahifa bloklari 6.2 tartibida |
| **G zona** | [MYGOV_DIZAYN.md 1.5–1.9](MYGOV_DIZAYN.md): soha kartochkasi (2 featured + "Barchasi"); soha sahifasi sidebar va filtr; pasport bo'limlari 1.7 tartibida; `#raqam` qidiruvda; fikr vidjeti va `Ctrl+Enter`; footer 3 ustun |
| **M zona** | [MEHNAT_SOLIQ_DIZAYN.md Q-01..Q-18](MEHNAT_SOLIQ_DIZAYN.md) |
| **Tizim** | Tokenlardan tashqari rang faqat ma'lumot vizualizatsiyasida (`grep` hisoboti); 4-bo'limdagi har komponent kamida bitta real sahifada; ikki nusxa yo'q; har raqam ostida `SourceNote` |
| **Sifat** | Lighthouse a11y ≥ 95, CLS ≤ 0,1, LCP raqami yozilgan; axe `serious`/`critical` yo'q |

Oldindan ma'lum istisnolar: Stat AI va operator chat tugmalari (S-8); my.gov.uz dagi menyusiz header (Z-03); breadcrumb'siz soha sahifasi (Z-09); til prefiksi (Z-10, H13 gacha).

---

## 10. Ochiq savollar

Javob bo'lmasa **default** bilan ishlanadi. "To'xtatadi" ustunida "—" bo'lsa, savol hech bir qadamni to'xtatmaydi.

| # | Savol | Default | To'xtatadi | Eski ID |
|---|---|---|---|---|
| **OS-H-01** | Shrift: Inter yoki Statista maketidagi IBM Plex Sans? | Inter | — (H1 da almashtiriladi) | — |
| **OS-H-02** | Asosiy rang `#1D5FBF` va navy `#0E2647` ma'qulmi yoki qo'mita/agentlikning brend rangi bormi? | 3.1 qiymatlari | — | OS-MS-06 |
| **OS-H-03** | Mavzular (12) va sohalar (14) ikkalasi qolsinmi (Z-06)? | Ha, 6.4 bog'lanishi bilan | — | — |
| **OS-H-04** | Til prefiksli URL (`/uz/...`) kerakmi? | Hozircha yo'q, H13 ixtiyoriy | H13 | S-4, MG-02 |
| **OS-H-05** | Rasmiy nom: "Statistika qo'mitasi" yoki "Statistika agentligi"? Header'da qanday yoziladi? | Hozirgi `Navbar.tsx` dagi nom, bitta i18n kaliti | — | S-2, OS-MG-03 |
| **OS-H-06** | Ishonch telefoni raqami, 24/7 mi? | `/contact` dagi raqam, "24/7" yozilmaydi | — | S-3, OS-MG-01 |
| **OS-H-07** | Ko'rsatkichlar ro'yxati va metadata (manba, nashr sanasi, metodologiya) backend'da bormi yoki SIAT'dan? | H5 da koddan aniqlanadi; yo'q bo'lsa faqat o'qish uchun endpoint | H5 ning metadata qismi | OS-ST-01 |
| **OS-H-08** | XLSX va PDF yuklab olish qaysi limitga bog'lanadi? | CSV, PNG bepul; XLSX kirish bilan; PDF paket limiti | — | OS-ST-02, OS-14 |
| **OS-H-09** | 12 mavzu ro'yxati tasdiqlanadimi (Aholi, Narxlar, Mehnat, Milliy hisoblar, Tashqi savdo, Sanoat, Qishloq xo'jaligi, Qurilish, Savdo va xizmatlar, Korxonalar, Ta'lim va sog'liq, Hududlar)? | Ha | — | OS-ST-03 |
| **OS-H-10** | Ko'rsatkich tavsifini kim yozadi? | Statistika bo'limi; bo'lmaguncha Stat AI qoralamasi "Tasdiqlanmagan" belgisi bilan | — | OS-ST-04 |
| **OS-H-11** | Bitta foydalanuvchi bir nechta tashkilot nomidan ishlaydimi (buxgalter, filiallar)? | Faqat mavjud bog'lanish, yangi model yo'q | H3 ning 3-bandi | OS-MS-03 |
| **OS-H-12** | Xabarnoma kanallari: email, Telegram backend'da bormi, SMS kerakmi? | Faqat mavjudlari | H11 qismi | OS-MS-04 |
| **OS-H-13** | ERI bilan imzolash kerakmi yoki faqat ERI bilan kirish? | Faqat kirish; imzo mavjud DIDOX oqimida | — | OS-MS-05 |
| **OS-H-14** | Hisobot topshirish (shakl to'ldirish) kabinetda bo'ladimi? | Yo'q, faqat muddat va holat | — | OS-MS-07 |
| **OS-H-15** | my.soliq.uz / my.mehnat.uz / my.gov.uz kabinetlarining skrinshotlarini bera olasizmi (shaxsiy ma'lumot bo'yalgan)? | Yo'q; PR'da "skrinshot bilan tekshirilmagan" | — | OS-MS-02, OS-MG-09, S-12 |
| **OS-H-16** | Xizmatlarga baho va sharhlar ochiq bo'lsinmi? | Ha, baho darhol, sharh moderatsiyadan keyin | — | OS-MG-07, S-11 |
| **OS-H-17** | Maxfiylik siyosati va foydalanish shartlari matnini kim beradi? | Namuna matn, "yuridik tekshiruvdan o'tmagan" belgisi | — | OS-MG-06, S-10 |
| **OS-H-18** | English BETA kerakmi? | Yo'q | — | OS-MG-02, S-13 |
| **OS-H-19** | Sohalar va ommabop xizmatlar tartibini admin o'zgartira olsinmi? | Hozircha statik konfiguratsiya | — | OS-MG-04 |
| **OS-H-20** | Plitkalar "story" ochsinmi? | Yo'q, to'g'ridan-to'g'ri pasport | — | OS-MG-05 |
| **OS-H-21** | Tashqi savdo jadvalida korxona STIR'i bormi? | H6 da koddan tekshiriladi; yo'q bo'lsa faqat davlatlar | TI-07 korxona qismi | TRADEINT 7.1 |
| **OS-H-22** | Namuna PDF uchun qaysi HS kodi? | Oxirgi yil eksportida eng katta 4 xonali kod, avtomatik | — | TRADEINT 7.2 |
| **OS-H-23** | Bosh sahifadagi "Ommabop xizmatlar" plitkalari (6.2, 7-blok) qolsinmi yoki faqat "Xizmatlar" menyusida bo'lsinmi? | Qoladi | — | — |

**Yopilgan savollar (shu qaror bilan):** OS-ST-05 (A/B/C) va OS-MS-01 (A/B/C): gibrid tanlandi. OS-MG-08 va S-9 (bosh sahifadan statistikani olib tashlash): kerak emas, statistika bosh sahifada qoladi. OS-MS-02 va OS-MG-09 OS-H-15 ga birlashdi.

---

## 11. Eski vazifalar qayerga tushdi

Lokal Claude Code eski hujjatdagi vazifa raqamini ko'rsa, shu jadvalga qaraydi.

| Eski vazifa | Holat | Qadam |
|---|---|---|
| ST-01 | MS-01, MG-01 bilan birlashdi, qiymatlar 3-bo'limda | H1 |
| ST-02, ST-03 | O'zgarishsiz (6.2) | H10 |
| ST-04 | O'zgarishsiz | H5 |
| ST-05 | O'zgarishsiz + soha bog'lanishi (6.4) | H8 |
| ST-06 | 4 karta, "Tavsiya etiladi" (Z-14) | H10 |
| ST-07 | MG-08 bilan birlashdi (5.5) | H9 |
| MS-00, MG-00 | Birlashdi, ixtiyoriy, faqat solishtirish | H1 |
| MS-01, MG-01 | ST-01 bilan birlashdi | H1 |
| MS-02 | O'zgarishsiz, papka `components/ds/` | H2 |
| MS-03, MS-04 | O'zgarishsiz, papka `components/cabinet/` | H3 |
| MS-05 | Menyu 7.1 da yangilandi, header to'q ko'k | H10 |
| MS-06 | **Bekor**, o'rniga 6.2 (Statista bosh sahifasi) | — |
| MS-07, MS-08, MS-09 | O'zgarishsiz | H4 |
| MS-10, MS-11 | O'zgarishsiz | H11 |
| MS-12 | MG-15 bilan birlashdi | H12 |
| MG-02 | Layout qismi qoladi, til prefiksi H13 ga | H10, H13 |
| MG-03 | **O'zgardi:** top bar elementlari `TopBar` ga, menyusiz header bekor | H10 |
| MG-04, MG-06, MG-07, MG-10 | O'zgarishsiz (+ breadcrumb, TI-04/05/12) | H7 |
| MG-05 | **Bekor**, o'rniga 6.2 | — |
| MG-08 | ST-07 bilan birlashdi | H9 |
| MG-09, MG-11 | O'zgarishsiz | H9 |
| MG-12 | **Bekor**, o'rniga MS-03 | — |
| MG-13 | **O'zgardi:** bosh sahifadan olib tashlanmaydi, `/statistics` boyiydi | H8 |
| MG-14 | MS-11 bilan birlashdi | H11 |
| MG-15 | "98%" o'rniga 9.3 ro'yxati | H12 |
| MYGOV_JORIY_ETISH 2A..2G | **Tartib bekor**, o'rniga 8.1. Katalog (4.1), plitkalar (4.2), shaxsiy bloklar (4.3 → "Kabinetingiz" qatori), S-savollar defaultlari o'z kuchida | — |
| TI-01..TI-03, TI-06..TI-09 | Uslub S zona (Z-15) | H6 |
| TI-04, TI-05, TI-12 | O'zgarishsiz | H7 (TI-12 forma maydonlari H6 dan keyin H4 formasiga) |
| TI-10 | O'zgarishsiz | H11 |
| TI-11 | ST-06 bilan birlashdi | H10 |
