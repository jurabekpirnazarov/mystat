import type { Favorite } from "../api/citizens";

/** Sevimli ko'rsatkich -> sahifa havolasi (FQ-04). */
export function favoriteLink(f: Favorite): string {
  const p = f.params ?? {};
  switch (f.kind) {
    case "cpi": return "/cpi-calculator";
    case "region": return p.region ? `/regions/${p.region}` : "/regions";
    case "salary": return `/my-salary${p.sector ? `?sector=${p.sector}` : ""}`;
    case "prices": return `/prices${p.product ? `?product=${p.product}` : ""}`;
    case "names": return `/names${p.name ? `?q=${encodeURIComponent(String(p.name))}` : ""}`;
    case "trade": return "/trade-flows";
    case "demography": return "/demographics";
    case "service": return p.number ? `/service/${p.number}` : "/spheres";
    default: return "/citizens";
  }
}
