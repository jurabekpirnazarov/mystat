import { formatValue, legendRows, type Scale } from "../../utils/mapScale";

interface Props {
  scale: Scale | null;
  unit: string;
  republic: number | null;
  parent?: { name: string; value: number | null } | null;
  preliminary: boolean;
  missingCount: number;
  /** Salohiyat indeksi: respublika qiymati yo'q (indeks nisbiy) */
  hideRepublic?: boolean;
  /** Qo'shimcha izoh (prognoz, salohiyat) */
  note?: string;
  missingLabel?: string;
}

export const HATCH_CSS = "repeating-linear-gradient(45deg,#f3f4f6 0 3px,#9ca3af 3px 4px)";

/**
 * KR-06: legenda — sinflar, "Ma'lumot yo'q", respublika qiymati alohida (N5), dastlabki belgisi (N9).
 * Karta ostida gorizontal joylashadi — kartaning hech bir hududini yopmaydi.
 */
export default function MapLegend({ scale, unit, republic, parent, preliminary, missingCount, hideRepublic, note, missingLabel = "Ma'lumot yo'q" }: Props) {
  const rows = scale ? legendRows(scale) : [];
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-xs">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="min-w-0 w-full sm:w-[26rem]">
          <p className="mb-1 font-medium text-gray-700 dark:text-gray-200">{unit || "Qiymat"}</p>
          {rows.length > 0 && (
            <div className="flex" role="list" aria-label="Rang shkalasi">
              {rows.map((row, i) => (
                <div key={row.color + row.from} role="listitem" className="flex-1 min-w-0" aria-label={`${formatValue(row.from)} – ${formatValue(row.to)}`}>
                  <span className={`block h-3 border-y border-gray-300 dark:border-gray-600 ${i === 0 ? "rounded-l border-l" : ""} ${i === rows.length - 1 ? "rounded-r border-r" : ""}`}
                    style={{ background: row.color }} />
                  <span className="mt-0.5 flex justify-between gap-1 tabular-nums text-gray-600 dark:text-gray-300">
                    <span className="truncate">{formatValue(row.from)}</span>
                    {i === rows.length - 1 && <span className="shrink-0">{formatValue(row.to)}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 pb-0.5">
          <span className="w-5 h-3 rounded-sm border border-gray-300 dark:border-gray-600" style={{ background: HATCH_CSS }} />
          <span className="text-gray-700 dark:text-gray-300">{missingLabel}{missingCount ? ` (${missingCount})` : ""}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 pb-0.5 sm:ml-auto text-gray-700 dark:text-gray-300">
          {parent && <span><span className="text-gray-500">{parent.name}:</span> <b className="tabular-nums">{formatValue(parent.value)}</b></span>}
          {!hideRepublic && (
            <span title="Respublika qiymati rang shkalasiga kirmaydi"><span className="text-gray-500">O'zbekiston:</span> <b className="tabular-nums">{formatValue(republic)}</b></span>
          )}
        </div>
      </div>
      {(scale?.diverging || preliminary || note) && (
        <p className="mt-1.5 text-gray-500">
          {scale?.diverging && !note && <>Markaz: {formatValue((scale.breaks[1] + scale.breaks[2]) / 2)}. </>}
          {note && <>{note} </>}
          {preliminary && <span className="text-amber-700 dark:text-amber-300">* Dastlabki ma'lumot — keyin aniqlashtirilishi mumkin.</span>}
        </p>
      )}
    </div>
  );
}
