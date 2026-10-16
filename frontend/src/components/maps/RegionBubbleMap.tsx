import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_CENTERS } from "../../data/regionCenters";
import { loadBoundaries, type GeoFeature } from "../../utils/mapGeo";
import { useTheme } from "../../contexts/ThemeContext";

export interface RegionBubble {
  code: string;
  value: number;
  label?: string;
}

interface Props {
  items: RegionBubble[];
  selected?: string | null;
  onSelect?: (code: string) => void;
  height?: number;
  /** Pufakcha rangi (masalan ko'rsatkich bo'yicha) — berilmasa ko'k */
  colorFor?: (item: RegionBubble) => string;
}

const THEME = {
  light: { bg: "#f8fafc", land: "#e2e8f0", landActive: "#fed7aa", border: "#ffffff" },
  dark: { bg: "#0f172a", land: "#334155", landActive: "#7c2d12", border: "#1e293b" },
};
const MAX_RADIUS = 22;

/**
 * Viloyatlar markazida qiymatga proporsional pufakchalar (FQ-02, K-04). Fon — O'zbekiston viloyat chegaralari
 * (public/geo/regions.geojson): tashqi tile serverga bog'liq emas, qo'shni davlatlar karta maydonini egallamaydi.
 * Pufakcha maydoni qiymatga proporsional (radius ∝ √qiymat), kattalari ostida chiziladi.
 */
export default function RegionBubbleMap({ items, selected, onSelect, height = 360, colorFor }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const base = useRef<L.GeoJSON | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [regions, setRegions] = useState<GeoFeature[] | null>(null);
  const colors = THEME[useTheme().theme === "dark" ? "dark" : "light"];

  useEffect(() => {
    loadBoundaries("regions").then((g) => setRegions(g.features)).catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { scrollWheelZoom: false, zoomSnap: 0.25, attributionControl: false }).setView([41.3, 64.5], 5);
    map.current = m;
    m.on("focus click", () => m.scrollWheelZoom.enable());
    m.on("blur mouseout", () => m.scrollWheelZoom.disable());
    const ro = new ResizeObserver(() => {
      m.invalidateSize();
      const b = base.current?.getBounds();
      if (b?.isValid()) m.fitBounds(b, { padding: [10, 10], animate: false });
    });
    ro.observe(box.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);

  // Fon: viloyat chegaralari (bosilsa ham viloyat tanlanadi)
  useEffect(() => {
    const m = map.current;
    if (!m || !regions?.length) return;
    base.current?.remove();
    base.current = L.geoJSON(regions as never, {
      style: (f) => {
        const code = (f as unknown as GeoFeature).properties.soato;
        return { fillColor: code === selected ? colors.landActive : colors.land, fillOpacity: 1, color: colors.border, weight: 1 };
      },
      onEachFeature: (f, l) => {
        const code = (f as unknown as GeoFeature).properties.soato;
        l.on("click", () => onSelectRef.current?.(code));
      },
    }).addTo(m);
    base.current.bringToBack();
    const b = base.current.getBounds();
    if (b.isValid()) {
      m.fitBounds(b, { padding: [10, 10], animate: false });
      m.setMaxBounds(b.pad(0.5));
      m.setMinZoom(m.getZoom() - 0.5);
    }
  }, [regions, selected, colors]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layer.current?.remove();
    layer.current = L.layerGroup().addTo(m);
    const max = Math.max(1, ...items.map((i) => i.value));
    [...items]
      .sort((a, b) => b.value - a.value)
      .forEach((item) => {
        const center = REGION_CENTERS[item.code];
        if (!center || item.value <= 0) return;
        const color = colorFor ? colorFor(item) : "#2563eb";
        const active = item.code === selected;
        const marker = L.circleMarker([center.lat, center.lng], {
          radius: 4 + Math.sqrt(item.value / max) * MAX_RADIUS,
          color: active ? "#f97316" : "#ffffff",
          weight: active ? 3 : 1.25,
          fillColor: color,
          fillOpacity: 0.7,
        });
        marker.bindTooltip(`<b>${center.name}</b><br/>${item.label ?? item.value.toLocaleString("ru-RU")}`, { direction: "top" });
        marker.on("click", () => onSelectRef.current?.(item.code));
        marker.addTo(layer.current as L.LayerGroup);
      });
  }, [items, selected, colorFor]);

  return (
    <div ref={box} style={{ height, background: colors.bg }} className="w-full rounded-xl overflow-hidden z-0 border border-gray-200 dark:border-gray-700"
      role="region" aria-label="Viloyatlar xaritasi" />
  );
}
