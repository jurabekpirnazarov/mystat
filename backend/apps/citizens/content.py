"""FQ-07 "Statistika oddiy tilda": maqolalar va lug'at (S-15 seed manbasi).

Matnlar tushunchalarni tushuntiradi va aniq statistik raqam keltirmaydi; misollardagi raqamlar
"masalan" deb belgilangan shartli raqamlar. Kirill varianti transliteratsiya bilan yaratiladi.
"""

ARTICLES = [
    {
        "slug": "inflyatsiya-nima",
        "topic": "prices",
        "minutes": 4,
        "title_uz": "Inflyatsiya nima va u hamyonimizga qanday ta'sir qiladi?",
        "title_ru": "Что такое инфляция и как она влияет на наш кошелёк?",
        "summary_uz": "Narxlarning umumiy o'sishi, pulning xarid qobiliyati va nima uchun maosh oshsa ham ba'zan kamroq narsa sotib olamiz.",
        "summary_ru": "Общий рост цен, покупательная способность денег и почему при росте зарплаты мы иногда можем купить меньше.",
        "related": [{"label": "Inflyatsiya kalkulyatori", "to": "/cpi-calculator"}, {"label": "Narxlar monitoringi", "to": "/prices"}],
        "body_uz": """**Inflyatsiya** — bu tovar va xizmatlar narxlarining umumiy darajasi vaqt o'tishi bilan oshishi. Bitta mahsulot qimmatlashishi hali inflyatsiya emas: inflyatsiya haqida ko'pchilik narxlar birga o'sganda gapiriladi.

## Pulning xarid qobiliyati

Inflyatsiya bo'lganda bir xil pulga avvalgidan kamroq narsa sotib olinadi. Masalan, yil boshida 100 ming so'mga 10 ta mahsulot olingan bo'lsa va yil davomida narxlar o'rtacha 10% oshsa, yil oxirida o'sha pulga taxminan 9 ta mahsulot olinadi (bu shartli misol).

## Inflyatsiya qanday o'lchanadi?

Statistika organlari har oy yuzlab tovar va xizmatlar narxini kuzatadi va ularni **iste'mol narxlari indeksi (ISN)** ga birlashtiradi. Har bir mahsulotning indeksdagi og'irligi oilalar xarajatlarida uning ulushiga qarab belgilanadi: non va go'shtning og'irligi, masalan, zargarlik buyumlarinikidan katta.

## Nima uchun maosh oshsa ham "yetmaydi"?

Maosh 15% oshgan, narxlar esa 12% oshgan bo'lsa, **real** maosh atigi taxminan 3% ga oshgan bo'ladi. Shuning uchun nominal (yozilgan) summa emas, inflyatsiyadan tozalangan real o'zgarish muhim.

## Amaliy maslahat

- Omonat yoki kredit foizini inflyatsiya bilan solishtiring: foiz inflyatsiyadan past bo'lsa, omonat real qiymatini yo'qotadi.
- Uzoq muddatli rejalarni (ijara, ta'lim to'lovi) inflyatsiyani hisobga olib tuzing.
- Saytdagi inflyatsiya kalkulyatori bilan o'tgan yillardagi summani bugungi narxlarga o'tkazib ko'ring.""",
    },
    {
        "slug": "iste-mol-narxlari-indeksi",
        "topic": "prices",
        "minutes": 5,
        "title_uz": "Iste'mol narxlari indeksi qanday hisoblanadi?",
        "title_ru": "Как рассчитывается индекс потребительских цен?",
        "summary_uz": "\"Iste'mol savati\", mahsulot og'irliklari va nima uchun sizning shaxsiy inflyatsiyangiz rasmiy raqamdan farq qilishi mumkin.",
        "summary_ru": "«Потребительская корзина», веса товаров и почему ваша личная инфляция может отличаться от официальной.",
        "related": [{"label": "Inflyatsiya kalkulyatori", "to": "/cpi-calculator"}],
        "body_uz": """**Iste'mol narxlari indeksi (ISN, inglizcha CPI)** — oilalar sotib oladigan tovar va xizmatlar to'plami narxining tanlangan bazaviy davrga nisbatan o'zgarishi.

## Uch bosqich

1. **Savat tanlanadi.** Uy xo'jaliklari byudjeti so'rovlari asosida oilalar eng ko'p pul sarflaydigan tovar va xizmatlar ro'yxati tuziladi: oziq-ovqat, kiyim, kommunal xizmatlar, transport, ta'lim va hokazo.
2. **Narxlar yig'iladi.** Har oy turli hududlardagi do'kon va bozorlardan bir xil mahsulotlarning narxi qayd etiladi.
3. **Og'irliklar qo'llanadi.** Har bir mahsulot narxining o'zgarishi oilalar xarajatlaridagi ulushiga ko'paytiriladi va yig'iladi.

## Indeksni o'qish

Indeks 100 dan yuqori bo'lsa narxlar bazaviy davrga nisbatan oshgan. Masalan, 108,5 — narxlar 8,5% oshgan degani (shartli misol).

## Nega sizning inflyatsiyangiz boshqacha?

Rasmiy indeks "o'rtacha oila" savati bo'yicha. Agar oilangiz daromadining katta qismini, masalan, ijaraga sarflasa va ijara narxi tez o'sayotgan bo'lsa, sizning shaxsiy inflyatsiyangiz rasmiy ko'rsatkichdan yuqori bo'ladi. Saytdagi "savat" kalkulyatorida o'z savatingizni tuzib ko'rishingiz mumkin.""",
    },
    {
        "slug": "yaim-qanday-hisoblanadi",
        "topic": "economy",
        "minutes": 5,
        "title_uz": "Yalpi ichki mahsulot (YaIM) qanday hisoblanadi?",
        "title_ru": "Как рассчитывается валовой внутренний продукт (ВВП)?",
        "summary_uz": "Iqtisodiyot hajmini o'lchashning uch usuli, nominal va real YaIM, nima uchun aholi jon boshiga hisoblash muhim.",
        "summary_ru": "Три способа измерить размер экономики, номинальный и реальный ВВП, почему важен расчёт на душу населения.",
        "related": [{"label": "Hududlar profili", "to": "/regions"}],
        "body_uz": """**YaIM** — mamlakat hududida ma'lum davr (chorak yoki yil) davomida ishlab chiqarilgan barcha yakuniy tovar va xizmatlarning bozor qiymati.

## Uch usul — bitta natija

- **Ishlab chiqarish usuli:** har bir tarmoq yaratgan qo'shilgan qiymat (sotuv minus xom ashyo va xizmatlar xarajati) yig'iladi.
- **Daromadlar usuli:** ish haqi, korxonalar foydasi va soliqlar yig'iladi.
- **Xarajatlar usuli:** uy xo'jaliklari iste'moli, investitsiyalar, davlat xarajatlari va sof eksport yig'iladi.

Nazariy jihatdan uch usul bir xil natija beradi; amalda farqlar statistik tuzatishlar bilan muvofiqlashtiriladi.

## Nominal va real

Nominal YaIM joriy narxlarda hisoblanadi, shuning uchun narxlar oshsa, ishlab chiqarish o'zgarmasa ham u o'sadi. **Real YaIM** narxlar o'zgarishidan tozalanadi va iqtisodiyot haqiqatan qancha ko'p mahsulot ishlab chiqarganini ko'rsatadi. Iqtisodiy o'sish haqida gap ketganda odatda real o'sish nazarda tutiladi.

## Aholi jon boshiga

Katta mamlakatda YaIM katta bo'lishi tabiiy. Turmush darajasini solishtirish uchun YaIM aholi soniga bo'linadi. Hududlar uchun xuddi shu ko'rsatkich **YaHM** (yalpi hududiy mahsulot) deyiladi.""",
    },
    {
        "slug": "yahm-va-hududlar",
        "topic": "economy",
        "minutes": 3,
        "title_uz": "Yalpi hududiy mahsulot: hududlar iqtisodiyotini qanday solishtirish mumkin?",
        "title_ru": "Валовой региональный продукт: как сравнивать экономику регионов?",
        "summary_uz": "YaHM nima, nega poytaxt ko'rsatkichi yuqori va hududlarni solishtirishda nimalarga e'tibor berish kerak.",
        "summary_ru": "Что такое ВРП, почему у столицы он выше и на что обращать внимание при сравнении регионов.",
        "related": [{"label": "Hududlar profili", "to": "/regions"}],
        "body_uz": """**Yalpi hududiy mahsulot (YaHM)** — viloyat yoki shahar hududida yaratilgan qo'shilgan qiymat. Barcha hududlar YaHM ining yig'indisi mamlakat YaIM iga yaqin bo'ladi.

## Solishtirishda e'tibor bering

- **Aholi jon boshiga** hisoblang: aholisi ko'p hududning umumiy YaHM i katta bo'lishi tabiiy.
- **Tarmoq tuzilmasi:** sanoat yoki tog'-kon korxonalari joylashgan hududda YaHM yuqori bo'lishi mumkin, lekin bu aholining daromadi ham shunchalik yuqori degani emas.
- **Bosh ofislar effekti:** yirik kompaniyalar bosh ofisi joylashgan shaharda (odatda poytaxtda) qo'shilgan qiymat ko'proq qayd etiladi.

Hududiy profil sahifasida YaHM ni ish haqi, ishsizlik va boshqa ko'rsatkichlar bilan birga ko'ring — bitta ko'rsatkich to'liq manzara bermaydi.""",
    },
    {
        "slug": "ishsizlik-darajasi",
        "topic": "labour",
        "minutes": 4,
        "title_uz": "Ishsizlik darajasi: kim ishsiz hisoblanadi?",
        "title_ru": "Уровень безработицы: кто считается безработным?",
        "summary_uz": "Iqtisodiy faol aholi, ishsizlik ta'rifi va nima uchun ishlamayotgan har bir kishi ham ishsiz emas.",
        "summary_ru": "Экономически активное население, определение безработицы и почему не каждый неработающий — безработный.",
        "related": [{"label": "Hududlar profili", "to": "/regions"}],
        "body_uz": """Xalqaro mehnat tashkiloti ta'rifiga ko'ra **ishsiz** — bu:

1. so'nggi haftada ishi bo'lmagan,
2. faol ish qidirgan,
3. yaqin ikki hafta ichida ishga chiqishga tayyor bo'lgan kishi.

## Ishsizlik darajasi

Ishsizlik darajasi = ishsizlar soni ÷ **iqtisodiy faol aholi** × 100. Iqtisodiy faol aholi — band (ishlayotgan) va ishsizlar yig'indisi.

## Kimlar hisobga kirmaydi?

Talabalar, nafaqaxo'rlar, uy bekalari va ish qidirmayotganlar iqtisodiy **nofaol** hisoblanadi. Shuning uchun ishlamayotgan har bir kishi ishsiz emas.

## Qanday aniqlanadi?

Ishsizlik asosan **uy xo'jaliklari tanlanma so'rovi** (ishchi kuchi so'rovi) orqali baholanadi: tasodifiy tanlangan oilalar bilan suhbat o'tkaziladi va natija butun aholiga tarqatiladi. Bandlik organlarida ro'yxatdan o'tganlar soni odatda haqiqiy ishsizlardan kam bo'ladi, chunki hamma ham ro'yxatdan o'tmaydi.""",
    },
    {
        "slug": "o-rtacha-va-median-ish-haqi",
        "topic": "labour",
        "minutes": 4,
        "title_uz": "O'rtacha va median ish haqi: qaysi biri haqiqatga yaqin?",
        "title_ru": "Средняя и медианная зарплата: какая ближе к реальности?",
        "summary_uz": "Nima uchun ko'pchilik \"o'rtacha maosh\"dan kam oladi va median nimani ko'rsatadi.",
        "summary_ru": "Почему большинство получает меньше «средней зарплаты» и что показывает медиана.",
        "related": [{"label": "Mening maoshim", "to": "/my-salary"}],
        "body_uz": """**O'rtacha ish haqi** — barcha xodimlar maoshi yig'indisi xodimlar soniga bo'linadi. **Median** — xodimlarni maoshi bo'yicha tartiblaganda o'rtada turgan kishining maoshi: yarmi undan kam, yarmi ko'p oladi.

## Nega ular farq qiladi?

Oz sonli juda yuqori maoshlar o'rtachani yuqoriga tortadi. Masalan, 9 kishi 3 mln, 1 kishi 30 mln so'm olsa, o'rtacha 5,7 mln, median esa 3 mln bo'ladi (shartli misol). Ko'pchilik uchun median "odatiy" maoshni yaxshiroq ko'rsatadi.

## Kvartillar va persentillar

- **25-persentil (p25):** xodimlarning chorak qismi bundan kam oladi.
- **75-persentil (p75):** xodimlarning to'rtdan uch qismi bundan kam oladi.
- **90-persentil (p90):** eng yuqori maoshli 10% ning chegarasi.

"Mening maoshim" sahifasida maoshingizni hudud va tarmoq taqsimoti bilan solishtiring — kiritgan summangiz serverga yuborilmaydi.""",
    },
    {
        "slug": "aholi-soni-qanday-aniqlanadi",
        "topic": "population",
        "minutes": 4,
        "title_uz": "Aholi soni qanday aniqlanadi?",
        "title_ru": "Как определяется численность населения?",
        "summary_uz": "Ro'yxatga olish, joriy hisob va demografik balans: tug'ilish, o'lim va migratsiya.",
        "summary_ru": "Перепись, текущий учёт и демографический баланс: рождаемость, смертность и миграция.",
        "related": [{"label": "Demografiya", "to": "/demographics"}],
        "body_uz": """Aholi soni ikki yo'l bilan aniqlanadi.

## 1. Aholini ro'yxatga olish

Har bir xonadonga borib, barcha yashovchilar haqida ma'lumot yig'iladi. Bu eng aniq, lekin juda qimmat usul, shuning uchun odatda o'n yilda bir marta o'tkaziladi.

## 2. Joriy hisob (demografik balans)

Ro'yxatga olishlar oralig'ida aholi soni har yili hisoblab boriladi:

**Yil oxiridagi aholi = yil boshidagi aholi + tug'ilganlar − vafot etganlar + kelganlar − ketganlar**

Tug'ilish va o'lim FHDYo organlari qaydlaridan, migratsiya esa doimiy yashash joyi bo'yicha ro'yxatga olish ma'lumotlaridan olinadi.

## Doimiy va mavjud aholi

Statistikada **doimiy aholi** (shu yerda doimiy yashaydiganlar) va **mavjud aholi** (hisob paytida shu yerda bo'lganlar) farqlanadi. Vaqtincha chet elda ishlayotganlar qaysi toifaga kirishi metodologiyada aniq belgilanadi.""",
    },
    {
        "slug": "tug-ilish-koeffitsienti",
        "topic": "population",
        "minutes": 3,
        "title_uz": "Tug'ilish koeffitsienti nima?",
        "title_ru": "Что такое коэффициент рождаемости?",
        "summary_uz": "Umumiy tug'ilish koeffitsienti va jami tug'ilish koeffitsienti o'rtasidagi farq.",
        "summary_ru": "Разница между общим коэффициентом рождаемости и суммарным коэффициентом рождаемости.",
        "related": [{"label": "Demografiya", "to": "/demographics"}],
        "body_uz": """**Umumiy tug'ilish koeffitsienti** — yil davomida tug'ilganlar sonining har 1000 aholiga nisbati. U oddiy, lekin aholining yosh tarkibiga bog'liq: yoshlar ko'p hududda koeffitsient yuqori bo'ladi.

**Jami tug'ilish koeffitsienti** — bir ayol butun reproduktiv yoshi davomida (shu yildagi yoshga xos tug'ilish darajalari saqlansa) o'rtacha nechta farzand ko'rishini ko'rsatadi. Aholining o'z o'rnini to'ldirishi uchun bu ko'rsatkich taxminan 2,1 bo'lishi kerak deb hisoblanadi.

Hududlarni solishtirishda yosh tarkibiga bog'liq bo'lmagan jami koeffitsientdan foydalangan ma'qul.""",
    },
    {
        "slug": "tashqi-savdo-saldosi",
        "topic": "economy",
        "minutes": 3,
        "title_uz": "Tashqi savdo saldosi: kamomad yomonmi?",
        "title_ru": "Сальдо внешней торговли: плох ли дефицит?",
        "summary_uz": "Eksport, import, saldo va savdo kamomadini qanday talqin qilish kerak.",
        "summary_ru": "Экспорт, импорт, сальдо и как интерпретировать торговый дефицит.",
        "related": [{"label": "Savdo oqimlari", "to": "/trade-flows"}, {"label": "Bozor tahlili", "to": "/market-report"}],
        "body_uz": """**Tashqi savdo saldosi** = eksport − import. Musbat saldo — profitsit, manfiy — kamomad (defitsit).

## Kamomad har doim yomon emasmi?

Yo'q. Rivojlanayotgan iqtisodiyot ko'pincha uskunalar va texnologiyalarni import qiladi — bu kelajakda ishlab chiqarishni oshiradi. Muhimi, import nimadan iborat: iste'mol tovarlari yoki investitsion tovarlar.

## Qanday hisoblanadi?

Bojxona deklaratsiyalari asosida tovarlar HS (TN VED) kodlari bo'yicha qayd etiladi; qiymat odatda AQSh dollarida beriladi. Xizmatlar savdosi (turizm, transport) alohida hisobga olinadi.

Saytdagi "Bozor tahlili" sahifasida istalgan mahsulot bo'yicha eksport, import va asosiy hamkor davlatlarni ko'rishingiz mumkin.""",
    },
    {
        "slug": "tanlanma-kuzatuv",
        "topic": "methods",
        "minutes": 4,
        "title_uz": "Tanlanma kuzatuv: nega hammadan so'ramasa ham bo'ladi?",
        "title_ru": "Выборочное наблюдение: почему не нужно опрашивать всех?",
        "summary_uz": "Tasodifiy tanlov, xatolik chegarasi va so'rovnoma natijalariga qanchalik ishonish mumkin.",
        "summary_ru": "Случайный отбор, предел погрешности и насколько можно доверять результатам опросов.",
        "related": [{"label": "So'rovnomalar", "to": "/surveys"}],
        "body_uz": """Butun aholini so'rash qimmat va uzoq. **Tanlanma kuzatuvda** aholining kichik, lekin to'g'ri tanlangan qismi so'raladi va natija butun aholiga tarqatiladi.

## Tanlov tasodifiy bo'lishi kerak

Agar faqat internetdan foydalanadiganlar yoki faqat shahar aholisi so'ralsa, natija qiyshiq bo'ladi. Shuning uchun hudud, shahar/qishloq, yosh va jins bo'yicha muvozanatlangan tasodifiy tanlov qo'llanadi.

## Xatolik chegarasi

Tanlanma natijasi taxmin: masalan, "45% ± 3%" degani haqiqiy qiymat katta ehtimol bilan 42–48% oralig'ida (shartli misol). Tanlanma kattalashgan sari xatolik kamayadi.

## Saytdagi so'rovnomalar haqida

Saytdagi so'rovnomalarda qatnashuvchilar o'zlari qatnashadi, ya'ni tanlov tasodifiy emas — natijalar fikrlarni ko'rsatadi, lekin rasmiy statistika o'rnini bosmaydi.""",
    },
    {
        "slug": "mavsumiy-tuzatish",
        "topic": "methods",
        "minutes": 3,
        "title_uz": "Mavsumiy tuzatish: nega oyma-oy solishtirish chalg'itishi mumkin?",
        "title_ru": "Сезонная корректировка: почему помесячные сравнения могут вводить в заблуждение?",
        "summary_uz": "Mavsumiylik, o'tgan yilning shu davri bilan solishtirish va kumulyativ ko'rsatkichlar.",
        "summary_ru": "Сезонность, сравнение с аналогичным периодом прошлого года и накопительные показатели.",
        "related": [{"label": "Savdo oqimlari", "to": "/trade-flows"}],
        "body_uz": """Ko'p ko'rsatkichlar yil fasliga bog'liq: qishloq xo'jaligi mahsulotlari kuzda ko'payadi, qurilish yozda faol, chakana savdo bayram oylarida o'sadi. Shuning uchun dekabrni noyabr bilan solishtirish noto'g'ri xulosaga olib kelishi mumkin.

## Ikki to'g'ri yo'l

1. **O'tgan yilning shu davri bilan solishtirish** (masalan, 2025-yil yanvar–sentabr va 2024-yil yanvar–sentabr). Saytdagi tashqi savdo sahifalari shu usulni ishlatadi.
2. **Mavsumiy tuzatilgan qatorlar** — maxsus usullar bilan mavsumiy tebranish olib tashlanadi.

## Kumulyativ ma'lumot

Ba'zi ko'rsatkichlar yil boshidan boshlab yig'ilib boradi ("yanvar–mart"). Bunday ma'lumotda mart oyining o'zini topish uchun yanvar–mart dan yanvar–fevral ayiriladi.""",
    },
    {
        "slug": "grafikni-to-g-ri-o-qish",
        "topic": "methods",
        "minutes": 4,
        "title_uz": "Statistik grafikni qanday to'g'ri o'qish kerak?",
        "title_ru": "Как правильно читать статистический график?",
        "summary_uz": "O'qlar, birliklar, foiz va foiz punkti, korrelyatsiya va sabab — oddiy qoidalar.",
        "summary_ru": "Оси, единицы измерения, процент и процентный пункт, корреляция и причинность — простые правила.",
        "related": [{"label": "Lug'at", "to": "/glossary"}],
        "body_uz": """## 1. O'qlarga qarang

Vertikal o'q noldan boshlanmasa, kichik farq katta bo'lib ko'rinadi. Avval o'q qayerdan boshlanishini tekshiring.

## 2. Birliklarni tekshiring

"Ming so'm", "mln AQSh $", "ming tonna" — birlik noto'g'ri o'qilsa, raqam ming marta adashadi.

## 3. Foiz va foiz punkti

Ishsizlik 8% dan 6% ga tushsa, bu **2 foiz punkti**, lekin **25%** ga kamayish (shartli misol). Ikkalasini aralashtirmang.

## 4. Korrelyatsiya — sabab emas

Ikki ko'rsatkich birga o'sishi biri ikkinchisini keltirib chiqaradi degani emas. Ko'pincha ularning ikkalasiga ta'sir qiladigan uchinchi omil bo'ladi.

## 5. Manba va davrni tekshiring

Raqam qaysi davr uchun (yil, chorak, kumulyativ), qaysi hudud bo'yicha va kim tomonidan e'lon qilinganiga qarang. Saytda namuna ma'lumotlar alohida "Namuna" belgisi bilan ko'rsatiladi.""",
    },
]

