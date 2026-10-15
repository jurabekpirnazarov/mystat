import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CornerDownLeft, FileText, HelpCircle, Layers, LayoutGrid, Library, Search, X } from "lucide-react";
import { globalSearch, type SearchGroup, type SearchItem } from "../../api/support";

// Statik sahifalar — serverga so'rovsiz, darhol qidiriladi
const PAGES: SearchItem[] = [
  { id: "p-home", title: "Bosh sahifa", subtitle: "Sahifa", url: "/" },
  { id: "p-services", title: "Xizmatlar va tariflar", subtitle: "Sahifa", url: "/services" },
  { id: "p-trade", title: "Tashqi savdo oqimlari", subtitle: "Eksport va import xaritasi", url: "/trade-flows" },
  { id: "p-ex-trade", title: "Tashqi savdo tahlili", subtitle: "Sahifa", url: "/ex-trade" },
  { id: "p-demo", title: "Demografik ma'lumotlar", subtitle: "Aholi, tug'ilish, migratsiya", url: "/demographics" },
  { id: "p-industry", title: "Sanoat mahsulotlari", subtitle: "Sahifa", url: "/industry" },
  { id: "p-ktut", title: "Korxonalar reyestri (KTUT)", subtitle: "Sahifa", url: "/organizations-ktut" },
  { id: "p-cpi", title: "Narx indeksi kalkulyatori", subtitle: "Sahifa", url: "/cpi-calculator" },
  { id: "p-calendar", title: "Hisobot kalendari", subtitle: "Sahifa", url: "/report-calendar" },
  { id: "p-class", title: "Statistik klassifikatorlar", subtitle: "Sahifa", url: "/statistical-classifications" },
  { id: "p-books", title: "Kitob do'koni", subtitle: "Statistik nashrlar", url: "/books" },
  { id: "p-stats", title: "Platforma statistikasi", subtitle: "Sahifa", url: "/statistics" },
  { id: "p-faq", title: "Ko'p so'raladigan savollar", subtitle: "Sahifa", url: "/questions" },
  { id: "p-contact", title: "Aloqa", subtitle: "Sahifa", url: "/contact" },
  { id: "p-cabinet", title: "Shaxsiy kabinet", subtitle: "Sahifa", url: "/cabinet" },
  { id: "p-tariffs", title: "Tariflarni taqqoslash va narx kalkulyatori", subtitle: "Sahifa", url: "/tariffs" },
  { id: "p-market", title: "Bozor tahlili (HS kodi bo'yicha)", subtitle: "Eksport, import, narxlar", url: "/market-report" },
  { id: "p-partners", title: "Hamkor va raqobatchilarni qidirish", subtitle: "Korxonalar", url: "/partners" },
  { id: "p-consult", title: "Konsultatsiya", subtitle: "Mutaxassis bilan uchrashuv", url: "/consultation" },
  { id: "p-citizens", title: "Fuqarolar uchun", subtitle: "Bepul xizmatlar", url: "/citizens" },
  { id: "p-regions", title: "Hududlar xaritasi", subtitle: "Viloyat va tumanlar SIAT ko'rsatkichlari, mening hududim", url: "/regions" },
  { id: "p-salary", title: "Mening maoshim", subtitle: "Ish haqi taqqoslash", url: "/my-salary" },
  { id: "p-prices", title: "Narxlar monitoringi va savat", subtitle: "Sahifa", url: "/prices" },
  { id: "p-learn", title: "Statistika oddiy tilda", subtitle: "Maqolalar", url: "/learn" },
  { id: "p-glossary", title: "Statistik atamalar lug'ati", subtitle: "Sahifa", url: "/glossary" },
  { id: "p-surveys", title: "Aholi so'rovnomalari", subtitle: "Sahifa", url: "/surveys" },
  { id: "p-names", title: "Ismlar statistikasi", subtitle: "Sahifa", url: "/names" },
  { id: "p-answers", title: "Savol bering — savol-javoblar", subtitle: "Sahifa", url: "/answers" },
  { id: "p-dev", title: "Ochiq ma'lumotlar API", subtitle: "Dasturchilar uchun", url: "/developers" },
];

const ICONS: Record<string, typeof Search> = {
  pages: LayoutGrid, services: Layers, faq: HelpCircle, reports: FileText, books: Library, classifications: Layers,
  articles: BookOpen, glossary: BookOpen,
};

const norm = (s: string) => s.toLowerCase().replace(/[‘’ʼʻ`']/g, "");

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Global qidiruv oynasi (Ctrl+K). Klaviatura: ↑ ↓ Enter Esc. U-10. */
export default function CommandPalette({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ("");
      setRemote([]);
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setRemote([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(() => {
      globalSearch(term)
        .then((g) => !cancelled && setRemote(g))
        .catch(() => !cancelled && setRemote([]))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  const groups = useMemo(() => {
    const term = norm(q.trim());
    const pages = term ? PAGES.filter((p) => norm(`${p.title} ${p.subtitle}`).includes(term)) : PAGES.slice(0, 6);
    const list: SearchGroup[] = pages.length ? [{ type: "pages", label: "Sahifalar", items: pages.slice(0, 6) }] : [];
    return [...list, ...remote];
  }, [q, remote]);
  const flat = groups.flatMap((g) => g.items);

  useEffect(() => setActive(0), [groups.length, q]);

  const go = (item: SearchItem) => {
    onClose();
    navigate(item.url);
  };

  if (!open) return null;

  let index = -1;
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center pt-[10vh] px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Qidiruv"
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && flat[active]) go(flat[active]);
            }}
            placeholder="Xizmat, savol, hisobot shakli yoki sahifa…"
            aria-label="Qidiruv so'rovi"
            className="flex-1 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Yopish" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
          {groups.map((g) => {
            const Icon = ICONS[g.type] ?? FileText;
            return (
              <div key={g.type} className="mb-2">
                <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{g.label}</p>
                {g.items.map((item) => {
                  index += 1;
                  const i = index;
                  return (
                    <button
                      key={`${g.type}-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${i === active ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-900 dark:text-white truncate">{item.title}</span>
                        {item.subtitle && <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</span>}
                      </span>
                      {i === active && <CornerDownLeft className="w-4 h-4 text-gray-400" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {q.trim().length >= 2 && !loading && flat.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-gray-500">"{q}" bo'yicha hech narsa topilmadi</p>
          )}
          {loading && <p className="px-3 py-2 text-xs text-gray-400">Qidirilmoqda…</p>}
        </div>
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex gap-4">
          <span>↑↓ tanlash</span><span>Enter ochish</span><span>Esc yopish</span>
        </div>
      </div>
    </div>
  );
}
