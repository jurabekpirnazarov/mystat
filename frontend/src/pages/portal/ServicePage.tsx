import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  BarChart3, Building2, ChevronDown, ChevronRight, Clock, CreditCard, FileText, ListOrdered, MessageSquareText,
  Phone, Scale, Share2, Star, ThumbsDown, ThumbsUp, UserCheck, Users,
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { CONTACT, serviceByNumber, type Access, type Audience } from "../../config/serviceCatalog";
import { sphereById } from "../../config/spheres";
import { useLang, type I18nText } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { useAuth } from "../../contexts/AuthContext";
import { loginUrl } from "../../utils/loginRedirect";
import {
  fetchReviews, fetchServiceStats, postReview, recordServiceUse, voteReview, type Review, type ReviewsResponse, type ServiceStats,
} from "../../api/portal";
import FavoriteServiceButton from "../../components/catalog/FavoriteServiceButton";
import DemoBadge from "../../components/ui/DemoBadge";

const USERS: Record<Audience, I18nText> = {
  all: { uz: "Jismoniy va yuridik shaxslar", ru: "Физические и юридические лица" },
  legal: { uz: "Yuridik shaxslar", ru: "Юридические лица" },
  individual: { uz: "Jismoniy shaxslar", ru: "Физические лица" },
};
const ACCESS: Record<Access, I18nText> = {
  open: { uz: "Ro'yxatdan o'tmasdan foydalanish mumkin", ru: "Доступно без регистрации" },
  login: { uz: "Tizimga kirish talab qilinadi", ru: "Требуется вход в систему" },
  package: { uz: "Tarif paketi bo'yicha (limitdan yechiladi)", ru: "По тарифному пакету (списывается с лимита)" },
  priced: { uz: "Alohida narx bo'yicha", ru: "По отдельной цене" },
  credits: { uz: "Asosiy qismi bepul, batafsil tahlil pullik (hamyondan)", ru: "Основная часть бесплатно, подробный анализ — платно (из кошелька)" },
};

function Stars({ value, size = "h-5 w-5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(2)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        return (
          <span key={i} className={`relative ${size}`}>
            <Star className={`absolute inset-0 ${size} text-slate-300`} aria-hidden="true" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${size} fill-amber-400 text-amber-400`} aria-hidden="true" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function timeAgo(iso: string, lang: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  const ru = lang === "ru";
  if (min < 60) return ru ? `${min} мин назад` : `${min} daqiqa oldin`;
  const h = Math.round(min / 60);
  if (h < 24) return ru ? `${h} ч назад` : `${h} soat oldin`;
  const d = Math.round(h / 24);
  if (d < 31) return ru ? `${d} дн назад` : `${d} kun oldin`;
  return new Date(iso).toLocaleDateString(ru ? "ru-RU" : "uz-UZ");
}

/** Ikonkali yig'iladigan bo'lim (my.gov.uz xizmat sahifasidagi kabi). */
function InfoSection({ icon: Icon, title, subtitle, children, wide }: {
  icon: typeof Star; title: string; subtitle?: string; children: ReactNode; wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-mg bg-mg-info ${wide ? "md:col-span-2" : ""}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full items-center gap-4 px-6 py-5 text-left">
        <Icon className="h-6 w-6 shrink-0 text-mg-primary-light" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-base font-semibold text-black dark:text-white">{title}</span>
          {subtitle && <span className="block text-sm text-mg-text">{subtitle}</span>}
        </span>
        <ChevronDown className={`h-5 w-5 text-mg-primary-light transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div className="px-6 pb-5 pl-16 text-[15px] leading-relaxed text-mg-text">{children}</div>}
    </div>
  );
}

