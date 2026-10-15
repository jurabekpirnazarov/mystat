import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatValue, legendRows, type Scale } from "../../utils/mapScale";

interface Props {
  scale: Scale | null;
  unit: string;
  republic: number | null;
  parent?: { name: string; value: number | null } | null;
  preliminary: boolean;
  missingCount: number;
}

/** KR-06: legenda — sinflar, "Ma'lumot yo'q", respublika qiymati alohida (N5), dastlabki belgisi (N9). */
export default function MapLegend({ scale, unit, republic, parent, preliminary, missingCount }: Props) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 text-xs">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 font-medium text-gray-700 dark:text-gray-200">
        Legenda{unit ? `, ${unit}` : ""}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1">
          {scale &&
            legendRows(scale).map((row) => (
              <div key={row.color + row.from} className="flex items-center gap-2">
                <span className="w-5 h-3 rounded-sm border border-gray-300" style={{ background: row.color }} />
                <span className="tabular-nums text-gray-700 dark:text-gray-300">{formatValue(row.from)} – {formatValue(row.to)}</span>
              </div>
            ))}
          <div className="flex items-center gap-2">
            <span className="w-5 h-3 rounded-sm border border-gray-300"
              style={{ background: "repeating-linear-gradient(45deg,#f3f4f6 0 3px,#9ca3af 3px 4px)" }} />
            <span className="text-gray-700 dark:text-gray-300">Ma'lumot yo'q{missingCount ? ` (${missingCount})` : ""}</span>
          </div>
          {scale?.diverging && <p className="text-gray-500">Markaz: {formatValue((scale.breaks[1] + scale.breaks[2]) / 2)}</p>}
          <div className="pt-1 mt-1 border-t border-gray-100 dark:border-gray-700 space-y-0.5">
            {parent && <p><span className="text-gray-500">{parent.name}:</span> <b className="tabular-nums">{formatValue(parent.value)}</b></p>}
            <p><span className="text-gray-500">O'zbekiston:</span> <b className="tabular-nums">{formatValue(republic)}</b> <span className="text-gray-400">(shkalaga kirmaydi)</span></p>
            {preliminary && <p className="text-amber-700 dark:text-amber-300">* Dastlabki ma'lumot — keyin aniqlashtirilishi mumkin</p>}
          </div>
        </div>
      )}
    </div>
  );
}
