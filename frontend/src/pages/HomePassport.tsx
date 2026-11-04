import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Bot, Clock, Layers, Search, Sparkles, Star, Wallet } from "lucide-react";
import { POPULAR, SERVICES, type Access, type ServiceCatalogItem } from "../config/serviceCatalog";
import { SPHERES, sphereById } from "../config/spheres";
import { POPULAR_QUERIES, searchUrl } from "../config/searchFilters";
import { SITUATIONS } from "../config/situations";
import { useLang, type I18nText } from "../i18n/LangContext";
import { UI } from "../i18n/ui";
import { compactNumber, useServiceStats } from "../components/catalog/useServiceStats";
import type { ServiceShortStats } from "../api/portal";
import HeroChat from "../components/home/HeroChat";

/**
 * "Shaffof xizmat pasporti" (Variant P) bosh sahifasi. Hamma xizmat `serviceCatalog.ts` dan o'qiladi (takroriy ro'yxat yo'q):
 * hero → xizmat pasporti slayderi (6 ta ommabop) → eng ko'p foydalaniladigan 8 ta → barcha xizmatlar (soha tablari) →
 * hayotiy vaziyatlar va yordam bloki. Foydalanish soni va baho `/portal/services/stats/` dan; namuna bo'lsa "namuna" deb belgilanadi.
 */
const ACCESS_SHORT: Record<Access, I18nText> = {
  open: { uz: "Bepul", ru: "Бесплатно" },
  login: { uz: "Bepul", ru: "Бесплатно" },
  package: { uz: "Paket", ru: "Пакет" },
  priced: { uz: "Pullik", ru: "Платно" },
  credits: { uz: "Hamyondan", ru: "Из кошелька" },
};
const ACCESS_NOTE: Record<Access, I18nText> = {
  open: { uz: "kirishsiz", ru: "без входа" },
  login: { uz: "kirish orqali", ru: "после входа" },
  package: { uz: "tarif limitidan", ru: "из лимита тарифа" },
  priced: { uz: "alohida narx", ru: "отдельная цена" },
  credits: { uz: "StatCoin hamyonidan", ru: "из кошелька StatCoin" },
};
const USERS_NOTE: Record<ServiceCatalogItem["users"], I18nText> = {
  all: { uz: "hamma uchun", ru: "для всех" },
  legal: { uz: "yuridik shaxslar", ru: "юридические лица" },
  individual: { uz: "jismoniy shaxslar", ru: "физические лица" },
};

const cardLink = "pp-card block rounded-[20px] border border-transparent bg-[var(--pp-card)] text-[var(--pp-text)] hover:no-underline";

function Soon() {
  const { t } = useLang();
  return <span className="rounded-full border border-dashed border-amber-700 bg-amber-50 px-1.5 text-[10.5px] font-normal text-amber-800">{t(UI.soon)}</span>;
}

