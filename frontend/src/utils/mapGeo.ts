/**
 * KR-04: SOATO kodli chegaralar (public/geo, build_map_boundaries yaratadi). Moslashtirish faqat
 * `properties.soato` bo'yicha — nom bo'yicha hech qachon (N1).
 */

export type Position = [number, number];
export interface GeoFeature {
  type: "Feature";
  properties: { soato: string; name_uz?: string; name_ru?: string; name_en?: string };
  geometry: { type: "Polygon"; coordinates: Position[][] } | { type: "MultiPolygon"; coordinates: Position[][][] };
}
export interface GeoCollection {
  type: "FeatureCollection";
  source?: string;
  features: GeoFeature[];
}

const cache: Partial<Record<"regions" | "districts", Promise<GeoCollection>>> = {};

export function loadBoundaries(kind: "regions" | "districts") {
  if (!cache[kind]) {
    cache[kind] = fetch(`/geo/${kind}.geojson`).then((r) => {
      if (!r.ok) throw new Error(`${kind}.geojson: ${r.status}`);
      return r.json() as Promise<GeoCollection>;
    });
    cache[kind]!.catch(() => delete cache[kind]);
  }
  return cache[kind]!;
}

export function polygons(feature: GeoFeature): Position[][][] {
  return feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
}

function inRing([x, y]: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** [lng, lat] nuqta qaysi hududda — "Mening hududim" (KR-13). */
export function featureAt(point: Position, features: GeoFeature[]) {
  return features.find((f) => polygons(f).some((poly) => inRing(point, poly[0]) && !poly.slice(1).some((h) => inRing(point, h))));
}

function ringArea(ring: Position[]) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return a / 2;
}

/**
 * Hudud ichidagi "ko'rinadigan markaz" [lng, lat] — yorliq va pufakcha uchun. Eng katta poligon tashqi halqasining
 * og'irlik markazi; u hudud ichida bo'lmasa (botiq shakl yoki teshik — masalan, Toshkent viloyati ichida shahar),
 * markazga eng yaqin ichki nuqta 24×24 to'rdan tanlanadi. Viloyat markaziy shahri emas (u ko'pincha chetda turadi).
 */
export function labelPoint(feature: GeoFeature): Position {
  const polys = polygons(feature);
  const main = polys.reduce((best, p) => (Math.abs(ringArea(p[0])) > Math.abs(ringArea(best[0])) ? p : best), polys[0]);
  const ring = main[0];
  const a = ringArea(ring);
  let cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
  }
  const c: Position = a ? [cx / (6 * a), cy / (6 * a)] : ring[0];
  const inside = (pt: Position) => inRing(pt, ring) && !main.slice(1).some((h) => inRing(pt, h));
  if (inside(c)) return c;
  const b = bounds([{ ...feature, geometry: { type: "Polygon", coordinates: main } }]);
  let best: Position | null = null, bestD = Infinity;
  for (let i = 1; i < 24; i++)
    for (let j = 1; j < 24; j++) {
      const pt: Position = [b.minX + ((b.maxX - b.minX) * i) / 24, b.minY + ((b.maxY - b.minY) * j) / 24];
      const d = (pt[0] - c[0]) ** 2 + (pt[1] - c[1]) ** 2;
      if (d < bestD && inside(pt)) { best = pt; bestD = d; }
    }
  return best ?? c;
}

export function bounds(features: GeoFeature[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features)
    for (const poly of polygons(f))
      for (const [x, y] of poly[0]) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
  return { minX, minY, maxX, maxY };
}

/**
 * KR-12: kartani PNG qilib chizish (Leaflet + html2canvas transformlarda noto'g'ri chiqadi, shuning uchun
 * GeoJSON to'g'ridan-to'g'ri canvas'ga chiziladi). Pastida ko'rsatkich, davr, manba va sana.
 */
export function renderMapPng(opts: {
  features: GeoFeature[];
  context?: GeoFeature[];
  fill: (code: string) => string | null;
  title: string;
  subtitle: string;
  legend: { color: string; label: string }[];
  footer: string;
  filename: string;
}) {
  const W = 1600, H = 1150, pad = 40, top = 110, bottom = 170;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const b = bounds(opts.features);
  const kx = Math.cos((((b.minY + b.maxY) / 2) * Math.PI) / 180); // taxminiy ekvidistant proyeksiya
  const scale = Math.min((W - pad * 2) / ((b.maxX - b.minX) * kx), (H - top - bottom) / (b.maxY - b.minY));
  const ox = (W - (b.maxX - b.minX) * kx * scale) / 2;
  const project = ([x, y]: Position): Position => [ox + (x - b.minX) * kx * scale, top + (b.maxY - y) * scale];
  const draw = (f: GeoFeature, fill: string | CanvasPattern, stroke: string) => {
    ctx.beginPath();
    for (const poly of polygons(f))
      for (const ring of poly)
        ring.forEach((p, i) => {
          const [x, y] = project(p);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  const hatch = document.createElement("canvas");
  hatch.width = hatch.height = 8;
  const h = hatch.getContext("2d")!;
  h.fillStyle = "#f3f4f6";
  h.fillRect(0, 0, 8, 8);
  h.strokeStyle = "#9ca3af";
  h.beginPath();
  h.moveTo(0, 8);
  h.lineTo(8, 0);
  h.stroke();
  const pattern = ctx.createPattern(hatch, "repeat") ?? "#e5e7eb";
  for (const f of opts.context ?? []) draw(f, "#f3f4f6", "#d1d5db");
  for (const f of opts.features) {
    const color = opts.fill(f.properties.soato);
    ctx.save();
    draw(f, color ?? pattern, "#ffffff");
    ctx.restore();
  }
  ctx.fillStyle = "#111827";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(opts.title.slice(0, 80), pad, 55);
  ctx.font = "22px sans-serif";
  ctx.fillStyle = "#4b5563";
  ctx.fillText(opts.subtitle, pad, 90);
  let x = pad;
  const ly = H - bottom + 40;
  ctx.font = "18px sans-serif";
  for (const item of opts.legend) {
    ctx.fillStyle = item.color === "hatch" ? pattern : item.color;
    ctx.fillRect(x, ly, 28, 18);
    ctx.strokeStyle = "#9ca3af";
    ctx.strokeRect(x, ly, 28, 18);
    ctx.fillStyle = "#374151";
    ctx.fillText(item.label, x + 36, ly + 15);
    x += 46 + ctx.measureText(item.label).width;
    if (x > W - 260) break;
  }
  ctx.fillStyle = "#6b7280";
  ctx.font = "17px sans-serif";
  opts.footer.split("\n").forEach((line, i) => ctx.fillText(line, pad, H - 60 + i * 24));
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = opts.filename;
  a.click();
}
