import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { addFavorite, fetchFavorites, removeFavorite, type Favorite } from "../api/citizens";
import { useAuth } from "../contexts/AuthContext";

let cache: Promise<Favorite[]> | null = null;
const same = (a: Record<string, unknown>, b: Record<string, unknown>) => JSON.stringify(a) === JSON.stringify(b);

interface Props {
  kind: string;
  title: string;
  params?: Record<string, string | number>;
}

/** FQ-04: ochiq ko'rsatkich sahifasidagi "Sevimlilarga qo'shish" yulduzchasi. */
export default function FavoriteButton({ kind, title, params = {} }: Props) {
  const { isAuthenticated } = useAuth();
  const [fav, setFav] = useState<Favorite | null>(null);
  const [busy, setBusy] = useState(false);
  const key = JSON.stringify(params);

  useEffect(() => {
    if (!isAuthenticated) return;
    cache ??= fetchFavorites().catch(() => []);
    let alive = true;
    void cache.then((list) => alive && setFav(list.find((f) => f.kind === kind && same(f.params, JSON.parse(key))) ?? null));
    return () => {
      alive = false;
    };
  }, [isAuthenticated, kind, key]);

  if (!isAuthenticated) {
    return (
      <Link to="/login" title="Sevimlilarga qo'shish uchun kiring" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
        <Star className="w-4 h-4" /> Sevimli
      </Link>
    );
  }

  const toggle = async () => {
    setBusy(true);
    try {
      if (fav) {
        await removeFavorite(fav.id);
        setFav(null);
      } else {
        setFav(await addFavorite({ kind, title, params }));
      }
      cache = null;
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={!!fav}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm ${fav ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"}`}
    >
      <Star className={`w-4 h-4 ${fav ? "fill-current" : ""}`} /> {fav ? "Sevimlilarda" : "Sevimlilarga"}
    </button>
  );
}