# (slug, atama uz, atama ru, ta'rif uz, ta'rif ru, misol uz, maqola slug)
GLOSSARY = [
    ("inflation", "Inflyatsiya", "Инфляция", "Tovar va xizmatlar narxlari umumiy darajasining oshishi.", "Рост общего уровня цен на товары и услуги.", "Narxlar yil davomida o'rtacha 10% oshsa, inflyatsiya 10%.", "inflyatsiya-nima"),
    ("deflation", "Deflyatsiya", "Дефляция", "Narxlar umumiy darajasining pasayishi.", "Снижение общего уровня цен.", "", "inflyatsiya-nima"),
    ("cpi", "Iste'mol narxlari indeksi (ISN)", "Индекс потребительских цен (ИПЦ)", "Oilalar xarid qiladigan tovar va xizmatlar to'plami narxining bazaviy davrga nisbatan o'zgarishi.", "Изменение стоимости набора товаров и услуг, покупаемых домохозяйствами, относительно базового периода.", "Indeks 105 — narxlar 5% oshgan.", "iste-mol-narxlari-indeksi"),
    ("ppi", "Ishlab chiqaruvchilar narxlari indeksi", "Индекс цен производителей", "Ishlab chiqaruvchilar o'z mahsulotini sotadigan narxlar o'zgarishi.", "Изменение цен, по которым производители продают свою продукцию.", "", None),
    ("base-period", "Bazaviy davr", "Базовый период", "Indeks hisoblanadigan va 100 deb olinadigan davr.", "Период, принятый за 100 при расчёте индекса.", "", "iste-mol-narxlari-indeksi"),
    ("purchasing-power", "Xarid qobiliyati", "Покупательная способность", "Ma'lum summa pulga sotib olish mumkin bo'lgan tovar va xizmatlar miqdori.", "Количество товаров и услуг, которое можно купить на определённую сумму.", "", "inflyatsiya-nima"),
    ("real-value", "Real qiymat", "Реальная стоимость", "Inflyatsiyadan tozalangan, doimiy narxlardagi qiymat.", "Стоимость в постоянных ценах, очищенная от инфляции.", "", "inflyatsiya-nima"),
    ("nominal-value", "Nominal qiymat", "Номинальная стоимость", "Joriy narxlarda ifodalangan qiymat.", "Стоимость, выраженная в текущих ценах.", "", "yaim-qanday-hisoblanadi"),
    ("real-interest-rate", "Real foiz stavkasi", "Реальная процентная ставка", "Nominal foiz stavkasidan inflyatsiya ta'siri chiqarilgan stavka: (1+nominal)/(1+inflyatsiya)−1.", "Ставка за вычетом влияния инфляции: (1+номинальная)/(1+инфляция)−1.", "", "inflyatsiya-nima"),
    ("gdp", "Yalpi ichki mahsulot (YaIM)", "Валовой внутренний продукт (ВВП)", "Mamlakatda ma'lum davrda ishlab chiqarilgan yakuniy tovar va xizmatlarning bozor qiymati.", "Рыночная стоимость конечных товаров и услуг, произведённых в стране за период.", "", "yaim-qanday-hisoblanadi"),
    ("grp", "Yalpi hududiy mahsulot (YaHM)", "Валовой региональный продукт (ВРП)", "Hudud (viloyat, shahar) miqyosidagi YaIM ekvivalenti.", "Аналог ВВП на уровне региона.", "", "yahm-va-hududlar"),
    ("value-added", "Qo'shilgan qiymat", "Добавленная стоимость", "Mahsulot qiymatidan unga sarflangan xom ashyo va xizmatlar qiymati ayirmasi.", "Стоимость продукции за вычетом стоимости использованного сырья и услуг.", "", "yaim-qanday-hisoblanadi"),
    ("per-capita", "Aholi jon boshiga", "На душу населения", "Ko'rsatkichning aholi soniga bo'lingan qiymati.", "Значение показателя, делённое на численность населения.", "", "yahm-va-hududlar"),
    ("growth-rate", "O'sish sur'ati", "Темп роста", "Ko'rsatkichning oldingi davrga nisbati, foizda.", "Отношение показателя к предыдущему периоду, в процентах.", "Joriy yil 110, o'tgan yil 100 — o'sish sur'ati 110%, o'sish 10%.", None),
    ("labour-force", "Iqtisodiy faol aholi", "Экономически активное население", "Band va ishsiz aholi yig'indisi (ishchi kuchi).", "Сумма занятых и безработных (рабочая сила).", "", "ishsizlik-darajasi"),
    ("unemployment-rate", "Ishsizlik darajasi", "Уровень безработицы", "Ishsizlarning iqtisodiy faol aholidagi ulushi, foizda.", "Доля безработных в экономически активном населении, в процентах.", "", "ishsizlik-darajasi"),
    ("employed", "Band aholi", "Занятое население", "Hisobot davrida daromad keltiruvchi ish bilan band bo'lgan shaxslar.", "Лица, занятые приносящей доход работой в отчётный период.", "", "ishsizlik-darajasi"),
    ("inactive", "Iqtisodiy nofaol aholi", "Экономически неактивное население", "Ishlamaydigan va ish qidirmaydigan shaxslar (talabalar, nafaqaxo'rlar va boshqalar).", "Лица, которые не работают и не ищут работу (студенты, пенсионеры и др.).", "", "ishsizlik-darajasi"),
    ("average-wage", "O'rtacha ish haqi", "Средняя заработная плата", "Ish haqi fondining xodimlar soniga nisbati.", "Отношение фонда оплаты труда к численности работников.", "", "o-rtacha-va-median-ish-haqi"),
    ("median", "Median", "Медиана", "Tartiblangan qatorning o'rtasidagi qiymat: yarmi undan kam, yarmi ko'p.", "Значение в середине упорядоченного ряда: половина меньше, половина больше.", "", "o-rtacha-va-median-ish-haqi"),
    ("percentile", "Persentil", "Перцентиль", "Qiymatlarning berilgan foizi undan kichik bo'lgan chegara (masalan, 90-persentil).", "Граница, ниже которой находится заданный процент значений (например, 90-й перцентиль).", "", "o-rtacha-va-median-ish-haqi"),
    ("quartile", "Kvartil", "Квартиль", "Taqsimotni to'rt teng qismga bo'luvchi qiymatlar (p25, median, p75).", "Значения, делящие распределение на четыре равные части (p25, медиана, p75).", "", "o-rtacha-va-median-ish-haqi"),
    ("census", "Aholini ro'yxatga olish", "Перепись населения", "Barcha aholi to'g'risida ma'lum sana holatiga ko'ra ma'lumot to'plash.", "Сбор сведений обо всём населении по состоянию на определённую дату.", "", "aholi-soni-qanday-aniqlanadi"),
    ("permanent-population", "Doimiy aholi", "Постоянное население", "Hududda doimiy yashaydigan shaxslar.", "Лица, постоянно проживающие на территории.", "", "aholi-soni-qanday-aniqlanadi"),
    ("natural-increase", "Tabiiy o'sish", "Естественный прирост", "Tug'ilganlar va vafot etganlar soni o'rtasidagi farq.", "Разница между числом родившихся и умерших.", "", "aholi-soni-qanday-aniqlanadi"),
    ("net-migration", "Migratsiya saldosi", "Сальдо миграции", "Kelganlar va ketganlar soni o'rtasidagi farq.", "Разница между числом прибывших и выбывших.", "", "aholi-soni-qanday-aniqlanadi"),
    ("crude-birth-rate", "Umumiy tug'ilish koeffitsienti", "Общий коэффициент рождаемости", "Yil davomida tug'ilganlarning har 1000 aholiga nisbati.", "Число родившихся за год на 1000 человек населения.", "", "tug-ilish-koeffitsienti"),
    ("total-fertility-rate", "Jami tug'ilish koeffitsienti", "Суммарный коэффициент рождаемости", "Bir ayolga o'rtacha to'g'ri keladigan tug'ilishlar soni.", "Среднее число рождений на одну женщину.", "", "tug-ilish-koeffitsienti"),
    ("life-expectancy", "Kutilayotgan umr davomiyligi", "Ожидаемая продолжительность жизни", "Joriy o'lim darajalari saqlansa, yangi tug'ilgan bola o'rtacha necha yil yashashi.", "Сколько лет в среднем проживёт новорождённый при сохранении текущей смертности.", "", None),
    ("export", "Eksport", "Экспорт", "Mamlakatdan chet elga tovar va xizmatlar chiqarilishi.", "Вывоз товаров и услуг за границу.", "", "tashqi-savdo-saldosi"),
    ("import", "Import", "Импорт", "Chet eldan mamlakatga tovar va xizmatlar olib kirilishi.", "Ввоз товаров и услуг из-за границы.", "", "tashqi-savdo-saldosi"),
    ("trade-balance", "Savdo saldosi", "Торговое сальдо", "Eksport va import qiymati o'rtasidagi farq.", "Разница между стоимостью экспорта и импорта.", "", "tashqi-savdo-saldosi"),
    ("hs-code", "HS (TN VED) kodi", "Код ТН ВЭД (HS)", "Tovarlarni tashqi savdoda tasniflash uchun xalqaro raqamli kod.", "Международный цифровой код классификации товаров во внешней торговле.", "5201 — tarashdan o'tkazilmagan paxta tolasi.", "tashqi-savdo-saldosi"),
    ("hhi", "Herfindahl indeksi", "Индекс Херфиндаля", "Bozor konsentratsiyasi ko'rsatkichi: ulushlar kvadratlari yig'indisi (0–10 000).", "Показатель концентрации рынка: сумма квадратов долей (0–10 000).", "", None),
    ("sample-survey", "Tanlanma kuzatuv", "Выборочное наблюдение", "Aholining tasodifiy tanlangan qismini so'rab, natijani butun aholiga tarqatish.", "Опрос случайно отобранной части населения с распространением результата на всё население.", "", "tanlanma-kuzatuv"),
    ("margin-of-error", "Xatolik chegarasi", "Предел погрешности", "Tanlanma natijasining haqiqiy qiymatdan ehtimoliy chetlanishi.", "Вероятное отклонение выборочного результата от истинного значения.", "", "tanlanma-kuzatuv"),
    ("seasonal-adjustment", "Mavsumiy tuzatish", "Сезонная корректировка", "Qatordan yil fasliga bog'liq tebranishlarni olib tashlash.", "Устранение из ряда колебаний, связанных со временем года.", "", "mavsumiy-tuzatish"),
    ("cumulative", "Kumulyativ ko'rsatkich", "Накопительный показатель", "Yil boshidan boshlab yig'ilib boriladigan ko'rsatkich (masalan, yanvar–sentabr).", "Показатель нарастающим итогом с начала года (например, январь–сентябрь).", "", "mavsumiy-tuzatish"),
    ("percentage-point", "Foiz punkti", "Процентный пункт", "Ikki foiz ko'rsatkich o'rtasidagi oddiy farq.", "Простая разница между двумя процентными показателями.", "8% dan 6% ga — 2 foiz punkti.", "grafikni-to-g-ri-o-qish"),
    ("correlation", "Korrelyatsiya", "Корреляция", "Ikki ko'rsatkichning birga o'zgarish darajasi; sabab-oqibat bog'liqligini bildirmaydi.", "Степень совместного изменения двух показателей; не означает причинно-следственной связи.", "", "grafikni-to-g-ri-o-qish"),
]

