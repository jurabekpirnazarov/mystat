# my.stat.uz dizayni: hozirgi holat

> **Sana:** 2026-10-30 · **Branch:** `main` (commit `a884c70` va undan keyingilar).
> **Manba:** frontend kodi (`frontend/src/theme/tokens.css`, `components/layout`, `components/ui`, `pages/HomePageV2.tsx`, `config/publicMenu.ts`). Oldingi (2026-10-21) variant eskirgan edi va shu hujjat bilan almashtirildi.
> **Cheklov:** hujjat kod asosida yozilgan; brauzerda ko'zdan kechirilmagan qismlar "tekshirilmagan" deb belgilangan.

---

## 1. Qisqacha

1. Ochiq saytning qobig'i **lex.uz andozasida** (`PublicShell`): yuqori qator → brend sarlavha → asosiy menyu → kontent → footer.
2. Ranglar, radius va soyalar **yagona `--ds-*` tokenlariga** ulangan (`frontend/src/theme/tokens.css`). Eski `--mg-*` nomlari shu tokenlarga yo'naltirilgan, kunduzgi va tungi rejim bor.
3. Ochiq sahifalar konteyneri **1600 px** gacha kengayadi (oldin 1200 px). Yuqori panel, sarlavha, menyu va footer bir xil kenglikda.
4. Bosh sahifa `HomePageV2.tsx`, hozirgi tartibi 3-bo'limda.

---

## 2. Dizayn tokenlari (`theme/tokens.css`)

