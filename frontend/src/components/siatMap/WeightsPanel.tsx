import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { GeoLevel, ScoreConfig } from "../../api/siatMap";

interface Props {
  config: ScoreConfig;
  level: GeoLevel;
  preset: string;
  /** "25,25,15,25,10" — maxsus vaznlar (URL `sw`) */
  weights: string;
  onChange: (patch: { sp: string | null; sw: string | null }) => void;
}

/**
 * SCORING_MODEL.md 7-bo'lim, 3-band: preset va 5 ta slayder. Natija URL'ga yoziladi (`sp=` yoki `sw=`) — havola
 * ulashilganda bir xil indeks chiqadi. Tuman darajasida faqat B va C ustunlari (viloyat ko'rsatkichlari tumanga
 * meros qilinmaydi).
 */
export default function WeightsPanel({ config, level, preset, weights, onChange }: Props) {
  const presetWeights = (key: string) => config.presets[key]?.[level] ?? config.presets.balanced[level];
  const initial = weights ? weights.split(",").map(Number) : presetWeights(preset || "balanced");
  const [draft, setDraft] = useState<number[]>(initial);
  const [open, setOpen] = useState(!!weights);

  useEffect(() => {
    setDraft(weights ? weights.split(",").map(Number) : presetWeights(preset || "balanced"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat tashqi holat o'zgarganda
  }, [weights, preset, level]);

  const enabled = (key: string) => level === "region" || key === "B" || key === "C";
  const total = draft.reduce((a, w, i) => a + (enabled(config.pillars[i].key) ? w : 0), 0);
  const apply = (next: number[]) => {
    setDraft(next);
    onChange({ sp: null, sw: next.map((w) => Math.round(w)).join(",") });
  };

  return (
    <section aria-label="Vaznlarni sozlash" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-300">Vaznlar:</span>
          <select value={weights ? "custom" : preset || "balanced"}
            onChange={(e) => e.target.value !== "custom" && onChange({ sp: e.target.value === "balanced" ? null : e.target.value, sw: null })}
            className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            {Object.entries(config.presets).map(([key, p]) => <option key={key} value={key}>{p.name}</option>)}
            {weights && <option value="custom">Maxsus</option>}
          </select>
        </label>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600">
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" /> Sozlash
        </button>
        {level === "district" && <span className="text-xs text-gray-500">Tumanlarda faqat mehnat bozori va demografiya.</span>}
      </div>
      {open && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {config.pillars.map((p, i) => (
            <label key={p.key} className={`text-xs ${enabled(p.key) ? "" : "opacity-40"}`}>
              <span className="flex justify-between">
                <span>{p.name}</span>
                <span className="tabular-nums text-gray-500">{total ? Math.round((enabled(p.key) ? draft[i] : 0) / total * 100) : 0}%</span>
              </span>
              <input type="range" min={0} max={60} step={5} value={enabled(p.key) ? draft[i] : 0} disabled={!enabled(p.key)}
                onChange={(e) => setDraft(draft.map((w, j) => (j === i ? Number(e.target.value) : w)))}
                onMouseUp={() => apply(draft)} onTouchEnd={() => apply(draft)} onKeyUp={() => apply(draft)}
                className="w-full accent-blue-600" aria-label={`${p.name} vazni`} />
            </label>
          ))}
          <p className="sm:col-span-2 text-xs text-gray-500">
            Vaznlar ekspert bahosi — statistik "to'g'ri" vazn yo'q. Har o'zgarishda xarita va reyting qayta hisoblanadi; sozlama havolada saqlanadi.
          </p>
        </div>
      )}
    </section>
  );
}
