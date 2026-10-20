import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { bounds, labelPoint, type GeoFeature } from "../../utils/mapGeo";
import { useTheme } from "../../contexts/ThemeContext";

export interface ChoroplethProps {
  features: GeoFeature[];
  /** Kontekst uchun kulrang (masalan tumanlar ko'rinishida qolgan viloyatlar) — bosilmaydi */
  context?: GeoFeature[];
  /**
   * Asosiy hududlar ostidagi taglik (masalan tumanlar ko'rinishida — viloyat chegarasi). Tuman chegaralari viloyatnikiga
   * to'liq mos kelmaydi; taglik bo'lmasa oradagi tirqishlar fon rangida "teshik" bo'lib ko'rinadi.
   */
  underlay?: GeoFeature[];
  fill: (code: string) => string | null; // null — "ma'lumot yo'q" (shtrix)
  tooltip: (code: string) => string;
  selected?: string | null;
  compare?: string | null;
  onSelect?: (code: string) => void;
  /** O'zgarsa karta shu hududlarga moslanadi */
  fitKey?: string;
  height?: number | string;
  label: string;
  /** Prognoz yili: ranglar shaffofroq va uzuq kontur — haqiqiy ma'lumot bilan adashtirilmasin (SCORING_MODEL.md 10.8) */
  dim?: boolean;
  /** Hudud nomlari kartada (standart: hududlar 16 tadan kam bo'lsa — viloyatlar ko'rinishi) */
  labels?: boolean;
}

/** "Samarqand viloyati" -> "Samarqand", "Qoraqalpog'iston Respublikasi" -> "Qoraqalpog'iston" */
function shortName(name: string) {
  return name.replace(/\s+(viloyati|Respublikasi|tumani)$/i, "").replace(/\s+shahri$/i, " sh.");
}

/** Yorliq faqat yetarlicha katta hududga (gradusda; Farg'ona vodiysi va Toshkent shahri — yozuvlar ustma-ust chiqmasin) */
const LABEL_MIN_AREA = 0.6;
function labelFits(f: GeoFeature) {
  const b = bounds([f]);
  return (b.maxX - b.minX) * (b.maxY - b.minY) >= LABEL_MIN_AREA;
}

const HATCH_ID = "siat-missing-hatch";

/** Katta hududlar avval, kichiklari (Toshkent shahri, tuman ichidagi shaharlar) ustida chiziladi — aks holda ular yopilib, bosib bo'lmaydi. */
function bySizeDesc(features: GeoFeature[]) {
  const area = (f: GeoFeature) => {
    const b = bounds([f]);
    return (b.maxX - b.minX) * (b.maxY - b.minY);
  };
  return [...features].map((f) => [area(f), f] as const).sort((a, b) => b[0] - a[0]).map(([, f]) => f);
}

