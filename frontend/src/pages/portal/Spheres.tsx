import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { SERVICES, matchesFilters, servicesOfSphere, type ServiceCatalogItem } from "../../config/serviceCatalog";
import { SPHERES, sphereById } from "../../config/spheres";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import ServiceCard from "../../components/catalog/ServiceCard";
import { useServiceStats } from "../../components/catalog/useServiceStats";
import DemoBadge from "../../components/ui/DemoBadge";

// Sohaga xos qo'shimcha bloklar (MYGOV_DIZAYN 0.4: 1-etap komponentlari shu sohalarga ko'chdi)
const TariffComponent = lazy(() => import("../../components/TariffComponent"));
const CalendarReport = lazy(() => import("../../components/CalendarReport"));

function SpheresSidebar({ activeId, activeSub }: { activeId?: number; activeSub?: string | null }) {
  const { t } = useLang();
  const [open, setOpen] = useState<number | undefined>(activeId);
  useEffect(() => setOpen(activeId), [activeId]);
  // Joriy soha birinchi turadi (my.gov.uz dagi kabi)
  const ordered = activeId ? [...SPHERES.filter((s) => s.id === activeId), ...SPHERES.filter((s) => s.id !== activeId)] : SPHERES;

  return (
    <nav aria-label={t(UI.spheres)} className="rounded-mg bg-mg-surface px-4 pb-4">
      <h2 className="px-1 pb-4 pt-6 text-xl font-bold text-black dark:text-white">{t(UI.spheres)}</h2>
      <ul>
        {ordered.map((sp) => {
          const isOpen = open === sp.id;
          const isActive = activeId === sp.id;
          return (
            <li key={sp.id} className="border-b border-mg-border last:border-b-0">
              <div className={`flex items-center rounded-mg ${isActive ? "bg-mg-info" : ""}`}>
                <Link to={`/spheres/${sp.id}`} aria-current={isActive && !activeSub ? "page" : undefined}
                  className={`flex-1 px-3 py-3 text-[15px] font-medium ${isActive ? "text-mg-primary" : "text-[#3f3f3f] hover:text-mg-primary dark:text-gray-200"}`}>
                  {t(sp.title)}
                </Link>
                {sp.subcategories.length > 0 && (
                  <button type="button" onClick={() => setOpen(isOpen ? undefined : sp.id)} aria-expanded={isOpen}
                    aria-label={t(sp.title)} className="p-3 text-mg-heading">
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                )}
              </div>
              {isOpen && sp.subcategories.length > 0 && (
                <ul className="pb-2 pt-1">
                  <li>
                    <Link to={`/spheres/${sp.id}`}
                      className={`block rounded-mg px-4 py-2 text-[15px] ${isActive && !activeSub ? "bg-mg-info font-semibold text-mg-primary" : "text-mg-primary hover:underline"}`}>
                      {t(sp.title)}
                    </Link>
                  </li>
                  {sp.subcategories.map((c) => (
                    <li key={c.id}>
                      <Link to={`/spheres/${sp.id}?sub=${c.id}`} aria-current={isActive && activeSub === c.id ? "page" : undefined}
                        className={`block rounded-mg px-4 py-2 text-[15px] ${isActive && activeSub === c.id ? "bg-mg-info font-semibold text-mg-primary" : "text-mg-primary hover:underline"}`}>
                        {t(c.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function FilterPanel({ params, setParams }: { params: URLSearchParams; setParams: (p: URLSearchParams) => void }) {
  const { t } = useLang();
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  const group = (key: string, title: string, options: [string, string][]) => (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-mg-heading">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, label]) => {
          const on = (params.get(key) ?? "") === value;
          return (
            <button key={value} type="button" onClick={() => set(key, value)} aria-pressed={on}
              className={`rounded-mg border px-4 py-1.5 text-sm ${on ? "border-mg-primary bg-mg-primary text-white" : "border-mg-primary bg-mg-surface text-mg-text"}`}>
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
  return (
    <div className="grid gap-4 rounded-mg bg-mg-surface p-5 sm:grid-cols-2">
      {group("user", t(UI.userType), [["", t(UI.everyone)], ["individual", t(UI.individual)], ["legal", t(UI.legal)]])}
      {group("price", t(UI.priceFilter), [["", t(UI.everyone)], ["free", t(UI.free)], ["paid", t(UI.paid)]])}
    </div>
  );
}

/**
 * MG-06: `/spheres/:id` — soha sahifasi (MG-00 bo'yicha): chapda "Sohalar" akkordeoni (joriysi birinchi, kichik toifalar),
 * o'ngda H1 + xizmatlar soni, "Xizmatni izlash", "Kengaytirilgan qidiruv" (foydalanuvchi turi, narx) va 2 ustunli kartochkalar.
 * `/spheres` — "Barcha xizmatlar": xuddi shu layout, sohalar ketma-ket. Filtrlar URL'da (`?user=legal&price=free&q=&sub=`).
 */
export default function Spheres() {
  const { id } = useParams();
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const { items: stats, isSample } = useServiceStats();
  const [advanced, setAdvanced] = useState(() => params.has("user") || params.has("price"));
  const sphere = id ? sphereById(Number(id)) : undefined;
  const sub = params.get("sub");
  const q = params.get("q") ?? "";

  const sections = useMemo(() => {
    const filter = (list: ServiceCatalogItem[]) =>
      list.filter((s) => (!sub || s.subcategory === sub) && matchesFilters(s, params.get("user"), params.get("price"), q));
    return sphere
      ? [{ sphere, services: filter(servicesOfSphere(sphere.id)) }]
      : SPHERES.map((sp) => ({ sphere: sp, services: filter(SERVICES.filter((s) => s.sphere === sp.id)) })).filter((x) => x.services.length);
  }, [sphere, sub, params, q]);

  useEffect(() => {
    document.title = `${sphere ? t(sphere.title) : t(UI.allServices)} — my.stat.uz`;
  }, [sphere, t]);

  if (id && !sphere) return <Navigate to="/spheres" replace />;
  const total = sections.reduce((n, x) => n + x.services.length, 0);
  const setQ = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          <li><Link to="/" className="text-mg-primary hover:underline">{t(UI.home)}</Link></li>
          <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" aria-hidden="true" />
            {sphere ? <Link to="/spheres" className="text-mg-primary hover:underline">{t(UI.spheres)}</Link> : <span aria-current="page">{t(UI.spheres)}</span>}
          </li>
          {sphere && <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" aria-hidden="true" /><span aria-current="page">{t(sphere.title)}</span></li>}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="hidden lg:block"><SpheresSidebar activeId={sphere?.id} activeSub={sub} /></div>
        {/* Mobil: sohalar gorizontal chip'lar */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
          {SPHERES.map((sp) => (
            <Link key={sp.id} to={`/spheres/${sp.id}`} aria-current={sp.id === sphere?.id ? "page" : undefined}
              className={`shrink-0 rounded-mg border px-3 py-1.5 text-sm ${sp.id === sphere?.id ? "border-mg-primary bg-mg-primary text-white" : "border-mg-border bg-mg-surface text-mg-text"}`}>
              {t(sp.title)}
            </Link>
          ))}
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-mg-primary">
            {sphere ? t(sphere.title) : t(UI.allServices)} <span className="font-normal">({total})</span>
            {isSample && <span className="ml-2 align-middle"><DemoBadge /></span>}
          </h1>
          <div className="mt-5 flex items-center gap-3 rounded-mg border border-mg-border bg-mg-surface px-4">
            <Search className="h-5 w-5 text-mg-primary" aria-hidden="true" />
            <label htmlFor="sphere-q" className="sr-only">{t(UI.serviceSearch)}</label>
            <input id="sphere-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(UI.serviceSearch)}
              className="h-12 w-full bg-transparent text-base text-mg-text outline-none placeholder:text-slate-400" />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced}
              className="inline-flex h-12 items-center gap-2.5 rounded-mg bg-mg-primary px-5 text-sm font-medium text-white hover:brightness-110">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />{t(UI.advancedSearch)}
            </button>
          </div>
          {advanced && <div className="mt-4"><FilterPanel params={params} setParams={setParams} /></div>}

          {total === 0 && <p className="mt-8 rounded-mg bg-mg-surface p-8 text-center text-mg-muted">{t(UI.nothingFound)}</p>}
          {sections.map(({ sphere: sp, services }) => (
            <section key={sp.id} className="mt-6" aria-labelledby={sphere ? undefined : `sphere-${sp.id}`}>
              {!sphere && (
                <h2 id={`sphere-${sp.id}`} className="mb-3 flex items-center justify-between text-lg font-bold text-mg-heading">
                  {t(sp.title)}
                  <Link to={`/spheres/${sp.id}`} className="text-sm font-medium text-mg-primary hover:underline">{t(UI.all)}</Link>
                </h2>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {services.map((s) => <ServiceCard key={s.number} s={s} stats={stats[s.number]} />)}
              </div>
            </section>
          ))}

          {sphere?.slug === "tariffs" && <Suspense fallback={null}><div className="mt-10"><TariffComponent /></div></Suspense>}
          {sphere?.slug === "reporting" && <Suspense fallback={null}><div className="mt-10"><CalendarReport /></div></Suspense>}
        </div>
      </div>
    </div>
  );
}
