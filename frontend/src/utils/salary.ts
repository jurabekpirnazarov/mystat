/** FQ-05: maosh persentilini taqsimot nuqtalari (p25, median, p75, p90) bo'yicha baholash — faqat brauzerda. */
export interface Distribution {
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

/**
 * Bo'lakli-chiziqli interpolyatsiya: (0 → 0%), (p25 → 25%), (median → 50%), (p75 → 75%), (p90 → 90%),
 * (p90 × 2 → 99%). Natija 0..99 oralig'ida, butun songa yaxlitlanadi.
 */
export function salaryPercentile(salary: number, d: Distribution): number {
  if (!(salary > 0)) return 0;
  const points: [number, number][] = [[0, 0], [d.p25, 25], [d.median, 50], [d.p75, 75], [d.p90, 90], [d.p90 * 2, 99]];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (salary <= x1) return Math.round(y0 + ((salary - x0) / (x1 - x0)) * (y1 - y0));
  }
  return 99;
}
