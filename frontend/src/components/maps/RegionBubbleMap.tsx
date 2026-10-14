import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_CENTERS } from "../../data/regionCenters";

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

/** Viloyatlar markazida qiymatga proporsional pufakchalar (Leaflet). FQ-02, K-04. */
export default function RegionBubbleMap({ items, selected, onSelect, height = 360, colorFor }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!box.current || map.current) return;
    map.current = L.map(box.current, { scrollWheelZoom: false }).setView([41.3, 64.5], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 10,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!layer.current) return;
    layer.current.clearLayers();
    const max = Math.max(1, ...items.map((i) => i.value));
    items.forEach((item) => {
      const center = REGION_CENTERS[item.code];
      if (!center) return;
      const color = colorFor ? colorFor(item) : "#2563eb";
      const marker = L.circleMarker([center.lat, center.lng], {
        radius: 6 + Math.sqrt(item.value / max) * 26,
        color: item.code === selected ? "#f97316" : color,
        weight: item.code === selected ? 3 : 1,
        fillColor: color,
        fillOpacity: 0.45,
      });
      marker.bindTooltip(`${center.name}: ${item.label ?? item.value.toLocaleString("ru-RU")}`);
      marker.on("click", () => onSelectRef.current?.(item.code));
      marker.addTo(layer.current as L.LayerGroup);
    });
  }, [items, selected, colorFor]);

  return <div ref={box} style={{ height }} className="w-full rounded-xl overflow-hidden z-0" role="img" aria-label="Viloyatlar xaritasi" />;
}
