import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Calculator, Coins } from "lucide-react";
import { formatCredits, PLAN_NAMES } from "../api/credits";
import { fetchTariffCompare, type TariffCompare } from "../api/tariffs";
import useApi from "../hooks/useApi";
import { ErrorState, PageHeader, Skeleton } from "../components/ui";
import { formatMoney } from "../utils/format";

/** Paket summasi: "824 000 so'm / oy" yoki "+412 000 so'm (bir marta)". */
const statcoinLabel = (s: NonNullable<TariffCompare["packages"][number]["statcoin"]>) =>
  s.kind === "monthly" ? `${formatCredits(s.amount)} / oy` : `+${formatCredits(s.amount)} (bir marta)`;

/** Hamyondan to'lanadigan xizmatlar jadvalda emas, alohida ro'yxatda: ularni "rasmiy xizmatlar"dan ajratamiz. */
const isStatCoinRow = (data: TariffCompare, slug: string | null) => !!slug && data.statcoin_services.some((s) => s.slug === slug);

/** K-09 + KR-41: StatCoin tariflari, StatCoin bilan to'lanadigan xizmatlar va sektor bo'yicha narx kalkulyatori.
 *  Eski paketlar jadvali olib tashlandi (egasi qarori, 2026-10-23): mavjud paket egalarining huquqi saqlanadi. */
