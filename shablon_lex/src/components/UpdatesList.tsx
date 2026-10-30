import { BadgeCheck, FileSpreadsheet, FileText } from "lucide-react";

/** Raqamlangan yangiliklar ro'yxati: tartib raqami, ko'k "tasdiqlangan" belgi, sarlavha, kulrang manba nishoni, o'ngda fayl ikonkalari. */
const ITEMS = [
  { title: "Iste'mol narxlari indeksi bo'yicha oylik ma'lumot (oktyabr)", source: "Statistika agentligi, 24.10.2026 yilda e'lon qilingan", files: ["pdf", "xls"] },
  { title: "Aholining o'rtacha oylik ish haqi va bandlik ko'rsatkichlari (III chorak)", source: "Statistika agentligi, 22.10.2026 yilda e'lon qilingan", files: ["pdf", "xls"] },
  { title: "Tashqi savdo aylanmasi: mamlakatlar va tovar guruhlari bo'yicha (yanvar–sentyabr)", source: "Statistika agentligi, Bojxona qo'mitasi bilan, 20.10.2026", files: ["pdf"] },
  { title: "Doimiy aholi soni va hududlar kesimida o'sish sur'ati (1 oktyabr holatiga)", source: "Statistika agentligi, 18.10.2026 yilda e'lon qilingan", files: ["pdf", "xls"] },
  { title: "Sanoat ishlab chiqarish hajmi indeksi va asosiy tarmoqlar ulushi", source: "Statistika agentligi, 15.10.2026 yilda e'lon qilingan", files: ["xls"] },
];

export default function UpdatesList() {
  return (
    <section aria-labelledby="news-h" className="mx-auto max-w-[1296px] px-4 pb-14">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="news-h" className="text-[21px] font-bold uppercase text-lx-ink">Yangi e'lonlar</h2>
        <a href="#" className="text-[15px] text-lx-link hover:underline">Hammasini ko'rsatish</a>
      </div>
      <ol className="mt-4 border-t border-lx-line">
        {ITEMS.map((it, i) => (
          <li key={it.title} className="flex items-start gap-3 border-b border-lx-line py-4">
            <span className="w-6 shrink-0 pt-0.5 text-right text-[17px] tabular-nums text-lx-muted">{i + 1}</span>
            <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 fill-[#4D9BE6] text-white" aria-label="Tasdiqlangan" />
            <div className="min-w-0 flex-1">
              <a href="#" className="block text-[16px] leading-snug text-lx-ink hover:text-lx-blue">{it.title}</a>
              <span className="mt-2 inline-block rounded-full bg-lx-pill px-3 py-0.5 text-[12px] text-lx-muted">{it.source}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 pt-1">
              {it.files.includes("pdf") && <a href="#" aria-label="PDF yuklab olish" className="text-lx-blue hover:text-lx-blue-dark"><FileText className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" /></a>}
              {it.files.includes("xls") && <a href="#" aria-label="Excel yuklab olish" className="text-lx-blue hover:text-lx-blue-dark"><FileSpreadsheet className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" /></a>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