function Hero({ featured, stats, isSample }: { featured: ServiceCatalogItem[]; stats: Record<string, ServiceShortStats>; isSample: boolean }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [chat, setChat] = useState(false);

  useEffect(() => {
    if (hold || featured.length < 2) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % featured.length), 6000);
    return () => window.clearInterval(id);
  }, [hold, featured.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(searchUrl(q.trim()));
  };
  const s = featured[i];
  const st = s ? stats[s.number] : undefined;
  const fields = s ? [
    { k: t({ uz: "MUDDAT", ru: "СРОК" }), v: t(s.duration), n: t({ uz: "bajarish vaqti", ru: "время выполнения" }) },
    { k: t({ uz: "NARX", ru: "ЦЕНА" }), v: t(ACCESS_SHORT[s.access]), n: t(ACCESS_NOTE[s.access]) },
    { k: t({ uz: "USUL", ru: "СПОСОБ" }), v: s.actionType === "apply" ? t({ uz: "Ariza", ru: "Заявка" }) : t({ uz: "Onlayn", ru: "Онлайн" }), n: t(USERS_NOTE[s.users]) },
    { k: t({ uz: "SOHA", ru: "СФЕРА" }), v: String(sphereById(s.sphere)?.id ?? "").padStart(2, "0"), n: sphereById(s.sphere) ? t(sphereById(s.sphere)!.title) : "" },
    { k: t({ uz: "FOYDALANISH", ru: "ИСПОЛЬЗОВАНИЙ" }), v: st?.usage ? compactNumber(st.usage) : "—", n: t({ uz: "jami", ru: "всего" }) },
    { k: t({ uz: "BAHO", ru: "ОЦЕНКА" }), v: st?.rating != null ? `${st.rating.toFixed(1)} / 5` : "—", n: st?.ratings ? `${st.ratings} ${t({ uz: "baho", ru: "оценок" })}` : t({ uz: "baho yo'q", ru: "оценок нет" }) },
  ] : [];
  const Icon = s?.icon;

  return (
    <section role="search" aria-label={t({ uz: "Rasmiy statistika portali va qidiruv", ru: "Портал официальной статистики и поиск" })}
      className="pp-fu relative flex min-h-[clamp(560px,70vh,820px)] flex-col overflow-hidden rounded-[32px] p-6 text-white sm:p-10"
      style={{ background: "linear-gradient(135deg, var(--p800) 0%, var(--btn) 100%)" }}>
      <svg aria-hidden="true" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
        <circle cx="1080" cy="80" r="260" fill="#fff" opacity=".05" />
        <circle cx="1080" cy="80" r="380" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".08" />
        <circle cx="120" cy="720" r="320" fill="#fff" opacity=".04" />
        <circle cx="120" cy="720" r="440" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".06" />
      </svg>
      <div className="relative z-[1] flex flex-1 flex-wrap items-stretch gap-8">
        <div className="flex min-w-0 flex-[5_1_560px] flex-col justify-center gap-6">
          <span className="flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/15 px-3.5 py-[7px] text-[13px] font-semibold">
            <span className="h-[7px] w-[7px] rounded-full bg-[#5be37a]" />
            {SERVICES.length} {t({ uz: "ta davlat xizmati · onlayn", ru: "государственных услуг · онлайн" })}
          </span>
          <h1 className="m-0 max-w-[820px] text-[clamp(36px,5vw,58px)] font-extrabold leading-none tracking-[-0.045em]">
            {t({ uz: "Kerakli raqamni yozing — ", ru: "Введите нужную цифру — " })}
            <span className="text-[#ffe08a]">{t({ uz: "qolganini biz topamiz.", ru: "остальное найдём мы." })}</span>
          </h1>
          <p className="m-0 max-w-[620px] text-lg text-white/90">
            {t({ uz: "Hisobot topshirish, korxonani tekshirish, rasmiy ko'rsatkichlar — bitta qidiruvda, bir necha soniyada.", ru: "Сдача отчётов, проверка предприятия, официальные показатели — в одном поиске, за секунды." })}
          </p>
          <form onSubmit={submit} className="flex w-full gap-2 rounded-[20px] bg-white p-2 shadow-[0_22px_44px_-20px_rgba(0,0,0,0.55)]">
            <span aria-hidden="true" className="flex w-12 shrink-0 items-center justify-center text-[var(--btn)]"><Search className="h-[22px] w-[22px]" /></span>
            <label htmlFor="pp-q" className="sr-only">{t({ uz: "Xizmatlarni qidirish", ru: "Поиск услуг" })}</label>
            <input id="pp-q" type="search" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={t({ uz: "Masalan: hisobot topshirish, STIR bo'yicha tekshiruv, inflyatsiya", ru: "Например: сдача отчёта, проверка по ИНН, инфляция" })}
              className="h-[60px] min-w-0 flex-1 rounded-xl border-0 bg-transparent px-2 text-lg text-[#1b2530] outline-none placeholder:text-[#6b7885]" />
            <button type="submit" className="h-[60px] rounded-[14px] bg-[var(--btn)] px-6 text-base font-extrabold text-white hover:brightness-110 sm:px-8">{t({ uz: "Topish", ru: "Найти" })}</button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-white/85">{t({ uz: "Ko'p qidiriladi:", ru: "Часто ищут:" })}</span>
            {POPULAR_QUERIES.map((c) => (
              <Link key={c} to={searchUrl(c)} className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25 hover:no-underline">{c}</Link>
            ))}
          </div>
          <button type="button" onClick={() => setChat(true)} className="inline-flex h-12 items-center gap-2.5 self-start rounded-full bg-white/95 px-5 text-[15px] font-bold text-[var(--p800)] shadow-[0_14px_28px_-14px_rgba(0,0,0,0.5)] hover:bg-white">
            <Bot className="h-5 w-5" aria-hidden="true" />{t({ uz: "AI yordamchi bilan suhbat", ru: "Чат с ИИ-помощником" })}
          </button>
          <HeroChat open={chat} onClose={() => setChat(false)} />
        </div>

        {s && Icon && (
          <div onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}
            className="relative flex min-w-0 flex-[3_1_400px] flex-col gap-3.5 overflow-hidden rounded-3xl border border-white/30 bg-white/[0.13] p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]">
            <div key={s.number} className="pp-slide relative flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-xs font-bold tracking-[0.16em] text-white/80">{t({ uz: "XIZMAT PASPORTI", ru: "ПАСПОРТ УСЛУГИ" })} · № {s.number}</span>
                  <span className="text-[clamp(26px,2.4vw,36px)] font-extrabold leading-[1.04] tracking-[-0.035em]">{t(s.title)}</span>
                </div>
                <span aria-hidden="true" className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center">
                  <svg width="84" height="84" viewBox="0 0 74 74" className="absolute inset-0">
                    <circle cx="37" cy="37" r="34" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    <circle cx="37" cy="37" r="28" fill="none" stroke="currentColor" strokeWidth=".8" strokeDasharray="2 2.5" />
                    <circle cx="37" cy="37" r="22" fill="currentColor" fillOpacity=".14" />
                  </svg>
                  <Icon className="relative h-[34px] w-[34px]" strokeWidth={1.8} />
                </span>
              </div>
              <span className="line-clamp-3 max-w-[520px] text-[17px] font-semibold leading-snug">{t(s.description)}</span>
              <div className="mt-1 grid grid-cols-2 overflow-hidden rounded-xl border-l border-t border-white/25">
                {fields.map((f) => (
                  <span key={f.k} className="flex min-w-0 flex-col gap-1.5 border-b border-r border-white/25 bg-white/[0.06] px-4 py-3.5">
                    <span className="text-xs font-bold tracking-[0.12em] text-white/75">{f.k}</span>
                    <span className="truncate text-[22px] font-extrabold leading-[1.1] tracking-[-0.02em]">{f.v}</span>
                    <span className="truncate text-xs text-white/70">{f.n}</span>
                  </span>
                ))}
              </div>
              <span className="mono mt-auto flex items-center gap-2.5 pt-2 text-xs text-white/75">
                <span className="tracking-[0.06em]">STAT·UZ·{String(s.number).padStart(4, "0")}·{new Date().getFullYear()}</span>
                {isSample && <span>· {t({ uz: "namuna", ru: "образец" })}</span>}
              </span>
            </div>
            <div className="relative flex min-h-[52px] items-center gap-1.5 border-t border-dashed border-white/30 pt-3 pr-[190px]">
              {featured.map((f, n) => (
                <button key={f.number} type="button" onClick={() => { setI(n); setHold(true); }} aria-label={t(f.title)} aria-current={n === i}
                  className="h-2 rounded-full border-0 p-0 transition-all duration-300"
                  style={{ width: n === i ? 30 : 8, background: n === i ? "#fff" : "rgba(255,255,255,0.35)" }} />
              ))}
              <span className="mono ml-2 text-[11px] text-white/75">{i + 1} / {featured.length}</span>
            </div>
            <Link to={`/service/${s.number}`} className="absolute bottom-6 right-6 z-[2] flex h-[50px] items-center rounded-full bg-white px-6 text-base font-extrabold text-[var(--p800)] shadow-[0_14px_28px_-12px_rgba(0,0,0,0.45)] hover:no-underline">
              {t({ uz: "Foydalanish →", ru: "Использовать →" })}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function TopServices({ items, stats, isSample }: { items: ServiceCatalogItem[]; stats: Record<string, ServiceShortStats>; isSample: boolean }) {
  const { t } = useLang();
  const max = Math.max(1, ...items.map((s) => stats[s.number]?.usage ?? 0));
  const chip = "inline-flex items-center gap-1.5 rounded-full bg-[var(--pp-soft)] px-3 py-1 text-[13px] font-semibold";
  return (
    <section aria-labelledby="pp-top" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="pp-top" className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">{t({ uz: "Eng ko'p foydalaniladigan xizmatlar", ru: "Самые востребованные услуги" })}</h2>
          <span className="text-[15px] text-[var(--pp-muted)]">
            {t({ uz: "Foydalanuvchilar eng ko'p ochgan xizmatlar: reyting, narx va bajarish vaqti bilan.", ru: "Чаще всего открываемые услуги: рейтинг, цена и срок выполнения." })}
            {isSample ? ` ${t({ uz: "(demo ma'lumot)", ru: "(демо-данные)" })}` : ""}
          </span>
        </div>
        <Link to="/spheres" className="text-sm font-semibold">{t({ uz: "Barcha xizmatlar →", ru: "Все услуги →" })}</Link>
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
        {items.map((s, n) => {
          const Icon = s.icon;
          const st = stats[s.number];
          const use = st?.usage ?? 0;
          const sphere = sphereById(s.sphere);
          return (
            <Link key={s.number} to={`/service/${s.number}`} className={`${cardLink} pp-fu flex min-h-[300px] flex-col gap-4 border-[var(--pp-line)] p-6`}>
              <span className="flex items-start justify-between gap-3">
                <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--btn)] text-white shadow-[0_10px_22px_-10px_var(--btn)]"><Icon className="h-8 w-8" strokeWidth={1.8} /></span>
                <span className="flex flex-col items-end gap-1">
                  <span className="mono rounded-full bg-[var(--p50)] px-3 py-1 text-sm font-bold text-[var(--p800)]">#{n + 1}</span>
                  {sphere && <span className="max-w-[180px] truncate text-xs text-[var(--pp-muted)]">{t(sphere.title)}</span>}
                </span>
              </span>
              <span className="flex flex-col gap-2">
                <span className="flex flex-wrap items-center gap-2 text-[22px] font-extrabold leading-tight tracking-[-0.02em]">{t(s.title)}{s.status === "soon" && <Soon />}</span>
                <span className="line-clamp-3 text-[15px] leading-relaxed text-[var(--pp-muted)]">{t(s.description)}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span className={chip}><Clock className="h-4 w-4" aria-hidden="true" />{t(s.duration)}</span>
                <span className={chip}>{t(ACCESS_SHORT[s.access])} · {t(ACCESS_NOTE[s.access])}</span>
                {st?.rating != null && <span className={chip}><Star className="h-4 w-4 fill-current text-amber-500" aria-hidden="true" />{st.rating.toFixed(1)}</span>}
              </span>
              <span className="mt-auto flex flex-col gap-3">
                <span className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between text-[13px] text-[var(--pp-muted)]">
                    <span>{t({ uz: "Foydalanishlar soni", ru: "Количество использований" })}</span>
                    <span className="mono text-base font-bold text-[var(--pp-text)]">{use ? use.toLocaleString("ru-RU") : "—"}</span>
                  </span>
                  <span className="block h-2 overflow-hidden rounded-full bg-[var(--pp-soft)]"><span className="block h-full rounded-full bg-[var(--btn)]" style={{ width: `${use ? Math.max(6, (use / max) * 100) : 4}%` }} /></span>
                </span>
                <span className="flex h-12 items-center justify-center rounded-2xl bg-[var(--p50)] text-base font-extrabold text-[var(--p800)]">{t({ uz: "Xizmatdan foydalanish →", ru: "Перейти к услуге →" })}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** 0 dan qiymatgacha silliq sanaydi (harakat kamaytirilgan bo'lsa darhol ko'rsatadi). */
function useCountUp(target: number, ms = 700) {
  const [v, setV] = useState(target);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const MIX_LABEL: Record<Access, I18nText> = {
  open: { uz: "Kirishsiz", ru: "Без входа" },
  login: { uz: "Kirish bilan", ru: "После входа" },
  package: { uz: "Paket", ru: "Пакет" },
  priced: { uz: "Pullik", ru: "Платно" },
  credits: { uz: "Hamyondan", ru: "Из кошелька" },
};
const ACCESS_COLOR: Record<Access, string> = { open: "#1eb53a", login: "#33b6d1", package: "#0077a0", priced: "#f2b234", credits: "#e0408a" };

/** Halqa diagramma: har qism `v` ulushi, `c` rangi. */
function Ring({ parts, size = 84 }: { parts: { k: string; v: number; c: string }[]; size?: number }) {
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  const r = 15.9155;
  let off = 25;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--pp-soft)" strokeWidth="4.2" />
      {parts.filter((p) => p.v > 0).map((p) => {
        const len = (p.v / total) * 100;
        const dash = Math.max(0, len - 0.8);
        const el = <circle key={p.k} cx="18" cy="18" r={r} fill="none" stroke={p.c} strokeWidth="4.2" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={off} />;
        off -= len;
        return el;
      })}
    </svg>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block h-[18px] w-[18px]">
            <Star className="absolute inset-0 h-[18px] w-[18px] text-[var(--pp-line)]" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}><Star className="h-[18px] w-[18px] fill-amber-400 text-amber-400" /></span>
          </span>
        );
      })}
    </span>
  );
}