/** Sharh ostidagi "Foydali / Foydasiz" (my.gov.uz dagi kabi). Mehmon bosganda login'ga yuboriladi. */
function ReviewVotes({ review }: { review: Review }) {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState({ helpful: review.helpful, unhelpful: review.unhelpful, my_vote: review.my_vote });
  if (review.is_mine) return null;
  const vote = async (helpful: boolean) => {
    if (!isAuthenticated) {
      navigate(loginUrl());
      return;
    }
    try {
      setState(await voteReview(review.id, helpful));
    } catch {
      /* tarmoq xatosi — holat o'zgarmaydi */
    }
  };
  const btn = (on: boolean) => `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm ${on ? "bg-mg-primary text-white" : "bg-slate-200/70 text-mg-text dark:bg-gray-700"}`;
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-mg-muted">{t({ uz: "Sharh sizga foydali bo'ldimi?", ru: "Был ли отзыв полезен?" })}</p>
      <div className="mt-2 flex gap-2">
        <button type="button" className={btn(state.my_vote === true)} aria-pressed={state.my_vote === true} onClick={() => vote(true)}>
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />{t({ uz: "Foydali", ru: "Полезно" })} ({state.helpful})
        </button>
        <button type="button" className={btn(state.my_vote === false)} aria-pressed={state.my_vote === false} onClick={() => vote(false)}>
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />{t({ uz: "Foydasiz", ru: "Бесполезно" })} ({state.unhelpful})
        </button>
      </div>
    </div>
  );
}

