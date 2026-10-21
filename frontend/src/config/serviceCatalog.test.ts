import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { POPULAR, SERVICES, featuredOfSphere, serviceForPath, servicesOfSphere } from "./serviceCatalog";
import { SPHERES } from "./spheres";

const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf-8");

describe("xizmatlar katalogi (MG-04)", () => {
  it("raqamlar takrorlanmaydi va soha raqamiga mos", () => {
    const nums = SERVICES.map((s) => s.number);
    expect(new Set(nums).size).toBe(nums.length);
    for (const s of SERVICES) expect(Math.floor(s.number / 100)).toBe(s.sphere);
  });

  it("har sohada kamida 2 ta ishlayotgan xizmat bor", () => {
    for (const sp of SPHERES) {
      expect(servicesOfSphere(sp.id).filter((s) => s.status === "live").length, String(sp.title)).toBeGreaterThanOrEqual(2);
      expect(featuredOfSphere(sp.id)).toHaveLength(2);
    }
  });

  it("har xizmat yo'li router'da bor", () => {
    for (const s of SERVICES) {
      const path = s.route.split("?")[0];
      const pattern = path.startsWith("/dashboards/") ? "/dashboards/:slug" : path;
      expect(app.includes(`path="${pattern}"`), s.route).toBe(true);
    }
  });

  it("kichik toifa sohada e'lon qilingan", () => {
    for (const s of SERVICES.filter((x) => x.subcategory)) {
      const sp = SPHERES.find((p) => p.id === s.sphere)!;
      expect(sp.subcategories.map((c) => c.id)).toContain(s.subcategory);
    }
  });

  it("ommabop xizmatlar tartibli, sahifa bo'yicha xizmat topiladi", () => {
    expect(POPULAR.length).toBeGreaterThanOrEqual(12);
    expect(serviceForPath("/market-report")?.number).toBe(302);
    expect(serviceForPath("/cabinet", "?tab=reports")?.number).toBe(202);
  });
});
