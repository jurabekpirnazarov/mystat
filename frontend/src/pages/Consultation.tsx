import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, UserRound, Video, Building } from "lucide-react";
import { bookSlot, fetchConsultants, fetchSlots, type Slot } from "../api/consultations";
import { asApiError } from "../api/errors";
import { useAuth } from "../contexts/AuthContext";
import useApi from "../hooks/useApi";
import { DemoBadge, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui";
import { loginUrl } from "../utils/loginRedirect";

const day = (iso: string) => new Date(iso).toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "short" });
const hm = (iso: string) => new Date(iso).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

/** A-03: konsultantlar → bo'sh slotlar → band qilish. Faqat korxonalar (OS-17). */
export default function Consultation() {
  const { isAuthenticated, user } = useAuth();
  const consultants = useApi(fetchConsultants, []);
  const [selected, setSelected] = useState<number | null>(null);
  const slots = useApi(() => (selected ? fetchSlots(selected) : Promise.resolve(null)), [selected]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    (slots.data?.slots ?? []).forEach((s) => {
      const k = s.starts_at.slice(0, 10);
      map.set(k, [...(map.get(k) ?? []), s]);
    });
    return [...map.entries()];
  }, [slots.data]);

  const book = async () => {
    if (!slot) return;
    try {
      await bookSlot(slot.id, topic.trim(), question.trim());
      setResult({ ok: true, text: "Konsultatsiya band qilindi. Uchrashuv havolasi kabinetga keladi." });
      setSlot(null);
      slots.reload();
    } catch (e) {
      const d = asApiError(e).response?.data;
      setResult({ ok: false, text: typeof d?.detail === "string" ? d.detail : "Band qilib bo'lmadi" });
    }
  };
  const legal = user?.type === "legal";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title="Konsultant bilan konsultatsiya" description="Statistika mutaxassisi bilan onlayn yoki ofisda uchrashuv band qiling. Paket limiti bilan."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Xizmatlar", to: "/services" }, { label: "Konsultatsiya" }]} />
        {!isAuthenticated ? <p className="mb-4 text-sm"><Link to={loginUrl()} className="text-blue-600 underline">Kiring</Link> — band qilish faqat korxonalar uchun.</p>
          : !legal ? <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">Konsultatsiya hozircha faqat korxonalar uchun. Savolingizni bepul "Savol bering" xizmati orqali yuborishingiz mumkin: <Link to="/answers" className="underline">Savol-javoblar</Link>.</p> : null}
        {result && <p role="status" className={`mb-4 text-sm ${result.ok ? "text-emerald-700" : "text-red-600"}`}>{result.text} {result.ok && <Link to="/cabinet" state={{ name: "consultations" }} className="underline">Konsultatsiyalarim</Link>}</p>}

        {consultants.loading && !consultants.data ? <Skeleton variant="card" /> : consultants.error ? <ErrorState onRetry={consultants.reload} /> : !consultants.data?.length ? (
          <EmptyState icon={UserRound} title="Hozircha konsultantlar yo'q" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ul className="space-y-3">
              {consultants.data.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { setSelected(c.id); setSlot(null); }}
                    className={`w-full text-left rounded-xl border p-4 bg-white dark:bg-gray-800 ${selected === c.id ? "border-blue-500" : "border-gray-200 dark:border-gray-700"}`}>
                    <p className="font-semibold flex items-center gap-2"><UserRound className="w-4 h-4 text-blue-600" /> {c.name} <DemoBadge show={c.bio.includes("namuna")} /></p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{c.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{c.topics.map((t) => t.name).join(", ")}</p>
                    <p className="mt-1 text-xs text-emerald-700">{c.free_slots} ta bo'sh vaqt</p>
                  </button>
                </li>
              ))}
            </ul>
            <div className="lg:col-span-2 space-y-4">
              {!selected ? <EmptyState icon={CalendarCheck} title="Konsultantni tanlang" /> : slots.loading && !slots.data ? <Skeleton variant="table" /> : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{slots.data?.consultant.bio}</p>
                  {byDay.length === 0 ? <EmptyState title="Yaqin 3 haftada bo'sh vaqt yo'q" /> : (
                    <div className="space-y-3">
                      {byDay.map(([d, list]) => (
                        <div key={d}>
                          <p className="text-sm font-medium mb-1">{day(list[0].starts_at)}</p>
                          <div className="flex flex-wrap gap-2">
                            {list.map((s) => (
                              <button key={s.id} type="button" aria-pressed={slot?.id === s.id} onClick={() => setSlot(s)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm ${slot?.id === s.id ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"}`}>
                                {s.format === "online" ? <Video className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />} {hm(s.starts_at)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {slot && (
                    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-4 space-y-3">
                      <p className="text-sm">{day(slot.starts_at)}, {hm(slot.starts_at)} · {slot.duration_min} daqiqa · {slot.format === "online" ? "onlayn" : "ofisda"}</p>
                      <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Mavzu" aria-label="Mavzu" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="Savolingiz (ixtiyoriy)" aria-label="Savol" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                      <p className="text-xs text-gray-500">24 soatdan oldin bekor qilsangiz limit qaytariladi; keyin bekor qilinsa qaytmaydi. Onlayn to'lov yo'q.</p>
                      <button type="button" disabled={!legal || !topic.trim()} onClick={book} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">Band qilish</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
