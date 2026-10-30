import { useEffect, type ReactNode } from "react";
import { BadgeCheck, CalendarDays, LineChart } from "lucide-react";
import { POPULAR } from "../config/serviceCatalog";
import { SITUATIONS } from "../config/situations";
import { useLang } from "../i18n/LangContext";
import { UI } from "../i18n/ui";
import HomeHero from "../components/home/HomeHero";
import HomeDashboard from "../components/home/HomeDashboard";
import PersonalBlocks from "../components/home/PersonalBlocks";
import SpheresGrid from "../components/home/SpheresGrid";
import { PortalFeatures, PortalNumbers } from "../components/home/PortalBlocks";
import ServiceCard from "../components/catalog/ServiceCard";
import SituationCard from "../components/catalog/SituationCard";
import { useServiceStats } from "../components/catalog/useServiceStats";
import DemoBadge from "../components/ui/DemoBadge";
import { ActionCard, ExternalLink, SectionHeader } from "../components/ui";
import HomePageV2 from "./HomePageV2";

function Section({ id, title, link, children, badge }: { id: string; title: string; link?: boolean; children: ReactNode; badge?: ReactNode }) {
  const { t } = useLang();
  return (
    <section aria-labelledby={id} className="mt-10">
      <SectionHeader id={id} title={title} badge={badge} moreHref={link ? "/spheres" : undefined} moreLabel={link ? t(UI.allServices) : undefined} />
      {children}
    </section>
  );
}

/** GV-09: foydali havolalar (matnli, logosiz). */
const USEFUL_LINKS = [
  { href: "https://stat.uz", label: "stat.uz: rasmiy sayt" },
  { href: "https://my.gov.uz", label: "my.gov.uz: davlat xizmatlari" },
  { href: "https://lex.uz", label: "lex.uz: qonun hujjatlari" },
  { href: "https://data.egov.uz", label: "data.egov.uz: ochiq ma'lumotlar" },
  { href: "https://id.egov.uz", label: "OneID: yagona identifikatsiya" },
];

/**
 * MG-05: bosh sahifa my.gov.uz tartibida (MG-00 da o'lchangan jonli tuzilma): hero (salom, qidiruv, ommabop plitkalar) →
 * shaxsiy bloklar → Sohalar → Hayotiy vaziyatlar → Portal imkoniyatlari → Raqamlarda → Ommabop xizmatlar.
 * Fikr vidjeti va footer — MainLayout'da. 1-etapdagi statistik bloklar (banner, "O'zbekiston raqamlarda") `/statistics` da (MG-13).
 */
/** UI_QAYTA_TUZISH.md H10: bosh sahifa v3 `VITE_PUBLIC_V2=1` bayrog'i ichida. */
export default function HomePage() {
  return import.meta.env.VITE_PUBLIC_V2 === "1" ? <HomePageV2 /> : <LegacyHomePage />;
}

function LegacyHomePage() {
  const { t } = useLang();
  const { items: stats, isSample } = useServiceStats();
  useEffect(() => {
    document.title = `my.stat.uz — ${t(UI.portalLine2)}`;
  }, [t]);

  return (
    <div>
      <HomeHero showTiles={false} />
      <section aria-labelledby="home-actions" className="mt-10">
        <SectionHeader id="home-actions" title="Nima qilmoqchisiz?" />
        <div className="grid gap-5 md:grid-cols-3">
          <ActionCard icon={CalendarDays} title="Hisobot muddati" text="Shaklingiz bo'yicha topshirish muddatini va qolgan kunlarni biling." actionLabel="Kalendarni ochish" href="/report-calendar" />
          <ActionCard icon={LineChart} title="Ko'rsatkich topish" text="Iqtisodiyot, aholi, mehnat va narxlar bo'yicha rasmiy raqamlar." actionLabel="Ko'rsatkichlarga o'tish" href="/dashboards" />
          <ActionCard icon={BadgeCheck} title="Kontragent tekshirish" text="STIR bo'yicha korxona ma'lumoti va ishonchlilik bahosi." actionLabel="STIR bo'yicha izlash" href="/check" />
        </div>
      </section>
      <Section id="home-popular" title={t(UI.popular)} link badge={<DemoBadge show={isSample} />}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {POPULAR.slice(0, 6).map((s) => <ServiceCard key={s.number} s={s} stats={stats[s.number]} />)}
        </div>
      </Section>
      <div className="mt-9"><PersonalBlocks /></div>
      <Section id="home-situations" title={t(UI.situations)}>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {SITUATIONS.map((s) => <SituationCard key={s.slug} slug={s.slug} />)}
        </div>
      </Section>
      <Section id="home-features" title={t(UI.portalFeatures)}><PortalFeatures /></Section>
      <div className="mt-10"><PortalNumbers /></div>
      <Section id="home-spheres" title={t(UI.spheres)} link><SpheresGrid /></Section>
      <section aria-labelledby="home-links" className="mt-10">
        <SectionHeader id="home-links" title="Foydali havolalar" />
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          {USEFUL_LINKS.map((l) => <li key={l.href}><ExternalLink href={l.href}>{l.label}</ExternalLink></li>)}
        </ul>
      </section>
      <HomeDashboard className="mt-10" showCards={false} showControls={false} />
    </div>
  );
}