// Chegara to'q kulrang: bir xil sinfdagi qo'shni hududlar (masalan Buxoro va Navoiy) bir-biriga qo'shilib ketmasin
const PALETTE = {
  light: { bg: "#f1f5f9", border: "#475569", gap: "#94a3b8", context: "#e2e8f0", hover: "#0f172a" },
  dark: { bg: "#0b1220", border: "#cbd5e1", gap: "#475569", context: "#334155", hover: "#f9fafb" },
};

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
export default function ChoroplethMap({ features, context, underlay, fill, tooltip, selected, compare, onSelect, fitKey, height = 480, label, dim = false, labels }: ChoroplethProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const main = useRef<L.GeoJSON | null>(null);
  const ctx = useRef<L.GeoJSON | null>(null);
  const under = useRef<L.GeoJSON | null>(null);
  const names = useRef<L.LayerGroup | null>(null);
  const colors = PALETTE[useTheme().theme === "dark" ? "dark" : "light"];
  // Viloyatlar — qalinroq chegara; tumanlar (yuzlab) — ingichka, aks holda karta chiziqlarga to'lib ketadi
  const lineWeight = features.length > 30 ? 0.45 : 1.1;
  const handlers = useRef({ fill, tooltip, onSelect, selected, compare, colors, dim, lineWeight });
  handlers.current = { fill, tooltip, onSelect, selected, compare, colors, dim, lineWeight };

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
    // Konteyner o'lchami o'zgarsa (oyna, yon panel ochilishi) karta qayta moslanadi
    const ro = new ResizeObserver(() => {
      map.current?.invalidateSize();
      fit(false);
    });
    ro.observe(box.current);
    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
     
  }, []);

  const fit = (animate: boolean) => {
    const m = map.current;
    const b = main.current?.getBounds();
    if (!m || !b?.isValid()) return;
    m.setMaxBounds(undefined as unknown as L.LatLngBounds);
    m.setMinZoom(0);
    m.once("moveend", () => {
      // Hududdan uzoqqa surib yoki kichraytirib yuborib bo'lmaydi
      m.setMinZoom(Math.max(3, m.getZoom() - 1));
      m.setMaxBounds(b.pad(0.6));
    });
    m.fitBounds(b, { padding: [16, 16], animate });
  };

  const styleFor = (code: string): L.PathOptions => {
    const { fill: f, selected: s, compare: c, colors: p, dim: d, lineWeight: w } = handlers.current;
    const color = f(code);
    const active = code === s || code === c;
    return {
      fillColor: color ?? `url(#${HATCH_ID})`,
      fillOpacity: d && color ? 0.55 : 1,
      dashArray: d && !active ? "3 3" : undefined,
      color: active ? (code === c ? "#7c3aed" : "#f97316") : p.border,
      opacity: active ? 1 : 0.85,
      weight: active ? 3 : w,
    };
  };

  /** Chizish tartibi: kattadan kichikka (bySizeDesc), oxirida tanlanganlar. */
  const restoreOrder = () => {
    main.current?.eachLayer((layer) => (layer as L.Path).bringToFront());
    raiseActive();
  };

  /** Tanlangan hududlar konturi qo'shnilari ostida qolmasligi uchun */
  const raiseActive = () => {
    const { selected: s, compare: c } = handlers.current;
    main.current?.eachLayer((layer) => {
      const code = ((layer as L.GeoJSON).feature as unknown as GeoFeature)?.properties.soato;
      if (code && (code === s || code === c)) (layer as L.Path).bringToFront();
    });
  };

  // Geometriya o'zgarganda qatlam qayta quriladi
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    ctx.current?.remove();
    under.current?.remove();
    main.current?.remove();
    names.current?.remove();
    if (context?.length) {
      ctx.current = L.geoJSON(context as never, {
        interactive: false,
        style: { fillColor: colors.context, fillOpacity: 1, color: colors.gap, weight: 0.8 },
      }).addTo(m);
    }
    if (underlay?.length) {
      under.current = L.geoJSON(underlay as never, {
        interactive: false,
        style: { fillColor: colors.gap, fillOpacity: 1, color: colors.border, weight: 1 },
      }).addTo(m);
    }
    main.current = L.geoJSON(bySizeDesc(features) as never, {
      style: (f) => styleFor((f as unknown as GeoFeature).properties.soato),
      onEachFeature: (f, layer) => {
        const code = (f as unknown as GeoFeature).properties.soato;
        layer.bindTooltip(() => handlers.current.tooltip(code), { sticky: true, direction: "top" });
        layer.on("click", () => handlers.current.onSelect?.(code));
        layer.on("mouseover", () => {
          (layer as L.Path).setStyle({ weight: 2.5, color: handlers.current.colors.hover });
          (layer as L.Path).bringToFront();
        });
        layer.on("mouseout", () => {
          (layer as L.Path).setStyle(styleFor(code));
          // Hover qilingan katta hudud ichidagi kichiklarini yopib qolmasligi uchun tartib tiklanadi
          restoreOrder();
        });
        const el = (layer as unknown as { getElement?: () => Element | undefined }).getElement?.();
        el?.setAttribute("tabindex", "0");
      },
    }).addTo(m);
    ensureHatch(m);
    raiseActive();
    if (labels ?? features.length <= 16) {
      names.current = L.layerGroup(features.filter(labelFits).map((f) => {
        const [lng, lat] = labelPoint(f);
        const name = shortName(f.properties.name_uz ?? "");
        return L.tooltip({ permanent: true, direction: "center", className: "map-label", interactive: false })
          .setLatLng([lat, lng]).setContent(name);
      })).addTo(m);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ranglar alohida effektda yangilanadi
  }, [features, context, underlay, colors, labels]);

  // Faqat ranglar/tanlov o'zgarsa — qatlam qayta qurilmaydi
  useEffect(() => {
    main.current?.eachLayer((layer) => {
      const code = ((layer as L.GeoJSON).feature as unknown as GeoFeature)?.properties.soato;
      if (code) {
        (layer as L.Path).setStyle(styleFor(code));
        (layer as L.Path).getElement?.()?.setAttribute("aria-label", tooltip(code));
      }
    });
    raiseActive();
    ensureHatch(map.current!);
     
  }, [fill, tooltip, selected, compare, dim]);

  useEffect(() => {
    fit(true);
     
  }, [fitKey]);

  return <div ref={box} style={{ height, background: colors.bg }} className="stat-map w-full rounded-xl overflow-hidden z-0 border border-slate-300 dark:border-gray-700" role="region" aria-label={label} />;
}
