import { HOME_REGIONS } from "../../config/homeWidgets";
import { useLang } from "../../i18n/LangContext";

/** 4-bo'lim: hudud tanlovi (Respublika + 14 hudud). Mahalliy `select` — klaviatura va ekran o'quvchida qidiruv ichida bor. */
export default function RegionSelect({ value, onChange, compact = false }: { value: string; onChange: (soato: string) => void; compact?: boolean }) {
  const { t } = useLang();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-mg-muted">
      {!compact && <span>{t({ uz: "Hudud", ru: "Регион" })}:</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={t({ uz: "Hudud", ru: "Регион" })}
        className={`rounded-lg border border-mg-border bg-mg-surface text-sm font-medium text-mg-text ${compact ? "max-w-[140px] px-2 py-1" : "px-3 py-2"}`}>
        {HOME_REGIONS.map((r) => <option key={r.soato} value={r.soato}>{t(r)}</option>)}
      </select>
    </label>
  );
}
