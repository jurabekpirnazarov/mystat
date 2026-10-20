import { describe, expect, it } from "vitest";
import { labelPoint, type GeoFeature } from "./mapGeo";

const feature = (coordinates: [number, number][][]): GeoFeature => ({ type: "Feature", properties: { soato: "1" }, geometry: { type: "Polygon", coordinates } });

describe("labelPoint", () => {
  it("to'rtburchak markazi", () => {
    const [x, y] = labelPoint(feature([[[0, 0], [4, 0], [4, 2], [0, 2], [0, 0]]]));
    expect(x).toBeCloseTo(2);
    expect(y).toBeCloseTo(1);
  });

  it("markazda teshik bo'lsa (viloyat ichida shahar) — nuqta hudud ichida, teshikda emas", () => {
    const outer: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const hole: [number, number][] = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
    const [x, y] = labelPoint(feature([outer, hole]));
    const inHole = x > 4 && x < 6 && y > 4 && y < 6;
    expect(inHole).toBe(false);
    expect(x > 0 && x < 10 && y > 0 && y < 10).toBe(true);
  });

  it("U shaklida (og'irlik markazi tashqarida) — ichki nuqta", () => {
    const u: [number, number][] = [[0, 0], [6, 0], [6, 6], [4, 6], [4, 2], [2, 2], [2, 6], [0, 6], [0, 0]];
    const [x, y] = labelPoint(feature([u]));
    const insideNotch = x > 2 && x < 4 && y > 2;
    expect(insideNotch).toBe(false);
  });
});
