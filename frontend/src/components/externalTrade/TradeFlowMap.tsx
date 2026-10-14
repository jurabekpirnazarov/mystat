import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { TradeFlowCountry } from "../../api/tradeFlows";
import { TRADE_VALUE_UNIT } from "../../api/tradeFlows";
import Skeleton from "../ui/Skeleton";

// Ketma-ket (sequential) ko'k shkala, och → to'q
const SCALE = ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e3a8a"];
const NO_DATA = "#e5e7eb";

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
  worldCache = feature(topology as any, (topology as any).objects.countries) as unknown as FeatureCollection;
  return worldCache;
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

  useEffect(() => {
    loadWorld().then(setWorld).catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      center: [35, 55],
      zoom: 2,
      minZoom: 1,
      maxZoom: 6,
      worldCopyJump: true,
      attributionControl: false,
      zoomControl: true,
    });
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !world) return;
    layerRef.current?.remove();

    const byIso = new Map(countries.filter((c) => c.iso_numeric).map((c) => [String(Number(c.iso_numeric)), c]));
    const max = Math.max(1, ...countries.map((c) => c.value));
    const bucket = (v: number) => Math.min(SCALE.length - 1, Math.floor((Math.log10(v + 1) / Math.log10(max + 1)) * SCALE.length));

    layerRef.current = L.geoJSON(world, {
      style: (f?: Feature<Geometry>) => {
        const c = byIso.get(String(Number(f?.id)));
        const isSelected = c && c.country_id === selectedId;
        return {
          fillColor: c && c.value > 0 ? SCALE[bucket(c.value)] : NO_DATA,
          fillOpacity: 0.9,
          color: isSelected ? "#f59e0b" : "#ffffff",
          weight: isSelected ? 2.5 : 0.6,
        };
      },
      onEachFeature: (f, layer) => {
        const c = byIso.get(String(Number(f.id)));
        const name = c?.country_name ?? (f.properties as { name?: string })?.name ?? "";
        layer.bindTooltip(
          c ? `<b>${name}</b><br/>${fmt(c.value)} ${TRADE_VALUE_UNIT} · ${c.share.toFixed(1)}%` : `${name}<br/><span style="opacity:.7">ma'lumot yo'q</span>`,
          { sticky: true }
        );
        layer.on("click", () => onSelect(c ? (c.country_id === selectedId ? null : c.country_id) : null));
      },
    }).addTo(map);
  }, [world, countries, selectedId, onSelect]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[320px] sm:h-[420px] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 z-0"
        role="img"
        aria-label="Savdo hamkorlari xaritasi"
      />
      {!world && !failed && <Skeleton variant="chart" className="absolute inset-0 bg-white/60 dark:bg-gray-900/60" />}
      {failed && <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">Xaritani yuklab bo'lmadi</p>}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-hidden="true">
        <span>kam</span>
        <div className="flex h-2 w-40 rounded overflow-hidden">
          {SCALE.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
        </div>
        <span>ko'p (log-shkala)</span>
        <span className="ml-3 inline-block w-3 h-3 rounded-sm" style={{ background: NO_DATA }} /> ma'lumot yo'q
      </div>
    </div>
  );
}
