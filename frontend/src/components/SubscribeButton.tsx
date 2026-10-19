import { useState } from "react";
import { Link } from "react-router-dom";
import { BellPlus, Check } from "lucide-react";
import { subscribe, type Subscription } from "../api/openApi";
import { useAuth } from "../contexts/AuthContext";
import { loginUrl } from "../utils/loginRedirect";

const CHANNELS: { id: Subscription["channel"]; label: string }[] = [
  { id: "in_app", label: "Saytda" },
  { id: "email", label: "Email" },
  { id: "telegram", label: "Telegram" },
];

/** A-02: ko'rsatkich sahifasidagi "Obuna bo'lish" — kanal tanlanadi, obunani kabinetda o'chirish mumkin. */
export default function SubscribeButton({ indicator, title }: { indicator: string; title: string }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Link to={loginUrl()} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"><BellPlus className="w-4 h-4" /> Obuna</Link>;
  }
  const pick = async (channel: Subscription["channel"]) => {
    await subscribe(indicator, channel, title);
    setDone(CHANNELS.find((c) => c.id === channel)?.label ?? channel);
    setOpen(false);
  };
  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm ${done ? "border-emerald-400 text-emerald-700 dark:text-emerald-300" : "border-gray-300 dark:border-gray-600"}`}>
        {done ? <Check className="w-4 h-4" /> : <BellPlus className="w-4 h-4" />} {done ? `Obuna (${done})` : "Obuna bo'lish"}
      </button>
      {open && (
        <span role="menu" className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
          {CHANNELS.map((c) => (
            <button key={c.id} type="button" role="menuitem" onClick={() => pick(c.id)} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">{c.label}</button>
          ))}
          <Link to="/cabinet" state={{ name: "subscriptions" }} className="block px-3 py-2 text-xs text-gray-500 hover:underline">Obunalarim →</Link>
        </span>
      )}
    </span>
  );
}
