import { Link } from "react-router-dom";
import { ExternalLink, Facebook, Instagram, Send, Youtube } from "lucide-react";
import uzstat from "../../img/stat.png";
import { Logo } from "../brand/Logo";
import { CONTACT } from "../../config/serviceCatalog";
import { useLang, type I18nText } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { NAV_GROUPS } from "../../config/navigation";

type FooterLink = { label: I18nText; to?: string; href?: string };

/**
 * GV-07: footer = sayt xaritasi. Birinchi ikki ustun yon menyudan (`config/navigation.ts`) olinadi, shuning uchun
 * menyuga band qo'shilsa footerda ham chiqadi. Qolgan ikki ustun: foydalanuvchilar va aloqa.
 */
const fromNav = (id: string): FooterLink[] =>
  (NAV_GROUPS.find((g) => g.id === id)?.items ?? []).map((i) => ({ label: i.label, to: i.to }));

const COLUMNS: { title: I18nText; links: FooterLink[] }[] = [
  { title: UI.groupServices, links: fromNav("services") },
  { title: UI.groupHelp, links: fromNav("help") },
  {
    title: UI.footerUsers,
    links: [
      { label: UI.forIndividuals, to: "/citizens" },
      { label: UI.forLegal, to: "/spheres/1" },
      { label: UI.forResearchers, to: "/developers" },
      { label: UI.instructions, to: "/reports" },
      { label: UI.statistics, to: "/statistics" },
    ],
  },
  {
    title: UI.footerSupport,
    links: [
      { label: UI.contact, to: "/contact" },
      { label: UI.feedbackLink, to: "/contact" },
      { label: { uz: `${CONTACT.phone} — ${UI.hotline.uz}`, ru: `${CONTACT.phone} — ${UI.hotline.ru}` }, href: CONTACT.phoneHref },
      { label: UI.complaints, to: "/contact" },
      { label: UI.anticor, href: "https://eanticor.uz/uz" },
    ],
  },
];

const SOCIAL = [
  { href: "https://www.youtube.com/channel/UCiMwrLl7Cq_NrUv1L5ubNkw", label: "YouTube", icon: Youtube },
  { href: "https://www.facebook.com/uzstataxborot", label: "Facebook", icon: Facebook },
  { href: "https://www.instagram.com/uzstataxborot", label: "Instagram", icon: Instagram },
  { href: "https://t.me/uzstataxborot", label: "Telegram", icon: Send },
];

const LEGAL: FooterLink[] = [
  { label: UI.privacy, to: "/privacy" },
  { label: UI.terms, to: "/terms" },
  { label: UI.sitemap, to: "/sitemap" },
  { label: UI.aiUsage, to: "/ai-usage" },
];

function FLink({ l, className }: { l: FooterLink; className: string }) {
  const { t } = useLang();
  if (l.href) {
    const external = l.href.startsWith("http");
    return (
      <a href={l.href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {t(l.label)}{external && <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" />}
      </a>
    );
  }
  return <Link to={l.to!} className={className}>{t(l.label)}</Link>;
}

export default function Footer() {
  const { t } = useLang();
  const link = "text-[14.4px] leading-[21.6px] text-mg-muted hover:text-mg-heading hover:underline";
  return (
    <footer className="pb-8 pt-4">
      <Link to="/" aria-label={t(UI.home)}><Logo size={48} org /></Link>
      <p className="mt-4 max-w-xl text-lg font-medium leading-snug text-mg-heading">{t(UI.portalFull)}</p>
      <p className="mt-3 max-w-xl text-xs font-medium text-mg-heading">{t(UI.typoHint)}</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((c) => (
          <details key={t(c.title)} open className="group sm:[&>summary]:pointer-events-none">
            {/* GV-07: har ustun alohida nav, mobilda yig'iladi */}
            <summary className="mb-2.5 cursor-pointer list-none text-[14.5px] font-bold text-mg-heading">{t(c.title)}</summary>
            <ul className="space-y-1">
              {c.links.map((l) => <li key={t(l.label)}><FLink l={l} className={link} /></li>)}
            </ul>
          </details>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-mg-border pt-6 lg:flex-row lg:items-center lg:justify-between lg:pr-20">
        <div className="flex items-center gap-3">
          {SOCIAL.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--ds-panel))] text-[rgb(var(--ds-on-panel-muted))] hover:bg-[rgb(var(--ds-brand))] hover:text-white">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </a>
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {LEGAL.map((l) => <li key={t(l.label)}><FLink l={l} className={`${link} text-sm`} /></li>)}
        </ul>
        {/* Qo'mitaning rasmiy emblemi — my.gov.uz footer'idagi hamkor logolari o'rnida */}
        <a href="https://stat.uz/uz/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-mg-text">
          <img src={uzstat} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          stat.uz <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
