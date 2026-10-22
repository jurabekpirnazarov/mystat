import { BarChart3, Database, ShieldCheck } from "lucide-react";
import { useLang } from "../../i18n/LangContext";
import { TRADE_ABOUT, TRADE_FAQ } from "../../config/tradeContent";

/** TI-04: "Ma'lumot haqida" — Ma'lumot turi / Tahlil / Sifat va cheklovlar (3 ustun, pasport kartochkalari uslubida). */
export function ServiceAbout({ number }: { number: number }) {
  const { t } = useLang();
  const a = TRADE_ABOUT[number];
  if (!a) return null;
  const cols = [
    { icon: Database, title: t({ uz: "Ma'lumot turi", ru: "Тип данных" }), text: t(a.type) },
    { icon: BarChart3, title: t({ uz: "Tahlil", ru: "Анализ" }), text: t(a.analysis) },
    { icon: ShieldCheck, title: t({ uz: "Sifat va cheklovlar", ru: "Качество и ограничения" }), text: t(a.quality) },
  ];
  return (
    <section aria-labelledby={`about-${number}`} className="mt-8">
      <h2 id={`about-${number}`} className="mb-4 text-[28px] text-black dark:text-white">{t({ uz: "Ma'lumot haqida", ru: "О данных" })}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {cols.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-mg bg-mg-info p-5">
            <Icon className="h-6 w-6 text-mg-primary-light" aria-hidden="true" />
            <h3 className="mt-2 text-base font-semibold text-black dark:text-white">{title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-mg-text">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** TI-12: savol-javob (yig'iladigan). */
export function ServiceFaq({ number }: { number: number }) {
  const { t } = useLang();
  const items = TRADE_FAQ[number];
  if (!items) return null;
  return (
    <section aria-labelledby={`faq-${number}`} className="mt-8">
      <h2 id={`faq-${number}`} className="mb-4 text-[28px] text-black dark:text-white">{t({ uz: "Savol-javob", ru: "Вопросы и ответы" })}</h2>
      <div className="space-y-2">
        {items.map((it) => (
          <details key={t(it.q)} className="group rounded-mg bg-mg-info px-5 py-4">
            <summary className="cursor-pointer list-none text-base font-semibold text-black marker:hidden dark:text-white">
              <span className="flex items-center justify-between gap-3">{t(it.q)}<span className="text-mg-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span></span>
            </summary>
            <p className="mt-2 text-[15px] leading-relaxed text-mg-text">{t(it.a)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
