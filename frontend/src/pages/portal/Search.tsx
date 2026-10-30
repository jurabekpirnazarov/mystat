import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, Building2, FileText, HelpCircle, Search as SearchIcon } from "lucide-react";
import { globalSearch, type SearchGroup } from "../../api/support";
import { SERVICES, matchesFilters, serviceByNumber } from "../../config/serviceCatalog";
import { useLang, type I18nText } from "../../i18n/LangContext";
import ServiceCard from "../../components/catalog/ServiceCard";
import { useServiceStats } from "../../components/catalog/useServiceStats";
import { SEARCH_TYPES } from "../../config/searchFilters";

/** "Ommabop so'rovlar" chip'lari (my.gov.uz qidiruv sahifasidagi kabi). */
const POPULAR_QUERIES: I18nText[] = [
  { uz: "Eksport", ru: "Экспорт" }, { uz: "Inflyatsiya", ru: "Инфляция" }, { uz: "STIR", ru: "ИНН" },
  { uz: "Hisobot", ru: "Отчёт" }, { uz: "Aholi", ru: "Население" }, { uz: "Maosh", ru: "Зарплата" }, { uz: "Tarif", ru: "Тариф" },
];

const GROUP_ICONS: Record<string, typeof HelpCircle> = { faq: HelpCircle, companies: Building2, articles: BookOpen, glossary: BookOpen };
const PREVIEW = 6;

/**
 * MG-08: `/search?q=` — "Izlash". Xizmatlar katalogdan (raqam, nom, tavsif, kalit so'zlar; lotin/kirill/rus),
 * qolgan bo'limlar backend global qidiruvidan (FAQ, hisobot shakllari, korxonalar, maqolalar, lug'at).
 * `#302` yoki `302` — to'g'ridan-to'g'ri xizmat pasporti.
 */
export default function Search() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  /** LX-04: ma'lumot turi filtri (URL'da `type=`): services | companies | faq | articles | glossary */
  const type = params.get("type") ?? "";
  const [input, setInput] = useState(q);
  const [remote, setRemote] = useState<SearchGroup[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { items: stats } = useServiceStats();

  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    document.title = `${t({ uz: "Izlash", ru: "Поиск" })} — my.stat.uz`;
  }, [t]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setRemote([]);
      return;
    }
    let alive = true;
    const timer = setTimeout(() => {
      globalSearch(q.trim()).then((g) => alive && setRemote(g)).catch(() => alive && setRemote([]));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q]);

  const services = useMemo(() => (q.trim() && (!type || type === "services") ? SERVICES.filter((s) => matchesFilters(s, null, null, q.replace(/^#/, ""))) : []), [q, type]);

  const visibleRemote = useMemo(() => remote.filter((g) => !type || g.type === type), [remote, type]);

  const withType = (extra: Record<string, string>) => ({ ...extra, ...(type ? { type } : {}) });

  const submit = (value: string) => {
    const num = /^#?(\d{3,4})$/.exec(value.trim());
    const service = num ? serviceByNumber(Number(num[1])) : undefined;
    if (service && service.status === "live") {
      navigate(`/service/${service.number}`);
      return;
    }
    setParams(value.trim() ? withType({ q: value.trim() }) : withType({}));
  };

  const section = (key: string, title: string, count: number, children: React.ReactNode) => (
    <section key={key} className="mt-8" aria-labelledby={`search-${key}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 id={`search-${key}`} className="text-lg font-semibold text-mg-primary">{title} <span className="font-normal">({count})</span></h2>
        {count > PREVIEW && (
          <button type="button" onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))}
            className="inline-flex items-center gap-2 text-sm font-medium text-mg-heading hover:text-mg-primary">
            {expanded[key] ? t({ uz: "Kamroq ko'rsatish", ru: "Свернуть" }) : t({ uz: "Barchasini ko'rish", ru: "Смотреть все" })}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </section>
  );

  const nothing = q.trim().length >= 2 && services.length === 0 && visibleRemote.every((g) => g.items.length === 0);

  return (
    <div>
      <h1 className="text-[34px] font-bold text-mg-primary">{t({ uz: "Izlash", ru: "Поиск" })}</h1>
      <form role="search" className="mt-6 flex max-w-3xl items-center gap-4 border-b border-mg-primary pb-3 focus-within:border-b-2"
        onSubmit={(e) => { e.preventDefault(); submit(input); }}>
        <SearchIcon className="h-6 w-6 text-mg-primary" aria-hidden="true" />
        <label htmlFor="search-q" className="sr-only">{t({ uz: "Xizmatni izlash", ru: "Поиск услуги" })}</label>
        <input id="search-q" type="search" autoFocus value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={t({ uz: "Xizmatni izlash, masalan — bozor tahlili yoki #302", ru: "Поиск услуги, например — анализ рынка или #302" })}
          className="w-full bg-transparent text-base outline-none placeholder:text-slate-400 focus-visible:outline-none" />
      </form>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Ma'lumot turi">
        {SEARCH_TYPES.map((x) => (
          <button key={x.key} type="button" aria-pressed={type === x.key}
            onClick={() => setParams({ ...(q ? { q } : {}), ...(x.key ? { type: x.key } : {}) })}
            className={`rounded-full border px-3 py-1 text-sm ${type === x.key ? "border-mg-primary bg-mg-primary text-white" : "border-mg-border text-mg-text hover:bg-mg-info"}`}>
            {x.label}
          </button>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-mg-primary">{t({ uz: "Ommabop so'rovlar", ru: "Популярные запросы" })}</h2>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {POPULAR_QUERIES.map((p) => (
          <button key={t(p)} type="button" onClick={() => submit(t(p))}
            className="rounded-mg border border-mg-primary bg-mg-surface px-[18px] py-2 text-sm text-mg-text hover:bg-mg-info">
            {t(p)}
          </button>
        ))}
      </div>

      {services.length > 0 && section("services", t({ uz: "Xizmatlar", ru: "Услуги" }), services.length, (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(expanded.services ? services : services.slice(0, PREVIEW)).map((s) => <ServiceCard key={s.number} s={s} stats={stats[s.number]} />)}
        </div>
      ))}

      {visibleRemote.filter((g) => g.items.length).map((g) => {
        const Icon = GROUP_ICONS[g.type] ?? FileText;
        const items = expanded[g.type] ? g.items : g.items.slice(0, PREVIEW);
        return section(g.type, g.label, g.items.length, (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((it) => (
              <Link key={String(it.id)} to={it.url}
                className="flex min-h-[100px] items-center gap-4 rounded-mg border border-mg-border bg-mg-surface px-4 py-3 hover:border-mg-primary/40">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-mg-border text-mg-heading">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-[15px] font-semibold text-black dark:text-white">{it.title}</span>
                  {it.subtitle && <span className="mt-0.5 line-clamp-1 block text-sm text-mg-muted">{it.subtitle}</span>}
                </span>
              </Link>
            ))}
          </div>
        ));
      })}

      {nothing && <p className="mt-10 rounded-mg bg-mg-surface p-8 text-center text-mg-muted">{t({ uz: "Hech narsa topilmadi", ru: "Ничего не найдено" })}</p>}
    </div>
  );
}
