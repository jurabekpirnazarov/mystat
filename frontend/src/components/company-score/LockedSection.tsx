import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import type { LockedSection as Locked } from "../../api/companyProfile";
import { formatCredits, notifyCreditsChanged, PLAN_NAMES, unlockSection, type UnlockResult } from "../../api/credits";
import { loginUrl } from "../../utils/loginRedirect";

const SKIP_KEY = "credits:skip-confirm";

const skipConfirm = () => {
  try {
    return sessionStorage.getItem(SKIP_KEY) === "1";
  } catch {
    return false;
  }
};

interface Props {
  stir: string;
  section: Locked;
  balance: number;
  onUnlocked: (r: UnlockResult) => void;
}

/** Xira statik namuna: haqiqiy qiymat emas, faqat bo'limda nima borligini ko'rsatadi (11.1). */
function Placeholder() {
  return (
    <div aria-hidden="true" className="pointer-events-none select-none blur-[3px] opacity-60">
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
          <polygon points="60,10 105,35 105,85 60,110 15,85 15,35" fill="none" stroke="#9ca3af" />
          <polygon points="60,30 90,45 95,80 60,95 30,75 25,45" fill="#93c5fd" fillOpacity=".5" stroke="#3b82f6" />
        </svg>
        <div className="flex-1 space-y-2">
          {[70, 45, 85, 30, 60].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-2 w-16 rounded bg-gray-300 dark:bg-gray-600" />
              <span className="h-2 rounded bg-blue-300 dark:bg-blue-700" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * KORXONA_SCORING.md 11.6, 13.2: qulflangan bo'lim — sarlavha, qisqa tavsif, xira namuna va holatga qarab tugma:
 * "Ochish · 1 kredit (qoldiq 37)", "Tarif tanlang", "Kredit sotib olish", mehmon uchun "Kirish". Kredit yechadigan
 * tugma tasdiqlash oynasi bilan ("Bu seansda so'ramasin"); ochilgach sahifa yangilanmasdan to'ladi.
 */
export default function LockedSection({ stir, section, balance, onUnlocked }: Props) {
  const location = useLocation();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opt = section.unlock;
  const credits = opt?.credits ?? 0;

  const doUnlock = async () => {
    if (!opt) return;
    setBusy(true);
    setError(null);
    try {
      const r = await unlockSection(stir, opt.level);
      notifyCreditsChanged(r.balance);
      setConfirm(false);
      onUnlocked(r);
    } catch (e) {
      const data = (e as { response?: { data?: { detail?: string } } })?.response?.data;
      setError(data?.detail || "Ochib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  };

  const start = () => (skipConfirm() ? doUnlock() : setConfirm(true));
  const btn = "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium";

  let action: JSX.Element;
  let note: string | null = null;
  if (section.insufficient || opt?.reason === "insufficient_data") {
    action = <span className={`${btn} cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300`}>Ma'lumot yetarli emas</span>;
    note = "Bu korxona uchun ishonchli ball yo'q, shuning uchun bo'limni ochib bo'lmaydi va kredit yechilmaydi.";
  } else if (!opt || opt.reason === "login") {
    action = <Link to={loginUrl(location.pathname + location.search)} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Kirish</Link>;
    note = "Bo'limni ochish uchun tizimga kiring.";
  } else if (opt.reason === "plan_required") {
    action = <Link to="/tariffs#scoring" className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Tarif tanlang</Link>;
    note = `${PLAN_NAMES[opt.min_plan] ?? opt.min_plan} va undan yuqori tarifda ochiladi.`;
  } else if (opt.reason === "insufficient") {
    action = <Link to="/tariffs#scoring" className={`${btn} bg-amber-500 text-white hover:bg-amber-600`}>Kredit sotib olish</Link>;
    note = `Kerak: ${formatCredits(credits)}, qoldiq: ${formatCredits(balance)}.`;
  } else if (opt.reason) {
    action = <span className={`${btn} cursor-not-allowed bg-gray-100 text-gray-500`}>Hozir mavjud emas</span>;
  } else {
    action = (
      <button type="button" onClick={start} disabled={busy} className={`${btn} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60`}>
        <Lock className="h-4 w-4" aria-hidden="true" /> Ochish · {formatCredits(credits)} (qoldiq {balance})
      </button>
    );
  }

  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4">
      <Placeholder />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 p-4 text-center dark:bg-gray-900/70">
        <p className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white"><Lock className="h-4 w-4" aria-hidden="true" /> {section.title}</p>
        <p className="max-w-md text-xs text-gray-600 dark:text-gray-300">Bu bo'limda: {section.summary}</p>
        {action}
        {note && <p className="text-xs text-gray-500 dark:text-gray-400">{note}</p>}
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </div>
      {confirm && opt && <ConfirmDialog credits={credits} title={section.title} busy={busy} error={error} onCancel={() => setConfirm(false)} onConfirm={doUnlock} />}
    </div>
  );
}

function ConfirmDialog({ credits, title, busy, error, onCancel, onConfirm }: {
  credits: number; title: string; busy: boolean; error: string | null; onCancel: () => void; onConfirm: () => void;
}) {
  const [skip, setSkip] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const confirm = () => {
    if (skip) {
      try {
        sessionStorage.setItem(SKIP_KEY, "1");
      } catch { /* sessionStorage yopiq — har safar so'raladi */ }
    }
    onConfirm();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby="unlock-title" className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 id="unlock-title" className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{formatCredits(credits)} yechiladi, bo'lim 30 kun ochiq turadi. Shu vaqt ichida qayta kirish va vaznlarni almashtirish bepul.</p>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} /> Bu seansda so'ramasin
        </label>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Bekor qilish</button>
          <button ref={okRef} type="button" onClick={confirm} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? "Ochilmoqda…" : `Ochish · ${formatCredits(credits)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
