import { Link } from "react-router-dom";
import { BookOpen, HelpCircle, MapPin, MessageCircle, Star, Trash2, Vote } from "lucide-react";
import { fetchCitizenSummary, removeFavorite } from "../../api/citizens";
import { favoriteLink } from "../../utils/favorites";
import { fetchRegionProfile } from "../../api/regions";
import useApi from "../../hooks/useApi";
import { DemoBadge, EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { formatDateTime, formatMoney } from "../../utils/format";

function MyRegion({ id }: { id: number }) {
  const { data } = useApi(() => fetchRegionProfile(id), [id]);
  if (!data) return <Skeleton rows={3} />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {data.cards.slice(0, 3).map((c) => (
        <div key={c.key} className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
          <p className="text-xs text-gray-500 flex items-center gap-1">{c.label} <DemoBadge show={c.source === "synthetic"} /></p>
          <p className="text-lg font-semibold">{new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(c.value)} <span className="text-xs font-normal text-gray-500">{c.unit}</span></p>
        </div>
      ))}
    </div>
  );
}

/** FQ-04: fuqaro (jismoniy shaxs) kabinetining bosh paneli. Korxona bloklari ko'rinmaydi. */
export default function CitizenHome({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data, loading, error, reload } = useApi(fetchCitizenSummary, []);
  if (loading && !data) return <div className="p-6"><Skeleton variant="chart" /></div>;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const card = "rounded-xl border border-gray-200 dark:border-gray-700 p-5";
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Mening hududim{data.region ? `: ${data.region.name}` : ""}</h2>
          <Link to={data.region ? `/regions/${data.region.id}` : "/regions"} className="text-sm text-blue-600 hover:underline">{data.region ? "To'liq profil →" : "Hududni tanlash →"}</Link>
        </div>
        {data.region ? <MyRegion id={data.region.id} /> : <p className="text-sm text-gray-500">Profilda manzil ko'rsatilmagan — hududlar xaritasidan tanlang.</p>}
      </section>

      <section className={card}>
        <h2 className="font-semibold flex items-center gap-2 mb-3"><Star className="w-5 h-5 text-amber-500" /> Sevimli ko'rsatkichlar</h2>
        {data.favorites.length === 0 ? (
          <EmptyState title="Hali sevimlilar yo'q" description="Ochiq ko'rsatkichlar sahifasidagi ☆ tugmasi bilan qo'shing." className="py-4" />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.favorites.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2">
                <Link to={favoriteLink(f)} className="text-sm text-blue-700 dark:text-blue-300 hover:underline truncate">{f.title}</Link>
                <button type="button" aria-label={`${f.title} — olib tashlash`} onClick={async () => { await removeFavorite(f.id); reload(); }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className={card}>
          <h2 className="font-semibold flex items-center gap-2 mb-2"><HelpCircle className="w-5 h-5 text-blue-600" /> Savollarim</h2>
          {data.questions.length === 0 ? <p className="text-sm text-gray-500">Savol yubormagansiz.</p> : (
            <ul className="space-y-1.5 text-sm">{data.questions.map((q) => <li key={q.id} className="flex justify-between gap-2"><span className="truncate">{q.question}</span><span className="text-xs text-gray-500 shrink-0">{q.status_label}</span></li>)}</ul>
          )}
          <button type="button" onClick={() => onNavigate("questions")} className="mt-2 text-sm text-blue-600 hover:underline">Savol berish →</button>
        </section>
        <section className={card}>
          <h2 className="font-semibold flex items-center gap-2 mb-2"><Vote className="w-5 h-5 text-blue-600" /> So'rovnomalar</h2>
          <p className="text-sm">Qatnashganlar: <b>{data.surveys_answered}</b> · ochiq: <b>{data.open_surveys}</b></p>
          <Link to="/surveys" className="mt-2 inline-block text-sm text-blue-600 hover:underline">So'rovnomalarga o'tish →</Link>
        </section>
        <section className={card}>
          <h2 className="font-semibold flex items-center gap-2 mb-2"><BookOpen className="w-5 h-5 text-blue-600" /> Kitob buyurtmalarim</h2>
          {data.book_orders.length === 0 ? <p className="text-sm text-gray-500">Buyurtmalar yo'q.</p> : (
            <ul className="space-y-1 text-sm">{data.book_orders.map((o) => <li key={o.id} className="flex justify-between"><span>#{o.id} · {formatDateTime(o.created_at, false)}</span><span className="text-gray-500">{formatMoney(o.total_amount)}</span></li>)}</ul>
          )}
          <button type="button" onClick={() => onNavigate("orders")} className="mt-2 text-sm text-blue-600 hover:underline">Barchasi →</button>
        </section>
      </div>

      <section className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-600" /> Fuqarolar uchun barcha xizmatlar: inflyatsiya kalkulyatori, maoshingiz, narxlar, ismlar va boshqalar.</p>
        <Link to="/citizens" className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Fuqarolar uchun →</Link>
      </section>
    </div>
  );
}
