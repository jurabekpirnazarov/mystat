import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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

function Section({ id, title, link, children, badge }: { id: string; title: string; link?: boolean; children: ReactNode; badge?: ReactNode }) {
  const { t } = useLang();
  return (
    <section aria-labelledby={id} className="mt-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={id} className="flex items-center gap-3 text-[24.5px] font-semibold leading-9 text-mg-heading">{title}{badge}</h2>
        {link && (
          <Link to="/spheres" className="inline-flex items-center gap-2 text-sm font-medium text-mg-heading hover:text-mg-primary">
            {t(UI.allServices)} <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * MG-05: bosh sahifa my.gov.uz tartibida (MG-00 da o'lchangan jonli tuzilma): hero (salom, qidiruv, ommabop plitkalar) →
 * shaxsiy bloklar → Sohalar → Hayotiy vaziyatlar → Portal imkoniyatlari → Raqamlarda → Ommabop xizmatlar.
 * Fikr vidjeti va footer — MainLayout'da. 1-etapdagi statistik bloklar (banner, "O'zbekiston raqamlarda") `/statistics` da (MG-13).
 */
export default function HomePage() {
  const { t } = useLang();
  const { items: stats, isSample } = useServiceStats();
  useEffect(() => {
    document.title = `my.stat.uz — ${t(UI.portalLine2)}`;
  }, [t]);

  return (
    <div>
      <HomeHero showTiles={false} />
      <HomeDashboard className="mt-10" showCards={false} />
      <div className="mt-9"><PersonalBlocks /></div>
      <Section id="home-spheres" title={t(UI.spheres)} link><SpheresGrid /></Section>
      <Section id="home-situations" title={t(UI.situations)}>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {SITUATIONS.map((s) => <SituationCard key={s.slug} slug={s.slug} />)}
        </div>
      </Section>
      <Section id="home-features" title={t(UI.portalFeatures)}><PortalFeatures /></Section>
      <div className="mt-10"><PortalNumbers /></div>
      <Section id="home-popular" title={t(UI.popular)} link badge={<DemoBadge show={isSample} />}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {POPULAR.slice(0, 6).map((s) => <ServiceCard key={s.number} s={s} stats={stats[s.number]} />)}
        </div>
      </Section>
    </div>
  );
}
