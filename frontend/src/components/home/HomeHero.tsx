import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { POPULAR } from "../../config/serviceCatalog";
import { useLang } from "../../i18n/LangContext";
import TileArt from "./TileArt";
import { UI } from "../../i18n/ui";

/** Plitka foni (yuqori och, pastga qarab xizmat rangiga) — my.gov.uz plitkalaridagi kabi yorug' sahna. */
const TILE_BG: Record<number, string> = {
  101: "from-[#EAF3FF] to-[#D6E6FD]", 102: "from-[#EEF9F2] to-[#D7F0E0]", 201: "from-[#F1EEFF] to-[#E0D9FF]",
  301: "from-[#E9F5FF] to-[#D3E8FB]", 302: "from-[#EEF4FF] to-[#DCE7FB]", 401: "from-[#EFFAF4] to-[#D7EFE2]",
  501: "from-[#FFF5E6] to-[#FBE3C0]", 601: "from-[#FFF0EE] to-[#F8DCD8]", 701: "from-[#EDFAF1] to-[#D4F0DE]",
  801: "from-[#EAF3FF] to-[#D3E3FA]", 1001: "from-[#FFF7E9] to-[#F6E5C6]", 1201: "from-[#EEF1F7] to-[#D9DFEA]",
};


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
    <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-mg bg-[rgb(var(--ds-brand))] pb-4 pl-4 pt-8 sm:pb-[18px] sm:pl-[28px] sm:pt-[32px]">
      {/* Rasmiy belgi: davlat bayrog'i ranglaridagi ingichka chiziq */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-[6px]">
        <span className="flex-1 bg-[#1CA7E8]" /><span className="w-px bg-[#CE1126]" /><span className="flex-1 bg-white" /><span className="w-px bg-[#CE1126]" /><span className="flex-1 bg-[#1EB53A]" />
      </div>
      <div className="relative pr-4 sm:pr-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--ds-on-brand-muted))]">{t({ uz: "Milliy statistika qo'mitasi · rasmiy portal", ru: "Национальный комитет по статистике · официальный портал" })}</p>
        <h1 id="hero-title" className="mt-1 text-[26px] font-bold leading-[32px] text-white sm:text-[36px] sm:leading-[42px]">{t(UI.welcome)}</h1>
        <form role="search" className="mt-5 flex h-12 items-center gap-3 rounded-[10px] bg-white pl-4 pr-1.5"
          onSubmit={(e) => { e.preventDefault(); navigate(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search"); }}>
          <Search className="h-5 w-5 shrink-0 text-mg-primary" aria-hidden="true" />
          <label htmlFor="hero-search" className="sr-only">{t(UI.search)}</label>
          <input id="hero-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(UI.searchPlaceholder)}
            className="w-full bg-transparent text-base text-black outline-none placeholder:text-slate-400" />
          <button type="submit" className="h-9 shrink-0 rounded-lg bg-[rgb(var(--ds-accent))] px-4 text-sm font-semibold text-[rgb(24_33_47)] transition hover:brightness-95">{t({ uz: "Izlash", ru: "Найти" })}</button>
        </form>
      </div>
      <div className="relative mt-6">
        <ul ref={rail} aria-label={t(UI.popular)}
          className="flex snap-x gap-4 overflow-x-auto pb-2 pr-4 [scrollbar-width:none] sm:pr-6 [&::-webkit-scrollbar]:hidden">
          {POPULAR.map((s) => (
            <li key={s.number} className="snap-start">
              <Link to={`/service/${s.number}`}
                className={`group relative flex h-[150px] w-[106px] flex-col justify-end overflow-hidden rounded-mg-tile border-[3px] border-white/90 bg-gradient-to-b p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-white ${TILE_BG[s.number] ?? "from-[#EAF3FF] to-[#D6E6FD]"}`}>
                <TileArt number={s.number} className="absolute left-1/2 top-0.5 h-[98px] w-[98px] -translate-x-1/2 transition-transform duration-300 group-hover:scale-105" />
                {/* Pastdan ko'k gradient — yozuv har qanday sahnada o'qiladi (my.gov.uz dagi kabi) */}
                <span className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-[#111827]/90 via-[#1F2937]/50 to-transparent" aria-hidden="true" />
                <span className="relative text-[11.5px] font-semibold leading-tight text-white">{t(SHORT[s.number] ?? s.title)}</span>
              </Link>
            </li>
          ))}
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
