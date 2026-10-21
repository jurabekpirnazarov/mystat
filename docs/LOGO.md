# my.stat.uz portal belgisi (logo)

> **Sana:** 2026-10-21 · **Kod:** `frontend/src/components/brand/Logo.tsx` (`LogoMark`, `Logo`), `frontend/public/favicon.svg`, `frontend/public/icons/*.png`

## 1. Nega yangi belgi

| | Eski: qo'mitaning UZSTAT emblemi (`src/img/stat.png`) | my.gov.uz belgisi (MG-00 da ko'rildi) |
|---|---|---|
| Nima | Davlat organining rasmiy emblemi: doira, 3D ustunlar, yashil "S", qizil trend chiziq, "UZSTAT" yozuvi | Davlat emblemi emas — **portalning o'z belgisi**: 3 ta ustma-ust yumaloq kartochka, old kartochkada belgi; yonida serifli "my.gov.uz" |
| Kichik o'lchamda | 44 px da "UZSTAT" o'qilmaydi, mayda detallar eriydi; favicon'da faqat doira ko'rinadi | 16 px da ham tanib bo'ladi |
| Rang | Yashil, qizil, to'q ko'k — yangi my.gov ko'k palitrasi (`#0068E0`) bilan to'qnashadi | Ko'k fonda oq, och fonda rangli |
| Fayl | 277 KB PNG, vektor yo'q | SVG |

Xulosa: my.gov.uz kabi, portal uchun alohida, sodda, vektor belgi kerak. Rasmiy emblem o'chirilmaydi — footer'da qo'mita saytiga (stat.uz) havola bilan turadi (my.gov.uz footer'idagi hamkor logolari o'rnida).

## 2. Yangi belgi

- **Shakl:** ikkita ustma-ust yumaloq kartochka ("xizmatlar portali" — my.gov.uz oilasiga mos) va old kartochkada **o'suvchi uchta ustun** (statistika; UZSTAT emblemidagi ustunlar bilan davomiylik).
- **my.gov.uz dan farqi:** kartochkalar 3 emas 2 ta, orqa kartochka o'ng-yuqorida, ichida belgi emas — ustunlar. Nusxa emas, bir oila uslubi.
- **Ranglar — davlat bayrog'idan:** old kartochka ko'k `#1A7BF0 → #0058C2` (portal asosiy rangi), ular orasidagi oq chiziq, orqa kartochka yashil `#2CC84D → #1A9E3F` (bayroqdagi yashil `#1EB53A` atrofida). Ustunlar oq.
- **Ko'k fonda** (`tone="dark"`, sidebar, PWA ikonka): old kartochka oq, orqasi 45% oq, ustunlar `#0068E0`.
- **Yozuv shrifti — Literata 700** (Google Fonts, OFL; lotin va kirill). my.gov.uz yozuvi SVG ko'rinishidagi maxsus qavsli serif — uni ko'chirib bo'lmaydi. 8 ta ochiq serif solishtirildi (Merriweather, PT Serif, Noto Serif, Lora, Source Serif 4, Playfair Display, Literata, Roboto Slab): Literata my.gov.uz yozuviga eng yaqin, rasmiy va kichik o'lchamda ham aniq. Merriweather va Playfair juda bezakli, Roboto Slab rasmiy emas. Tailwind: `font-brand`.
- **Rasmiy lockup** (`<Logo org />`): yozuv ostida "MILLIY STATISTIKA QO'MITASI" — Montserrat 600, katta harflar, kengaytirilgan interval. Sidebar (ochilganda) va footer'da ishlatiladi; mustaqil belgi (`LogoMark`) — kichik joylarda.
- Interfeys shrifti o'zgarmaydi — Montserrat (my.gov.uz bilan bir xil).
- 16, 24, 32, 48, 85, 128 px da tekshirildi.

## 3. Qayerda ishlatiladi

| Joy | Variant |
|---|---|
| Sidebar (ko'k) | yopiq — `LogoMark tone="dark"`; ochilganda — `Logo tone="dark" org` |
| Mobil header | `LogoMark` |
| Footer | `Logo org` (belgi + yozuv + tashkilot); pastda UZSTAT emblemi + "stat.uz" |
| Brauzer yorlig'i | `public/favicon.svg` |
| PWA / telefon ekrani | `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — ko'k gradient fon, oq belgi (maskable uchun 60%) |

Service worker kesh versiyasi `v2` ga oshirildi — eski ikonkalar foydalanuvchi qurilmasida yangilanadi.

**Egasining tasdig'i kerak:** belgi qo'mita rahbariyati bilan kelishilmagan. Rad etilsa, `Logo.tsx` va 4 ta faylni almashtirish yetarli.
