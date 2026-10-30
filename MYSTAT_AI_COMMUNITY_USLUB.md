# MyStat: AI Community Uzbekistan uslubiga moslash

> **Sana:** 2026-10-29 · **Asos:** foydalanuvchi yuborgan "AI Community Uzbekistan — sayt dizayni" spetsifikatsiyasi.
> **Namuna sahifa:** [`ai_community_uslub/namuna.html`](ai_community_uslub/namuna.html) (Artifact: https://claude.ai/artifact/5SyqrrRiaNTTS2XSxfQiYi)
> **Solishtirilgan hujjatlar:** `HIBRID_DIZAYN.md` (3-bo'lim tokenlari, Z-01..Z-17), `DIZAYN_HOZIRGI_HOLAT.md`, `BARCHA_XIZMATLAR.md`, `HISOBOT_TOPSHIRISH_VA_YANGI_FUNKSIYALAR.md`, `mobil_namuna/report_forms.json`.

## 1. Qisqacha

AI Community sahifasining vizual tili (iliq och fon, lojuvard ko'k, oltin aksent, girih naqshi, Unbounded + Manrope) va bo'lim tuzilmasi o'zgarishsiz olindi. Mazmun MyStat'ga almashtirildi: jamiyat o'rniga portal, "Nima qilamiz" o'rniga xizmatlar, tadbirlar o'rniga hisobot muddatlari, "Qo'shilish" formasi o'rniga muddat eslatmasi.

Bu uslub `HIBRID_DIZAYN.md` dagi qabul qilingan `--ds-*` tokenlariga **zid** (4-bo'lim). Shuning uchun uni butun portalga emas, avval bitta sahifaga (taklif: bosh sahifa hero'si yoki `/about`) sinab ko'rish tavsiya etiladi.

## 2. Bo'limlar xaritasi

| AI Community | MyStat | Anchor | Izoh |
|---|---|---|---|
| Menyu: Biz haqimizda · Nima qilamiz · Tadbirlar · **Qo'shilish** | Portal haqida · Xizmatlar · Hisobot muddatlari · **Kabinetga kirish** | `#portal`, `#xizmatlar`, `#muddatlar`, `#eslatma` | Haqiqiy saytda menyu `HIBRID` 7.1 dagi 5 band bo'ladi; bu faqat landing namunasi |
| Logo: ikki kvadratli yulduz | Xuddi shu yulduz, markazida 3 ta ustun (diagramma) | — | Ko'k nuqta o'rniga ustunlar: "statistika" belgisi |
| Hero | Hero | `#top` | Girih + markazda katta yulduz ichida ustunli diagramma |
| Biz haqimizda | Portal haqida | `#portal` | Ikki ustun 1:2 saqlangan |
| Nima qilamiz (4 karta) | Xizmatlar (4 karta) | `#xizmatlar` | Har kartaga narx yozuvi qo'shildi (`BARCHA_XIZMATLAR` 2.1) |
| Tadbirlar (ro'yxat) | Hisobot muddatlari (ro'yxat) | `#muddatlar` | 4-ustun qo'shildi: keyingi muddat sanasi. "Namuna" belgisi bilan |
| Qo'shilish (to'q bo'lim + forma) | Muddat eslatmasi (to'q bo'lim + forma) | `#eslatma` | YF-04 (Telegram eslatma) g'oyasi |
| Footer | Footer | — | Aloqa · Reglamentlar · Ochiq API · Telegram |

## 3. Matnlar (eski → yangi)

### 3.1. Hero
| Element | AI Community | MyStat |
|---|---|---|
| Badge | O'zbek tilidagi AI hamjamiyati | Korxonalar va fuqarolar uchun rasmiy statistika |
| H1 | Kuchlilarni bir joyga yig'amiz va **birga o'samiz** | Hisobot, raqam va xizmat **bir oynada** |
| Lead | AI sohasidagi o'zbek mutaxassislari uchun samimiy jamiyat... | Hisobot topshirish muddatlari, O'zbekiston bo'yicha rasmiy ko'rsatkichlar va statistik xizmatlar bitta portalda. Har bir raqamning manbasi va davri yozilgan. |
| Asosiy tugma | Jamiyatga qo'shilish → | Kabinetga kirish → |
| Ikkinchi tugma | Telegram kanal | Ko'rsatkichlarni ko'rish |
| Qo'shimcha qator (yangi) | — | 3 til · OneID orqali kirish · Ochiq API |

Muqobil H1 variantlari: "Rasmiy raqamlar **ochiq**, hisobotlar **o'z vaqtida**" · "Korxonangiz statistikasi **bir joyda**".

### 3.2. Portal haqida
- Yorliq: PORTAL HAQIDA
- H2: Statistika bilan ishlash oson bo'lsin
- 1-xatboshi: Avval korxona hisobot muddatini, kerakli ko'rsatkichni yoki ma'lumotnomani topish uchun bir nechta saytni aylanib chiqardi. Buxgalter muddatni eslab yurishi, rahbar esa raqamni qayerdan olishni bilishi kerak edi.
- 2-xatboshi: my.stat.uz shularni bir joyga yig'adi: hisobot kalendari, ko'rsatkichlar va hududlar, kontragent kartasi, konsultatsiya va pullik xizmatlar. Raqamlar rasmiy manbadan olinadi va qaysi davrga tegishli ekani doim ko'rsatiladi.
- 3-xatboshi (qalin): Savolingiz bo'lsa, Stat AI yordamchisi yoki operator darhol javob beradi.

### 3.3. Xizmatlar
- Yorliq: XIZMATLAR · H2: Eng ko'p ishlatiladigan to'rt xizmat · o'ngda "Barcha xizmatlar →" (`/all-services`)

| Ikonka | Sarlavha | Matn | Narx yozuvi | Route |
|---|---|---|---|---|
| Kalendar | Hisobot kalendari | Shaklingiz bo'yicha topshirish muddati, qolgan kunlar va muddatdan oldin eslatma. | Bepul | `/report-calendar` |
| Ustunli diagramma | Ko'rsatkichlar | Iqtisodiyot, aholi, mehnat va narxlar bo'yicha rasmiy raqamlar, hududlar kesimida. | Bepul | `/dashboards/...` |
| Bino | Kontragent kartasi | STIR bo'yicha korxona ma'lumoti: faoliyat turi, hudud, o'lcham va statistik intizom. | Qidiruv bepul | `/check` |
| Ikki odam | Konsultatsiya | Statistik konsultant bilan onlayn uchrashuv band qiling va savolingizga javob oling. | Paket limiti bilan | `/consultation` |

Ikonkalar AI Community qoidasi bo'yicha: chiziqli SVG, 24×24, stroke 1.6–2, rang lojuvard, emoji yo'q.

### 3.4. Hisobot muddatlari (Tadbirlar o'rniga)
- Yorliq: HISOBOT MUDDATLARI · H2: Qachon nima topshiriladi · o'ngda "Namuna" belgisi
- Ustunlar: davriylik (ko'k) · shakl kodi + nomi (22px, qalin) · qoida · **keyingi muddat** (yangi ustun, `tabular-nums`)

| Davriylik | Shakl | Qoida | Keyingi muddat (2026-10-29 holatiga) |
|---|---|---|---|
| Har oy | MEHNAT · Mehnat bo'yicha hisobot | Oy tugaganidan keyin 10 kun ichida | 10.11.2026 (oktyabr) |
| Har chorak | INVEST · Investitsiyalar bo'yicha hisobot | Chorak tugaganidan keyin 20 kun ichida | 20.01.2027 (IV chorak) |
| Har chorak | 1-KB · Kichik korxona faoliyati | Chorak tugaganidan keyin 25 kun ichida | 25.01.2027 (IV chorak) |
| Har yil | 1-KORXONA · Korxona faoliyati, yillik | Yil tugaganidan keyin 90 kun ichida | 31.03.2027 (2026-yil) |

Manba: `mobil_namuna/report_forms.json` (`is_sample: true`), shuning uchun "Namuna" belgisi majburiy. Haqiqiy sahifada sanalar HT-01 (muddatni davr qoidasidan hisoblash) tuzatilgandan keyin API'dan olinadi. Dam olish kuniga tushgan muddat (HT-10) hisobga olinmagan.

- Izoh qatori: "Eng yaqin muddat: **10-noyabr, Mehnat bo'yicha hisobot**. To'liq ro'yxat hisobot kalendarida, korxonangizga tegishlilari kabinetda."

### 3.5. Muddat eslatmasi (Qo'shilish o'rniga)
- H2: Muddatni o'tkazib yubormang
- Matn: Kichik korxona bo'lasizmi yoki yirik zavod, hisobot muddati hammaga bir xil muhim. STIR va kontaktingizni qoldiring, muddatdan 5 kun oldin eslatamiz.
- Och oltin havola: Yoki OneID orqali kabinetga kiring va barcha hisobotlaringizni bir joyda ko'ring →
- Forma:

| Maydon | Turi | Placeholder / variantlar |
|---|---|---|
| Korxona STIR | text, `inputmode=numeric`, 9 raqam | 301234567 |
| Telegram yoki email | text | @username |
| Qaysi hisobotlar | select | Hammasi · Oylik · Choraklik · Yillik |
| — | tugma | **Eslatmani yoqish** |

"5 kun" `report_forms.json` dagi `due_soon.days = 5` bilan bir xil. Forma hozir faqat dizayn; ulash YF-04 (Telegram eslatma) yoki mavjud `remind` API orqali, Celery Beat production'da ko'tarilgandan keyin.

### 3.6. Footer
- Chapda: kichik logo + "my.stat.uz · Toshkent"
- O'ngda: Aloqa · Reglamentlar · Ochiq API · Telegram

## 4. Mavjud dizayn bilan ziddiyatlar

| # | Masala | `HIBRID_DIZAYN.md` (qabul qilingan) | AI Community uslubi | Taklif |
|---|---|---|---|---|
| 1 | Sahifa foni | `--ds-bg #F4F6FA` (sovuq kulrang) | `#F7F4EE` (iliq qum rang) | Faqat landing/hero'da iliq fon; kabinet va jadvallar sovuq fonda qoladi |
| 2 | Asosiy rang | `--ds-primary #1D5FBF`, navy `#0E2647` | Lojuvard `#1F3F8F` | Yaqin rang. `#1F3F8F` ni `--ds-primary` sifatida olsa bo'ladi (oq fonda kontrast yuqoriroq), lekin grafiklar seriyasi (`--ds-series-export`) ham o'zgaradi |
| 3 | Urg'u rangi | `--ds-accent #F0A14A` (to'q sariq), `--ds-accent-strong #C07A2A` | Oltin `#C08A2E`, och oltin `#F2C46B` | Juda yaqin. Oltinni `--ds-accent-strong` ga, och oltinni to'q fondagi CTA'ga berish mumkin |
| 4 | Shrift | Inter (Z-02, OS-H-01), raqamlar uchun `tabular-nums` | Unbounded (sarlavha) + Manrope (matn) | Unbounded faqat H1/H2 da. Manrope'ning `tnum` qo'llashi va kirill harflari kabinet jadvallarida tekshirilishi kerak; jadval va KPI uchun Inter qolishi xavfsizroq |
| 5 | H1 o'lchami | 40/48 (mobil 28/36) | 40–76 px | Faqat bosh sahifa hero'sida katta o'lcham |
| 6 | Radius | 6 (tugma, input), 10 (karta) | 12 (tugma), 16 (karta), 18 (forma) | Ommaviy sahifalarda 12/16 sinab ko'rish, kabinetda 6/10 qoladi |
| 7 | Header | To'q ko'k header + 5 bandli menyu + rasmiy `TopBar` (Z-03) | Och fonli header, 3 havola + tugma | Rasmiy davlat portali uchun `TopBar` majburiy qoladi; och header faqat landing'da |
| 8 | Bosh sahifadagi kalendar | Mehmonga "Yaqin e'lonlar", hisobot muddatlari `TopBar`/kabinetda (Z-16) | Namunada bosh sahifada hisobot muddatlari ro'yxati | Agar bosh sahifada bo'lsa, Z-16 qarorini qayta ko'rish kerak; aks holda bu ro'yxat `/report-calendar` sahifasining yuqori qismiga mos |
| 9 | Footer | 3 ustun + huquqiy qator (Z-11, MG-09) | Bitta qator | MG-09 footer qoladi, faqat ranglar va logo olinadi |
| 10 | Tungi rejim | Bor (`--ds-*` tungi qiymatlari) | Spetsifikatsiyada yo'q | Namunada tungi palitra qo'shildi (fon `#0F1626`, ko'k `#8EA9EC`, oltin `#D9A64E`) |
| 11 | Girih naqshi | Yo'q | 80×80 pattern, sakkiz qirrali yulduz | Yangi, ziddiyat yo'q. Hero, to'q bo'limlar va bo'sh holatlar (`EmptyState`) uchun yaxshi milliy belgi |

## 5. Tavsiya

1. **Eng arzon yo'l:** girih naqshi, yangi logo g'oyasi va oltin aksentni hozirgi `--ds-*` tokenlariga qo'shish (`--ds-pattern`, `--ds-gold`). Boshqa hech narsa o'zgarmaydi.
2. **O'rta yo'l:** ommaviy zonada (bosh sahifa hero, `/about`, xizmat sahifalari) iliq fon + Unbounded sarlavhalar; kabinet (M zona) `HIBRID` bo'yicha qoladi.
3. **To'liq almashtirish** `HIBRID_DIZAYN` ning Z-01, Z-02, Z-03 qarorlarini bekor qiladi va OS-H-01, OS-H-02 savollariga yangi javob kerak bo'ladi.

## 6. Ochiq savollar

- Qaysi yo'l tanlanadi (5-bo'lim 1, 2 yoki 3)?
- Logo: MyStat'ning rasmiy logosi bormi yoki yulduz + ustunlar g'oyasi ishlatilsinmi?
- Tashkilot nomi (Z-17): hero va footer'da "Statistika agentligi" yoki "Statistika qo'mitasi"?
- Bosh sahifada hisobot muddatlari ro'yxati bo'lsinmi (Z-16 ga zid)?
- Telegram havolasi va bot nomi.
