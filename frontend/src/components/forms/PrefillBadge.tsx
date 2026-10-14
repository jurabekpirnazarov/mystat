import type { PrefillField, PrefillSource } from "../../hooks/usePrefill";

const LABEL: Record<PrefillSource, string> = {
  profile: "Profildan",
  organization: "Korxona profilidan",
  registry: "Davlat reyestridan",
  ktut: "KTUT bazasidan",
  industry: "Sanoat reyestridan",
  last_order: "Oxirgi buyurtmadan",
};

const date = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

/** K-01: avtomatik to'ldirilgan maydon yonidagi manba belgisi. */
export default function PrefillBadge({ field, edited }: { field?: PrefillField; edited?: boolean }) {
  if (edited) {
    return (
      <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        Tahrirlangan
      </span>
    );
  }
  if (!field) return null;
  const title = `${LABEL[field.source]}${field.fetched_at ? `, ${date(field.fetched_at)}` : ""}`;
  return (
    <span
      title={title}
      aria-label={`Avtomatik to'ldirildi: ${title}`}
      className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    >
      {LABEL[field.source]}
    </span>
  );
}
