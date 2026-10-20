import { useState, type RefObject } from "react";
import { Check, Code2, Copy, Image as ImageIcon, Link2, Quote } from "lucide-react";
import { exportElementToPng } from "../../utils/exportPdf";
import { citations, embedCode as buildEmbed } from "../../utils/statPublic";

/**
 * JAHON_TAJRIBASI JT-15: doimiy havola, "Saytingizga qo'yish" (iframe), iqtibos (APA / GOST) va PNG.
 * Havola joriy URL — filtrlar URL'da bo'lsa, ular ham saqlanadi.
 */
interface Props {
  title: string;
  /** Embed sahifasi uchun ko'rsatkich kaliti (`/embed/indicator/:key`). Berilmasa embed tugmasi chiqmaydi. */
  embedKey?: string;
  /** PNG uchun blok */
  targetRef?: RefObject<HTMLElement>;
  fileName?: string;
  /** Ma'lumot yili (iqtibosda) */
  year?: string;
  sample?: boolean;
  compact?: boolean;
}


type Panel = "embed" | "cite" | null;

export default function ShareBar({ title, embedKey, targetRef, fileName, year, sample, compact }: Props) {
  const [panel, setPanel] = useState<Panel>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const url = window.location.href;
  const cite = citations(title, url, year);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
    } catch {
      /* clipboard ruxsat yo'q — matn baribir ko'rinib turadi */
    }
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300";
  const active = "border-blue-400 text-blue-700 dark:text-blue-300";
  const CopyIcon = ({ id }: { id: string }) =>
    copied === id ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />;

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ulashish">
        <button type="button" className={btn} onClick={() => copy(url, "link")}>
          {copied === "link" ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Link2 className="w-3.5 h-3.5" aria-hidden="true" />}
          {copied === "link" ? "Nusxalandi" : compact ? "Havola" : "Havolani nusxalash"}
        </button>
        {embedKey && (
          <button type="button" className={`${btn} ${panel === "embed" ? active : ""}`} aria-expanded={panel === "embed"}
            onClick={() => setPanel(panel === "embed" ? null : "embed")}>
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" /> {compact ? "Embed" : "Saytga qo'yish"}
          </button>
        )}
        <button type="button" className={`${btn} ${panel === "cite" ? active : ""}`} aria-expanded={panel === "cite"}
          onClick={() => setPanel(panel === "cite" ? null : "cite")}>
          <Quote className="w-3.5 h-3.5" aria-hidden="true" /> Iqtibos
        </button>
        {targetRef && (
          <button type="button" className={btn}
            onClick={() => targetRef.current && exportElementToPng(targetRef.current, fileName || "mystat.png", sample)}>
            <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" /> PNG
          </button>
        )}
      </div>

      {panel === "embed" && embedKey && (
        <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 text-xs">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Kodni saytingiz yoki maqolangizga qo'ying: grafik har doim oxirgi ma'lumot bilan ko'rinadi va manbaga havola beradi.
          </p>
          <div className="flex gap-2 items-start">
            <code className="flex-1 break-all rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 text-gray-800 dark:text-gray-100">
              {buildEmbed(window.location.origin, embedKey, title)}
            </code>
            <button type="button" className={btn} onClick={() => copy(buildEmbed(window.location.origin, embedKey, title), "embed")} aria-label="Embed kodini nusxalash">
              <CopyIcon id="embed" />
            </button>
          </div>
        </div>
      )}

      {panel === "cite" && (
        <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 text-xs space-y-2">
          {(["apa", "gost"] as const).map((k) => (
            <div key={k} className="flex gap-2 items-start">
              <span className="w-10 shrink-0 font-semibold text-gray-500 uppercase pt-2">{k}</span>
              <p className="flex-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 text-gray-800 dark:text-gray-100 break-words">
                {cite[k]}
              </p>
              <button type="button" className={btn} onClick={() => copy(cite[k], k)} aria-label={`${k.toUpperCase()} iqtibosini nusxalash`}>
                <CopyIcon id={k} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
