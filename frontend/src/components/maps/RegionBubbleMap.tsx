import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_CENTERS } from "../../data/regionCenters";
import { labelPoint, loadBoundaries, type GeoFeature } from "../../utils/mapGeo";
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
  /** Pufakcha rangi (masalan ko'rsatkich bo'yicha) — berilmasa qiymatga qarab ko'k shkala */
  colorFor?: (item: RegionBubble) => string;
  /** O'lcham izohidagi birlik, masalan "korxona" */
  unit?: string;
}

const THEME = {
  light: { bg: "#f1f5f9", land: "#ffffff", landActive: "#fed7aa", border: "#64748b", text: "#0f172a" },
  dark: { bg: "#0b1220", land: "#1e293b", landActive: "#7c2d12", border: "#94a3b8", text: "#f1f5f9" },
};
// Ko'k ketma-ket shkala (och -> to'q): qiymat ulushi bo'yicha
const LIGHT_BLUE = [147, 197, 253];
const DARK_BLUE = [30, 58, 138];

function blue(t: number) {
  const c = LIGHT_BLUE.map((v, i) => Math.round(v + (DARK_BLUE[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** 12 345 -> "12,3 ming", 1 234 567 -> "1,2 mln" (pufakcha ichidagi qisqa yorliq) */
function compact(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} mln`;
  if (n >= 1e4) return `${Math.round(n / 1e3)} ming`;
  return new Intl.NumberFormat("ru-RU").format(n).replace(/\s/g, " ");
}

/**
 * Viloyatlar kesimida qiymatga proporsional pufakchalar (FQ-02, K-04).
 * - Pufakcha **maydoni** qiymatga proporsional: r = R·√(qiymat / max). Ilgari radiusga doimiy +4 qo'shilardi va kichik
 *   qiymatlar ham katta ko'rinardi — o'lchamlar solishtirib bo'lmas edi.
 * - Pufakcha viloyat hududining ko'rinadigan markazida (`labelPoint`), viloyat markaziy shahrida emas: Nukus va Navoiy
 *   shahri hududning chetida, pufakcha qo'shni viloyat ustiga tushardi.
 * - Rang ham qiymatga qarab to'qlashadi, katta pufakchada qiymat yozilgan; burchakda o'lcham izohi.
 */
export default function RegionBubbleMap({ items, selected, onSelect, height = 360, colorFor, unit }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const base = useRef<L.GeoJSON | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const legend = useRef<L.Control | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [regions, setRegions] = useState<GeoFeature[] | null>(null);
  const colors = THEME[useTheme().theme === "dark" ? "dark" : "light"];
  const maxRadius = Math.max(18, Math.round(height * 0.1));

  useEffect(() => {
    loadBoundaries("regions").then((g) => setRegions(g.features)).catch(() => setRegions([]));
  }, []);

  // Pufakcha joyi: hudud markazi (chegaralar yuklangan bo'lsa), aks holda viloyat markaziy shahri
  const centers = useMemo(() => {
    const out: Record<string, { lat: number; lng: number; name: string }> = {};
    for (const [code, c] of Object.entries(REGION_CENTERS)) out[code] = c;
    for (const f of regions ?? []) {
      const code = f.properties.soato;
      const [lng, lat] = labelPoint(f);
      out[code] = { lat, lng, name: REGION_CENTERS[code]?.name ?? f.properties.name_uz ?? code };
    }
    return out;
  }, [regions]);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { scrollWheelZoom: false, zoomSnap: 0.25, attributionControl: false }).setView([41.3, 64.5], 5);
    map.current = m;
    m.on("focus click", () => m.scrollWheelZoom.enable());
    m.on("blur mouseout", () => m.scrollWheelZoom.disable());
    const ro = new ResizeObserver(() => {
      m.invalidateSize();
      const b = base.current?.getBounds();
      if (b?.isValid()) m.fitBounds(b, { padding: [8, 8], animate: false });
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
        return { fillColor: code === selected ? colors.landActive : colors.land, fillOpacity: 1, color: colors.border, weight: 0.9, opacity: 0.8 };
      },
      onEachFeature: (f, l) => {
        const code = (f as unknown as GeoFeature).properties.soato;
        l.on("click", () => onSelectRef.current?.(code));
      },
    }).addTo(m);
    base.current.bringToBack();
    const b = base.current.getBounds();
    if (b.isValid()) {
      m.fitBounds(b, { padding: [8, 8], animate: false });
      m.setMaxBounds(b.pad(0.5));
      m.setMinZoom(m.getZoom() - 0.5);
    }
  }, [regions, selected, colors]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    layer.current?.remove();
    layer.current = L.layerGroup().addTo(m);
    const shown = items.filter((i) => i.value > 0 && centers[i.code]);
    const max = Math.max(1, ...shown.map((i) => i.value));
    const placed: L.Point[] = [];   // yorliq qo'yilgan nuqtalar (piksel) — ustma-ust chiqmasligi uchun
    [...shown]
      .sort((a, b) => b.value - a.value)   // kattalari ostida, kichiklari ustida — bosib bo'ladi
      .forEach((item) => {
        const center = centers[item.code];
        const share = item.value / max;
        const radius = Math.max(3, Math.sqrt(share) * maxRadius);
        const active = item.code === selected;
        const marker = L.circleMarker([center.lat, center.lng], {
          radius,
          color: active ? "#f97316" : "#ffffff",
          weight: active ? 3 : 1.5,
          fillColor: colorFor ? colorFor(item) : blue(Math.sqrt(share)),
          fillOpacity: 0.9,
        });
        marker.bindTooltip(`<b>${center.name}</b><br/>${item.label ?? compact(item.value)}`, { direction: "top" });
        marker.on("click", () => onSelectRef.current?.(item.code));
        marker.addTo(layer.current as L.LayerGroup);
        // Qiymat faqat sig'adigan pufakchada va yaqinida boshqa yorliq bo'lmasa (kattalar oldin qo'yiladi); to'q fonda oq matn
        const pt = m.latLngToContainerPoint([center.lat, center.lng]);
        if (radius >= 14 && placed.every((q) => q.distanceTo(pt) > 38)) {
          placed.push(pt);
          L.tooltip({ permanent: true, direction: "center", className: `map-label${share > 0.35 ? " on-dark" : ""}`, interactive: false })
            .setLatLng([center.lat, center.lng]).setContent(compact(item.value)).addTo(layer.current as L.LayerGroup);
        }
      });

    // O'lcham izohi: eng katta qiymat va uning ½ va ¼ qismi (maydon proporsional bo'lgani uchun radius √ bilan)
    legend.current?.remove();
    if (shown.length) {
      const Legend = L.Control.extend({
        onAdd: () => {
          const div = L.DomUtil.create("div");
          const steps = [1, 0.5, 0.25].map((k) => ({ v: max * k, r: Math.sqrt(k) * maxRadius }));
          const size = Math.ceil(maxRadius * 2 + 4);
          const circles = steps.map(({ r }) =>
            `<circle cx="${size / 2}" cy="${size - 2 - r}" r="${r}" fill="none" stroke="${colors.border}" stroke-width="1"/>`).join("");
          div.innerHTML = `<div style="background:${colors.land};border:1px solid ${colors.border}33;border-radius:8px;padding:6px 8px;font:11px system-ui;color:${colors.text}">
            <div style="display:flex;align-items:flex-end;gap:8px"><svg width="${size}" height="${size}" aria-hidden="true">${circles}</svg>
            <div style="display:flex;flex-direction:column;gap:2px">${steps.map((s) => `<span>${compact(Math.round(s.v))}</span>`).join("")}</div></div>
            ${unit ? `<div style="margin-top:2px;color:#64748b">${unit}</div>` : ""}</div>`;
          return div;
        },
      });
      legend.current = new Legend({ position: "bottomright" }).addTo(m);
    }
  }, [items, selected, colorFor, centers, maxRadius, colors, unit]);

  return (
    <div ref={box} style={{ height, background: colors.bg }} className="stat-map w-full rounded-xl overflow-hidden z-0 border border-slate-300 dark:border-gray-700"
      role="region" aria-label="Viloyatlar xaritasi" />
  );
}
