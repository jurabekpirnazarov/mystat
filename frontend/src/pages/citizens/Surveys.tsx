import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Vote } from "lucide-react";
import { answerSurvey, fetchSurvey, fetchSurveyResults, fetchSurveys } from "../../api/citizens";
import { asApiError } from "../../api/errors";
import { useAuth } from "../../contexts/AuthContext";
import useApi from "../../hooks/useApi";
import { ApiErrorState, ErrorState, PageHeader, SampleBanner, Skeleton } from "../../components/ui";
import { loginUrl } from "../../utils/loginRedirect";

/** FQ-08: so'rovnomalar ro'yxati. */
export function SurveyList() {
  const { data, loading, error, reload } = useApi(fetchSurveys, []);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title="Aholi so'rovnomalari" description="Qisqa so'rovnomalarda qatnashing; natijalar hamma uchun ochiq."
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "So'rovnomalar" }]} />
        <SampleBanner text="Natijalardagi javoblarning asosiy qismi namuna (sintetik). Haqiqiy javoblar alohida sanaladi." />
        {loading && !data ? <Skeleton rows={6} /> : error || !data ? <ErrorState onRetry={reload} /> : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((s) => (
              <li key={s.slug} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col">
                <Vote className="w-6 h-6 text-blue-600 mb-2" aria-hidden="true" />
                <h2 className="font-semibold">{s.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">{s.description}</p>
                <p className="mt-2 text-xs text-gray-500">{s.responses} ta javob · {s.is_open ? (s.closes_at ? `${s.closes_at} gacha` : "faol") : "yopilgan"}</p>
                <div className="mt-3 flex gap-2">
                  {s.is_open && !s.answered && <Link to={`/surveys/${s.slug}`} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">Qatnashish</Link>}
                  {s.answered && <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Qatnashgansiz</span>}
                  <Link to={`/surveys/${s.slug}?view=results`} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Natijalar</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Results({ slug }: { slug: string }) {
  const [region, setRegion] = useState("");
  const [age, setAge] = useState("");
  const survey = useApi(() => fetchSurvey(slug), [slug]);
  const { data, loading, error, reload } = useApi(() => fetchSurveyResults(slug, { region: region ? Number(region) : undefined, age_group: age || undefined }), [slug, region, age]);
  if (loading && !data) return <Skeleton variant="chart" />;
  if (error || !data) return <ErrorState onRetry={reload} />;
  const select = "px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Hudud" value={region} onChange={(e) => setRegion(e.target.value)} className={select}>
          <option value="">Barcha hududlar</option>
          {survey.data?.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select aria-label="Yosh guruhi" value={age} onChange={(e) => setAge(e.target.value)} className={select}>
          <option value="">Barcha yoshlar</option>
          {survey.data?.age_groups.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <p className="text-sm text-gray-600 dark:text-gray-300"><b>{data.sample_responses}</b> ta namuna javob, <b>{data.real_responses}</b> ta haqiqiy javob</p>
      </div>
      {data.questions.map((q) => (
        <section key={q.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="font-medium mb-3">{q.text}</h3>
          <ul className="space-y-2">
            {q.options.map((o) => (
              <li key={o.id} className="text-sm">
                <div className="flex justify-between"><span>{o.text}</span><span className="tabular-nums text-gray-500">{o.share}% ({o.count})</span></div>
                <div className="mt-1 h-2 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${o.share}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Form({ slug, onDone }: { slug: string; onDone: () => void }) {
  const { data, loading, error, reload } = useApi(() => fetchSurvey(slug), [slug]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[] | number>>({});
  const [meta, setMeta] = useState({ region: "", age_group: "" });
  const [err, setErr] = useState<string | null>(null);
  if (loading && !data) return <Skeleton rows={6} />;
  if (error || !data) return <ApiErrorState error={error} onRetry={reload} />;
  if (data.answered) return <p className="text-emerald-700">Siz bu so'rovnomada qatnashgansiz. Rahmat!</p>;
  if (!data.is_open) return <p className="text-gray-600">So'rovnoma yopilgan.</p>;

  const total = data.questions.length + 1;
  const q = data.questions[step];
  const ready = q ? (q.kind === "scale" ? typeof answers[q.id] === "number" : ((answers[q.id] as string[]) ?? []).length > 0) : true;
  const toggle = (opt: string) => setAnswers((a) => {
    const cur = (a[q.id] as string[]) ?? [];
    return { ...a, [q.id]: q.kind === "single" ? [opt] : cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
  });
  const submit = async () => {
    setErr(null);
    try {
      await answerSurvey(slug, { region: meta.region ? Number(meta.region) : undefined, age_group: meta.age_group || undefined, answers });
      onDone();
    } catch (e) {
      const d = asApiError(e).response?.data;
      setErr(typeof d?.detail === "string" ? d.detail : "Yuborib bo'lmadi");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
      <div className="h-2 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total} aria-label="Jarayon">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      {q ? (
        <fieldset>
          <legend className="font-medium mb-3">{step + 1}. {q.text}</legend>
          {q.kind === "scale" ? (
            <div className="flex gap-2">
              {Array.from({ length: q.scale_max }, (_, i) => i + 1).map((v) => (
                <button key={v} type="button" aria-pressed={answers[q.id] === v} onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  className={`w-11 h-11 rounded-full border font-semibold ${answers[q.id] === v ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>{v}</button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {q.options.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <input type={q.kind === "single" ? "radio" : "checkbox"} name={`q${q.id}`} checked={((answers[q.id] as string[]) ?? []).includes(o.id)} onChange={() => toggle(o.id)} />
                  {o.text}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      ) : (
        <fieldset className="space-y-3">
          <legend className="font-medium mb-1">O'zingiz haqingizda (ixtiyoriy, anonim)</legend>
          <select aria-label="Hudud" value={meta.region} onChange={(e) => setMeta({ ...meta, region: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
            <option value="">Hudud</option>
            {data.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select aria-label="Yosh guruhi" value={meta.age_group} onChange={(e) => setMeta({ ...meta, age_group: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
            <option value="">Yosh guruhi</option>
            {data.age_groups.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </fieldset>
      )}
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <div className="flex justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40">← Orqaga</button>
        {q ? (
          <button type="button" disabled={!ready} onClick={() => setStep((s) => s + 1)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">Keyingi →</button>
        ) : (
          <button type="button" onClick={submit} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">Yuborish</button>
        )}
      </div>
    </div>
  );
}

/** FQ-08: so'rovnoma — qadamma-qadam forma yoki natijalar (?view=results). */
export function SurveyPage() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const view = params.get("view") === "results" ? "results" : "form";
  const { data } = useApi(() => fetchSurvey(slug), [slug]);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title={data?.title ?? "So'rovnoma"} description={data?.description}
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "So'rovnomalar", to: "/surveys" }, { label: data?.title ?? "" }]}
          actions={<button type="button" onClick={() => setParams(view === "results" ? {} : { view: "results" })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">{view === "results" ? "Qatnashish" : "Natijalar"}</button>} />
        {view === "results" ? <Results slug={slug} /> : !isAuthenticated ? (
          <p className="text-sm">Qatnashish uchun <Link to={loginUrl()} className="text-blue-600 underline">tizimga kiring</Link> (bitta foydalanuvchi — bitta javob). Natijalarni kirmasdan ko'rishingiz mumkin.</p>
        ) : <Form slug={slug} onDone={() => setParams({ view: "results" })} />}
      </div>
    </div>
  );
}
