import { Facebook, Instagram, Send, Youtube } from "lucide-react";
import { Logo } from "../Logo";
import { NAV_GROUPS } from "./nav";

/** Footer = sayt xaritasi: birinchi ikki ustun yon menyudan (nav.ts) olinadi, qolganlari qo'lda. */
const EXTRA = [
  { title: "Foydalanuvchilar uchun", links: ["Jismoniy shaxs", "Yuridik shaxs", "Tadqiqotchilar", "Yo'riqnomalar"] },
  { title: "Aloqa", links: ["Bog'lanish", "Qayta aloqa", "+998 71 200-00-00", "Shikoyatlar"] },
];
const SOCIAL = [{ label: "YouTube", icon: Youtube }, { label: "Facebook", icon: Facebook }, { label: "Instagram", icon: Instagram }, { label: "Telegram", icon: Send }];
const LEGAL = ["Maxfiylik siyosati", "Foydalanish shartlari", "Sayt xaritasi"];

export default function Footer() {
  const link = "text-[14.4px] leading-[21.6px] text-mg-muted hover:text-mg-heading hover:underline";
  const columns = [
    ...NAV_GROUPS.map((g) => ({ title: g.label, links: g.items.map((i) => i.label) })),
    ...EXTRA,
  ];
  return (
    <footer className="pb-8 pt-4">
      <a href="#" aria-label="Bosh sahifa" className="inline-block"><Logo /></a>
      <p className="mt-4 max-w-xl text-lg font-medium leading-snug text-mg-heading">Tashkilotning to'liq nomi yagona onlayn portali</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((c) => (
          <details key={c.title} open className="group sm:[&>summary]:pointer-events-none">
            <summary className="mb-2.5 cursor-pointer list-none text-[14.5px] font-bold text-mg-heading">{c.title}</summary>
            <ul className="space-y-1">{c.links.map((l) => <li key={l}><a href="#" className={link}>{l}</a></li>)}</ul>
          </details>
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-4 border-t border-mg-border pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          {SOCIAL.map(({ label, icon: Icon }) => (
            <a key={label} href="#" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--ds-panel))] text-[rgb(var(--ds-on-panel-muted))] hover:bg-[rgb(var(--ds-brand))] hover:text-white">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </a>
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">{LEGAL.map((l) => <li key={l}><a href="#" className={`${link} text-sm`}>{l}</a></li>)}</ul>
      </div>
    </footer>
  );
}
