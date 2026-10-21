import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { addFavorite, fetchFavorites, removeFavorite, type Favorite } from "../../api/citizens";
import { useAuth } from "../../contexts/AuthContext";
import { useLang } from "../../i18n/LangContext";
import { loginUrl } from "../../utils/loginRedirect";

let cache: Promise<Favorite[]> | null = null;
const listeners = new Set<() => void>();

/**
 * MG-07: "Tanlanganlarga qo'shish" — xizmat sevimlilarga (FQ-04 modeli, kind="service", params={number}).
 * `variant="icon"` — kartochkadagi yulduzcha, `"button"` — pasportdagi tugma. Mehmonni login'ga yuboradi.
 */
export default function FavoriteServiceButton({ number, title, variant = "icon" }: { number: number; title: string; variant?: "icon" | "button" }) {
  const { isAuthenticated } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [fav, setFav] = useState<Favorite | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    cache ??= fetchFavorites().catch(() => []);
    let alive = true;
    void cache.then((list) => alive && setFav(list.find((f) => f.kind === "service" && Number(f.params?.number) === number) ?? null));
    return () => {
      alive = false;
    };
  }, [isAuthenticated, number, tick]);

  const label = fav ? t({ uz: "Tanlanganlardan olib tashlash", ru: "Убрать из избранного" }) : t({ uz: "Tanlanganlarga qo'shish", ru: "Добавить в избранное" });

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate(loginUrl());
      return;
    }
    setBusy(true);
    try {
      if (fav) await removeFavorite(fav.id);
      else await addFavorite({ kind: "service", title, params: { number } });
      cache = null;
      listeners.forEach((l) => l());
    } finally {
      setBusy(false);
    }
  };

  if (variant === "button") {
    return (
      <button type="button" onClick={toggle} disabled={busy} aria-pressed={!!fav}
        className="inline-flex h-[42px] items-center gap-2 rounded-mg bg-white px-4 text-sm font-semibold text-black shadow-sm hover:bg-slate-50">
        <Star className={`h-5 w-5 ${fav ? "fill-amber-400 text-amber-400" : ""}`} aria-hidden="true" />{label}
      </button>
    );
  }
  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={!!fav} aria-label={label} title={label}
      className="rounded-full p-1 text-slate-400 hover:text-amber-500">
      <Star className={`h-5 w-5 ${fav ? "fill-amber-400 text-amber-400" : ""}`} aria-hidden="true" />
    </button>
  );
}
