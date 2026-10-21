# my.gov.uz namunasi (MG-00)

> **Olingan sana:** 2026-10-21 · **Skript:** [`tools/mygov-reference/capture.ts`](../../tools/mygov-reference/capture.ts)
> Qayta olish: repo ildizida `node tools/mygov-reference/capture.ts` (Node 22.6+, `frontend/node_modules` dagi Playwright; proksi `HTTPS_PROXY` dan olinadi).

| Fayl | Nima |
|---|---|
| `tokens.json` | 4 sahifa × 3 kenglik (360/768/1280) bo'yicha asosiy elementlarning `getComputedStyle` qiymatlari |
| `screens/*.jpg` | Har sahifaning birinchi ekrani (JPEG, 60% sifat) |
| `checklist.md` | "98% o'xshashlik" tekshiruv ro'yxati (MYGOV_DIZAYN.md 1.12) |

my.gov.uz dan shrift, ikonka yoki rasm fayllari **yuklab olinmagan**. Faqat skrinshot va hisoblangan uslublar.
`768-home.jpg` skrinshoti bo'sh chiqqan (sahifa shu kenglikda kech chiziladi), qolganlari to'liq.

## 1. O'lchangan tokenlar (1280 px)

| Token | Qiymat | Qayerdan |
|---|---|---|
| Shrift | **Montserrat**, sans-serif (Google Fonts, OFL litsenziya) | `body` |
| Asosiy matn | 16px / 24px, `#000000` | `body` |
| Sahifa foni | `#F2F4F7` | `body` |
| Asosiy rang | `#0068E0` | sidebar, havolalar, bo'lim sarlavhalari |
| Asosiy rang (to'q) | `#0153B2` | soha kartochkasidagi havolalar |
| Asosiy rang (och) | `#1A7BF0` | "Kirish" tugmasi gradientining boshi |
| Urg'u (yashil) | `#00DC82` | hero gradientining oxiri |
| Muvaffaqiyat tugmasi | `#2DB257` | "Ariza yuborish" |
| Ma'lumot bloki foni | `#E5EFFC` | xizmat pasportidagi ikonkali bo'limlar |
| Kartochka | oq, radius **14px**, padding 20px | soha kartochkasi |
| Hero | `linear-gradient(65.97deg, #0068E0 33.59%, #00DC82 122.33%)`, radius 14px, padding 25px | bosh sahifa |
| Hero sarlavhasi | 34px / 700, oq | "Xush kelibsiz!" |
| Plitka (story) | 100×150 px, radius 16px, yozuv 11px / 500 oq | "Ommabop so'rovlar" |
| Bo'lim sarlavhasi | 24.5px / 400, `#0068E0` | "Sohalar", "Ommabop xizmatlar" |
| Kartochka sarlavhasi | 17px / 700, qora | soha nomi |
| Shaxsiy blok | radius 14px, padding 12px 32px, `radial-gradient(120% 120% at 92% 50%, #F1F7FE 0, #FFF 46%)`; sarlavha 21px / 700 `#1E293B`; havola 15px / 500 | "Elektron hujjatlaringiz" |
| Sidebar | `#0068E0`, kenglik 85px (ochilganda ~268px), radius 25px, chekkadan 22px | `aside .sidebarWrap` |
| "Kirish" tugmasi | `linear-gradient(100deg, #1A7BF0, #0068E0)`, radius 9999px, 48px balandlik, soya `0 5px 17px rgba(0,104,224,.43)` + `0 0 0 4px rgba(0,104,224,.25)` | header |
| Header | padding 24px 0, balandlik ~109px; portal nomi 2 qator, katta harflarda | header |
| Konteyner | sidebar'dan keyin, ichki padding 0 40px, kontent kengligi 1103px (1280 da) | `.constrainedBox` |
| Qidiruv chip'i | oq, chegara 1px `#0068E0`, radius 14px, padding 8px 18px | `/search` |
| Fikr vidjeti | savol 17px / 500 `#354862`; "Ha"/"Yo'q" tugmalari chegarali, radius ~10px | sahifa oxiri |
| Footer | ustun sarlavhasi 14.5px / 700 `#151515`; havola 14.4px `#454545` | footer |

## 2. Hujjat taxminlaridan farqlar (MG-00 ustun turadi)

MYGOV_DIZAYN.md 1-bo'limi faqat matn bo'yicha yozilgan edi. Jonli saytda quyidagilar boshqacha:

| # | Hujjatda | Jonli saytda | Qaror |
|---|---|---|---|
| 1 | Header'da navigatsiya yo'q, menyu = sohalar | **Chap tomonda doimiy ko'k sidebar** (ikonkalar; sichqoncha borganda yozuvlar bilan ochiladi). Ikki guruh: "Xizmatlar" (Ommabop xizmatlar, Sohalar, To'lov, Arizani tekshirish, Joylar xaritasi, Yagona reyestr, Proaktiv xizmatlar, Mobil ilovalar) va "Yordam va qo'llab-quvvatlash" (Elektron ishtirok, Hayotiy vaziyatlar, FAQ, Xorij fuqarolari, Yangiliklar, ...) | Sidebar qilinadi |
| 2 | Breadcrumb yo'q | Ichki sahifalarda **breadcrumb bor** ("Bosh sahifa › Sohalar › Iqtisodiyot va biznes") | Breadcrumb qoladi (layout darajasida) |
| 3 | Bosh sahifa: plitkalar → shaxsiy bloklar → sohalar → fikr → footer | Hero ("Xush kelibsiz!" + qidiruv + plitkalar bitta gradient blokda) → shaxsiy bloklar → Sohalar → **Hayotiy vaziyatlar** → **Portal imkoniyatlari** → **Portal raqamlarda** → **Ommabop xizmatlar** (kartochkalar) → Mobil ilova → oxirgi o'zgarish sanasi + fikr → footer | Jonli tartib olinadi (mobil ilova — istisno) |
| 4 | Bosh sahifada statistik raqamlar yo'q | "Portal imkoniyatlarini raqamlarda kashf eting" bloki bor (foydalanuvchilar, tashkilotlar, xizmatlar) | Portal raqamlari bosh sahifada qisqa blok, batafsili `/statistics` da |
| 5 | Soha kartochkasi: ikonka + nom + 2 xizmat | Nom + 2 xizmat (nuqtali ro'yxat) + "Barchasi"; ikonka o'ng pastda och doira ichida | Shunday qilinadi |
| 6 | Soha sahifasi: ro'yxat | Chapda "Sohalar" akkordeoni (joriysi ochiq, kichik toifalar), o'ngda H1 + son, "Xizmatni izlash" maydoni, "Kengaytirilgan qidiruv" tugmasi, **2 ustunli xizmat kartochkalari** (`#raqam`, ikonka, nom, reyting, foydalanish soni, vaqt, yulduzcha) | Shunday qilinadi |
| 7 | Xizmat sahifasi: ketma-ket kartochkalar | **Ko'k hero** (ikonka, nom, vaqt, foydalanish soni, reyting, "Ariza yuborish" yashil tugma, "Tanlanganlarga qo'shish", ulashish, video), keyin **2 ustunli yig'iladigan bo'limlar** (narx, foydalanuvchilar, huquqiy asos, aloqa, muddat, tashkilot, hujjatlar, "Bu qanday ishlaydi?"), "Umumiy statistika", "Baho va sharhlar" (taqsimot chiziqlari, sharhlar, "Foydali/Foydasiz") | Shunday qilinadi (video — istisno) |
| 8 | Header: 112SOS · 1242 · Qayta aloqa · til · Kirish | Portal nomi (chapda) · [qidiruv ikonkasi, bosh sahifadan tashqari] · 112 SOS · 1242 Qayta aloqa · til "O'z ▾" · maxsus imkoniyatlar ikonkasi · "Kirish" | Shunday qilinadi; 112 SOS → Hisobot kalendari |
| 9 | Footer 3 ustun | Logo + to'liq nom, "Ctrl+Enter" eslatmasi, 3 ustun, ijtimoiy tarmoqlar, huquqiy havolalar | Shunday qilinadi |
| 10 | — | O'ng pastda doimiy chat tugmasi | Mavjud `FloatingSupport` (Stat AI) shu joyda |

## 3. Kabinet

Kabinet sahifalari login talab qiladi va skript bilan olinmadi (robots.txt ham yopadi). MG-12 uchun my.gov.uz kabinetining 3–4 skrinshoti kerak (OS-MG-09). Ular bo'lmaguncha MYGOV_DIZAYN.md MG-12 dagi tartib ishlatiladi.
