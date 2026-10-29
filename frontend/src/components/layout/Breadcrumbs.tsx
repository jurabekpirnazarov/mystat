import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Info } from "lucide-react";
import { SERVICES, serviceForPath } from "../../config/serviceCatalog";
import { sphereById } from "../../config/spheres";
import { useLang, type I18nText } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

/** Katalogda yo'q sahifalar nomi (yo'l boshi bo'yicha). */
const PAGE_TITLES: [string, I18nText][] = [
  ["/spheres", UI.spheres],
  ["/popular", UI.popular],
  ["/search", { uz: "Izlash", ru: "Поиск" }],
  ["/situations", UI.situations],
  ["/questions", UI.faq],
  ["/about", UI.about],
  ["/contact", UI.contact],
  ["/statistics", UI.statistics],
  ["/cabinet", UI.cabinet],
  ["/login", UI.login],
  ["/privacy", UI.privacy],
  ["/terms", UI.terms],
  ["/ai-usage", UI.aiUsage],
  ["/sitemap", UI.sitemap],
  ["/services", UI.allServices],
  ["/tariff/", { uz: "Tarif", ru: "Тариф" }],
  ["/learn/", UI.learn],
  ["/regions/", { uz: "Hudud profili", ru: "Профиль региона" }],
  ["/company/", { uz: "Korxona profili", ru: "Профиль предприятия" }],
  ["/surveys/", { uz: "So'rovnoma", ru: "Опрос" }],
  ["/book-order", { uz: "Buyurtma", ru: "Заказ" }],
  ["/dashboards", { uz: "Mavzuli panellar", ru: "Тематические панели" }],
];

type Crumb = { label: string; to?: string };

/**
 * MG-00: my.gov.uz ichki sahifalarida breadcrumb bor ("Bosh sahifa › Sohalar › Iqtisodiyot va biznes").
 * Katalogdagi xizmat sahifasida: Bosh sahifa › Sohalar › Soha › Xizmat va o'ngda "#302 xizmat haqida" (MG-07.2).
 * Soha va xizmat pasporti sahifalari o'z breadcrumb'ini o'zi chizadi.
 */
export default function Breadcrumbs() {
  const { pathname, search } = useLocation();
  const { t } = useLang();
  // Sohalar, xizmat pasporti va hayotiy vaziyatlar sahifalari (ro'yxat ham, ichki ham) breadcrumb'ini o'zi chizadi
  if (pathname === "/" || /^\/(spheres|situations|service)(\/|$)/.test(pathname)) return null;

  const service = serviceForPath(pathname, search);
  const crumbs: Crumb[] = [{ label: t(UI.home), to: "/" }];
  if (service) {
    const sp = sphereById(service.sphere)!;
    crumbs.push({ label: t(UI.spheres), to: "/spheres" }, { label: t(sp.title), to: `/spheres/${sp.id}` }, { label: t(service.title) });
  } else {
    // Ichki sahifa: avval asosiy xizmat yo'li (masalan /regions/5 -> "Hududlar xaritasi"), keyin sahifa nomi
    const parent = SERVICES.find((s) => s.status === "live" && !s.route.includes("?") && s.route !== "/" && pathname.startsWith(`${s.route}/`));
    if (parent) crumbs.push({ label: t(parent.title), to: parent.route });
    const title = PAGE_TITLES.find(([p]) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`))?.[1];
    if (title) crumbs.push({ label: t(title) });
    if (crumbs.length === 1) return null;
  }
  crumbs[crumbs.length - 1].to = undefined;

  return (
    <div className="mb-5 flex min-h-[28px] flex-wrap items-center justify-between gap-2">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {crumbs.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-4 w-4 text-mg-heading" aria-hidden="true" />}
              {c.to ? <Link to={c.to} className="text-mg-primary hover:underline">{c.label}</Link>
                : <span aria-current="page" className="text-mg-text">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      {service && (
        <Link to={`/service/${service.number}`} className="inline-flex items-center gap-1.5 rounded-full bg-mg-info px-3 py-1 text-xs font-medium text-mg-primary hover:underline">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />#{service.number} — {t({ uz: "xizmat haqida", ru: "об услуге" })}
        </Link>
      )}
    </div>
  );
}
