"""FQ-07 "Statistika oddiy tilda": maqolalar va lug'at (S-15 seed manbasi).

Matnlar tushunchalarni tushuntiradi va aniq statistik raqam keltirmaydi; misollardagi raqamlar
"masalan" deb belgilangan shartli raqamlar. Kirill varianti transliteratsiya bilan yaratiladi.
"""

ARTICLES = [
    {
        "slug": "inflyatsiya-nima",
        "topic": "prices",
        "minutes": 2,
        "title_uz": "Inflyatsiya nima?",
        "title_ru": "Что такое инфляция и как она влияет на наш кошелёк?",
        "summary_uz": "Narxlar oshsa, pulimizga kamroq narsa olamiz. Inflyatsiya shu haqida.",
        "summary_ru": "Общий рост цен, покупательная способность денег и почему при росте зарплаты мы иногда можем купить меньше.",
        "related": [{"label": "Inflyatsiya kalkulyatori", "to": "/cpi-calculator"}, {"label": "Narxlar monitoringi", "to": "/prices"}],
        "body_uz": """**Inflyatsiya** — narxlarning oshishi. Bitta mahsulot qimmatlashsa, bu hali inflyatsiya emas. Ko'p narsalar birga qimmatlashsa — bu inflyatsiya.

## Pulimizga nima bo'ladi?

Narxlar oshsa, o'sha pulga kamroq narsa olamiz.

Masalan: yil boshida 100 ming so'mga 10 ta non oldingiz. Narxlar 10% oshdi. Endi shu pulga taxminan 9 ta non olasiz. (Bu shunchaki misol.)

## Qanday o'lchanadi?

Statistika xodimlari har oy do'kon va bozorlarda narxlarni yozib boradi. Ulardan bitta raqam chiqariladi. Bu raqam **iste'mol narxlari indeksi** deyiladi.

## Maosh oshdi, lekin yetmayapti — nega?

Maoshingiz 15% oshdi. Narxlar esa 12% oshdi. Demak, aslida maoshingiz atigi 3% ga oshgan. Buni **real** o'sish deyiladi.

## Foydali maslahatlar

- Omonat foizi inflyatsiyadan past bo'lsa, pulingiz qadrsizlanadi.
- Katta xarajatlarni rejalashtirganda narxlar oshishini hisobga oling.
- Saytdagi inflyatsiya kalkulyatorida eski summani bugungi narxga o'tkazib ko'ring.""",
    },
    {
        "slug": "iste-mol-narxlari-indeksi",
        "topic": "prices",
        "minutes": 2,
        "title_uz": "Narxlar indeksi qanday hisoblanadi?",
        "title_ru": "Как рассчитывается индекс потребительских цен?",
        "summary_uz": "\"Iste'mol savati\" nima va nega sizning inflyatsiyangiz rasmiy raqamdan farq qilishi mumkin.",
        "summary_ru": "«Потребительская корзина», веса товаров и почему ваша личная инфляция может отличаться от официальной.",
        "related": [{"label": "Inflyatsiya kalkulyatori", "to": "/cpi-calculator"}],
        "body_uz": """**Iste'mol narxlari indeksi (ISN)** — oilalar sotib oladigan narsalar qanchaga qimmatlashganini ko'rsatadi.

## Uch qadam

1. **Savat tuziladi.** Oilalar nimaga ko'p pul sarflashi aniqlanadi: oziq-ovqat, kiyim, kommunal, transport, o'qish.
2. **Narxlar yoziladi.** Har oy turli shaharlardagi do'kon va bozorlarda bir xil mahsulotlar narxi yoziladi.
3. **Hisoblanadi.** Ko'p pul ketadigan narsalar natijaga ko'proq ta'sir qiladi. Masalan, non zargarlik buyumidan muhimroq.

## Raqamni qanday o'qish kerak?

100 — narxlar o'zgarmagan.
108 — narxlar 8% oshgan.
95 — narxlar 5% arzonlagan.

## Nega sizda boshqacha?

Rasmiy raqam "o'rtacha oila" uchun. Agar siz pulingizning ko'p qismini ijaraga bersangiz va ijara tez qimmatlashsa, sizning inflyatsiyangiz kattaroq bo'ladi.""",
    },
    {
        "slug": "yaim-qanday-hisoblanadi",
        "topic": "economy",
        "minutes": 2,
        "title_uz": "YaIM nima?",
        "title_ru": "Как рассчитывается валовой внутренний продукт (ВВП)?",
        "summary_uz": "Mamlakat bir yilda qancha narsa ishlab chiqardi? YaIM shuni ko'rsatadi.",
        "summary_ru": "Три способа измерить размер экономики, номинальный и реальный ВВП, почему важен расчёт на душу населения.",
        "related": [{"label": "Hududlar xaritasi", "to": "/regions"}],
        "body_uz": """**YaIM (yalpi ichki mahsulot)** — mamlakatda bir yilda yoki bir chorakda yaratilgan barcha mahsulot va xizmatlarning qiymati.

Oddiy qilib aytganda: YaIM — iqtisodiyotning kattaligi.

## Nima kiradi?

Zavodda ishlab chiqarilgan mahsulot, dalada yetishtirilgan hosil, sartaroshning xizmati, taksining xizmati — hammasi.

## Nominal va real

- **Nominal YaIM** — bugungi narxlarda. Narxlar oshsa, u ham oshadi.
- **Real YaIM** — narxlar oshishi olib tashlangan. U iqtisodiyot haqiqatan o'sganmi, shuni ko'rsatadi.

"Iqtisodiyot 6% o'sdi" deyilsa, odatda real o'sish nazarda tutiladi.

## Aholi jon boshiga

Katta mamlakatda YaIM ham katta bo'ladi. Shuning uchun YaIMni aholi soniga bo'lib solishtiriladi. Viloyatlar uchun bu **YaHM** deyiladi.""",
    },
    {
        "slug": "yahm-va-hududlar",
        "topic": "economy",
        "minutes": 2,
        "title_uz": "Viloyatlar iqtisodiyotini qanday solishtirish mumkin?",
        "title_ru": "Валовой региональный продукт: как сравнивать экономику регионов?",
        "summary_uz": "YaHM nima va viloyatlarni solishtirishda nimaga e'tibor berish kerak.",
        "summary_ru": "Что такое ВРП, почему у столицы он выше и на что обращать внимание при сравнении регионов.",
        "related": [{"label": "Hududlar xaritasi", "to": "/regions"}],
        "body_uz": """**YaHM (yalpi hududiy mahsulot)** — bitta viloyatda yaratilgan mahsulot va xizmatlar qiymati. Bu viloyatning YaIMi.

## Solishtirishda 3 ta qoida

- **Aholi soniga bo'ling.** Aholisi ko'p viloyatda YaHM katta bo'lishi tabiiy.
- **Zavod va konlarga qarang.** Katta zavod bor viloyatda YaHM yuqori bo'ladi. Lekin odamlar daromadi ham yuqori degani emas.
- **Poytaxt alohida.** Katta kompaniyalar ofisi Toshkentda, shuning uchun poytaxt raqami yuqori chiqadi.

Bitta raqamga qarab xulosa qilmang. Hududlar xaritasida ish haqi, ishsizlik va aholini ham ko'ring.""",
    },
    {
        "slug": "ishsizlik-darajasi",
        "topic": "labour",
        "minutes": 2,
        "title_uz": "Kim ishsiz hisoblanadi?",
        "title_ru": "Уровень безработицы: кто считается безработным?",
        "summary_uz": "Ishlamayotgan har bir odam ishsiz emas. Farqi nimada?",
        "summary_ru": "Экономически активное население, определение безработицы и почему не каждый неработающий — безработный.",
        "related": [{"label": "Hududlar xaritasi", "to": "/regions"}],
        "body_uz": """Odam **ishsiz** hisoblanishi uchun uch shart bor:

1. Hozir ishi yo'q.
2. Ish qidiryapti.
3. Ish topilsa, yaqin ikki haftada chiqishga tayyor.

## Kim ishsiz emas?

Talaba, nafaqaxo'r, uy bekasi, ish qidirmayotgan odam — ular ishsiz emas. Ular hisobga umuman kirmaydi.

## Ishsizlik darajasi qanday hisoblanadi?

Ishlayotganlar va ish qidirayotganlar birga olinadi. Shulardan necha foizi ish qidirayotgan bo'lsa — bu ishsizlik darajasi.

Masalan: 100 kishidan 94 tasi ishlaydi, 6 tasi ish qidiryapti. Ishsizlik — 6%.

## Ma'lumot qayerdan olinadi?

Tasodifiy tanlangan oilalardan so'raladi. Bandlik markazida ro'yxatdagilar soni odatda kamroq chiqadi, chunki hamma ham u yerga bormaydi.""",
    },
    {
        "slug": "o-rtacha-va-median-ish-haqi",
        "topic": "labour",
        "minutes": 2,
        "title_uz": "O'rtacha maosh va median: farqi nima?",
        "title_ru": "Средняя и медианная зарплата: какая ближе к реальности?",
        "summary_uz": "Nega ko'pchilik \"o'rtacha maosh\"dan kam oladi?",
        "summary_ru": "Почему большинство получает меньше «средней зарплаты» и что показывает медиана.",
        "related": [{"label": "Mening maoshim", "to": "/my-salary"}],
        "body_uz": """**O'rtacha maosh** — hamma maoshlar qo'shiladi va odamlar soniga bo'linadi.

**Median** — hammani maoshi bo'yicha qatorga tizsak, o'rtada turgan odamning maoshi. Yarmi undan kam, yarmi ko'p oladi.

## Misol

10 kishi bor. 9 tasi 3 mln so'm oladi, bittasi 30 mln.

- O'rtacha maosh — 5,7 mln.
- Median — 3 mln.

Ko'rdingizmi? Bitta katta maosh o'rtachani yuqoriga tortdi. Lekin 10 kishidan 9 tasi 3 mln oladi. Shuning uchun median hayotga yaqinroq.

(Raqamlar shunchaki misol.)

## O'zingizni solishtiring

"Mening maoshim" sahifasida maoshingizni boshqalar bilan solishtiring. Siz yozgan summa serverga yuborilmaydi.""",
    },
    {
        "slug": "aholi-soni-qanday-aniqlanadi",
        "topic": "population",
        "minutes": 2,
        "title_uz": "Aholi soni qanday aniqlanadi?",
        "title_ru": "Как определяется численность населения?",
        "summary_uz": "Uyma-uy ro'yxat va har yilgi hisob: tug'ilganlar, vafot etganlar, kelganlar va ketganlar.",
        "summary_ru": "Перепись, текущий учёт и демографический баланс: рождаемость, смертность и миграция.",
        "related": [{"label": "Demografiya", "to": "/demographics"}],
        "body_uz": """Aholi soni ikki yo'l bilan aniqlanadi.

## 1. Aholini ro'yxatga olish

Har bir uyga borib, unda kim yashashi yoziladi. Bu eng aniq yo'l. Lekin qimmat, shuning uchun taxminan 10 yilda bir marta o'tkaziladi.

## 2. Har yilgi hisob

Qolgan yillarda aholi soni oddiy hisob bilan topiladi:

**Yil boshidagi aholi + tug'ilganlar − vafot etganlar + ko'chib kelganlar − ko'chib ketganlar**

Tug'ilish va o'lim FHDYo (ZAGS) yozuvlaridan olinadi. Ko'chib kelish va ketish — propiska ma'lumotlaridan.""",
    },
    {
        "slug": "tug-ilish-koeffitsienti",
        "topic": "population",
        "minutes": 2,
        "title_uz": "Tug'ilish koeffitsienti nima?",
        "title_ru": "Что такое коэффициент рождаемости?",
        "summary_uz": "Tug'ilishni o'lchashning ikki usuli va ularning farqi.",
        "summary_ru": "Разница между общим коэффициентом рождаемости и суммарным коэффициентом рождаемости.",
        "related": [{"label": "Demografiya", "to": "/demographics"}],
        "body_uz": """Tug'ilishni ikki xil o'lchash mumkin.

## 1. Har 1000 kishiga nechta bola

Bir yilda tug'ilgan bolalar soni har 1000 aholiga hisoblanadi. Bu **umumiy tug'ilish koeffitsienti**.

Kamchiligi: yoshlar ko'p joyda bu raqam o'z-o'zidan yuqori chiqadi.

## 2. Bir ayolga nechta bola

Bir ayol hayoti davomida o'rtacha nechta farzand ko'rishi hisoblanadi. Bu **jami tug'ilish koeffitsienti**.

Agar bu raqam taxminan 2,1 bo'lsa, aholi soni o'zgarmay turadi. Undan ko'p bo'lsa — aholi ko'payadi.

Viloyatlarni solishtirish uchun ikkinchi usul yaxshiroq.""",
    },
    {
        "slug": "tashqi-savdo-saldosi",
        "topic": "economy",
        "minutes": 2,
        "title_uz": "Eksport, import va savdo saldosi",
        "title_ru": "Сальдо внешней торговли: плох ли дефицит?",
        "summary_uz": "Chetga sotganimizdan ko'p sotib olsak — bu yomonmi?",
        "summary_ru": "Экспорт, импорт, сальдо и как интерпретировать торговый дефицит.",
        "related": [{"label": "Savdo oqimlari", "to": "/trade-flows"}, {"label": "Bozor tahlili", "to": "/market-report"}],
        "body_uz": """- **Eksport** — chet elga sotganimiz.
- **Import** — chet eldan sotib olganimiz.
- **Saldo** — eksportdan importni ayiramiz.

Saldo musbat bo'lsa — ko'proq sotganmiz. Manfiy bo'lsa — ko'proq sotib olganmiz. Buni **kamomad** deyiladi.

## Kamomad yomonmi?

Har doim emas. Agar chetdan zavod uskunalari olib kelinsa, keyinchalik ular ko'proq mahsulot ishlab chiqaradi. Muhimi — nima sotib olinyapti.

## Ma'lumot qayerdan?

Chegaradan o'tgan har bir yuk bojxonada yoziladi. Har bir mahsulotning o'z kodi bor (masalan, paxta tolasi — 5201).

Saytdagi "Bozor tahlili" sahifasida istalgan mahsulotni kim sotib olishini va kim sotishini ko'ring.""",
    },
    {
        "slug": "tanlanma-kuzatuv",
        "topic": "methods",
        "minutes": 2,
        "title_uz": "Nega hammadan so'ramasa ham bo'ladi?",
        "title_ru": "Выборочное наблюдение: почему не нужно опрашивать всех?",
        "summary_uz": "Bir necha ming kishidan so'rab, butun mamlakat haqida bilish mumkin. Qanday qilib?",
        "summary_ru": "Случайный отбор, предел погрешности и насколько можно доверять результатам опросов.",
        "related": [{"label": "So'rovnomalar", "to": "/surveys"}],
        "body_uz": """Qozondagi oshning tuzini bilish uchun hammasini yeyish shart emas. Bir qoshiq yetadi — agar yaxshilab aralashtirilgan bo'lsa.

Statistika ham shunday. Hammadan emas, bir qismidan so'raladi. Bu **tanlanma kuzatuv** deyiladi.

## Asosiy shart — tasodifiy tanlash

Faqat shaharliklardan yoki faqat yoshlardan so'ralsa, natija noto'g'ri chiqadi. Shuning uchun turli viloyat, shahar va qishloq, yosh va keksa odamlar tasodifiy tanlanadi.

## "± 3%" nima degani?

Natija aniq emas, taxmin. "45% ± 3%" — haqiqiy raqam 42% bilan 48% orasida degani. Ko'proq odamdan so'ralsa, xato kichrayadi.

## Saytdagi so'rovnomalar

Saytdagi so'rovnomalarda istagan odam qatnashadi. Shuning uchun ular fikrlarni ko'rsatadi, lekin rasmiy statistika emas.""",
    },
    {
        "slug": "mavsumiy-tuzatish",
        "topic": "methods",
        "minutes": 2,
        "title_uz": "Nega dekabrni noyabr bilan solishtirib bo'lmaydi?",
        "title_ru": "Сезонная корректировка: почему помесячные сравнения могут вводить в заблуждение?",
        "summary_uz": "Fasllar raqamlarga ta'sir qiladi. To'g'ri solishtirish yo'li.",
        "summary_ru": "Сезонность, сравнение с аналогичным периодом прошлого года и накопительные показатели.",
        "related": [{"label": "Savdo oqimlari", "to": "/trade-flows"}],
        "body_uz": """Ko'p narsa faslga bog'liq:

- kuzda hosil ko'p,
- yozda qurilish ko'p,
- bayram oldidan savdo ko'p.

Shuning uchun "dekabrda savdo noyabrdan oshdi" degani hali yaxshi yangilik emas. Har yili shunday bo'ladi.

## To'g'ri solishtirish

**O'tgan yilning shu oyi bilan solishtiring.** Masalan, bu yilgi dekabrni o'tgan yilgi dekabr bilan.

## "Yanvar–mart" nima degani?

Ba'zi raqamlar yil boshidan yig'ilib boradi. "Yanvar–mart" — uch oyning jami. Faqat martni bilish uchun "yanvar–mart"dan "yanvar–fevral"ni ayiring.""",
    },
    {
        "slug": "grafikni-to-g-ri-o-qish",
        "topic": "methods",
        "minutes": 2,
        "title_uz": "Grafikni qanday to'g'ri o'qish kerak?",
        "title_ru": "Как правильно читать статистический график?",
        "summary_uz": "Grafik sizni aldamasligi uchun 5 ta oddiy qoida.",
        "summary_ru": "Оси, единицы измерения, процент и процентный пункт, корреляция и причинность — простые правила.",
        "related": [{"label": "Lug'at", "to": "/glossary"}],
        "body_uz": """## 1. Chap tomondagi raqamlarga qarang

Ular noldan boshlanmasa, kichik farq ham katta bo'lib ko'rinadi.

## 2. O'lchov birligini o'qing

"Ming so'm" yoki "mln so'm"? Bitta so'zni o'tkazib yuborsangiz, ming marta adashasiz.

## 3. Foiz va foiz punkti

Ishsizlik 8% dan 6% ga tushdi. Bu **2 foiz punkti** kamaygani. Lekin **25%** ga kamaygani ham to'g'ri. Ikkalasini chalkashtirmang.

## 4. Birga o'sish — sabab emas

Yozda muzqaymoq ham, suvga cho'kish ham ko'payadi. Lekin muzqaymoq bunga sabab emas — sabab issiq havo.

## 5. Manba va sanani tekshiring

Raqam qaysi yil uchun? Qaysi hudud uchun? Kim e'lon qilgan? Saytda sinov raqamlari "Namuna" belgisi bilan ko'rsatiladi.""",
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