/** Tanlangan soha bo'yicha jonli ko'rsatkichlar: xizmatlar soni, tarif aralashmasi, foydalanish, baho. Hammasi katalog va statistikadan. */
function Kpis({ list, stats, isSample }: { list: ServiceCatalogItem[]; stats: Record<string, ServiceShortStats>; isSample: boolean }) {
  const { t } = useLang();
  const total = list.length;
  const free = list.filter((s) => s.access === "open" || s.access === "login").length;
  const usage = list.map((s) => stats[s.number]?.usage ?? 0);
  const uses = usage.reduce((a, b) => a + b, 0);
  const rated = list.map((s) => stats[s.number]?.rating).filter((r): r is number => r != null);
  const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0;
  const soon = list.filter((s) => s.status === "soon").length;
  const nTotal = useCountUp(total);
  const nUses = useCountUp(uses, 900);
  const nFree = useCountUp(total ? Math.round((free / total) * 100) : 0, 900);
  const mix = (Object.keys(ACCESS_COLOR) as Access[]).map((k) => ({ k, c: ACCESS_COLOR[k], v: list.filter((s) => s.access === k).length }));
  const bars = [...usage].sort((a, b) => b - a).slice(0, 14);
  const barMax = Math.max(1, ...bars);
  const tile = "relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-[26px] border border-[var(--pp-line)] bg-[var(--pp-card)] p-5 transition-shadow hover:shadow-[0_20px_40px_-24px_rgb(0_78_107/.45)]";
  const label = "flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--pp-muted)]";
  const chipIcon = "flex h-8 w-8 items-center justify-center rounded-[11px] bg-[var(--p50)] text-[var(--p800)]";
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={`${tile} text-white`} style={{ background: "linear-gradient(145deg, var(--p800) 0%, var(--btn) 70%, var(--pacc) 130%)", borderColor: "transparent" }}>
        <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-25">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#fff" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 6" />
          <circle cx="100" cy="100" r="34" fill="#fff" fillOpacity=".25" />
        </svg>
        <span className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-white/85"><Layers className="h-4 w-4" aria-hidden="true" />{t({ uz: "XIZMATLAR", ru: "УСЛУГ" })}</span>
        <span className="mono relative text-[68px] font-extrabold leading-none tracking-[-0.05em]">{nTotal}</span>
        <span className="relative inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold">
          <span className="h-2 w-2 rounded-full bg-[#5be37a]" aria-hidden="true" />
          {soon ? t({ uz: `${total - soon} ta ishlayapti · ${soon} tez orada`, ru: `${total - soon} работают · ${soon} скоро` }) : t({ uz: "hammasi ishlayapti", ru: "все работают" })}
        </span>
      </div>

      <div className={tile}>
        <span className={label}><span className={chipIcon}><Wallet className="h-4 w-4" aria-hidden="true" /></span>{t({ uz: "TARIF VA NARX", ru: "ТАРИФ И ЦЕНА" })}</span>
        <div className="flex items-center gap-4">
          <span className="relative flex shrink-0 items-center justify-center">
            <Ring parts={mix} size={108} />
            <span className="mono absolute text-[22px] font-extrabold tracking-[-0.03em]">{nFree}%</span>
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-bold leading-tight">{t({ uz: "bepul xizmatlar", ru: "бесплатных услуг" })}</span>
            <span className="text-[13px] text-[var(--pp-muted)]">{free} / {total}</span>
          </div>
        </div>
        <span className="flex flex-wrap gap-1.5 text-xs">
          {mix.filter((m) => m.v > 0).map((m) => (
            <span key={m.k} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ background: `${m.c}22` }}>
              <span className="h-2 w-2 rounded-full" style={{ background: m.c }} />{t(MIX_LABEL[m.k])} <span className="mono">{m.v}</span>
            </span>
          ))}
        </span>
      </div>

      <div className={tile}>
        <span className={label}><span className={chipIcon}><Activity className="h-4 w-4" aria-hidden="true" /></span>{t({ uz: "JAMI FOYDALANISH", ru: "ВСЕГО ИСПОЛЬЗОВАНИЙ" })}</span>
        <span className="mono text-[44px] font-extrabold leading-none tracking-[-0.04em] text-[var(--btn)]">{uses ? nUses.toLocaleString("ru-RU") : "—"}</span>
        {uses > 0 && (
          <span className="flex h-14 items-end gap-[3px]" aria-hidden="true">
            {bars.map((b, i) => (
              <span key={i} className="flex-1 rounded-t-[4px] bg-[linear-gradient(180deg,var(--pacc),var(--btn))] transition-[height] duration-700" style={{ height: `${Math.max(8, (b / barMax) * 100)}%`, opacity: 1 - i * 0.04 }} />
            ))}
          </span>
        )}
        <span className="text-[13px] text-[var(--pp-muted)]">
          {total && uses ? t({ uz: `o'rtacha ${Math.round(uses / total).toLocaleString("ru-RU")} marta / xizmat`, ru: `в среднем ${Math.round(uses / total).toLocaleString("ru-RU")} на услугу` }) : ""}
          {isSample ? ` · ${t({ uz: "demo", ru: "демо" })}` : ""}
        </span>
      </div>

      <div className={tile}>
        <span className={label}><span className={chipIcon}><Star className="h-4 w-4" aria-hidden="true" /></span>{t({ uz: "FOYDALANUVCHILAR BAHOSI", ru: "ОЦЕНКА ПОЛЬЗОВАТЕЛЕЙ" })}</span>
        <div className="flex items-end gap-2"><span className="mono text-[56px] font-extrabold leading-none tracking-[-0.04em]">{avg ? avg.toFixed(1) : "—"}</span><span className="pb-2 text-base text-[var(--pp-muted)]">/ 5</span></div>
        <Stars value={avg} />
        <span className="block h-2 overflow-hidden rounded-full bg-[var(--pp-soft)]" aria-hidden="true"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#f2b234,#ffe08a)] transition-[width] duration-700" style={{ width: `${(avg / 5) * 100}%` }} /></span>
        <span className="text-[13px] text-[var(--pp-muted)]">{rated.length} {t({ uz: "ta xizmat baholangan", ru: "услуг оценено" })}</span>
      </div>
    </div>
  );
}

