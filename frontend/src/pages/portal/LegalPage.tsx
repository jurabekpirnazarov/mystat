import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useLang, type I18nText } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { CONTACT } from "../../config/serviceCatalog";

type Kind = "privacy" | "terms" | "ai-usage";

/**
 * MG-09: footer'dagi huquqiy sahifalar. Matnlar portal kodida haqiqatda nima qilinishini tasvirlaydi, lekin yuridik
 * tekshiruvdan o'tmagan (OS-MG-06) — sahifa tepasida shu haqida belgi bor.
 */
const CONTENT: Record<Kind, { title: I18nText; sections: { h: I18nText; p: I18nText[] }[] }> = {
  privacy: {
    title: UI.privacy,
    sections: [
      {
        h: { uz: "Qanday ma'lumot yig'iladi", ru: "Какие данные собираются" },
        p: [
          { uz: "Ro'yxatdan o'tishda: ism, familiya, elektron pochta, telefon raqami; yuridik shaxs uchun korxona nomi va STIR. OneID orqali kirilganda egov.uz bergan shaxsiy ma'lumotlar.", ru: "При регистрации: имя, фамилия, электронная почта, телефон; для юрлиц — название предприятия и ИНН. При входе через OneID — персональные данные, переданные egov.uz." },
          { uz: "Xizmatlardan foydalanish: qaysi xizmatdan qachon foydalanilgani (paket limitlari va xizmat statistikasi uchun), qoldirilgan baho va sharhlar, murojaatlar.", ru: "Использование услуг: какой услугой и когда воспользовались (для лимитов пакета и статистики услуг), оценки и отзывы, обращения." },
          { uz: "Sahifa fikri (\"Ha/Yo'q\") va matndagi xato xabarlari shaxsiy ma'lumotsiz qabul qilinadi; takrorlanishni cheklash uchun IP manzilning qaytarib bo'lmaydigan xeshi saqlanadi.", ru: "Отзывы о странице («Да/Нет») и сообщения об ошибках принимаются без персональных данных; для ограничения повторов хранится необратимый хеш IP-адреса." },
        ],
      },
      {
        h: { uz: "Brauzerda saqlanadigan ma'lumot", ru: "Данные в браузере" },
        p: [{ uz: "Kirish tokenlari, tanlangan til, tungi rejim va shrift o'lchami brauzer xotirasida (localStorage) saqlanadi. Reklama yoki kuzatuv cookie-fayllari ishlatilmaydi.", ru: "Токены входа, выбранный язык, ночной режим и размер шрифта хранятся в памяти браузера (localStorage). Рекламные и отслеживающие cookie не используются." }],
      },
      {
        h: { uz: "Ma'lumot kimga beriladi", ru: "Кому передаются данные" },
        p: [{ uz: "Shartnoma imzolash uchun DIDOX, to'lov uchun Click, kirish uchun OneID tizimlariga faqat shu amal uchun zarur ma'lumot uzatiladi. Boshqa uchinchi shaxslarga berilmaydi.", ru: "Для подписания договора (DIDOX), оплаты (Click) и входа (OneID) передаются только необходимые для этого данные. Другим третьим лицам данные не передаются." }],
      },
      {
        h: { uz: "Murojaat", ru: "Обращение" },
        p: [{ uz: `Shaxsiy ma'lumotlaringiz bo'yicha savol yoki ularni o'chirish so'rovi: ${CONTACT.email}, ${CONTACT.phone}.`, ru: `Вопросы о персональных данных или запрос на их удаление: ${CONTACT.email}, ${CONTACT.phone}.` }],
      },
    ],
  },
  terms: {
    title: UI.terms,
    sections: [
      {
        h: { uz: "Umumiy qoidalar", ru: "Общие положения" },
        p: [{ uz: "Portal Milliy statistika qo'mitasining rasmiy statistik ma'lumotlari va xizmatlarini taqdim etadi. Portaldan foydalanish shu shartlarga rozilikni bildiradi.", ru: "Портал предоставляет официальные статистические данные и услуги Национального комитета по статистике. Использование портала означает согласие с этими условиями." }],
      },
      {
        h: { uz: "Ma'lumotlardan foydalanish", ru: "Использование данных" },
        p: [{ uz: "Ochiq statistik ma'lumotlardan manbaga havola bilan (\"Manba: my.stat.uz\") erkin foydalanish mumkin. \"Namuna\" belgisi qo'yilgan raqamlar sinov uchun yaratilgan va rasmiy statistika emas.", ru: "Открытые статистические данные можно свободно использовать со ссылкой на источник («Источник: my.stat.uz»). Цифры с пометкой «Образец» созданы для тестирования и не являются официальной статистикой." }],
      },
      {
        h: { uz: "Pullik xizmatlar", ru: "Платные услуги" },
        p: [{ uz: "Tarif paketlari shartnoma asosida, nashrlar Click orqali to'lanadi. Narxlar bazaviy hisoblash miqdorida (BHM) belgilanadi va xizmat pasportida ko'rsatiladi.", ru: "Тарифные пакеты оплачиваются по договору, издания — через Click. Цены устанавливаются в базовых расчётных величинах (БРВ) и указаны в паспорте услуги." }],
      },
      {
        h: { uz: "Cheklovlar", ru: "Ограничения" },
        p: [{ uz: "Portalga avtomatik so'rovlar bilan ortiqcha yuk berish, boshqa foydalanuvchilar ma'lumotiga ruxsatsiz kirishga urinish taqiqlanadi. Ochiq API kunlik limitlar bilan ishlaydi.", ru: "Запрещается создавать избыточную нагрузку автоматическими запросами и пытаться получить несанкционированный доступ к данным других пользователей. Открытый API работает с дневными лимитами." }],
      },
    ],
  },
  "ai-usage": {
    title: UI.aiUsage,
    sections: [
      {
        h: { uz: "\"Stat AI\" qanday ishlaydi", ru: "Как работает «Stat AI»" },
        p: [
          { uz: "\"Stat AI\" yordamchisi savolingizdagi so'zlar bo'yicha portalning \"Ko'p beriladigan savollar\" bazasidan mos javoblarni va tegishli sahifalarni topadi.", ru: "Помощник «Stat AI» по словам вашего вопроса находит подходящие ответы в базе «Часто задаваемых вопросов» и ссылки на страницы портала." },
          { uz: "Tashqi sun'iy intellekt xizmatlari (katta til modellari) ishlatilmaydi, savollaringiz uchinchi shaxslarga yuborilmaydi.", ru: "Внешние сервисы искусственного интеллекта (большие языковые модели) не используются, ваши вопросы третьим лицам не передаются." },
        ],
      },
      {
        h: { uz: "Javoblarning chegarasi", ru: "Ограничения ответов" },
        p: [{ uz: "Yordamchi javobi rasmiy maslahat emas. Aniq javob kerak bo'lsa, \"Operator\" chatiga yozing yoki konsultatsiya band qiling.", ru: "Ответ помощника не является официальной консультацией. Если нужен точный ответ, напишите в чат «Оператор» или запишитесь на консультацию." }],
      },
    ],
  },
};

export default function LegalPage({ kind }: { kind: Kind }) {
  const { t } = useLang();
  const c = CONTENT[kind];
  useEffect(() => {
    document.title = `${t(c.title)} — my.stat.uz`;
  }, [c, t]);
  return (
    <article className="max-w-3xl rounded-mg bg-mg-surface p-6 md:p-10">
      <h1 className="text-[28px] font-semibold text-mg-primary">{t(c.title)}</h1>
      {kind !== "ai-usage" && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t({ uz: "Namuna matn, yuridik tekshiruvdan o'tmagan.", ru: "Образец текста, не прошёл юридическую проверку." })}
        </p>
      )}
      {c.sections.map((s) => (
        <section key={t(s.h)} className="mt-6">
          <h2 className="text-lg font-semibold text-mg-heading">{t(s.h)}</h2>
          {s.p.map((p, i) => <p key={i} className="mt-2 leading-relaxed text-mg-text">{t(p)}</p>)}
        </section>
      ))}
    </article>
  );
}
