import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone, Send, Youtube } from "lucide-react";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { CONTACT } from "../../config/serviceCatalog";
import { FOOTER_LINKS, SOCIALS } from "../../config/publicMenu";

const ICONS = { telegram: Send, facebook: Facebook, instagram: Instagram, youtube: Youtube } as const;

/** LX-12: ixcham footer, 3 qator. To'liq sayt xaritasi `/sitemap` da (footer xarita emas). */
export default function PublicFooter() {
  const { t } = useLang();
  const link = "text-sm text-mg-muted hover:text-mg-heading hover:underline";
  return (
    <footer className="mt-10 border-t border-mg-border bg-mg-surface">
      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {FOOTER_LINKS.map((l) => <li key={l.to}><Link to={l.to} className={link}>{t(l.label)}</Link></li>)}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ul className="flex items-center gap-2">
            {SOCIALS.map((s) => {
              const Icon = ICONS[s.key];
              return (
                <li key={s.key}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--ds-panel))] text-[rgb(var(--ds-on-panel-muted))] hover:bg-[rgb(var(--ds-brand))] hover:text-white">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-mg-text">
            <a href={CONTACT.phoneHref} className="inline-flex items-center gap-1.5 hover:underline"><Phone className="h-4 w-4" aria-hidden="true" />{CONTACT.phone}</a>
            <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-1.5 hover:underline"><Mail className="h-4 w-4" aria-hidden="true" />{CONTACT.email}</a>
          </div>
        </div>
        <p className="border-t border-mg-border pt-4 text-xs text-mg-muted">
          © {new Date().getFullYear()} {t(UI.portalLine1)} · {t(UI.typoHint)}
        </p>
      </div>
    </footer>
  );
}
