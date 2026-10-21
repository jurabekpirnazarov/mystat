# my.gov.uz bilan o'xshashlik tekshiruvi (MG-00, MG-15)

> **Tekshirilgan sana:** 2026-10-21 · **Usul:** MYGOV_DIZAYN.md 1.12. Har band "bor/yo'q", piksel taqqoslash emas.
> Asos — jonli my.gov.uz (MG-00 skrinshotlari, `README.md` 2-bo'limi), hujjatdagi taxminlar emas.
> Belgilar: ✅ bor · ❌ yo'q · ➖ istisno (ataylab farq qiladi, hisobga olinmaydi).

## 1. Tuzilma va tartib

| # | Band | my.gov.uz | my.stat.uz | Holat |
|---|---|---|---|---|
| 1.1 | Skip-link birinchi fokusda | bor | "Asosiy kontentga o'tish" | ✅ |
| 1.2 | Chapda doimiy ko'k sidebar, ikki guruh | "Xizmatlar", "Yordam va qo'llab-quvvatlash" | xuddi shunday (`Sidebar.tsx`) | ✅ |
| 1.3 | Header: portal nomi chapda, 2 qator, katta harflarda | bor | bor | ✅ |
| 1.4 | Header: qidiruv ikonkasi (bosh sahifadan tashqari) | bor | bor | ✅ |
| 1.5 | Header: "112 SOS" | bor | Hisobot muddati (eng yaqin sana) | ➖ |
| 1.6 | Header: telefon + "Qayta aloqa" | 1242 | +998 71 233-45-67 | ✅ |
| 1.7 | Header: til almashtirgich | "O'z ▾" | "O'z ▾" (O'z · Ўз · Ру) | ✅ |
| 1.8 | Header: maxsus imkoniyatlar | bor | shrift o'lchami, tungi rejim | ✅ |
| 1.9 | Header: "Kirish" gradientli tugma; kirgandan keyin "Xush kelibsiz!" + ism | bor | bor | ✅ |
| 1.10 | Ichki sahifalarda breadcrumb | bor | layout darajasida, sahifadagi takror olib tashlandi | ✅ |
| 1.11 | Bosh sahifa: hero (salom, qidiruv, plitkalar bitta gradient blokda) | bor | bor | ✅ |
| 1.12 | Bosh sahifa: 2 ta shaxsiy blok | bor | "Hisobotlarim"/"Savollarim" + "Shaxsiy xabarnomalar" | ✅ |
| 1.13 | Bosh sahifa: "Sohalar" + "Barcha xizmatlar" | 25 soha | 14 soha | ✅ |
| 1.14 | Bosh sahifa: "Hayotiy vaziyatlar" | bor | 9 ta vaziyat | ✅ |
| 1.15 | Bosh sahifa: "Portal imkoniyatlari" | bor | bor | ✅ |
| 1.16 | Bosh sahifa: "Portal imkoniyatlarini raqamlarda kashf eting" | bor | bor (haqiqiy raqamlar) | ✅ |
| 1.17 | Bosh sahifa: "Ommabop xizmatlar" kartochkalari | bor | bor | ✅ |
| 1.18 | Bosh sahifa: "Mobil ilova" bloki | bor | ilova yo'q | ➖ |
| 1.19 | Sahifa oxirida "Oxirgi o'zgartirilgan sana" | sahifa o'zgargan sana | build sanasi | ✅ |
| 1.20 | Sahifa oxirida fikr vidjeti + "N kishi ma'qul deb topdi" | bor | bor | ✅ |
| 1.21 | Soha sahifasi: chapda "Sohalar" akkordeoni, joriysi birinchi, kichik toifalar | bor | bor | ✅ |
| 1.22 | Soha sahifasi: H1 + xizmatlar soni | "Iqtisodiyot va biznes (42)" | "Tashqi savdo (3)" | ✅ |
| 1.23 | Soha sahifasi: "Xizmatni izlash" maydoni | bor | bor | ✅ |
| 1.24 | Soha sahifasi: "Kengaytirilgan qidiruv" tugmasi | bor | bor (foydalanuvchi turi, narx) | ✅ |
| 1.25 | Soha sahifasi: 2 ustunli xizmat kartochkalari | bor | bor | ✅ |
| 1.26 | Xizmat: ko'k hero, ikonka va nom | bor | bor | ✅ |
| 1.27 | Xizmat: "Bajarish vaqti" va "marotaba foydalanilgan" | bor | bor | ✅ |
| 1.28 | Xizmat: reyting (yulduzlar, son) | bor | bor | ✅ |
| 1.29 | Xizmat: "Ariza yuborish" (yashil), "Tanlanganlarga qo'shish", ulashish | bor | bor ("Xizmatdan foydalanish" — ko'rish turidagi xizmatlarda) | ✅ |
| 1.30 | Xizmat: video ko'rsatma | bor | videolar yo'q | ➖ |
| 1.31 | Xizmat: 2 ustunli ikonkali yig'iladigan bo'limlar (narx, foydalanuvchilar, huquqiy asos, aloqa, muddat, tashkilot, hujjatlar, "Bu qanday ishlaydi?") | bor | bor, 8 ta | ✅ |
| 1.32 | Xizmat: "Umumiy statistika" (to'liq kenglik) | bor | bor, davr filtri va oylik grafik | ✅ |
| 1.33 | Xizmat: "Baho va sharhlar" — o'rtacha, taqsimot, saralash, sharhlar | bor | bor | ✅ |
| 1.34 | Xizmat: sharhga "Foydali / Foydasiz" | bor | bor (`ServiceReviewVote`, bir foydalanuvchi — bitta ovoz) | ✅ |
| 1.35 | Qidiruv: H1 "Izlash", tagi chizilgan maydon | bor | bor | ✅ |
| 1.36 | Qidiruv: "Ommabop so'rovlar" chip'lari | bor | bor | ✅ |
| 1.37 | Qidiruv: "Xizmatlar" (`#raqam`) va "Barchasini ko'rish" | bor | bor | ✅ |
| 1.38 | Qidiruv: "Ko'p beriladigan savollar" bo'limi | bor | bor (+ korxonalar, maqolalar, lug'at) | ✅ |
| 1.39 | Footer: logo + to'liq nom | bor | bor | ✅ |
| 1.40 | Footer: Ctrl+Enter eslatmasi | bor | bor | ✅ |
| 1.41 | Footer: 3 ustun (Ma'lumot · Foydalanuvchilar uchun · Aloqa) | bor | bor | ✅ |
| 1.42 | Footer: ijtimoiy tarmoqlar, huquqiy havolalar | bor | bor | ✅ |
| 1.43 | Footer: hamkor logolari (egov, uzinfocom) | bor | stat.uz havolasi | ➖ |
| 1.44 | O'ng pastda doimiy chat tugmasi | bor | Stat AI / operator | ✅ |

## 2. Komponentlar

| # | Band | Holat |
|---|---|---|
| 2.1 | Sidebar sichqoncha borganda yozuvlar bilan ochiladi, faol band ajratilgan | ✅ |
| 2.2 | Til ro'yxatida "English BETA", "Qaraqalpaqsha BETA" | ➖ (OS-MG-02: faqat uz/cry/ru) |
| 2.3 | Plitkalar: rasmli "story" kartochkalar | ❌ (rasm o'rnida gradient + ikonka; o'z illyustratsiyalari kerak) |
| 2.4 | Shaxsiy bloklarda illyustratsiya va son belgisi | ✅ |
| 2.5 | Soha kartochkasi: nuqtali 2 xizmat, "› Barchasi", o'ng pastda och doira ikonka | ✅ |
| 2.6 | Xizmat kartochkasi: `#raqam`, doira ikonka, reyting · foydalanish · vaqt, yulduzcha | ✅ |
| 2.7 | Vaziyat kartochkasi: och ko'k kvadrat ikonka + nom | ✅ |
| 2.8 | Fikr vidjeti: chegarali "Ha 👍" / "Yo'q 👎" | ✅ |
| 2.9 | Kabinet: umumiy layout ichida, chap menyu (MG-12 tartibi) | ✅ (my.gov.uz kabineti skrinshotlarsiz, OS-MG-09) |

## 3. Dizayn tokenlari (`tokens.json` bilan, ±2 px / bir xil hex)

| # | Token | my.gov.uz | my.stat.uz | Holat |
|---|---|---|---|---|
| 3.1 | Shrift | Montserrat | Montserrat (Google Fonts) | ✅ |
| 3.2 | Asosiy rang | `#0068E0` | `--mg-primary` `#0068E0` | ✅ |
| 3.3 | Sahifa foni | `#F2F4F7` | `#F2F4F7` | ✅ |
| 3.4 | Kartochka radiusi | 14px | 14px | ✅ |
| 3.5 | Sidebar: kenglik / radius / chekka | 85 / 25 / 22px | 85 / 25 / 22px | ✅ |
| 3.6 | Hero gradienti | `65.97deg, #0068E0 33.59%, #00DC82 122.33%` | xuddi shunday | ✅ |
| 3.7 | "Kirish" tugmasi: gradient, 48px, soya | bor | xuddi shunday | ✅ |
| 3.8 | Bo'lim sarlavhasi: 24.5px / 400 / asosiy rang | bor | xuddi shunday | ✅ |
| 3.9 | Soha kartochkasi sarlavhasi: 17px / 700 | bor | xuddi shunday | ✅ |
| 3.10 | Yashil tugma `#2DB257`, ma'lumot bloki foni `#E5EFFC` | bor | xuddi shunday | ✅ |
| 3.11 | Kontent boshlanishi (1280 px da x = 137) | 137 | 22 + 85 + 30 = 137 | ✅ |
| 3.12 | Footer: sarlavha `#151515` 14.5px/700, havola `#454545` 14.4px | bor | xuddi shunday | ✅ |

## 4. Xatti-harakat

| # | Band | Holat |
|---|---|---|
| 4.1 | Har URL til prefiksi bilan (`/uz/...`) | ❌ Prefiks faqat kirish nuqtasi: `/ru/...` tilni o'rnatib prefikssiz manzilga o'tadi (60+ sahifadagi havolalarni qayta yozmaslik uchun) |
| 4.2 | Plitkalar gorizontal skroll (360 px da sahifa skrolli yo'q) | ✅ (e2e) |
| 4.3 | Mobil menyu (burger), Esc bilan yopiladi | ✅ (e2e) |
| 4.4 | Matnni belgilab Ctrl+Enter — xato xabari | ✅ |
| 4.5 | Qidiruvda `#raqam` — to'g'ridan-to'g'ri xizmat | ✅ (e2e) |
| 4.6 | Soha filtrlari URL'da, qayta ochilganda tiklanadi | ✅ (e2e) |
| 4.7 | "Tanlanganlarga qo'shish" kabinetda ko'rinadi | ✅ |
| 4.8 | Fikr: bir sahifaga kuniga bir marta | ✅ (backend test) |
| 4.9 | axe-core tekshiruvi CI'da | ❌ (kutubxona qo'shilmadi — yangi bog'liqlik uchun ruxsat kerak) |

## Natija

| Guruh | ✅ | ❌ | ➖ istisno |
|---|---|---|---|
| 1. Tuzilma | 40 | 0 | 4 |
| 2. Komponentlar | 7 | 1 | 1 |
| 3. Tokenlar | 12 | 0 | 0 |
| 4. Xatti-harakat | 7 | 2 | 0 |
| **Jami** | **66** | **3** | **5** |

**O'xshashlik: 66 / 69 = 95,7%** (istisnolarsiz). Maqsad ≥ 98% — **bajarilmagan**.

98% ga yetish uchun qolgan 3 band (yangi vazifalar taklifi):
1. **2.3** — plitkalar uchun 12 ta o'z illyustratsiyasi (dizayner ishi; `frontend/src/assets/popular/`).
2. **4.1** — to'liq til prefiksli URL: barcha ichki havolalarni `useLangPath()` orqali yasash.
3. **4.9** — `@axe-core/playwright` ni e2e'ga qo'shish (bog'liqlik qo'shishga ruxsat kerak).

Ikkitasi bajarilsa: 68 / 69 = 98,6% — maqsadga yetadi.
