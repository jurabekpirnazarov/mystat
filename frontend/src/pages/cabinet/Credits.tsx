import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarClock, Coins, Plus } from "lucide-react";
import { fetchCredits, formatCredits, type CreditLedgerRow } from "../../api/credits";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";

const fmtDate = (s: string) => new Date(s).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });

const ACTION_NAMES: Record<string, string> = {
  profile_basis: "Profil: ball nimaga asoslangan",
  profile_deep: "Profil: chuqur tahlil",
};

const KIND_TONE: Record<string, string> = {
  grant: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  refund: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  spend: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  expire: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  adjust: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

function describe(r: CreditLedgerRow) {
  if (r.kind === "spend" || r.kind === "refund") {
    const what = ACTION_NAMES[r.action_code] ?? r.action_code;
    return r.object_ref ? <>{what} — <Link to={`/company/${r.object_ref}`} className="text-blue-600 hover:underline">{r.object_name ?? `STIR ${r.object_ref}`}</Link></> : what;
  }
  return r.reason || r.kind_name;
}

/**
 * KORXONA_SCORING.md 11.6, 13.5: StatCoin hamyoni — balans, muddati yaqin StatCoin'lar, ochilgan profillar (qolgan kunlar
 * bilan) va ledger tarixi (faqat qo'shiladi, o'chirilmaydi).
 */
export default function Credits() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(() => fetchCredits(page), [page]);

  if (loading && !data) return <Skeleton variant="card" />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const pages = Math.max(1, Math.ceil(data.ledger.count / data.ledger.page_size));
  const nextExpiry = data.expiring[0];
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">StatCoin hamyoni</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">StatCoin — korxona profillarining pullik bo'limlarini ochish uchun ichki hisob birligi</p>
        </div>
        <Link to="/tariffs#scoring" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" aria-hidden="true" />{data.plan ? "StatCoin qo'shish" : "Tarif tanlang"}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Coins className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Balans</p>
              <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{formatCredits(data.balance)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Tarif: <span className="font-medium text-gray-700 dark:text-gray-200">{data.plan_name}</span></p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"><CalendarClock className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Eng yaqin muddat</p>
              <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{nextExpiry ? fmtDate(nextExpiry.expires_at) : "—"}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{nextExpiry ? `${formatCredits(nextExpiry.left)} shu kungacha amal qiladi` : "Muddati tugaydigan StatCoin yo'q"}</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Ochilgan korxonalar</p>
              <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{data.unlocks.length}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Muddat tugaguncha qayta ochish bepul</p>
        </div>
      </div>

      {data.expiring.length > 0 && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">StatCoin'lar muddati</h3>
          <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-700">
            {data.expiring.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="text-gray-800 dark:text-gray-100"><span className="font-semibold tabular-nums">{formatCredits(e.left)}</span> · {e.reason}</span>
                <span className="text-gray-500 dark:text-gray-400">{fmtDate(e.expires_at)} gacha</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">Ochilgan korxonalar</h3>
        {data.unlocks.length ? (
          <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-700">
            {data.unlocks.map((u) => (
              <li key={`${u.stir}:${u.level}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link to={`/company/${u.stir}${u.level === "deep" ? "?tab=deep" : "?tab=basis"}`} className="min-w-0 truncate font-medium text-blue-600 hover:underline">{u.name ?? `STIR ${u.stir}`}</Link>
                <span className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{u.level_name}</span>
                  <span className={u.days_left <= 3 ? "text-red-600" : "text-gray-500 dark:text-gray-400"}>yana {u.days_left} kun</span>
                </span>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="Hali korxona ochilmagan" description="Hamkor qidiruvida korxona profilini oching." />}
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900 dark:border-gray-700 dark:text-white">Amallar tarixi</h3>
        {data.ledger.results.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                  <th className="px-4 py-2 font-medium">Sana</th>
                  <th className="px-4 py-2 font-medium">Turi</th>
                  <th className="px-4 py-2 font-medium">Izoh</th>
                  <th className="px-4 py-2 text-right font-medium">StatCoin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.ledger.results.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDate(r.created_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${KIND_TONE[r.kind] ?? KIND_TONE.adjust}`}>{r.kind_name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{describe(r)}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${r.amount < 0 ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"}`}>{r.amount > 0 ? "+" : ""}{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Yozuvlar yo'q" />}
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-2 text-sm dark:border-gray-700">
            <button type="button" aria-label="Oldingi sahifa" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40 dark:border-gray-600">←</button>
            <span className="tabular-nums">{page} / {pages}</span>
            <button type="button" aria-label="Keyingi sahifa" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40 dark:border-gray-600">→</button>
          </div>
        )}
      </section>
    </div>
  );
}
