import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Coins, Loader2 } from "lucide-react";
import axiosT from "../../api/baseUrl";
import { formatCredits, PLAN_NAMES } from "../../api/credits";
import { fetchTariffCompare, type PackageStatCoin } from "../../api/tariffs";
import { useAuth } from "../../contexts/AuthContext";

interface Activation {
  contracts: { id: number; number: string; status: string; total: number; paid: number; activated: boolean }[];
  active: boolean;
  balance: number;
  plan: string;
  activated_now?: string[];
}

const money = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} so'm`;
const times = (amount: number, price: number) => (price > 0 ? Math.floor(amount / price) : 0);

/**
 * KR-41: StatCoin paketi tanlanganda — nima berishi, StatCoin bilan nimalar ochilishi (narx va necha marta yetishi) va
 * faollashtirish holati. To'lov tasdiqlangach paket o'zi faollashadi (Celery, har 10 daqiqa); "Tekshirish" tugmasi buni
 * darhol bajaradi.
 */
export default function StatCoinPackagePanel({ packageId }: { packageId: number }) {
  const { isAuthenticated } = useAuth();
  const [sc, setSc] = useState<PackageStatCoin | null>(null);
  const [state, setState] = useState<Activation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTariffCompare().then((d) => setSc(d.packages.find((p) => p.id === packageId)?.statcoin ?? null)).catch(() => undefined);
  }, [packageId]);

  const load = useCallback(() => {
    if (!isAuthenticated) return;
    axiosT.get<Activation>("/credits/activation/", { params: { package: packageId } }).then((r) => setState(r.data)).catch(() => undefined);
  }, [isAuthenticated, packageId]);
  useEffect(load, [load]);

  const check = async () => {
    setBusy(true);
    setMessage("");
    try {
      const { data } = await axiosT.post<Activation>("/credits/activation/", { package: packageId });
      setState(data);
      setMessage(data.activated_now?.length ? "Paket faollashdi, summa hamyonga qo'shildi." : "To'lov hali to'liq tasdiqlanmagan.");
    } catch {
      setMessage("Tekshirib bo'lmadi. Keyinroq urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  };

  if (!sc) return null;
  const monthly = sc.kind === "monthly";
  const last = state?.contracts[0];

  return (
    <div className="mb-5 space-y-4">
      <section className="rounded-2xl border border-mg-border bg-mg-surface p-5">
        <h3 className="flex items-center gap-2 font-semibold text-mg-heading">
          <Coins className="h-5 w-5 text-mg-primary" aria-hidden="true" /> Bu tarif nima beradi
        </h3>
        <p className="mt-2 text-lg font-bold text-mg-heading">{monthly ? `${formatCredits(sc.amount)} har oy` : `${formatCredits(sc.amount)} bir marta`}</p>
        <p className="mt-1 text-sm text-mg-muted">
          {monthly
            ? "Oylik summa hamyoningizga har oy qo'shiladi; ishlatilmagani keyingi oyga o'tmaydi."
            : "Summa hamyoningizga bir marta qo'shiladi va paket muddati davomida amal qiladi."}
          {sc.plan && ` Hamyon darajasi: ${PLAN_NAMES[sc.plan] ?? sc.plan}.`}
        </p>

        <h4 className="mt-4 text-sm font-semibold text-mg-heading">Hamyon bilan nimalar ochiladi</h4>
        <ul className="mt-2 divide-y divide-mg-border rounded-mg border border-mg-border text-sm">
          {[...sc.opens.profile, ...sc.opens.services.map((s) => ({ ...s, level: s.slug }))].map((o) => (
            <li key={o.level} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <span className="text-mg-text">{o.name}</span>
              <span className="whitespace-nowrap text-right">
                <b className="text-mg-heading">{formatCredits(o.credits)}</b>
                <span className="block text-xs text-mg-muted">{times(sc.amount, o.credits)} marta yetadi{monthly ? " (oyiga)" : ""}</span>
              </span>
            </li>
          ))}
        </ul>
        {sc.opens.needs_plan_for_profile && (
          <p className="mt-2 text-xs text-mg-muted">Korxona profili bo'limlari uchun oylik Scoring tarifi ham kerak; xizmatlar esa faqat hamyon bilan ishlaydi.</p>
        )}
      </section>

      {isAuthenticated && (
        <section className="rounded-2xl border border-mg-border bg-mg-surface p-5" aria-live="polite">
          <h3 className="font-semibold text-mg-heading">Faollashtirish holati</h3>
          {state?.active ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-mg-text">
              <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" /> Paket faol. Hamyonda: <b>{formatCredits(state.balance)}</b>.{" "}
              <Link to="/cabinet?tab=credits" className="font-semibold text-mg-primary hover:underline">Hamyon</Link>
            </p>
          ) : last ? (
            <p className="mt-2 text-sm text-mg-text">
              Shartnoma {last.number}: to'lov {money(last.paid)} / {money(last.total)}. To'lov to'liq tasdiqlangach paket o'zi faollashadi.
            </p>
          ) : (
            <p className="mt-2 text-sm text-mg-text">Hali shartnoma yo'q. "Xizmatdan foydalanish" tugmasi orqali shartnoma tuzing; to'lovdan keyin paket o'zi faollashadi.</p>
          )}
          {!state?.active && last && (
            <button type="button" onClick={check} disabled={busy}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-mg-btn px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} To'lovni tekshirish va faollashtirish
            </button>
          )}
          {message && <p role="status" className="mt-2 text-sm text-mg-muted">{message}</p>}
        </section>
      )}
    </div>
  );
}