export default function TariffCompare() {
  const [sector, setSector] = useState<number | undefined>();
  const { data, loading, error, reload } = useApi(() => fetchTariffCompare(sector), [sector]);
  const withCoin = (data?.packages ?? []).filter((p) => p.statcoin);
  const monthly = withCoin.filter((p) => p.statcoin!.kind === "monthly").sort((a, b) => a.statcoin!.amount - b.statcoin!.amount);
  const topups = withCoin.filter((p) => p.statcoin!.kind === "topup").sort((a, b) => a.statcoin!.amount - b.statcoin!.amount);
  const officialRows = (data?.rows ?? []).filter((r) => !isStatCoinRow(data!, r.slug) && Object.keys(r.cells).length > 0);

  return (
    <div className="py-2">
      <div className="w-full">
        <PageHeader
          title="Tariflarni taqqoslash"
          description="Hamyon tariflari, xizmatlar narxi va tarmog'ingiz bo'yicha yakuniy narx."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Xizmatlar", to: "/services" }, { label: "Tariflar" }]}
        />
        {loading && !data ? (
          <Skeleton variant="table" rows={8} />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-blue-600" /> Narx kalkulyatori
              </h2>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1" htmlFor="sector">Faoliyat tarmog'i (OKED bo'limi)</label>
              <select
                id="sector"
                value={sector ?? data.sector?.id ?? ""}
                onChange={(e) => setSector(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              >
                <option value="">Tarmoq tanlanmagan (asosiy narx)</option>
                {data.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                    {s.id === data.user_sector_id ? " (sizning korxonangiz)" : ""}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Narx = paketdagi BHM soni × BHM qiymati ({formatMoney(data.packages[0]?.pricing.bhm_value)}) × tarmoq koeffitsienti. Hisob serverda bajariladi.
              </p>
            </section>

            {data.packages.some((p) => p.statcoin) && (
              <section aria-labelledby="statcoin-tariffs" className="rounded-2xl border border-mg-border bg-mg-surface p-5">
                <h2 id="statcoin-tariffs" className="mb-1 flex items-center gap-2 font-semibold text-mg-heading">
                  <Coins className="h-5 w-5 text-mg-primary" aria-hidden="true" /> Hamyon tariflari
                </h2>
                <p className="mb-4 text-sm text-mg-muted">
                  To'langan summa hamyoningizga so'mda tushadi va korxona profillarining pullik bo'limlari hamda xizmatlar uchun sarflanadi.
                  Oylik tarif har oy hamyoningizga shu summani qo'shadi (ishlatilmagani keyingi oyga o'tmaydi); qo'shimcha paket bir marta qo'shiladi va paket muddati davomida amal qiladi.
                  Paket shartnoma imzolanib, to'lov tasdiqlangach faollashadi.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {monthly.map((p) => (
                    <Link key={p.id} to={`/tariff/${p.id}`}
                      className="flex flex-col rounded-mg border border-mg-border bg-[rgb(var(--ds-panel))] p-4 transition hover:border-mg-primary/50">
                      <span className="text-xs font-semibold uppercase tracking-wide text-mg-muted">Oylik tarif</span>
                      <span className="mt-1 font-semibold text-mg-heading">{p.name}</span>
                      <span className="mt-2 text-lg font-bold text-mg-heading">{statcoinLabel(p.statcoin!)}</span>
                      {p.statcoin!.plan && <span className="text-xs text-mg-muted">Daraja: {PLAN_NAMES[p.statcoin!.plan] ?? p.statcoin!.plan}</span>}
                      <span className="mt-3 text-sm text-mg-muted">To'lov: {formatMoney(p.pricing.price)}</span>
                    </Link>
                  ))}
                  <Link to="/contact" className="flex flex-col rounded-mg border border-dashed border-mg-border p-4 transition hover:border-mg-primary/50">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mg-muted">
                      <Building2 className="h-4 w-4" aria-hidden="true" /> Korporativ
                    </span>
                    <span className="mt-1 font-semibold text-mg-heading">Banklar, lizing, sug'urta, ta'minotchi tekshiruvi</span>
                    <span className="mt-2 text-sm text-mg-muted">Shartnoma bo'yicha hajm; ommaviy tekshiruv va monitoring.</span>
                    <span className="mt-3 text-sm font-semibold text-mg-primary">Bog'lanish</span>
                  </Link>
                </div>
                {topups.length > 0 && (
                  <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-mg-muted">
                    <span>Hamyonni qo'shimcha to'ldirish (bir marta, paket muddati davomida amal qiladi):</span>
                    {topups.map((p) => (
                      <Link key={p.id} to={`/tariff/${p.id}`}
                        className="rounded-full border border-mg-border px-3 py-1 font-semibold text-mg-heading hover:border-mg-primary/50">
                        +{formatCredits(p.statcoin!.amount)}
                      </Link>
                    ))}
                  </p>
                )}
              </section>
            )}

            {data.statcoin_services.length > 0 && (
              <section aria-labelledby="statcoin-services" className="rounded-2xl border border-mg-border bg-mg-surface p-5">
                <h2 id="statcoin-services" className="mb-1 font-semibold text-mg-heading">Hamyondan to'lanadigan xizmatlar</h2>
                <p className="mb-4 text-sm text-mg-muted">
                  Har bir foydalanish hamyoningizdan so'mda yechiladi, paket limiti kerak emas. Narxlar o'zgarishi mumkin.
                  Eski paketingizda limit qolgan bo'lsa, avval o'sha ishlatiladi.
                </p>
                <ul className="divide-y divide-mg-border rounded-mg border border-mg-border">
                  {data.statcoin_services.map((s) => (
                    <li key={s.slug} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                      <span className="text-mg-text">{s.name}</span>
                      <span className="whitespace-nowrap font-bold text-mg-heading">{formatCredits(s.credits)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {officialRows.length > 0 && (
              <section aria-labelledby="official-services" className="rounded-2xl border border-mg-border bg-mg-surface p-5">
                <h2 id="official-services" className="mb-1 font-semibold text-mg-heading">Rasmiy xizmatlar (shartnoma asosida)</h2>
                <p className="mb-3 text-sm text-mg-muted">
                  Bu xizmatlar hamyondan emas, alohida shartnoma va to'lov bilan ko'rsatiladi.
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-mg-text">
                  {officialRows.map((r) => <li key={r.id}>{r.name}</li>)}
                </ul>
                <Link to="/services" className="mt-3 inline-flex text-sm font-semibold text-mg-primary hover:underline">Xizmatlar katalogi</Link>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
