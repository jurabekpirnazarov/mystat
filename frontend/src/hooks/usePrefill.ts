import { useCallback, useEffect, useRef, useState } from "react";
import axiosT from "../api/baseUrl";

export type PrefillSource = "profile" | "organization" | "registry" | "ktut" | "industry" | "last_order";

export interface PrefillField {
  field: string;
  value: string | number;
  source: PrefillSource;
  fetched_at: string | null;
}

export interface PrefillResponse {
  has_organization: boolean;
  fields: PrefillField[];
}

/** Forma maydoni -> prefill maydonlari (birinchi topilgani olinadi) */
export type PrefillMapping<K extends string> = Record<K, string[]>;

export const fetchPrefill = async () => (await axiosT.get<PrefillResponse>("/organizations/me/prefill/")).data;

/**
 * K-01 qoidasi: faqat **bo'sh** va foydalanuvchi **tahrirlamagan** maydonlar to'ldiriladi.
 * Qaytaradi: yoziladigan qiymatlar va har maydon manbasi.
 */
export function computePrefill<K extends string>(
  mapping: PrefillMapping<K>,
  values: Record<K, string>,
  edited: ReadonlySet<K>,
  fields: PrefillField[]
): { updates: Partial<Record<K, string>>; sources: Partial<Record<K, PrefillField>> } {
  const byName = new Map(fields.map((f) => [f.field, f]));
  const updates: Partial<Record<K, string>> = {};
  const sources: Partial<Record<K, PrefillField>> = {};
  (Object.keys(mapping) as K[]).forEach((key) => {
    if (edited.has(key) || (values[key] ?? "").trim() !== "") return;
    const found = mapping[key].map((name) => byName.get(name)).find((f) => f && String(f.value).trim() !== "");
    if (!found) return;
    updates[key] = String(found.value);
    sources[key] = found;
  });
  return { updates, sources };
}

/**
 * Formani prefill bilan to'ldiradi. `setValue` orqali yozadi, `markEdited` foydalanuvchi o'zgartirgan
 * maydonni belgilaydi — u qayta to'ldirishda ustidan yozilmaydi va manba belgisi "Tahrirlangan" bo'ladi.
 */
export function usePrefill<K extends string>(
  mapping: PrefillMapping<K>,
  values: Record<K, string>,
  setValue: (key: K, value: string) => void,
  enabled = true
) {
  const [sources, setSources] = useState<Partial<Record<K, PrefillField>>>({});
  const [edited, setEdited] = useState<Set<K>>(new Set());
  const [loading, setLoading] = useState(false);
  const latest = useRef({ mapping, values, setValue, edited });
  latest.current = { mapping, values, setValue, edited };

  const refill = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPrefill();
      const cur = latest.current;
      const { updates, sources: found } = computePrefill(cur.mapping, cur.values, cur.edited, data.fields);
      (Object.keys(updates) as K[]).forEach((k) => cur.setValue(k, updates[k] as string));
      setSources((prev) => ({ ...prev, ...found }));
    } catch {
      // Prefill ixtiyoriy: xato bo'lsa forma oddiy qo'lda to'ldiriladi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refill();
  }, [enabled, refill]);

  const markEdited = useCallback((key: K) => {
    setEdited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  return { sources, edited, markEdited, refill, loading };
}

export default usePrefill;
