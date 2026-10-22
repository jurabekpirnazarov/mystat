import { useMemo, useRef, useState } from "react";
import { bounds, labelPoint, polygons, type GeoFeature } from "../../utils/mapGeo";
import { MISSING_COLOR } from "../../utils/mapScale";

export interface MapTip {
  name: string;
  value: string;
  /** 0..1 — hududlar orasidagi nisbiy o'rin (chiziq uchun) */
  share: number | null;
  rank: string;
}

const S = 100; // 1 gradus = 100 birlik
const LIFT = 7;
const DEPTH = 5;

/**
 * Bosh sahifa kartasi: SVG, "ko'tariladigan" hududlar (soya va qalinlik bilan 2.5D), silliq rang almashishi, sichqoncha yonida
 * suzuvchi ma'lumot kartochkasi, tanlangan hudud doimiy ko'tarilgan. Leaflet'siz — yengil. Hudud SOATO kodi bo'yicha.
 */
export default function InteractiveMap({ features, fill, tip, selected, onSelect, label }: {
  features: GeoFeature[];
  fill: (code: string) => string | null;
  tip: (code: string) => MapTip;
  selected: string | null;
  onSelect: (code: string) => void;
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const geo = useMemo(() => {
    const b = bounds(features);
    const k = Math.cos((((b.minY + b.maxY) / 2) * Math.PI) / 180);
    const px = (x: number) => ((x - b.minX) * k * S).toFixed(1);
    const py = (y: number) => ((b.maxY - y) * S).toFixed(1);
    const w = (b.maxX - b.minX) * k * S;
    const h = (b.maxY - b.minY) * S;
    const items = features.map((f, i) => {
      const d = polygons(f).map((poly) => poly.map((ring) => `M${ring.map(([x, y]) => `${px(x)},${py(y)}`).join("L")}Z`).join("")).join("");
      const lp = labelPoint(f);
      const fb = bounds([f]);
      return { code: f.properties.soato, d, i, cx: Number(px(lp[0])), cy: Number(py(lp[1])), name: (f.properties.name_uz ?? "").replace(/\s+(viloyati|Respublikasi)$/i, "").replace(/\s+shahri$/i, " sh."), big: (fb.maxX - fb.minX) * (fb.maxY - fb.minY) >= 0.6 };
    });
    return { items, w, h };
  }, [features]);

  // Tanlangan va ustiga kelgan hudud oxirida chiziladi (boshqalar ustida ko'rinsin)
  const ordered = useMemo(() => {
    const top = (c: string) => (c === hover ? 2 : c === selected ? 1 : 0);
    return [...geo.items].sort((a, b) => top(a.code) - top(b.code));
  }, [geo, hover, selected]);

  const active = hover ?? null;
  const tipData = active ? tip(active) : null;
  const onMove = (e: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div ref={box} className="relative h-full w-full select-none" onPointerMove={onMove} onPointerLeave={() => { setHover(null); setPos(null); }}>
      <svg viewBox={`-10 -${LIFT + 10} ${geo.w + 20} ${geo.h + DEPTH + LIFT + 24}`} className="h-full w-full" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="map-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#1F2937" floodOpacity="0.18" />
          </filter>
          <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#155EEF" floodOpacity="0.55" />
          </filter>
          <pattern id="map-missing" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#f3f4f6" /><line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="2" />
          </pattern>
        </defs>

        {/* Qalinlik: har hududning pastga siljitilgan to'q nusxasi */}
        <g filter="url(#map-shadow)">
          {geo.items.map((r) => (
            <path key={`d-${r.code}`} d={r.d} transform={`translate(0 ${DEPTH})`} fill={fill(r.code) ?? MISSING_COLOR} style={{ filter: "brightness(0.62)", transition: "fill .5s" }} />
          ))}
        </g>

        {ordered.map((r) => {
          const on = r.code === hover;
          const sel = r.code === selected;
          const lifted = on || sel;
          return (
            <g key={r.code} style={{ transform: `translateY(${lifted ? -LIFT : 0}px)`, transition: "transform .22s cubic-bezier(.2,.8,.3,1)" }}>
              <path d={r.d} fill={fill(r.code) ?? "url(#map-missing)"} stroke={sel ? "#ffffff" : "rgba(255,255,255,.85)"} strokeWidth={sel ? 3 : 1.4} strokeLinejoin="round"
                filter={sel ? "url(#map-glow)" : undefined} cursor="pointer" onPointerEnter={() => setHover(r.code)} onClick={() => onSelect(r.code)}
                className="map-pop" style={{ transition: "fill .5s, stroke-width .2s", animationDelay: `${r.i * 45}ms`, filter: on && !sel ? "brightness(1.08) saturate(1.1)" : undefined }} />
              {r.big && <text x={r.cx} y={r.cy} textAnchor="middle" dominantBaseline="middle" pointerEvents="none" fontSize="22" fontWeight="700" fill="#1F2937"
                stroke="rgba(255,255,255,.9)" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">{r.name}</text>}
            </g>
          );
        })}
      </svg>

      {tipData && pos && (
        <div role="tooltip" style={{ left: Math.min(pos.x + 14, (box.current?.clientWidth ?? 300) - 190), top: Math.max(pos.y - 78, 4) }}
          className="pointer-events-none absolute z-10 w-44 rounded-xl border border-mg-border bg-mg-surface p-3 shadow-ds-popover">
          <p className="text-sm font-semibold text-mg-heading">{tipData.name}</p>
          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-mg-primary">{tipData.value}</p>
          {tipData.share !== null && <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mg-info"><div className="h-full rounded-full bg-mg-primary" style={{ width: `${tipData.share * 100}%` }} /></div>}
          <p className="mt-1 text-xs text-mg-muted">{tipData.rank}</p>
        </div>
      )}
      <style>{`
        @keyframes map-pop { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: none; } }
        .map-pop { animation: map-pop .5s cubic-bezier(.2,.8,.3,1) both; transform-box: fill-box; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) { .map-pop { animation: none; } }
      `}</style>
    </div>
  );
}
