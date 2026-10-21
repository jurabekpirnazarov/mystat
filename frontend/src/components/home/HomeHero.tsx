import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { POPULAR } from "../../config/serviceCatalog";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

// Plitkalar foni: my.gov.uz dagi rasmlar o'rnida o'z uslubimizdagi gradientlar (tashqi rasm ishlatilmaydi)
const TILE_BG = [
  "from-sky-400 to-blue-700", "from-violet-400 to-indigo-700", "from-emerald-400 to-teal-700", "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-700", "from-cyan-400 to-blue-600", "from-lime-400 to-green-700", "from-fuchsia-400 to-purple-700",
  "from-teal-300 to-cyan-700", "from-blue-400 to-indigo-800", "from-orange-300 to-red-600", "from-green-400 to-emerald-700",
];

/** Plitkadagi qisqa nom (1–3 so'z, fe'lsiz) — MYGOV_DIZAYN 2.1. */
const SHORT: Record<number, { uz: string; ru: string }> = {
  101: { uz: "Korxona ma'lumoti", ru: "Сведения о компании" },
  102: { uz: "Kontragent", ru: "Контрагент" },
  201: { uz: "Hisobot kalendari", ru: "Календарь отчётов" },
  301: { uz: "Tashqi savdo", ru: "Внешняя торговля" },
  302: { uz: "Bozor tahlili", ru: "Анализ рынка" },
  401: { uz: "Hamkor qidirish", ru: "Поиск партнёров" },
  501: { uz: "Inflyatsiya", ru: "Инфляция" },
  601: { uz: "Demografiya", ru: "Демография" },
  701: { uz: "Mening maoshim", ru: "Моя зарплата" },
  801: { uz: "Mening hududim", ru: "Мой регион" },
  1001: { uz: "Nashrlar", ru: "Издания" },
  1201: { uz: "Ochiq API", ru: "Открытый API" },
};

/**
 * MG-05 (MG-00 tartibi): gradientli hero — "Xush kelibsiz!", qidiruv maydoni va "Ommabop xizmatlar" plitkalari
 * (gorizontal skroll, desktopda o'q tugmalari). Qidiruv `/search?q=` ga olib boradi.
 */
export default function HomeHero() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const rail = useRef<HTMLUListElement>(null);
  const scroll = (dir: number) => rail.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <section aria-labelledby="hero-title" className="rounded-mg bg-mg-hero pb-4 pl-4 pt-6 sm:pb-[15px] sm:pl-[25px] sm:pt-[25px]">
      <div className="pr-4 sm:pr-6">
        <h1 id="hero-title" className="text-[26px] font-bold leading-[30px] text-white sm:text-[34px]">{t(UI.welcome)}</h1>
        <form role="search" className="mt-5 flex h-11 items-center gap-3 rounded-[10px] border border-white/60 bg-white px-4"
          onSubmit={(e) => { e.preventDefault(); navigate(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search"); }}>
          <Search className="h-5 w-5 shrink-0 text-mg-primary" aria-hidden="true" />
          <label htmlFor="hero-search" className="sr-only">{t(UI.search)}</label>
          <input id="hero-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(UI.searchPlaceholder)}
            className="w-full bg-transparent text-base text-black outline-none placeholder:text-slate-400" />
        </form>
      </div>
      <div className="relative mt-5">
        <ul ref={rail} aria-label={t(UI.popular)}
          className="flex snap-x gap-4 overflow-x-auto pb-2 pr-4 [scrollbar-width:none] sm:pr-6 [&::-webkit-scrollbar]:hidden">
          {POPULAR.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.number} className="snap-start">
                <Link to={`/service/${s.number}`}
                  className={`relative flex h-[150px] w-[106px] flex-col justify-end overflow-hidden rounded-mg-tile border-2 border-white/70 bg-gradient-to-br p-2.5 transition hover:-translate-y-0.5 ${TILE_BG[i % TILE_BG.length]}`}>
                  <Icon className="absolute -right-3 top-3 h-20 w-20 text-white/35" strokeWidth={1.25} aria-hidden="true" />
                  <span className="relative text-[11px] font-semibold leading-tight text-white">{t(SHORT[s.number] ?? s.title)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={() => scroll(-1)} aria-label={t({ uz: "Oldingi", ru: "Назад" })}
          className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white p-1.5 text-mg-primary shadow md:block">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label={t({ uz: "Keyingi", ru: "Далее" })}
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white p-1.5 text-mg-primary shadow md:block">
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
