import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, Building2, Calculator, ClipboardList, ExternalLink, Factory, Globe2, Landmark, LayoutGrid, LogIn, Users,
} from "lucide-react";
import { interactive_services } from "../api/apiUrls";
import { getRequest } from "../api/request";
import type { InteractiveServicesResponse } from "../types";
import { stripHtml } from "../utils/format";

/**
 * Bosh sahifa: interaktiv xizmatlar. Har kartochka — haqiqiy havola (`/<slug>`; http bo'lsa tashqi sahifa).
 * Ilgari: ikonka ro'yxatdagi tartib raqami bo'yicha olinardi (xizmatga mos emas), tavsif admin'dagi HTML bilan
 * (kengaytirilgan matn) chiqardi, yo'nalish nomdagi so'z bo'yicha taxmin qilinardi, hech qachon ochilmaydigan
 * modal oynalar bor edi.
 */
const ICONS: Record<string, typeof Users> = {
  demographics: Users,
  books: BookOpen,
  "ex-trade": Globe2,
  "cpi-calculator": Calculator,
  industry: Factory,
  "report-calendar": ClipboardList,
  orginfo: Building2,
  organizations: Landmark,
};

type Service = InteractiveServicesResponse["results"][number];

function access(s: Service) {
  if (s.in_package) return { text: "Tarif bo'yicha", cls: "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200" };
  if (s.is_free) return { text: "Bepul", cls: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" };
  return { text: "Pullik", cls: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" };
}

function ServiceCard({ s }: { s: Service }) {
  const external = s.slug?.startsWith("http");
  const Icon = ICONS[s.slug ?? ""] ?? LayoutGrid;
  const a = access(s);
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 transition group-hover:bg-blue-900 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {s.is_popular && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-gray-700 dark:text-gray-200">Ko'p foydalaniladi</span>}
      </div>
      <h3 className="mt-4 font-semibold leading-snug text-slate-900 group-hover:text-blue-900 dark:text-white dark:group-hover:text-blue-300">{s.name_uz}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600 dark:text-gray-300">{stripHtml(s.description_uz)}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-gray-700">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${a.cls}`}>{a.text}</span>
          {s.requires_login && (
            <span title="Ma'lumotni ko'rish uchun tizimga kirish kerak" className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-gray-700 dark:text-gray-300">
              <LogIn className="h-3 w-3" aria-hidden="true" />Kirish kerak
            </span>
          )}
        </span>
        {external
          ? <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-900" aria-hidden="true" />
          : <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-900" aria-hidden="true" />}
      </div>
    </>
  );
  const cls = "group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800";
  return external
    ? <a href={s.slug!} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
    : <Link to={`/${s.slug ?? "services"}`} className={cls}>{body}</Link>;
}

const Interactive = () => {
  const [data, setData] = useState<InteractiveServicesResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getRequest(`${interactive_services}?category__name=interactive&limit=8`)
      .then((res) => setData(res as InteractiveServicesResponse))
      .catch(() => setFailed(true));
  }, []);

  const services = (data?.results ?? []).slice(0, 8);
  return (
    <section aria-labelledby="interactive-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="border-l-4 border-blue-900 pl-4 dark:border-blue-400">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-900 dark:text-blue-300">Onlayn xizmatlar</p>
          <h2 id="interactive-title" className="mt-1 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Interaktiv xizmatlar</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">Statistik ma'lumotlardan foydalanish, kalkulyatorlar va ma'lumotnomalar.</p>
        </div>
        <Link to="/services" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:border-blue-800 hover:text-blue-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
          Barcha xizmatlar <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {failed ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-gray-700 dark:bg-gray-800">
          Xizmatlar ro'yxatini yuklab bo'lmadi. <Link to="/services" className="text-blue-800 underline">Barcha xizmatlar</Link> sahifasini oching.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!data
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-xl bg-slate-200 dark:bg-gray-700" />)
            : services.map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
      )}
    </section>
  );
};

export default Interactive;