/** Eng faol 6 soha: gorizontal ustunlar, bosilsa shu sohaga filtrlanadi. */
function SphereBars({ stats, active, onPick }: { stats: Record<string, ServiceShortStats>; active: number; onPick: (id: number) => void }) {
  const { t } = useLang();
  const rows = SPHERES.map((sp) => {
    const items = SERVICES.filter((s) => s.sphere === sp.id);
    return { sp, n: items.length, uses: items.reduce((a, s) => a + (stats[s.number]?.usage ?? 0), 0) };
  }).sort((a, b) => b.uses - a.uses || b.n - a.n).slice(0, 6);
  const max = Math.max(1, ...rows.map((r) => r.uses || r.n));
  return (
    <div className="flex flex-col gap-2 rounded-[24px] border border-[var(--pp-line)] bg-[var(--pp-card)] p-5">
      <span className="text-xs font-bold tracking-[0.1em] text-[var(--pp-muted)]">{t({ uz: "ENG FAOL SOHALAR", ru: "САМЫЕ АКТИВНЫЕ СФЕРЫ" })}</span>
      {rows.map(({ sp, n, uses }) => {
        const Icon = sp.icon;
        const val = uses || n;
        return (
          <button key={sp.id} type="button" onClick={() => onPick(active === sp.id ? 0 : sp.id)} aria-pressed={active === sp.id}
            className={`pp-focus flex items-center gap-3 rounded-2xl px-2 py-1.5 text-left hover:bg-[var(--pp-soft)] ${active === sp.id ? "bg-[var(--p50)]" : ""}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--p50)] text-[var(--p800)]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-baseline justify-between gap-2 text-[13px]">
                <span className="truncate font-semibold">{t(sp.title)}</span>
                <span className="mono shrink-0 text-xs text-[var(--pp-muted)]">{uses ? uses.toLocaleString("ru-RU") : `${n} ${t({ uz: "xizmat", ru: "услуг" })}`}</span>
              </span>
              <span className="block h-2 overflow-hidden rounded-full bg-[var(--pp-soft)]"><span className="block h-full rounded-full bg-[linear-gradient(90deg,var(--btn),var(--pacc))] transition-[width] duration-700" style={{ width: `${Math.max(5, (val / max) * 100)}%` }} /></span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AllServices({ stats, isSample }: { stats: Record<string, ServiceShortStats>; isSample: boolean }) {
  const { t } = useLang();
  const [sphere, setSphere] = useState<number | 0>(0);
  const list = useMemo(() => {
    const base = sphere ? SERVICES.filter((s) => s.sphere === sphere || s.alsoIn?.includes(sphere)) : SERVICES;
    return [...base].sort((a, b) => (stats[b.number]?.usage ?? 0) - (stats[a.number]?.usage ?? 0) || (a.popularOrder ?? 99) - (b.popularOrder ?? 99) || a.number - b.number);
  }, [sphere, stats]);
  const count = (id: number) => SERVICES.filter((s) => s.sphere === id || s.alsoIn?.includes(id)).length;
  const tab = (on: boolean) => `pp-focus rounded-full px-3.5 py-2 text-[13px] font-semibold ${on ? "bg-[var(--btn)] text-white" : "text-[var(--pp-muted)] hover:bg-[var(--pp-soft)]"}`;
  return (
    <section aria-labelledby="pp-all" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="pp-all" className="m-0 text-2xl font-extrabold tracking-[-0.03em]">{t({ uz: "Barcha xizmatlar", ru: "Все услуги" })}</h2>
          <span className="text-[13px] text-[var(--pp-muted)]">{t({ uz: "Raqamlar tanlangan soha bo'yicha o'zgaradi", ru: "Цифры меняются по выбранной сфере" })}</span>
        </div>
        <div role="tablist" aria-label={t({ uz: "Soha", ru: "Сфера" })} className="flex max-w-full flex-wrap gap-1 rounded-[22px] border border-[var(--pp-line)] bg-[var(--pp-card)] p-1">
          <button type="button" role="tab" aria-selected={sphere === 0} onClick={() => setSphere(0)} className={tab(sphere === 0)}>
            {t({ uz: "Hammasi", ru: "Все" })} <span className="mono opacity-70">{SERVICES.length}</span>
          </button>
          {SPHERES.map((sp) => (
            <button key={sp.id} type="button" role="tab" aria-selected={sphere === sp.id} onClick={() => setSphere(sp.id)} className={tab(sphere === sp.id)}>
              {t(sp.title)} <span className="mono opacity-70">{count(sp.id)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Kpis list={list} stats={stats} isSample={isSample} />
        <SphereBars stats={stats} active={sphere} onPick={setSphere} />
      </div>
      <Link to={sphere ? `/spheres/${sphere}` : "/spheres"} className="flex h-12 items-center justify-center rounded-2xl border border-[var(--pp-line)] bg-[var(--pp-card)] text-[15px] font-bold text-[var(--p800)] hover:bg-[var(--pp-soft)] hover:no-underline">
        {sphere ? t({ uz: "Shu sohadagi xizmatlarni ochish →", ru: "Открыть услуги этой сферы →" }) : t({ uz: "Barcha xizmatlar ro'yxatini ochish →", ru: "Открыть полный список услуг →" })}
      </Link>
    </section>
  );
}

function Situations() {
  const { t } = useLang();
  return (
    <section aria-labelledby="pp-sit" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="pp-sit" className="m-0 text-2xl font-extrabold tracking-[-0.03em]">{t({ uz: "Hayotiy vaziyatlar", ru: "Жизненные ситуации" })}</h2>
        <Link to="/situations" className="text-sm font-semibold">{t({ uz: "Hammasi →", ru: "Все →" })}</Link>
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {SITUATIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.slug} to={`/situations/${s.slug}`} className={`${cardLink} flex items-start gap-3 p-4`}>
              <span aria-hidden="true" className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--p50)] text-[var(--p800)]"><Icon className="h-5 w-5" strokeWidth={1.9} /></span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-[15px] font-bold leading-tight">{t(s.title)}</span>
                <span className="line-clamp-2 text-[13px] leading-snug text-[var(--pp-muted)]">{t(s.description)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function HelpBlock() {
  const { t } = useLang();
  const row = "flex h-[46px] items-center rounded-[14px] px-4 text-[15px] font-semibold text-white hover:no-underline";
  return (
    <section className="pp-fu flex flex-col justify-between gap-4 rounded-[28px] bg-[#1b2530] p-6 text-white sm:flex-row sm:items-center">
      <div className="flex max-w-xl flex-col gap-1.5">
        <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em]">{t({ uz: "Kerakli xizmatni topa olmadingizmi?", ru: "Не нашли нужную услугу?" })}</h2>
        <span className="text-sm text-[#c3ccd4]">{t({ uz: "Savolingizni oddiy tilda yozing yoki mutaxassis bilan bog'laning.", ru: "Напишите вопрос простыми словами или свяжитесь со специалистом." })}</span>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-[340px]">
        <button type="button" onClick={() => window.dispatchEvent(new Event("open-global-search"))} className={`${row} justify-between bg-white/10 text-left hover:bg-white/15`}>
          <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden="true" />{t({ uz: "Qidiruv va yordamchi", ru: "Поиск и помощник" })}</span>
          <span className="mono rounded-md border border-white/30 px-1.5 py-0.5 text-xs">Ctrl K</span>
        </button>
        <Link to="/consultation" className={`${row} bg-white/10 hover:bg-white/15`}>{t({ uz: "Mutaxassis konsultatsiyasi →", ru: "Консультация специалиста →" })}</Link>
        <Link to="/contact" className={`${row} bg-[var(--btn)] hover:brightness-110`}>{t({ uz: "Murojaat yuborish →", ru: "Отправить обращение →" })}</Link>
      </div>
    </section>
  );
}

export default function HomePassport() {
  const { t } = useLang();
  const { items: stats, isSample } = useServiceStats();
  useEffect(() => {
    document.title = `my.stat.uz — ${t(UI.portalLine2)}`;
  }, [t]);

  const top = useMemo(() => {
    const live = POPULAR.filter((s) => s.status === "live");
    return [...live].sort((a, b) => (stats[b.number]?.usage ?? 0) - (stats[a.number]?.usage ?? 0) || a.popularOrder! - b.popularOrder!).slice(0, 8);
  }, [stats]);

  return (
    <div className="flex flex-col gap-6 px-4 pb-7 pt-5 sm:px-6">
      <Hero featured={top.slice(0, 6)} stats={stats} isSample={isSample} />
      <TopServices items={top} stats={stats} isSample={isSample} />
      <AllServices stats={stats} isSample={isSample} />
      <Situations />
      <HelpBlock />
    </div>
  );
}
