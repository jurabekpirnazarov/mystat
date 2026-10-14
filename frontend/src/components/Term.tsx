import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fetchGlossary, type GlossaryItem } from "../api/citizens";

let glossaryPromise: Promise<Map<string, GlossaryItem>> | null = null;
function glossary() {
  glossaryPromise ??= fetchGlossary()
    .then((items) => new Map(items.map((i) => [i.slug, i])))
    .catch(() => {
      glossaryPromise = null;
      return new Map<string, GlossaryItem>();
    });
  return glossaryPromise;
}

/**
 * FQ-07: murakkab atama — ustiga olib borilganda yoki bosilganda (mobil) lug'atdan qisqa ta'rif.
 * <Term id="inflation">inflyatsiya</Term>
 */
export default function Term({ id, children }: { id: string; children: ReactNode }) {
  const [item, setItem] = useState<GlossaryItem | null>(null);
  const [open, setOpen] = useState(false);
  const tipId = useId();

  useEffect(() => {
    let alive = true;
    void glossary().then((g) => alive && setItem(g.get(id) ?? null));
    return () => {
      alive = false;
    };
  }, [id]);

  if (!item) return <>{children}</>;
  return (
    <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="underline decoration-dotted decoration-blue-500 underline-offset-2 cursor-help text-inherit"
      >
        {children}
      </button>
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="absolute z-30 left-0 top-full mt-1 w-72 max-w-[80vw] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-left text-xs font-normal text-gray-700 dark:text-gray-200 shadow-lg"
        >
          <b className="block text-sm text-gray-900 dark:text-white mb-1">{item.term}</b>
          {item.definition}
          {item.example && <span className="block mt-1 text-gray-500">Masalan: {item.example}</span>}
          <Link to={item.article ? `/learn/${item.article}` : "/glossary"} className="block mt-1.5 text-blue-600" onMouseDown={(e) => e.preventDefault()}>
            Batafsil →
          </Link>
        </span>
      )}
    </span>
  );
}
