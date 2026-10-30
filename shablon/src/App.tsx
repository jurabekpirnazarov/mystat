import { BadgeCheck, Building2, CalendarDays, Calculator, LineChart, Map as MapIcon, Users, Wallet } from "lucide-react";
import Shell from "./components/layout/Shell";
import { ActionCard, EmptyState, ExternalLink, PageHeader, SectionHeader, ServiceCard, StatCard } from "./components/ui";

/** Namunaviy bosh sahifa: shablon komponentlari qanday birga ishlashini ko'rsatadi. Matnlar o'rnini bosuvchi. */
const SERVICES = [
  { icon: Building2, title: "Korxona haqida ma'lumot", meta: "4.3 · 1 daqiqa" },
  { icon: BadgeCheck, title: "Kontragentni tekshirish", meta: "4.4 · 1 daqiqa" },
  { icon: CalendarDays, title: "Hisobot kalendari", meta: "4.4 · Darhol" },
  { icon: Calculator, title: "Kalkulyator", meta: "4.6 · Darhol" },
  { icon: Wallet, title: "Maosh ko'rsatkichlari", meta: "4.5 · Darhol" },
  { icon: MapIcon, title: "Hududlar xaritasi", meta: "4.4 · Darhol" },
];

export default function App() {
  return (
    <Shell>
      <section aria-labelledby="hero" className="rounded-mg border border-[rgb(var(--ds-panel-line))] bg-[rgb(var(--ds-panel))] p-6 sm:p-8">
        <h1 id="hero" className="max-w-2xl text-[32px] font-semibold leading-10 text-[rgb(var(--ds-on-panel))]">Hisobot, raqam va xizmat bir oynada</h1>
        <p className="mt-2 max-w-2xl text-[rgb(var(--ds-on-panel-muted))]">Qisqa tavsif: portal nima beradi va kim uchun. Har bir raqamda manba va davr ko'rsatiladi.</p>
        <label className="mt-5 flex max-w-xl items-center rounded-full border border-mg-border bg-mg-surface px-4">
          <span className="sr-only">Qidiruv</span>
          <input type="search" placeholder="Xizmat yoki ko'rsatkich izlash" className="h-12 w-full bg-transparent text-mg-text outline-none placeholder:text-mg-muted" />
        </label>
      </section>

      <section aria-labelledby="actions" className="mt-10">
        <SectionHeader id="actions" title="Nima qilmoqchisiz?" />
        <div className="grid gap-5 md:grid-cols-3">
          <ActionCard icon={CalendarDays} title="Muddatni bilish" text="Shakl bo'yicha topshirish muddati va qolgan kunlar." actionLabel="Kalendarni ochish" href="#" />
          <ActionCard icon={LineChart} title="Ko'rsatkich topish" text="Rasmiy raqamlar, hududlar va davrlar kesimida." actionLabel="Ko'rsatkichlarga o'tish" href="#" />
          <ActionCard icon={BadgeCheck} title="Tekshirish" text="STIR bo'yicha ma'lumot va ishonchlilik bahosi." actionLabel="STIR bo'yicha izlash" href="#" />
        </div>
      </section>

      <section aria-labelledby="services" className="mt-10">
        <SectionHeader id="services" title="Ommabop xizmatlar" moreHref="#" moreLabel="Barcha xizmatlar" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {SERVICES.map((s, i) => <ServiceCard key={s.title} icon={s.icon} title={s.title} number={101 + i} meta={s.meta} />)}
        </div>
      </section>

      <section aria-labelledby="stats" className="mt-10">
        <SectionHeader id="stats" title="Raqamlarda" description="Manba: namunaviy ma'lumot, 2026" moreHref="#" moreLabel="Barcha ko'rsatkichlar" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Aholi soni" value="38,24 mln" icon={Users} change={1.8} hint="2026" />
          <StatCard label="Ishsizlik darajasi" value="4,8 %" icon={LineChart} change={-0.7} hint="2025" />
          <StatCard label="O'rtacha oylik ish haqi" value="5 179 326" icon={Wallet} change={17.6} hint="so'm, 2025" />
          <StatCard label="Korxonalar soni" value="650 213" icon={Building2} hint="1-yanvar holatiga" />
        </div>
      </section>

      <section aria-labelledby="empty" className="mt-10">
        <SectionHeader id="empty" title="Bo'sh holat" />
        <div className="rounded-mg border border-mg-border bg-mg-surface">
          <EmptyState title="Yozuvlar yo'q" description="Ma'lumot paydo bo'lgach shu yerda ko'rinadi." />
        </div>
      </section>

      <section aria-labelledby="links" className="mt-10">
        <SectionHeader id="links" title="Foydali havolalar" />
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          {["stat.uz", "my.gov.uz", "lex.uz", "data.egov.uz"].map((d) => <li key={d}><ExternalLink href={`https://${d}`}>{d}</ExternalLink></li>)}
        </ul>
      </section>

      <div className="mt-10"><PageHeader title="Sahifa sarlavhasi" description="Ichki sahifalar sarlavhasi shu ko'rinishda" /></div>
    </Shell>
  );
}
