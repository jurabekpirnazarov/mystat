import { HOME_REGIONS } from "../../config/homeWidgets";
import { useLang } from "../../i18n/LangContext";

/** 4-bo'lim: hudud tanlovi (Respublika + 14 hudud). Mahalliy `select` — klaviatura va ekran o'quvchida qidiruv ichida bor. */
export default function RegionSelect({ value, onChange }: { value: string; onChange: (soato: string) => void }) {
  const { t } = useLang();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-mg-muted">
      <span>{t({ uz: "Hudud", ru: "Регион" })}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={t({ uz: "Hudud", ru: "Регион" })}
        className="rounded-lg border border-mg-border bg-mg-surface px-3 py-2 text-sm font-medium text-mg-text">
        {HOME_REGIONS.map((r) => <option key={r.soato} value={r.soato}>{t(r)}</option>)}
      </select>
    </label>
  );
}
