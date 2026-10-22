import { AlertTriangle } from "lucide-react";

/** Ma'lumoti to'liq bo'lmagan yillar bilan taqqoslangan o'zgarish foizlari ishonchsiz — foydalanuvchi bilishi kerak. */
export default function DataQualityNote({ notes }: { notes?: string[] }) {
  const unique = [...new Set(notes ?? [])];
  if (!unique.length) return null;
  return (
    <div role="note" className="flex gap-2 rounded-mg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Ma'lumot sifati haqida</p>
        <ul className="mt-0.5 list-disc pl-5">{unique.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="mt-1 text-xs">Bu yillar bilan solishtirilgan o'zgarish foizlari va dinamika ishonchsiz bo'lishi mumkin.</p>
      </div>
    </div>
  );
}
