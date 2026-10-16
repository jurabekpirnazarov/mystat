import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { TradeFlowCountry } from "../../api/tradeFlows";
import { TRADE_VALUE_UNIT } from "../../api/tradeFlows";
import Skeleton from "../ui/Skeleton";
import { useTheme } from "../../contexts/ThemeContext";

// Ketma-ket (sequential) ko'k shkala, och → to'q
const SCALE = ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e3a8a"];
const THEME = {
  light: { ocean: "#eef2f7", noData: "#e5e7eb", border: "#ffffff", hover: "#111827" },
  dark: { ocean: "#0f172a", noData: "#374151", border: "#1f2937", hover: "#f9fafb" },
};
const ANTARCTICA = "010";
/** Kartaning ko'rinadigan qismi: Antarktidasiz, Chukotka 180° dan o'tib ketadi */
const WORLD_BOUNDS = L.latLngBounds([-57, -170], [84, 192]);

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 1 }).format(n).replace(/,/g, " ");

let worldCache: FeatureCollection | null = null;
async function loadWorld(): Promise<FeatureCollection> {
  if (worldCache) return worldCache;
  // ~108 KB, alohida chunk'da faqat shu sahifada yuklanadi (tashqi CDN kerak emas)
  const [{ feature }, topo] = await Promise.all([
    import("topojson-client"),
    import("world-atlas/countries-110m.json"),
  ]);
  const topology = (topo as { default?: unknown }).default ?? topo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- topojson tiplari JSON importga mos emas
  const fc = feature(topology as any, (topology as any).objects.countries) as unknown as FeatureCollection;
  worldCache = { ...fc, features: fc.features.filter((f) => String(f.id) !== ANTARCTICA).map(fixAntimeridian) };
  return worldCache;
}

/**
 * 180° meridianni kesib o'tadigan davlatlar (Rossiya, Fiji) Leaflet'da butun karta bo'ylab gorizontal chiziq
 * bo'lib chizilardi. Halqa uzunliklari uzluksiz qilinadi (179 → 181, -179 emas) va davlatning asosiy qismidan
 * 180° narida qolgan bo'laklar (Chukotka) u tomonga suriladi.
 */
function fixAntimeridian(f: Feature): Feature {
  const g = f.geometry;
  if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return f;
  const unwrap = (ring: Position[]) => {
    let shift = 0;
    return ring.map(([x, y], i) => {
      if (i > 0) {
        const prev = ring[i - 1][0];
        if (x - prev > 180) shift -= 360;
        else if (prev - x > 180) shift += 360;
      }
      return [x + shift, y];
    });
  };
  const polys = (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map((poly) => poly.map(unwrap));
  const mean = (poly: Position[][]) => poly[0].reduce((a, p) => a + p[0], 0) / poly[0].length;
  const east = polys.some((poly) => mean(poly) > 90);
  const moved = polys.map((poly) => (east && mean(poly) < -150 ? poly.map((ring) => ring.map(([x, y]) => [x + 360, y])) : poly));
  return { ...f, geometry: g.type === "Polygon" ? { type: "Polygon", coordinates: moved[0] } : { type: "MultiPolygon", coordinates: moved } };
}

interface Props {
  countries: TradeFlowCountry[];
  selectedId: number | null;
  onSelect: (countryId: number | null) => void;
}

/** Davlatlar savdo hajmi bo'yicha (choropleth, log-shkala). ISO 3166 raqamli kod (`ctrana`) orqali bog'lanadi. */
export default function TradeFlowMap({ countries, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const [world, setWorld] = useState<FeatureCollection | null>(null);
  const [failed, setFailed] = useState(false);
  const colors = THEME[useTheme().theme === "dark" ? "dark" : "light"];

  const positive = countries.filter((c) => c.value > 0).map((c) => c.value);
  const max = Math.max(1, ...positive);
  const min = positive.length ? Math.min(...positive) : null;

  useEffect(() => {
    loadWorld().then(setWorld).catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomSnap: 0.25,
      maxZoom: 6,
      maxBounds: WORLD_BOUNDS.pad(0.05),
      maxBoundsViscosity: 1,
      scrollWheelZoom: false,
      attributionControl: false,
      zoomControl: true,
    });
    mapRef.current = map;
    const fit = () => {
      map.invalidateSize();
      map.setMinZoom(0);
      map.fitBounds(WORLD_BOUNDS, { animate: false });
      map.setMinZoom(map.getZoom());
    };
    fit();
    // Sichqoncha g'ildiragi sahifani aylantiradi; xaritani bosgandan keyin zoom
    map.on("focus click", () => map.scrollWheelZoom.enable());
    map.on("blur mouseout", () => map.scrollWheelZoom.disable());
    const ro = new ResizeObserver(fit);
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !world) return;
    layerRef.current?.remove();

    const byIso = new Map(countries.filter((c) => c.iso_numeric).map((c) => [String(Number(c.iso_numeric)), c]));
    const bucket = (v: number) => Math.min(SCALE.length - 1, Math.floor((Math.log10(v + 1) / Math.log10(max + 1)) * SCALE.length));
    const style = (c: TradeFlowCountry | undefined): L.PathOptions => {
      const isSelected = c && c.country_id === selectedId;
      return {
        fillColor: c && c.value > 0 ? SCALE[bucket(c.value)] : colors.noData,
        fillOpacity: 1,
        color: isSelected ? "#f59e0b" : colors.border,
        weight: isSelected ? 2.5 : 0.5,
      };
    };
    let selectedLayer: L.Path | undefined;

    layerRef.current = L.geoJSON(world, {
      style: (f?: Feature<Geometry>) => style(byIso.get(String(Number(f?.id)))),
      onEachFeature: (f, layer) => {
        const c = byIso.get(String(Number(f.id)));
        const name = c?.country_name ?? (f.properties as { name?: string })?.name ?? "";
        layer.bindTooltip(
          c ? `<b>${name}</b><br/>${fmt(c.value)} ${TRADE_VALUE_UNIT} · ${c.share.toFixed(1)}%` : `${name}<br/><span style="opacity:.7">ma'lumot yo'q</span>`,
          { sticky: true }
        );
        layer.on("click", () => onSelect(c ? (c.country_id === selectedId ? null : c.country_id) : null));
        layer.on("mouseover", () => {
          (layer as L.Path).setStyle({ weight: 1.5, color: colors.hover });
          (layer as L.Path).bringToFront();
        });
        layer.on("mouseout", () => {
          (layer as L.Path).setStyle(style(c));
          selectedLayer?.bringToFront();
        });
        if (c && c.country_id === selectedId) selectedLayer = layer as L.Path;
      },
    }).addTo(map);
    selectedLayer?.bringToFront();
  }, [world, countries, selectedId, onSelect, colors, max]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ background: colors.ocean }}
        className="h-[300px] sm:h-[440px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 z-0"
        role="img"
        aria-label="Savdo hamkorlari xaritasi"
      />
      {!world && !failed && <Skeleton variant="chart" className="absolute inset-0 bg-white/60 dark:bg-gray-900/60" />}
      {failed && <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">Xaritani yuklab bo'lmadi</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="tabular-nums">{min !== null ? fmt(min) : "kam"}</span>
        <div className="flex h-2.5 w-40 rounded overflow-hidden" aria-hidden="true">
          {SCALE.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
        </div>
        <span className="tabular-nums">{fmt(max)} {TRADE_VALUE_UNIT}</span>
        <span className="text-gray-400">(logarifmik shkala)</span>
        <span className="ml-3 inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: colors.noData }} /> ma'lumot yo'q
        </span>
      </div>
    </div>
  );
}
