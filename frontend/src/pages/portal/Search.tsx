import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, Building2, FileText, HelpCircle, Search as SearchIcon, Sparkles } from "lucide-react";
import { aiSearch, globalSearch, type AiSearchReply, type SearchGroup } from "../../api/support";
import { fetchDashboards, type DashboardItem } from "../../api/statPublic";
import { SERVICES, matchesFilters, normalizeQuery, serviceByNumber } from "../../config/serviceCatalog";
import { translate, useLang, type I18nText } from "../../i18n/LangContext";
import ServiceCard from "../../components/catalog/ServiceCard";
import ServiceAccessNote from "../../components/catalog/ServiceAccessNote";
import DataAgentPanel, { TRADE_INTENT } from "../../components/search/DataAgentPanel";
import { useServiceStats } from "../../components/catalog/useServiceStats";
import { SEARCH_TYPES } from "../../config/searchFilters";

/** "Ommabop so'rovlar" chip'lari (my.gov.uz qidiruv sahifasidagi kabi). */
const POPULAR_QUERIES: I18nText[] = [
  { uz: "Eksport", ru: "Экспорт" }, { uz: "Inflyatsiya", ru: "Инфляция" }, { uz: "STIR", ru: "ИНН" },
  { uz: "Hisobot", ru: "Отчёт" }, { uz: "Aholi", ru: "Население" }, { uz: "Maosh", ru: "Зарплата" }, { uz: "Tarif", ru: "Тариф" },
];

const GROUP_ICONS: Record<string, typeof HelpCircle> = { faq: HelpCircle, companies: Building2, articles: BookOpen, glossary: BookOpen };
const PREVIEW = 6;

/** AI'ga yuboriladigan qisqa katalog (faqat ishlayotgan xizmatlar). */
const AI_CATALOG = SERVICES.filter((s) => s.status === "live").map((s) => ({ n: s.number, t: translate(s.title, "uz"), d: translate(s.description, "uz").slice(0, 140) }));

type Indicator = DashboardItem & { panel: string };

/** Ma'lumot bo'yicha izlash: ko'rsatkich nomi, birligi va panel nomida barcha so'zlar uchrashi kerak. */
function matchIndicators(all: Indicator[], q: string): Indicator[] {
  const words = normalizeQuery(q).split(" ").filter((w) => w.length > 1);
  if (!words.length) return [];
  return all.filter((i) => {
    const hay = normalizeQuery(`${i.name} ${i.unit} ${i.panel} ${i.key}`);
    return words.every((w) => hay.includes(w));
  });
}

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
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [ai, setAi] = useState<{ loading: boolean; reply: AiSearchReply | null }>({ loading: false, reply: null });

  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    let alive = true;
    fetchDashboards()
      .then((d) => alive && setIndicators(d.panels.flatMap((p) => p.items.map((i) => ({ ...i, panel: p.title })))))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  // AI tavsiyasi (lokal Gemma): so'rov o'zgarib, 600 ms to'xtagach; o'chiq yoki xato bo'lsa blok chiqmaydi
  useEffect(() => {
    if (q.trim().length < 3 || (type && type !== "services")) {
      setAi({ loading: false, reply: null });
      return;
    }
    const ctrl = new AbortController();
    setAi({ loading: true, reply: null });
    const timer = setTimeout(() => {
      aiSearch(q.trim(), AI_CATALOG, ctrl.signal)
        .then((reply) => setAi({ loading: false, reply: reply.enabled ? reply : null }))
        .catch(() => !ctrl.signal.aborted && setAi({ loading: false, reply: null }));
    }, 600);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, type]);
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

  const dataHits = useMemo(() => (q.trim() && (!type || type === "indicators") ? matchIndicators(indicators, q) : []), [q, type, indicators]);
  const aiServices = useMemo(() => (ai.reply?.services ?? []).map((n) => serviceByNumber(n)).filter((s): s is NonNullable<typeof s> => !!s && s.status === "live"), [ai.reply]);

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

  const nothing = q.trim().length >= 2 && services.length === 0 && dataHits.length === 0 && aiServices.length === 0 && !ai.loading && visibleRemote.every((g) => g.items.length === 0);

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

      {q.trim().length >= 3 && TRADE_INTENT.test(q) && (!type || type === "services") && <DataAgentPanel query={q.trim()} />}

      {(ai.loading || ai.reply) && (
        <section className="mt-8 rounded-[20px] border border-mg-primary/30 bg-mg-info p-5" aria-labelledby="search-ai" aria-live="polite">
          <h2 id="search-ai" className="flex items-center gap-2 text-lg font-semibold text-mg-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />{t({ uz: "AI tavsiyasi", ru: "Рекомендация ИИ" })}
          </h2>
          {ai.loading && <p className="mt-2 text-sm text-mg-muted">{t({ uz: "So'rovingiz tahlil qilinmoqda…", ru: "Анализируем ваш запрос…" })}</p>}
          {ai.reply?.answer && <p className="mt-2 text-[15px] text-mg-text">{ai.reply.answer}</p>}
          {aiServices.length > 0 && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {aiServices.map((s) => (
                <div key={s.number}>
                  <ServiceCard s={s} stats={stats[s.number]} rich />
                  <ServiceAccessNote s={s} />
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-mg-muted">{t({ uz: "Tavsiya sun'iy intellekt (Gemma) tomonidan tuzilgan, xato bo'lishi mumkin.", ru: "Рекомендация составлена ИИ (Gemma) и может содержать ошибки." })}</p>
        </section>
      )}

      {dataHits.length > 0 && section("indicators", t({ uz: "Ko'rsatkichlar (ma'lumot)", ru: "Показатели (данные)" }), dataHits.length, (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(expanded.indicators ? dataHits : dataHits.slice(0, PREVIEW)).map((i) => (
            <Link key={i.key} to={`/indicators/${i.key}`} className="flex min-h-[100px] items-center gap-4 rounded-mg border border-mg-border bg-mg-surface px-4 py-3 hover:border-mg-primary/40">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-mg-border text-mg-heading"><BarChart3 className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="line-clamp-2 block text-[15px] font-semibold">{i.name}</span>
                <span className="mt-0.5 block text-sm text-mg-muted"><b className="text-mg-text">{i.value.toLocaleString("ru-RU")}</b> {i.unit} · {i.period}</span>
                <span className="block truncate text-xs text-mg-muted">{i.panel}</span>
              </span>
            </Link>
          ))}
        </div>
      ))}

      {services.length > 0 && section("services", t({ uz: "Xizmatlar", ru: "Услуги" }), services.length, (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(expanded.services ? services : services.slice(0, PREVIEW)).map((s) => <div key={s.number}><ServiceCard s={s} stats={stats[s.number]} rich /><ServiceAccessNote s={s} /></div>)}
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
