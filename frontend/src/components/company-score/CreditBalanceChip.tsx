import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins } from "lucide-react";
import { CREDITS_CHANGED, fetchCredits } from "../../api/credits";

/**
 * KORXONA_SCORING.md 11.6: sarlavhadagi balans chipi. Hamyoni yo'q (tarifsiz) foydalanuvchida chiqmaydi.
 * StatCoin yechilganda (`credits:changed` hodisasi) sahifa yangilanmasdan yangilanadi.
 */
export default function CreditBalanceChip() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCredits().then((d) => alive && setBalance(d.wallet ? d.balance : null)).catch(() => alive && setBalance(null));
    const onChange = (e: Event) => {
      const b = (e as CustomEvent<{ balance?: number }>).detail?.balance;
      if (typeof b === "number") setBalance(b);
    };
    window.addEventListener(CREDITS_CHANGED, onChange);
    return () => {
      alive = false;
      window.removeEventListener(CREDITS_CHANGED, onChange);
    };
  }, []);

  if (balance === null) return null;
  return (
    <Link to="/cabinet/credits" title="StatCoin balansi" aria-label={`StatCoin balansi: ${balance}`}
      className="hidden h-12 items-center gap-2 rounded-full border border-mg-border bg-mg-surface py-1 pl-1 pr-3.5 shadow-sm transition hover:border-amber-300 sm:inline-flex">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
        <Coins className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold tabular-nums text-mg-heading">{balance}</span>
        <span className="block text-[10px] font-medium uppercase tracking-wide text-mg-muted">StatCoin</span>
      </span>
    </Link>
  );
}
