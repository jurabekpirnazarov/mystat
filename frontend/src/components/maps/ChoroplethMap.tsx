import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoFeature } from "../../utils/mapGeo";

export interface ChoroplethProps {
  features: GeoFeature[];
  /** Kontekst uchun kulrang (masalan tumanlar ko'rinishida qolgan viloyatlar) — bosilmaydi */
  context?: GeoFeature[];
  fill: (code: string) => string | null; // null — "ma'lumot yo'q" (shtrix)
  tooltip: (code: string) => string;
  selected?: string | null;
  compare?: string | null;
  onSelect?: (code: string) => void;
  /** O'zgarsa karta shu hududlarga moslanadi */
  fitKey?: string;
  height?: number | string;
  label: string;
}

const HATCH_ID = "siat-missing-hatch";

/** SVG renderer'ga "ma'lumot yo'q" shtrix naqshini qo'shadi (KR-06, N2). */
function ensureHatch(map: L.Map) {
  const svg = map.getPanes().overlayPane.querySelector("svg");
  if (!svg || svg.querySelector(`#${HATCH_ID}`)) return;
  const ns = "http://www.w3.org/2000/svg";
  const defs = document.createElementNS(ns, "defs");
  const pattern = document.createElementNS(ns, "pattern");
  pattern.setAttribute("id", HATCH_ID);
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", "6");
  pattern.setAttribute("height", "6");
  pattern.setAttribute("patternTransform", "rotate(45)");
  const bg = document.createElementNS(ns, "rect");
  bg.setAttribute("width", "6");
  bg.setAttribute("height", "6");
  bg.setAttribute("fill", "#f3f4f6");
  const line = document.createElementNS(ns, "line");
  line.setAttribute("x1", "0");
  line.setAttribute("y1", "0");
  line.setAttribute("x2", "0");
  line.setAttribute("y2", "6");
  line.setAttribute("stroke", "#9ca3af");
  line.setAttribute("stroke-width", "2");
  pattern.append(bg, line);
  defs.append(pattern);
  svg.prepend(defs);
}

/**
 * Xoropleta karta (Leaflet, fon xaritasiz): hududlar SOATO kodi bo'yicha bo'yaladi (KR-06).
 * Fon tile'lari yo'q — statistik karta uchun ortiqcha va PNG eksportni buzadi.
 */
export default function ChoroplethMap({ features, context, fill, tooltip, selected, compare, onSelect, fitKey, height = 480, label }: ChoroplethProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const main = useRef<L.GeoJSON | null>(null);
  const ctx = useRef<L.GeoJSON | null>(null);
  const handlers = useRef({ fill, tooltip, onSelect, selected, compare });
  handlers.current = { fill, tooltip, onSelect, selected, compare };

  useEffect(() => {
    if (!box.current || map.current) return;
    map.current = L.map(box.current, {
      zoomSnap: 0.25,
      scrollWheelZoom: false,
      attributionControl: true,
      renderer: L.svg({ padding: 0.5 }),
    }).setView([41.3, 64.5], 5.5);
    map.current.attributionControl.setPrefix(false).addAttribution("Chegaralar: geoBoundaries (OSM, OCHA)");
    // Sichqoncha g'ildiragi sahifani aylantiradi; xaritani faollashtirgandan keyin zoom
    map.current.on("focus click", () => map.current?.scrollWheelZoom.enable());
    map.current.on("blur mouseout", () => map.current?.scrollWheelZoom.disable());
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const styleFor = (code: string): L.PathOptions => {
    const { fill: f, selected: s, compare: c } = handlers.current;
    const color = f(code);
    const active = code === s || code === c;
    return {
      fillColor: color ?? `url(#${HATCH_ID})`,
      fillOpacity: 1,
      color: active ? (code === c ? "#7c3aed" : "#f97316") : "#ffffff",
      weight: active ? 3 : 0.8,
    };
  };

  // Geometriya o'zgarganda qatlam qayta quriladi
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    ctx.current?.remove();
    main.current?.remove();
    if (context?.length) {
      ctx.current = L.geoJSON(context as never, {
        interactive: false,
        style: { fillColor: "#e5e7eb", fillOpacity: 1, color: "#ffffff", weight: 1 },
      }).addTo(m);
    }
    main.current = L.geoJSON(features as never, {
      style: (f) => styleFor((f as unknown as GeoFeature).properties.soato),
      onEachFeature: (f, layer) => {
        const code = (f as unknown as GeoFeature).properties.soato;
        layer.bindTooltip(() => handlers.current.tooltip(code), { sticky: true, direction: "top" });
        layer.on("click", () => handlers.current.onSelect?.(code));
        layer.on("mouseover", () => (layer as L.Path).setStyle({ weight: 2.5, color: "#1f2937" }));
        layer.on("mouseout", () => (layer as L.Path).setStyle(styleFor(code)));
        const el = (layer as unknown as { getElement?: () => Element | undefined }).getElement?.();
        el?.setAttribute("tabindex", "0");
      },
    }).addTo(m);
    ensureHatch(m);
    main.current.eachLayer((layer) => {
      const el = (layer as L.Path).getElement?.();
      const code = ((layer as L.GeoJSON).feature as unknown as GeoFeature)?.properties.soato;
      if (el && code) {
        el.setAttribute("aria-label", handlers.current.tooltip(code));
        el.addEventListener("keydown", (e) => {
          if ((e as KeyboardEvent).key === "Enter") handlers.current.onSelect?.(code);
        });
      }
    });
  }, [features, context]);

  // Faqat ranglar/tanlov o'zgarsa — qatlam qayta qurilmaydi
  useEffect(() => {
    main.current?.eachLayer((layer) => {
      const code = ((layer as L.GeoJSON).feature as unknown as GeoFeature)?.properties.soato;
      if (code) {
        (layer as L.Path).setStyle(styleFor(code));
        (layer as L.Path).getElement?.()?.setAttribute("aria-label", tooltip(code));
      }
    });
    ensureHatch(map.current!);
  }, [fill, tooltip, selected, compare]);

  useEffect(() => {
    const m = map.current;
    if (!m || !main.current) return;
    const b = main.current.getBounds();
    if (b.isValid()) m.fitBounds(b, { padding: [12, 12] });
  }, [fitKey]);

  return <div ref={box} style={{ height }} className="w-full rounded-xl overflow-hidden z-0 bg-slate-50 dark:bg-slate-800" role="region" aria-label={label} />;
}