# Faol so'rovnomalar (FQ-08). options: (id, matn)
SURVEYS = [
    {
        "slug": "uy-xojaligi-xarajatlari",
        "title_uz": "Uy xo'jaligi xarajatlari",
        "title_ru": "Расходы домохозяйства",
        "description_uz": "Oilangiz byudjeti qanday taqsimlanadi va narxlar o'zgarishini qanday his qilasiz?",
        "questions": [
            ("single", "Oilaviy byudjetingizning eng katta qismi nimaga sarflanadi?", [("food", "Oziq-ovqat"), ("rent", "Ijara va kommunal"), ("transport", "Transport"), ("education", "Ta'lim"), ("other", "Boshqa")]),
            ("scale", "So'nggi yilda narxlar o'sishini qanchalik sezdingiz? (1 — umuman, 5 — juda kuchli)", []),
            ("multi", "Qaysi xarajatlarni qisqartirdingiz?", [("clothes", "Kiyim"), ("leisure", "Dam olish"), ("food", "Oziq-ovqat"), ("none", "Qisqartirmadim")]),
        ],
    },
    {
        "slug": "raqamli-xizmatlar",
        "title_uz": "Raqamli xizmatlardan foydalanish",
        "title_ru": "Использование цифровых услуг",
        "description_uz": "Davlat va tijorat raqamli xizmatlaridan qanchalik foydalanasiz?",
        "questions": [
            ("single", "Internetdan qanchalik tez-tez foydalanasiz?", [("daily", "Har kuni"), ("weekly", "Haftada bir necha marta"), ("rare", "Kamdan-kam"), ("never", "Foydalanmayman")]),
            ("multi", "Qaysi xizmatlardan foydalangansiz?", [("gov", "Davlat xizmatlari portali"), ("bank", "Mobil bank"), ("shop", "Onlayn xarid"), ("taxi", "Taksi ilovasi")]),
            ("scale", "Davlat raqamli xizmatlaridan qoniqish darajangiz (1–5)", []),
        ],
    },
    {
        "slug": "statistikaga-ishonch",
        "title_uz": "Rasmiy statistikaga ishonch",
        "title_ru": "Доверие к официальной статистике",
        "description_uz": "Statistik ma'lumotlardan qanday foydalanasiz va ularga qanchalik ishonasiz?",
        "questions": [
            ("single", "Rasmiy statistik ma'lumotlardan qanchalik tez-tez foydalanasiz?", [("work", "Ish yuzasidan muntazam"), ("sometimes", "Ba'zan"), ("rare", "Juda kam"), ("never", "Foydalanmayman")]),
            ("scale", "Rasmiy statistikaga ishonch darajangiz (1–5)", []),
            ("multi", "Qaysi mavzular sizga qiziq?", [("prices", "Narxlar"), ("wages", "Ish haqi"), ("population", "Aholi"), ("business", "Biznes")]),
        ],
    },
    {
        "slug": "mehnat-va-bandlik",
        "title_uz": "Mehnat va bandlik",
        "title_ru": "Труд и занятость",
        "description_uz": "Ish joyingiz va mehnat sharoitlari haqida qisqa so'rovnoma.",
        "questions": [
            ("single", "Hozirgi bandlik holatingiz", [("employed", "Yollanib ishlayman"), ("self", "O'zimning biznesim"), ("student", "Talabaman"), ("searching", "Ish qidiryapman"), ("other", "Boshqa")]),
            ("scale", "Ish haqingizdan qoniqish darajangiz (1–5)", []),
            ("single", "Keyingi yil ish o'zgartirishni rejalashtiryapsizmi?", [("yes", "Ha"), ("maybe", "Balki"), ("no", "Yo'q")]),
        ],
    },
]
