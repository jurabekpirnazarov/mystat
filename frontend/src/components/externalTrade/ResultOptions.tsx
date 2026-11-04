import type { ReactNode } from "react";

/** Parametrli tahlilning "Natijani sozlash" qadami: backend `trade-data/` ga yuboriladigan qo'shimcha filtrlar. */
export interface ResultOpt { value: string | number; label: string }

export interface ResultOpts {
  excluded: ResultOpt[];
  search: string;
  minValue: string;
  maxValue: string;
  sortBy: "" | "value_desc" | "value_asc" | "name";
  topN: string;
  showShare: boolean;
  showGrowth: boolean;
}

export const DEFAULT_RESULT_OPTS: ResultOpts = { excluded: [], search: "", minValue: "", maxValue: "", sortBy: "", topN: "", showShare: false, showGrowth: false };

const SORTS: [ResultOpts["sortBy"], string][] = [["", "Standart tartib"], ["value_desc", "Qiymat: kattadan kichikka"], ["value_asc", "Qiymat: kichikdan kattaga"], ["name", "Nomi bo'yicha (A–Z)"]];
const TOPS = ["", "5", "10", "20", "50", "100"];

/** Faqat to'ldirilgan maydonlar qaytadi, shuning uchun bo'sh forma eski so'rovni o'zgartirmaydi. */
export function resultOptsPayload(o: ResultOpts): Record<string, string | number | boolean | string[]> {
  const out: Record<string, string | number | boolean | string[]> = {};
  if (o.excluded.length) out.exclude_countries = o.excluded.map((c) => String(c.value));
  if (o.search.trim()) out.search = o.search.trim();
  if (o.minValue !== "" && Number(o.minValue) >= 0) out.min_value = Number(o.minValue);
  if (o.maxValue !== "" && Number(o.maxValue) >= 0) out.max_value = Number(o.maxValue);
  if (o.sortBy) out.sort_by = o.sortBy;
  if (o.topN) out.top_n = Number(o.topN);
  if (o.showShare) out.show_share = true;
  if (o.showGrowth) out.show_growth = true;
  return out;
}

export function resultOptsCount(o: ResultOpts): number {
  return Object.keys(resultOptsPayload(o)).length;
}

const inputCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="m-0 text-xs text-gray-500">{hint}</p>}
      {children}
    </div>
  );
}

export default function ResultOptions({ value, onChange, excludeSlot }: { value: ResultOpts; onChange: (v: ResultOpts) => void; excludeSlot?: ReactNode }) {
  const set = <K extends keyof ResultOpts>(k: K, v: ResultOpts[K]) => onChange({ ...value, [k]: v });
  const rangeBad = value.minValue !== "" && value.maxValue !== "" && Number(value.minValue) > Number(value.maxValue);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field label="Nom bo'yicha qidirish" hint="Davlat, hudud yoki mahsulot nomining bir qismi (masalan: shakar, Rossiya)" htmlFor="ro-search">
          <input id="ro-search" type="text" maxLength={60} value={value.search} onChange={(e) => set("search", e.target.value)} placeholder="Qidiruv so'zi" className={inputCls} />
        </Field>
        {excludeSlot && (
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-gray-700">Davlatlarni chiqarib tashlash</span>
            <p className="m-0 text-xs text-gray-500">Tanlangan davlatlar natijaga kirmaydi (masalan: Rossiyasiz)</p>
            {excludeSlot}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Field label="Eng kam qiymat, ming $" hint="Oxirgi davrdagi qiymat bo'yicha" htmlFor="ro-min">
          <input id="ro-min" type="number" min={0} inputMode="decimal" value={value.minValue} onChange={(e) => set("minValue", e.target.value)} placeholder="0" className={inputCls} />
        </Field>
        <Field label="Eng ko'p qiymat, ming $" htmlFor="ro-max">
          <input id="ro-max" type="number" min={0} inputMode="decimal" value={value.maxValue} onChange={(e) => set("maxValue", e.target.value)} placeholder="Cheklovsiz" aria-invalid={rangeBad} className={inputCls} />
        </Field>
        <Field label="Saralash" htmlFor="ro-sort">
          <select id="ro-sort" value={value.sortBy} onChange={(e) => set("sortBy", e.target.value as ResultOpts["sortBy"])} className={inputCls}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Eng kattalari" hint="Faqat birinchi N qator" htmlFor="ro-top">
          <select id="ro-top" value={value.topN} onChange={(e) => set("topN", e.target.value)} className={inputCls}>
            {TOPS.map((v) => <option key={v} value={v}>{v ? `Top ${v}` : "Hammasi"}</option>)}
          </select>
        </Field>
      </div>
      {rangeBad && <p role="alert" className="m-0 text-sm text-red-700">Eng kam qiymat eng ko'p qiymatdan katta bo'lmasligi kerak.</p>}

      <fieldset className="m-0 rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium text-gray-700">Qo'shimcha ustunlar</legend>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-800">
            <input type="checkbox" checked={value.showShare} onChange={(e) => set("showShare", e.target.checked)} className="mt-0.5 h-4 w-4" />
            <span>Ulush, %<span className="block text-xs text-gray-500">Har qatorning jamidagi ulushi</span></span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-800">
            <input type="checkbox" checked={value.showGrowth} onChange={(e) => set("showGrowth", e.target.checked)} className="mt-0.5 h-4 w-4" />
            <span>O'sish, %<span className="block text-xs text-gray-500">Oxirgi davr oldingisiga nisbatan (kamida 2 davr tanlang)</span></span>
          </label>
        </div>
      </fieldset>

      <button type="button" onClick={() => onChange(DEFAULT_RESULT_OPTS)} className="text-sm font-medium text-blue-700 underline-offset-2 hover:underline">
        Qo'shimcha sozlamalarni tozalash
      </button>
    </div>
  );
}