function UsageStats({ number }: { number: number }) {
  const { t } = useLang();
  const [period, setPeriod] = useState("all");
  const [data, setData] = useState<ServiceStats | null>(null);
  useEffect(() => {
    let alive = true;
    fetchServiceStats(number, period).then((d) => alive && setData(d)).catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
  }, [number, period]);
  if (!data) return <p className="text-sm text-mg-muted">—</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {([["all", { uz: "Barcha", ru: "Все" }], ["year", { uz: "Yil", ru: "Год" }], ["month", { uz: "Oy", ru: "Месяц" }]] as [string, I18nText][]).map(([p, label]) => (
          <button key={p} type="button" onClick={() => setPeriod(p)} aria-pressed={period === p}
            className={`rounded-mg border px-3 py-1 text-sm ${period === p ? "border-mg-primary bg-mg-primary text-white" : "border-mg-primary bg-mg-surface"}`}>
            {t(label)}
          </button>
        ))}
        <DemoBadge show={data.is_sample} />
      </div>
      <p>
        <span className="text-2xl font-bold text-mg-heading">{data.usage_count.toLocaleString("ru-RU")}</span>{" "}
        {t({ uz: "marta foydalanilgan", ru: "использований" })}
        {data.since && period === "all" && <span className="text-sm text-mg-muted"> · {t({ uz: "xizmat ishga tushirilganidan beri", ru: "с момента запуска услуги" })} ({data.since})</span>}
      </p>
      {data.monthly.length > 1 && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(m: string) => m.slice(5)} />
              <Tooltip formatter={(v: number) => [v, t({ uz: "Foydalanish", ru: "Использования" })]} />
              <Bar dataKey="count" fill="#1D5FBF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Ratings({ number, stats, onRated }: { number: number; stats: ServiceStats | null; onRated: () => void }) {
  const { t, lang } = useLang();
  const { isAuthenticated } = useAuth();
  const [ordering, setOrdering] = useState("recent");
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchReviews(number, ordering, 10).then((d) => {
      if (!alive) return;
      setData(d);
      if (d.my_review) {
        setScore(d.my_review.score);
        setComment(d.my_review.comment);
      }
    }).catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
  }, [number, ordering, reload]);

  const total = stats?.rating_count ?? 0;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!score) return;
    try {
      const r = await postReview(number, score, comment.trim());
      setMsg(r.moderation
        ? t({ uz: "Rahmat! Bahoyingiz hisobga olindi, sharh moderatsiyadan keyin ko'rinadi.", ru: "Спасибо! Оценка учтена, отзыв появится после модерации." })
        : t({ uz: "Rahmat! Bahoyingiz hisobga olindi.", ru: "Спасибо! Оценка учтена." }));
      setReload((n) => n + 1);
      onRated();
    } catch {
      setMsg(t({ uz: "Yuborib bo'lmadi, keyinroq urinib ko'ring.", ru: "Не удалось отправить, попробуйте позже." }));
    }
  };

  return (
    <section aria-labelledby="ratings-title" className="mt-8">
      <div className="flex flex-wrap items-center gap-4">
        <h2 id="ratings-title" className="text-[28px] text-black dark:text-white">{t({ uz: "Baho va sharhlar", ru: "Оценки и отзывы" })}</h2>
        <label className="sr-only" htmlFor="review-order">{t({ uz: "Saralash", ru: "Сортировка" })}</label>
        <select id="review-order" value={ordering} onChange={(e) => setOrdering(e.target.value)}
          className="rounded-full border-0 bg-mg-info px-4 py-2 text-sm font-semibold text-mg-primary">
          <option value="recent">{t({ uz: "Yaqinda qo'shilgan", ru: "Недавно добавленные" })}</option>
          <option value="high">{t({ uz: "Avval yuqori baho", ru: "Сначала высокие" })}</option>
          <option value="low">{t({ uz: "Avval past baho", ru: "Сначала низкие" })}</option>
        </select>
        <DemoBadge show={!!stats?.is_sample} />
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-[200px_1fr]">
        <div>
          <p className="text-[40px] font-bold leading-none text-black dark:text-white">{stats?.rating_avg?.toFixed(2) ?? "—"}</p>
          <div className="mt-2"><Stars value={stats?.rating_avg ?? 0} size="h-8 w-8" /></div>
          <p className="mt-3 text-sm font-semibold text-mg-muted">{t({ uz: "Baholashdi", ru: "Оценили" })}: {total}</p>
          <p className="mt-1 text-sm font-semibold text-mg-muted">{t({ uz: "Sharhlar soni", ru: "Количество отзывов" })}: {stats?.comment_count ?? 0}</p>
        </div>
        <ul className="max-w-xl space-y-1.5" aria-label={t({ uz: "Baholar taqsimoti", ru: "Распределение оценок" })}>
          {[5, 4, 3, 2, 1].map((n) => {
            const c = stats?.distribution[String(n) as "1"] ?? 0;
            return (
              <li key={n} className="flex items-center gap-3">
                <span className="w-3 text-sm font-semibold">{n}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-700">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: total ? `${(100 * c) / total}%` : 0 }} />
                </span>
                <span className="sr-only">{c}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 max-w-3xl rounded-mg bg-mg-surface p-5">
        {isAuthenticated ? (
          <form onSubmit={submit} className="space-y-3">
            <p className="font-semibold text-mg-heading">{data?.my_review ? t({ uz: "Bahoyingizni o'zgartirish", ru: "Изменить оценку" }) : t({ uz: "Xizmatni baholang", ru: "Оцените услугу" })}</p>
            <div className="flex gap-1" role="radiogroup" aria-label={t({ uz: "Baho", ru: "Оценка" })}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" role="radio" aria-checked={score === i} aria-label={`${i}`} onClick={() => setScore(i)}>
                  <Star className={`h-8 w-8 ${i <= score ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden="true" />
                </button>
              ))}
            </div>
            <label htmlFor="review-comment" className="sr-only">{t({ uz: "Sharh", ru: "Отзыв" })}</label>
            <textarea id="review-comment" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder={t({ uz: "Sharh (ixtiyoriy)", ru: "Отзыв (необязательно)" })}
              className="w-full rounded-[10px] border border-mg-border bg-mg-surface p-3 text-sm" />
            <button type="submit" disabled={!score} className="rounded-mg bg-mg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
              {t({ uz: "Yuborish", ru: "Отправить" })}
            </button>
            {msg && <p className="text-sm text-mg-success">{msg}</p>}
          </form>
        ) : (
          <p className="text-sm text-mg-text">
            <Link to={loginUrl()} className="font-semibold text-mg-primary hover:underline">{t(UI.login)}</Link>
            {" — "}{t({ uz: "xizmatni baholash uchun tizimga kiring.", ru: "чтобы оценить услугу." })}
          </p>
        )}
      </div>

      <ul className="mt-6 max-w-3xl divide-y divide-mg-border">
        {data?.results.map((r) => (
          <li key={r.id} className="py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mg-info text-sm font-semibold text-mg-muted">{r.author[0]}</span>
              <span className="text-sm font-semibold uppercase text-black dark:text-white">{r.author}</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Stars value={r.score} />
              <span className="text-sm text-mg-muted">{timeAgo(r.created_at, lang)}</span>
            </div>
            {r.comment && <p className="mt-2 text-[15px] text-mg-text">{r.comment}</p>}
            <ReviewVotes review={r} />
          </li>
        ))}
        {data && data.results.length === 0 && <li className="py-5 text-sm text-mg-muted">{t({ uz: "Hozircha sharhlar yo'q.", ru: "Пока нет отзывов." })}</li>}
      </ul>
    </section>
  );
}

/**
 * MG-07: xizmat pasporti `/service/:number` — MG-00 dagi my.gov.uz tuzilishi: ko'k hero (ikonka, nom, bajarish vaqti,
 * foydalanish soni, reyting, asosiy tugma, "Tanlanganlarga qo'shish", ulashish) → ikonkali yig'iladigan bo'limlar
 * (2 ustun) → "Umumiy statistika" → "Baho va sharhlar". Asosiy tugma mavjud ishchi sahifaga olib boradi.
 */
export default function ServicePage() {
  const { number } = useParams();
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const s = serviceByNumber(Number(number));
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [statsTick, setStatsTick] = useState(0);

  useEffect(() => {
    if (!s) return;
    document.title = `#${s.number} ${t(s.title)} — my.stat.uz`;
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute("content", t(s.description));
  }, [s, t]);

  useEffect(() => {
    if (!s) return;
    let alive = true;
    fetchServiceStats(s.number).then((d) => alive && setStats(d)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [s, statsTick]);

  if (!s || s.status !== "live") return <Navigate to="/spheres" replace />;
  const sphere = sphereById(s.sphere)!;
  const Icon = s.icon;
  // Paketli/pullik xizmatlarning ochiq qismi ham bor (qisqa bozor tahlili, hamkor qidiruvi) — login faqat shart bo'lsa
  const needsLogin = !isAuthenticated && (s.access === "login" || s.route.startsWith("/cabinet"));

  const start = () => {
    void recordServiceUse(s.number);
    navigate(needsLogin ? loginUrl(s.route) : s.route);
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: t(s.title), url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* foydalanuvchi bekor qildi */
    }
  };

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          <li><Link to="/" className="text-mg-primary hover:underline">{t(UI.home)}</Link></li>
          <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" aria-hidden="true" /><Link to="/spheres" className="text-mg-primary hover:underline">{t(UI.spheres)}</Link></li>
          <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" aria-hidden="true" /><Link to={`/spheres/${sphere.id}`} className="text-mg-primary hover:underline">{t(sphere.title)}</Link></li>
          <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" aria-hidden="true" /><span aria-current="page">#{s.number}</span></li>
        </ol>
      </nav>

      <div className="overflow-hidden rounded-mg border border-mg-border">
        <section className="bg-mg-primary px-6 py-8 text-white md:px-8 dark:bg-blue-900">
          <div className="flex items-start gap-4">
            <Icon className="h-11 w-11 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-sm text-white/80">#{s.number}</p>
              <h1 className="text-xl font-bold leading-snug md:text-2xl">{t(s.title)}</h1>
              <p className="mt-2 max-w-3xl text-[15px] text-white/90">{t(s.description)}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/20"><Clock className="h-5 w-5" aria-hidden="true" /></span>
              <span className="leading-tight"><span className="block font-bold">{t(s.duration)}</span><span className="text-xs">{t({ uz: "Bajarish vaqti", ru: "Время выполнения" })}</span></span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/20"><UserCheck className="h-5 w-5" aria-hidden="true" /></span>
              <span className="leading-tight">
                <span className="block font-bold">{stats ? stats.usage_total.toLocaleString("ru-RU") : "—"}</span>
                <span className="text-xs">{t({ uz: "marotaba foydalanilgan", ru: "раз использовано" })}</span>
              </span>
            </div>
          </div>
          {stats?.rating_avg != null && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-white/25 px-3 py-2 text-sm">
              <Stars value={stats.rating_avg} />
              {stats.rating_avg.toFixed(2)} ({stats.rating_count} {t({ uz: "baho", ru: "оценок" })})
              {stats.is_sample && <span className="rounded bg-white/30 px-1.5 text-xs">{t(UI.sample)}</span>}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={start}
              className="h-[42px] rounded-mg bg-mg-success px-6 text-sm font-semibold text-white shadow-[0_13px_27px_rgba(0,0,0,0.08)] hover:brightness-110">
              {s.actionType === "apply" ? t({ uz: "Ariza yuborish", ru: "Подать заявку" }) : t({ uz: "Xizmatdan foydalanish", ru: "Воспользоваться услугой" })}
            </button>
            <FavoriteServiceButton number={s.number} title={t(s.title)} variant="button" />
            <button type="button" onClick={share} aria-label={t({ uz: "Ulashish", ru: "Поделиться" })}
              className="flex h-[42px] w-[62px] items-center justify-center rounded-mg bg-white text-black hover:bg-slate-50">
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </button>
            {copied && <span className="text-sm">{t({ uz: "Havola nusxalandi", ru: "Ссылка скопирована" })}</span>}
          </div>
          {s.access !== "open" && (
            <p className="mt-4 text-sm text-white/90">
              {needsLogin ? t({ uz: "Xizmatdan foydalanish uchun tizimga kirasiz, keyin shu xizmatga qaytasiz.", ru: "Для использования услуги нужно войти, после входа вы вернётесь к услуге." }) : t(ACCESS[s.access])}
            </p>
          )}
        </section>

        <section className="bg-[#F9FBFE] px-6 py-8 md:px-8 dark:bg-gray-900">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoSection icon={CreditCard} title={t({ uz: "Xizmat narxi", ru: "Стоимость услуги" })}>{t(s.price)}</InfoSection>
            <InfoSection icon={Users} title={t({ uz: "Xizmat foydalanuvchilari", ru: "Получатели услуги" })}>
              {t(USERS[s.users])}. {t(ACCESS[s.access])}.
            </InfoSection>
            <InfoSection icon={Scale} title={t({ uz: "Xizmat ko'rsatishning huquqiy asosi", ru: "Правовое основание" })}>{t(s.legalBasis)}</InfoSection>
            <InfoSection icon={Phone} title={t({ uz: "Aloqa", ru: "Контакты" })}>
              <a href={CONTACT.phoneHref} className="font-semibold text-mg-primary">{CONTACT.phone}</a> ·{" "}
              <a href={`mailto:${CONTACT.email}`} className="text-mg-primary">{CONTACT.email}</a>
            </InfoSection>
            <InfoSection icon={Clock} title={t({ uz: "Xizmat ko'rsatish muddati", ru: "Срок оказания услуги" })}>{t(s.duration)}</InfoSection>
            <InfoSection icon={Building2} title={t({ uz: "Mas'ul tashkilot", ru: "Ответственная организация" })}>{t(s.unit)}</InfoSection>
            <InfoSection icon={FileText} title={t({ uz: "Xizmatni olish uchun kerakli hujjatlar", ru: "Необходимые документы" })}>{t(s.requiredDocs)}</InfoSection>
            <InfoSection icon={ListOrdered} title={t({ uz: "Bu qanday ishlaydi?", ru: "Как это работает?" })}>
              <ol className="list-decimal space-y-1 pl-5">{s.howItWorks.map((step, i) => <li key={i}>{t(step)}</li>)}</ol>
            </InfoSection>
            <InfoSection wide icon={BarChart3} title={t({ uz: "Umumiy statistika", ru: "Общая статистика" })}
              subtitle={t({ uz: "Xizmat bo'yicha umumiy ma'lumotlar", ru: "Общие сведения по услуге" })}>
              <UsageStats number={s.number} />
            </InfoSection>
          </div>

          <Ratings number={s.number} stats={stats} onRated={() => setStatsTick((n) => n + 1)} />

          <p className="mt-8 flex items-center gap-2 text-sm text-mg-muted">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            <Link to={`/spheres/${sphere.id}`} className="text-mg-primary hover:underline">{t(sphere.title)}</Link>
            {" — "}{t({ uz: "sohadagi boshqa xizmatlar", ru: "другие услуги сферы" })}
          </p>
        </section>
      </div>
    </div>
  );
}