| Guruh | Kunduzgi | Tungi |
|---|---|---|
| Brend (sarlavha foni) `--ds-brand` | `17 43 82` | `24 32 45` |
| Asosiy `--ds-primary` | `0 94 184` | `91 141 239` |
| Aksent `--ds-accent` | `242 178 52` | — (o'zgarmaydi) |
| Fon `--ds-bg` / yuza `--ds-surface` | `245 247 250` / `255 255 255` | `15 21 32` / `22 30 44` |
| Matn `--ds-text` / xira `--ds-text-muted` | `22 32 48` / `92 105 125` | `230 234 242` / `154 166 188` |
| Chegara `--ds-border` | `223 229 237` | `38 50 74` |
| Holat ranglari | success, warning, danger, info (har biri `-bg` bilan) | alohida tungi qiymatlar |
| Grafik qatorlari | `--ds-series-export/import/total` | alohida |
| Radius | control 6 px, card 12 px, pill 999 px | |
| Soya | card (yengil), popover | |

- Qiymatlar `R G B` ko'rinishida, ishlatilishi `rgb(var(--ds-...))`.
- **Shrift:** Inter Variable (asosiy), Literata (sarlavha-brend, `font-brand`).
- **Zichlik:** `data-density="compact"` 14/22 px, `"comfortable"` 16/24 px. Shrift o'lchami `--ds-font-scale` bilan o'zgaradi.
- Balandliklar: header 72 px, menyu qatori 48 px, yuqori qator 36 px.

---

## 3. Bosh sahifa (`pages/HomePageV2.tsx`) — yuqoridan pastga

| # | Blok | Tavsif |
|---|---|---|
| 1 | **Hero** | Brend rangidagi chiziq, sarlavha "Rasmiy statistik ma'lumotlarni izlash". Ostida bitta qatorda 3 ustun: qidiruv paneli · "Ko'p ishlatiladigan xizmatlar" (6 ta karta) · yon panel (sana/vaqt, aholi soati, ob-havo). Ustun kengliklari: lg `300px 1fr 300px`, xl `360px 1fr 340px`. xl da xizmatlar 3 ustun, lg da 2 ustun |
| 2 | **Eng yaqin e'lon** | Hero tagida bitta qator: sarlavha, sana, "necha kun qoldi", kalendarga havola |
| 3 | **Asosiy ko'rsatkichlar** | 4 ta karta: qiymat, o'zgarish (rangli yorliq), mini grafik (SVG), davr |
| 4 | Kirgan foydalanuvchi uchun | Hisobot kalendari va kabinetga havola |
| 5 | **Statistika mavzulari** | Mavzu kartalari, har birida 2 ta ko'rsatkich |
| 6 | **Yangi e'lon qilingan ma'lumotlar** va **Yangi nashrlar** | lg+ da yonma-yon, har biri 5 qator, ixcham `DocList`. Nashrlar yuklanmasa (mehmon, API 401) e'lonlar to'liq kenglikda |
| 7 | **Nima qilmoqchisiz?** | 3 ta `ActionCard`: hisobot muddati, ko'rsatkich topish, kontragent tekshirish |
| 8 | **Xizmat sohalari** | `LinkGrid`, boshida 12 ta, "Hammasini ochish" |
| 9 | **Hayotiy vaziyatlar** | 3 ustunli ro'yxat, tavsif 2 qatorgacha |
| 10 | **Portaldagi ma'lumotlar** va **Yana ommabop xizmatlar** | lg+ da yonma-yon; hisoblagichlar yarim kenglikda 2 ustun |
| 11 | **Foydali resurslar** | Tashqi havolalar (stat.uz, my.gov.uz, lex.uz, data.egov.uz, gov.uz) |

Grafik kutubxonasi bosh sahifada import qilinmaydi (mini grafiklar oddiy SVG).

---

## 4. Qobiq va menyu (`components/layout`)

- **TopBar** (faqat lg+): ijtimoiy tarmoqlar, hisobot kalendari, telefon, ko'rinish sozlamalari (`ViewControls`, A A A), til almashtirgich, kabinet/kirish.
- **PublicHeader:** logo + ikki qatorli rasmiy nom, qidiruv tugmasi (`Ctrl+K` — `CommandPalette`), kabinet/kirish tugmasi (aksent rangda). Mobilda ☰ tugmasi.
- **Asosiy menyu** (`config/publicMenu.ts`, yagona manba; MainNav, mobil menyu va `/sitemap` shundan o'qiydi): Statistik ma'lumotlar · Xizmatlar · Hisobot topshiruvchilarga · Ma'lumotnomalar · Portal haqida.
- **PublicFooter**, **Breadcrumbs** (`/spheres` va `/situations` o'z breadcrumb'ini chizadi, umumiy layout ularni o'tkazib yuboradi), **PageFeedback**, **TypoReporter**, **AccessibilityMenu**.
- Kabinet uchun alohida `MainLayout` (Sidebar + Header), konteyner 1600 px.

---

## 5. Umumiy UI komponentlari (`components/ui`)

`ActionCard`, `CountGrid` (`narrow` — yarim kenglik uchun 2 ustun), `DocList` (`compact` — sarlavha qatorisiz, zichroq; desktopda jadval, < 768 px da raqamli ro'yxat), `IconChip`, `LinkGrid`, `SectionHeader`, `PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, `ApiErrorState`, `ErrorBoundary`, `Skeleton`, `DemoBadge`, `ExternalLink`.

---

## 6. Ma'lum cheklovlar va tekshirilmagan joylar

- Yangi kenglik (1600 px) va hero ustunlari **brauzerda ko'zdan kechirilmagan**; natijani ko'rib sozlash kerak bo'lishi mumkin.
- Nashrlar bloki kirishni talab qiladigan API'dan keladi (`/books/books-list/`), mehmonga ko'rinmaydi.
- Lighthouse ko'rsatkichlari (performance, LCP, CLS) bu hujjat yozilganda qayta o'lchanmagan.
- Ichki sahifalar (kabinet, xaritalar, kitob do'koni va boshqalar) ushbu hujjatda batafsil tasvirlanmagan; ular `--ds-*` tokenlariga o'tganmi, har bir fayl bo'yicha tekshirilmagan.
