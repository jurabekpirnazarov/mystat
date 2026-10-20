import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ClipboardList, Factory, FileBadge, Info } from "lucide-react";
import { fetchCompanyCard, type CardBadge, type CardDiscipline, type CardPassport, type CardProduction, type CompanyCard } from "../../api/companyCard";

/** IHAMKOR_MUQOBIL.md IH-01..IH-04: kontragent kartasi bloklari. Har blok pastida manba yoziladi. */

const TONE: Record<CardBadge["tone"], string> = {
  good: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
  info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
  warn: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
};
const TONE_ICON = { good: CheckCircle2, info: Info, warn: AlertTriangle };

export function Block({ title, icon: Icon, source, children, aside }: {
  title: string; icon: typeof Info; source?: string | null; children: React.ReactNode; aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />{title}
        </h2>
        {aside}
      </div>
      {children}
      {source && <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">Manba: {source}</p>}
    </section>
  );
}

export function CardBadges({ badges }: { badges: CardBadge[] }) {
  if (!badges.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Xulosa belgilari">
      {badges.map((b) => {
        const Icon = TONE_ICON[b.tone];
        return (
          <li key={b.code} title={[b.hint, `Manba: ${b.source}`].filter(Boolean).join("\n")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${TONE[b.tone]}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />{b.text}
          </li>
        );
      })}
    </ul>
  );
}

export function PassportBlock({ p }: { p: CardPassport }) {
  const rows: [string, string | null][] = [
    ["Nomi", p.name], ["STIR", p.stir], ["OKPO", p.okpo], ["Tashkiliy-huquqiy shakl", p.legal_form],
    ["Hudud", [p.region, p.district].filter(Boolean).join(", ") || null], ["Manzil", p.address],
  ];
  return (
    <Block title="Pasport" icon={FileBadge} source={[p.sources.requisites, p.sources.address].filter((s, i, a) => s && a.indexOf(s) === i).join("; ")}
      aside={p.as_of ? <span className="text-xs text-gray-500">holat: {p.as_of}</span> : undefined}>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-gray-500">{k}</dt>
            <dd className={`break-words ${v ? "text-gray-900 dark:text-gray-100" : "italic text-gray-400"}`}>{v || "Manbada yo'q"}</dd>
          </div>
        ))}
      </dl>
      {p.missing.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">Portaldagi manbalarda yo'q: {p.missing.join(", ").toLowerCase()}.</p>
      )}
    </Block>
  );
}

export function DisciplineBlock({ d }: { d: CardDiscipline }) {
  const [all, setAll] = useState(false);
  const forms = all ? d.forms : d.forms.slice(0, 5);
  return (
    <Block title="Statistik hisobotlar" icon={ClipboardList} source={d.source}>
      {!d.available ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">{d.note}</p>
      ) : d.reports_count === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Korxonaga majburiy statistik hisobot biriktirilmagan.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="font-semibold text-gray-900 dark:text-white">{d.reports_count} ta majburiy shakl</span>
            {Object.entries(d.by_periodicity).map(([k, n]) => (
              <span key={k} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">{k}: {n}</span>
            ))}
          </div>
          <ul className="mt-3 divide-y divide-gray-100 text-sm dark:divide-gray-700">
            {forms.map((f) => (
              <li key={f.id} className="py-2">
                <span className="font-medium text-gray-900 dark:text-white">{f.form}</span>
                <span className="block text-xs text-gray-500">{f.title}{f.deadline_rule ? ` · ${f.deadline_rule}` : ""}</span>
              </li>
            ))}
          </ul>
          {d.forms.length > 5 && (
            <button type="button" onClick={() => setAll(!all)} className="mt-1 text-xs font-medium text-blue-600 hover:underline">
              {all ? "Qisqartirish" : `Hammasini ko'rsatish (${d.forms.length})`}
            </button>
          )}
          {d.timely_note && <p className="mt-3 text-xs text-gray-500">{d.timely_note}</p>}
        </>
      )}
    </Block>
  );
}

export function ProductionBlock({ p }: { p: CardProduction }) {
  const [all, setAll] = useState(false);
  if (!p.available) {
    return (
      <Block title="Ishlab chiqarish" icon={Factory} source={p.source}>
        <p className="text-sm text-gray-600 dark:text-gray-300">Sanoat mahsulotlari reyestrida bu korxona yo'q.</p>
      </Block>
    );
  }
  const items = all ? p.products : p.products.slice(0, 6);
  return (
    <Block title={`Ishlab chiqarish · ${p.products_count} mahsulot turi`} icon={Factory} source={p.source}
      aside={p.as_of ? <span className="text-xs text-gray-500">holat: {p.as_of}</span> : undefined}>
      {p.categories.length > 0 && (
        <p className="mb-3 text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium text-gray-800 dark:text-gray-100">Asosiy yo'nalishlar: </span>
          {p.categories.slice(0, 3).map((c) => `${c.name} (${c.count})`).join("; ")}
          {p.categories.length > 3 && <span className="text-gray-500"> va yana {p.categories.length - 3} yo'nalish</span>}
        </p>
      )}
      <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-700">
        {items.map((x) => (
          <li key={x.code} className="flex gap-3 py-1.5">
            <span className="w-24 shrink-0 font-mono text-xs text-gray-500">{x.code}</span>
            <span className="text-gray-800 dark:text-gray-100">{x.name}</span>
          </li>
        ))}
      </ul>
      {p.products.length > 6 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-1 text-xs font-medium text-blue-600 hover:underline">
          {all ? "Qisqartirish" : `Hammasini ko'rsatish (${p.products.length})`}
        </button>
      )}
    </Block>
  );
}

/** IH-04: rasmiy ma'lumotnoma (JT-04) ga o'tish. */
export function CertificateLink({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
      <FileBadge className="h-4 w-4 text-blue-600" aria-hidden="true" />Rasmiy ma'lumotnoma (PDF, QR bilan tekshiriladi)
    </Link>
  );
}

/** Korxona profilining "Umumiy ma'lumot" yorlig'i uchun: kartaning real-manba bloklari (ball profilning o'zida). */
export function ProfileCardExtras({ stir }: { stir: string }) {
  const [card, setCard] = useState<CompanyCard | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetchCompanyCard(stir, ctrl.signal).then(setCard).catch(() => { /* karta ixtiyoriy: xatoda profil o'zicha ishlayveradi */ });
    return () => ctrl.abort();
  }, [stir]);
  if (!card) return null;
  return (
    <div className="space-y-4">
      <CardBadges badges={card.badges} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DisciplineBlock d={card.discipline} />
        <ProductionBlock p={card.production} />
      </div>
      <CertificateLink to={card.links.certificate} />
    </div>
  );
}
