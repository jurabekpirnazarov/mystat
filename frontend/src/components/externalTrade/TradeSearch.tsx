import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Globe2, Package, Search } from "lucide-react";
import { searchTrade, type TradeSearchResult } from "../../api/tradeHub";
import type { TradeFlow } from "../../api/tradeFlows";

type Item = { kind: "product" | "country"; key: string; id: string; label: string };
const RECENT_KEY = "trade-search-recent";

function readRecent(): Item[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Item[];
  } catch {
    return [];
  }
}
function writeRecent(item: Item) {
  try {
    const next = [item, ...readRecent().filter((r) => r.key !== item.key)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* xotira yopiq */
  }
}

/**
 * TI-01: bitta aqlli qidiruv — mahsulot (nom yoki HS kodi) yoki davlat. Takliflar guruhlangan ("Mahsulotlar (HS)",
 * "Davlatlar"), oxirgi 5 qidiruv eslab qolinadi, klaviatura bilan boshqariladi. Tanlov: mahsulot → bozor tahlili,
 * davlat → savdo oqimlari (yoki sahifa o'zi `onPick*` bilan ushlaydi).
 */
export default function TradeSearch({ flow, onPickProduct, onPickCountry, placeholder, initial = "", className = "" }: {
  flow?: TradeFlow;
  onPickProduct?: (code: string) => void;
  onPickCountry?: (id: number) => void;
  placeholder?: string;
  initial?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState<TradeSearchResult>({ products: [], countries: [] });
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const flowQ = flow ? `&flow=${flow}` : "";

  useEffect(() => setQ(initial), [initial]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setRes({ products: [], countries: [] });
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => searchTrade(q.trim(), ctrl.signal).then(setRes).catch(() => undefined), 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => boxRef.current && !boxRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const recentMode = q.trim().length < 2;
  const items: Item[] = useMemo(() => {
    if (recentMode) return open ? readRecent() : [];
    return [
      ...res.products.map((p): Item => ({ kind: "product", key: `p${p.code}`, id: p.code, label: `${p.code} · ${p.name.replace(/[:?]+\s*$/, "")}` })),
      ...res.countries.map((c): Item => ({ kind: "country", key: `c${c.id}`, id: String(c.id), label: c.name })),
    ];
  }, [res, recentMode, open]);

  const pick = (item: Item) => {
    writeRecent(item);
    setOpen(false);
    setQ(item.kind === "product" ? item.id : item.label);
    if (item.kind === "product") (onPickProduct ?? ((c) => navigate(`/market-report?hs=${c}${flowQ}`)))(item.id);
    else (onPickCountry ?? ((id) => navigate(`/trade-flows?country=${id}${flowQ}`)))(Number(item.id));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) pick(items[active]);
      else if (/^\d{2,6}$/.test(q.trim())) pick({ kind: "product", key: `p${q.trim()}`, id: q.trim(), label: q.trim() });
      else if (items[0]) pick(items[0]);
    }
  };

  const optionClass = (i: number) => `cursor-pointer px-4 py-2 text-sm ${i === active ? "bg-mg-info text-mg-primary" : "text-mg-text"}`;
  const group = (kind: Item["kind"], title: string, Icon: typeof Package) => {
    const list = items.map((it, i) => ({ it, i })).filter(({ it }) => it.kind === kind);
    if (!list.length) return null;
    return (
      <li role="presentation" key={kind}>
        <p className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-mg-muted">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />{title}
        </p>
        <ul role="group" aria-label={title}>
          {list.map(({ it, i }) => (
            <li key={it.key} role="option" aria-selected={i === active} id={`ts-opt-${i}`} className={optionClass(i)}
              onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(it); }}>
              <span className="line-clamp-1">{it.label}</span>
            </li>
          ))}
        </ul>
      </li>
    );
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <label htmlFor="trade-search" className="sr-only">Mahsulot, HS kodi yoki davlat</label>
      <div className="flex items-center gap-3 rounded-mg border border-mg-border bg-mg-surface px-4 shadow-sm focus-within:border-mg-primary">
        <Search className="h-5 w-5 shrink-0 text-mg-primary" aria-hidden="true" />
        <input id="trade-search" role="combobox" aria-expanded={open && items.length > 0} aria-controls="trade-search-list" aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `ts-opt-${active}` : undefined} autoComplete="off" value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
          placeholder={placeholder ?? "Mahsulot, HS kodi yoki davlat nomini yozing — masalan paxta, 5205, Xitoy"}
          className="h-12 w-full bg-transparent text-base text-mg-text outline-none placeholder:text-slate-400" />
      </div>
      {open && items.length > 0 && (
        <ul id="trade-search-list" role="listbox" aria-label="Takliflar"
          className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-mg border border-mg-border bg-mg-surface pb-2 shadow-lg">
          {recentMode ? (
            <>
              <li role="presentation" className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-mg-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />Oxirgi qidiruvlar
              </li>
              {items.map((it, i) => (
                <li key={it.key} role="option" aria-selected={i === active} id={`ts-opt-${i}`} className={optionClass(i)}
                  onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(it); }}>
                  <span className="line-clamp-1">{it.label}</span>
                </li>
              ))}
            </>
          ) : (
            <>
              {group("product", "Mahsulotlar (HS)", Package)}
              {group("country", "Davlatlar", Globe2)}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
