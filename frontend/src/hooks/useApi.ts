import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  reload: () => void;
}

/**
 * API chaqiruvi uchun umumiy holat: yuklanish, xato, qayta yuklash.
 * Eskirgan javob (deps o'zgargandan keyin kelgan) e'tiborsiz qoldiriladi.
 */
export function useApi<T>(fn: () => Promise<T>, deps: DependencyList = []): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);
  const callId = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const id = ++callId.current;
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((result) => {
        if (id === callId.current) setData(result);
      })
      .catch((err) => {
        if (id === callId.current) setError(err);
      })
      .finally(() => {
        if (id === callId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps chaqiruvchi tomonidan beriladi
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, reload };
}

export default useApi;
