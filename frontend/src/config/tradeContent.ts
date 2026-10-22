import type { I18nText } from "../i18n/LangContext";

/**
 * TRADEINT_DIZAYN TI-04 ("Ma'lumot haqida", 3 ustun) va TI-12 (savol-javob). Xizmat raqami bo'yicha.
 * Matnlar bazadagi haqiqiy holatga mos: TradeData'da korxona STIR'i yo'q, narx faqat tonnada o'lchangan yozuvlardan.
 */
export interface AboutData {
  type: I18nText;
  analysis: I18nText;
  quality: I18nText;
}
export interface FaqItem {
  q: I18nText;
  a: I18nText;
}

const ABOUT_TRADE: AboutData = {
  type: {
    uz: "Tovarlar tashqi savdosi: HS kodi va davlat kesimida, qiymat (ming AQSh dollari) va og'irlik. Eksport va import oylik jamlanma davrlar bilan.",
    ru: "Внешняя торговля товарами: в разрезе кода ТН ВЭД и страны, стоимость (тыс. долл. США) и вес. Экспорт и импорт нарастающим итогом по месяцам.",
  },
  analysis: {
    uz: "Yillar bo'yicha dinamika, top davlatlar va ulushlar, o'tgan yilning shu davriga nisbatan o'zgarish, o'rtacha narx (USD/kg), bozor konsentratsiyasi (Herfindahl indeksi).",
    ru: "Динамика по годам, топ-страны и доли, изменение к тому же периоду прошлого года, средняя цена (USD/кг), концентрация рынка (индекс Херфиндаля).",
  },
  quality: {
    uz: "Og'irligi tonnada bo'lmagan yozuvlar narx hisobidan chiqariladi; xizmatlar (IT va boshqalar) savdosi kirmaydi; korxona kesimi yo'q. Ma'lumoti to'liq bo'lmagan yillar sahifada ogohlantirish bilan belgilanadi.",
    ru: "Записи, вес которых не в тоннах, исключаются из расчёта цены; торговля услугами не входит; разреза по предприятиям нет. Годы с неполными данными отмечаются предупреждением.",
  },
};

export const TRADE_ABOUT: Record<number, AboutData> = {
  301: ABOUT_TRADE,
  302: ABOUT_TRADE,
  303: ABOUT_TRADE,
};

const FAQ_TRADE: FaqItem[] = [
  {
    q: { uz: "Ma'lumot qayerdan olinadi va qanchalik yangi?", ru: "Откуда данные и насколько они свежие?" },
    a: {
      uz: "Milliy statistika qo'mitasining tashqi savdo statistikasi (bojxona ma'lumotlari asosida). Ma'lumot oylik jamlanma davrlar bilan yuklanadi; oxirgi yangilanish davri sahifa boshida ko'rsatilgan.",
      ru: "Статистика внешней торговли Нацкомитета по статистике (на основе таможенных данных). Данные загружаются нарастающим итогом по месяцам; последний период указан в начале страницы.",
    },
  },
  {
    q: { uz: "Korxona nomlari bormi?", ru: "Есть ли названия предприятий?" },
    a: {
      uz: "Hozir yo'q. Ma'lumot davlat va mahsulot (HS) kesimida; savdo jadvalida korxona STIR'i saqlanmaydi. Korxonalar uchun \"Kontragentni tekshirish\" xizmatiga qarang.",
      ru: "Пока нет. Данные в разрезе стран и товаров (ТН ВЭД); в таблице торговли ИНН предприятия не хранится. По предприятиям см. услугу «Проверка контрагента».",
    },
  },
  {
    q: { uz: "Narx (USD/kg) qanday hisoblanadi va qachon chiqmaydi?", ru: "Как считается цена (USD/кг) и когда её нет?" },
    a: {
      uz: "Qiymat / og'irlik, faqat o'lchov birligi tonna bo'lgan yozuvlar bo'yicha. Dona, litr kabi birlikdagi tovarlar uchun narx chiqmaydi; hisobotda qamrov foizi ko'rsatiladi.",
      ru: "Стоимость / вес, только по записям с единицей измерения «тонна». Для товаров в штуках, литрах и т. п. цена не считается; в отчёте указан процент охвата.",
    },
  },
  {
    q: { uz: "Bepul va paket versiyasining farqi nima?", ru: "Чем отличается бесплатная версия от пакетной?" },
    a: {
      uz: "Qisqa versiya (top-5 davlat) hammaga ochiq. To'liq hisobot — top-10, bozor konsentratsiyasi, o'sayotgan va qisqarayotgan bozorlar, PDF — tizimga kirgan foydalanuvchiga, tarif paketi limiti bilan.",
      ru: "Краткая версия (топ-5 стран) открыта всем. Полный отчёт — топ-10, концентрация рынка, растущие и сокращающиеся рынки, PDF — для вошедших в систему, в рамках лимита пакета.",
    },
  },
  {
    q: { uz: "Ma'lumotni boshqa joyda ishlatsam bo'ladimi?", ru: "Можно ли использовать данные в других местах?" },
    a: {
      uz: "Ha, manbani ko'rsatgan holda. Har bir grafikda havola, iqtibos (APA/GOST) va rasm (PNG) tugmalari bor.",
      ru: "Да, со ссылкой на источник. У каждого графика есть ссылка, цитата (APA/ГОСТ) и PNG.",
    },
  },
];

export const TRADE_FAQ: Record<number, FaqItem[]> = {
  301: FAQ_TRADE,
  302: FAQ_TRADE,
  303: FAQ_TRADE,
};
