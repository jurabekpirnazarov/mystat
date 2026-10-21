import { useEffect, useState } from "react";
import { fetchAllServiceStats, type ServiceShortStats } from "../../api/portal";

/** Barcha xizmatlarning foydalanish soni va reytingi (MG-10). Bir marta yuklanadi, kartochkalar o'qiydi. */
export function useServiceStats() {
  const [state, setState] = useState<{ items: Record<string, ServiceShortStats>; isSample: boolean }>({ items: {}, isSample: false });
  useEffect(() => {
    let alive = true;
    void fetchAllServiceStats().then((r) => alive && setState({ items: r.items, isSample: r.is_sample }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** my.gov.uz uslubidagi qisqa son: 874, 8.3K, 11.9M. */
export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}
