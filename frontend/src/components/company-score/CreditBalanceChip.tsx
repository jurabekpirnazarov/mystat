import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins } from "lucide-react";
import { CREDITS_CHANGED, fetchCredits } from "../../api/credits";

/**
 * KORXONA_SCORING.md 11.6: sarlavhadagi balans chipi. Hamyoni yo'q (tarifsiz) foydalanuvchida chiqmaydi.
 * Kredit yechilganda (`credits:changed` hodisasi) sahifa yangilanmasdan yangilanadi.
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
    <Link to="/cabinet/credits" title="Kredit balansi" aria-label={`Kredit balansi: ${balance}`}
      className="hidden items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-sm font-medium tabular-nums text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 sm:inline-flex">
      <Coins className="h-4 w-4" aria-hidden="true" /> {balance}
    </Link>
  );
}
