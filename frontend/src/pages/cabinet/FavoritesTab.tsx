import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Trash2 } from "lucide-react";
import { fetchFavorites, removeFavorite, type Favorite } from "../../api/citizens";
import { favoriteLink } from "../../utils/favorites";

/**
 * MYGOV_DIZAYN MG-12: kabinetdagi "Tanlanganlar" — xizmat pasportidan qo'shilgan xizmatlar (MG-07) va
 * sevimli ko'rsatkichlar (FQ-04) bir ro'yxatda.
 */
export default function FavoritesTab() {
  const [items, setItems] = useState<Favorite[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchFavorites().then(setItems).catch(() => setError(true));
  }, []);

  const remove = async (id: number) => {
    await removeFavorite(id);
    setItems((list) => list?.filter((f) => f.id !== id) ?? null);
  };

  return (
    <div className="rounded-mg bg-mg-surface p-6">
      <h2 className="text-xl font-semibold text-mg-heading">Tanlanganlar</h2>
      <p className="mt-1 text-sm text-mg-muted">Xizmat sahifasidagi yulduzcha yoki "Tanlanganlarga qo'shish" tugmasi bilan qo'shiladi.</p>
      {error && <p className="mt-4 text-sm text-red-600">Ro'yxatni yuklab bo'lmadi.</p>}
      {items && items.length === 0 && (
        <p className="mt-6 rounded-mg bg-mg-info p-6 text-center text-sm text-mg-text">
          Hozircha tanlangan xizmat yo'q. <Link to="/spheres" className="font-semibold text-mg-primary hover:underline">Xizmatlar katalogi</Link>
        </p>
      )}
      <ul className="mt-4 divide-y divide-mg-border">
        {items?.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 py-3">
            <Link to={favoriteLink(f)} className="flex items-center gap-3 text-[15px] font-medium text-mg-primary hover:underline">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {f.kind === "service" && f.params?.number ? `#${f.params.number} ` : ""}{f.title}
            </Link>
            <button type="button" onClick={() => remove(f.id)} aria-label={`${f.title} — olib tashlash`}
              className="rounded-lg p-2 text-mg-muted hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
