import { useState } from "react";
import { Link } from "react-router-dom";
import { Coins } from "lucide-react";
import { fetchCredits, formatCredits, type CreditLedgerRow } from "../../api/credits";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";

const fmtDate = (s: string) => new Date(s).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });

const ACTION_NAMES: Record<string, string> = {
  profile_basis: "Profil: ball nimaga asoslangan",
  profile_deep: "Profil: chuqur tahlil",
};

function describe(r: CreditLedgerRow) {
  if (r.kind === "spend" || r.kind === "refund") {
    const what = ACTION_NAMES[r.action_code] ?? r.action_code;
    return r.object_ref ? <>{what} — <Link to={`/company/${r.object_ref}`} className="text-blue-600 hover:underline">{r.object_name ?? `STIR ${r.object_ref}`}</Link></> : what;
  }
  return r.reason || r.kind_name;
}

/**
 * KORXONA_SCORING.md 11.6, 13.5: kredit hamyoni — balans, muddati yaqin kreditlar, ochilgan profillar (qolgan kunlar
 * bilan) va ledger tarixi (faqat qo'shiladi, o'chirilmaydi).
 */
export default function Credits() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(() => fetchCredits(page), [page]);

  if (loading && !data) return <Skeleton variant="card" />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const pages = Math.max(1, Math.ceil(data.ledger.count / data.ledger.page_size));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><Coins className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <p className="text-sm text-gray-500">Balans</p>
            <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{formatCredits(data.balance)}</p>
            <p className="text-xs text-gray-500">Tarif: {data.plan_name}</p>
          </div>
        </div>
        <Link to="/tariffs#scoring" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{data.plan ? "Kredit qo'shish" : "Tarif tanlang"}</Link>
      </div>

      {data.expiring.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Muddati bo'yicha</h3>
          <ul className="space-y-1 text-sm">
            {data.expiring.map((e) => (
              <li key={e.id} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                <span>{formatCredits(e.left)} · {e.reason}</span>
                <span className="text-gray-500">{fmtDate(e.expires_at)} gacha</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Ochilgan korxonalar</h3>
        {data.unlocks.length ? (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 text-sm dark:divide-gray-700 dark:border-gray-700">
            {data.unlocks.map((u) => (
              <li key={`${u.stir}:${u.level}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <Link to={`/company/${u.stir}${u.level === "deep" ? "?tab=deep" : "?tab=basis"}`} className="min-w-0 truncate text-blue-600 hover:underline">{u.name ?? `STIR ${u.stir}`}</Link>
                <span className="text-xs text-gray-500">{u.level_name} · yana {u.days_left} kun</span>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="Hali korxona ochilmagan" description="Hamkor qidiruvida korxona profilini oching." />}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Tarix</h3>
        {data.ledger.results.length ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="bg-gray-50 text-left text-xs text-gray-500 dark:bg-gray-800"><th className="px-3 py-2">Sana</th><th className="px-3">Amal</th><th className="px-3 text-right">Kredit</th></tr></thead>
              <tbody>
                {data.ledger.results.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="whitespace-nowrap px-3 py-2 text-gray-500">{fmtDate(r.created_at)}</td>
                    <td className="px-3"><span className="mr-1 text-xs text-gray-400">{r.kind_name}:</span>{describe(r)}</td>
                    <td className={`px-3 text-right tabular-nums ${r.amount < 0 ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"}`}>{r.amount > 0 ? "+" : ""}{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Yozuvlar yo'q" />}
        {pages > 1 && (
          <div className="mt-2 flex items-center justify-end gap-2 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">←</button>
            <span>{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">→</button>
          </div>
        )}
      </section>
    </div>
  );
}
