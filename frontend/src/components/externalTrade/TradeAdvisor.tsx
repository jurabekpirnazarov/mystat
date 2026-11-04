import { useState } from "react";
import { AlertTriangle, Compass, FileText, Lightbulb, Loader2, Send, Sparkles, TrendingUp } from "lucide-react";
import { downloadTradeAdviceDocx, fetchTradeAdvice, type TradeAdviceBlock } from "../../api/tradeFlows";

const SAMPLE_QUESTIONS = [
  "Eksportni qaysi bozorlarga kengaytirish mumkin?",
  "Importga bog'liqlikni qanday kamaytirish mumkin?",
  "Savdo balansi nima uchun defitsitda?",
];

const SECTIONS: { key: "summary" | "risks" | "opportunities" | "recommendations"; title: string; icon: typeof Compass; tone: string }[] = [
  { key: "summary", title: "Qisqacha xulosa", icon: Compass, tone: "bg-[var(--p50)] text-[var(--p800)]" },
  { key: "risks", title: "Xavflar", icon: AlertTriangle, tone: "bg-[#FFF3D9] text-[#865900]" },
  { key: "opportunities", title: "Imkoniyatlar", icon: TrendingUp, tone: "bg-[#E4F7E8] text-[#12691F]" },
  { key: "recommendations", title: "Tavsiyalar", icon: Lightbulb, tone: "bg-[#EEE9FB] text-[#4B3A99]" },
];

/**
 * Savdo maslahatchisi: tanlangan yil va TN VED bo'yicha eksport/import tahlili (lokal Gemma yoki raqamlarga asoslangan qoidalar),
 * savol berish va Word (.docx) hisobot. Raqamlar serverda bazadan olinadi, brauzer faqat yil, kod va savolni yuboradi.
 */
export default function TradeAdvisor({ year, hs }: { year?: number; hs?: string }) {
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState<TradeAdviceBlock | null>(null);
  const [asked, setAsked] = useState("");
  const [loading, setLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchTradeAdvice({ year, hs: hs || undefined, question: q || undefined });
      setAdvice(r.advice);
      setAsked(q);
    } catch {
      setError("Tahlilni tayyorlab bo'lmadi. Birozdan keyin qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const toDocx = async () => {
    setDocLoading(true);
    setError(null);
    try {
      await downloadTradeAdviceDocx({ year, hs: hs || undefined, question: asked || undefined });
    } catch {
      setError("Word faylini tayyorlab bo'lmadi.");
    } finally {
      setDocLoading(false);
    }
  };

  return (
    <section aria-labelledby="trade-advisor" className="overflow-hidden rounded-[28px] border border-[var(--pp-line)] bg-[var(--pp-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 text-white" style={{ background: "linear-gradient(135deg, var(--p800), var(--btn))" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Sparkles className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h2 id="trade-advisor" className="m-0 text-xl font-extrabold tracking-[-0.02em]">Savdo maslahatchisi</h2>
            <p className="m-0 text-sm text-white/85">Eksport va importni tahlil qiladi: xavf, imkoniyat va tavsiya{hs ? ` · TN VED ${hs}*` : ""}{year ? ` · ${year}-yil` : ""}</p>
          </div>
        </div>
        {advice && (
          <button type="button" onClick={toDocx} disabled={docLoading}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[var(--p800)] disabled:opacity-60">
            {docLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}
            Word (.docx) yuklab olish
          </button>
        )}
      </div>

      <div className="space-y-5 p-6">
        <form onSubmit={(e) => { e.preventDefault(); void run(question.trim()); }} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="advisor-q" className="sr-only">Maslahatchiga savol</label>
          <input id="advisor-q" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300}
            placeholder="Savol bering (ixtiyoriy), masalan: eksportni qaysi bozorlarga kengaytirish mumkin?"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-[var(--pp-line)] bg-[var(--pp-bg)] px-4 text-[15px] outline-none focus:border-[var(--btn)]" />
          <button type="submit" disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--btn)] px-6 text-[15px] font-bold text-white hover:brightness-110 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {question.trim() ? "Savolga javob olish" : "Tahlil qilish"}
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((q) => (
            <button key={q} type="button" onClick={() => { setQuestion(q); void run(q); }}
              className="rounded-full border border-[var(--pp-line)] px-3 py-1.5 text-[13px] text-[var(--pp-muted)] hover:border-[var(--btn)] hover:text-[var(--pp-text)]">{q}</button>
          ))}
        </div>

        {error && <p role="alert" className="m-0 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {loading && <p role="status" className="m-0 text-sm text-[var(--pp-muted)]">Raqamlar tahlil qilinmoqda…</p>}

        {advice && !loading && (
          <div className="space-y-4" aria-live="polite">
            {advice.answer && (
              <div className="rounded-2xl border border-[var(--btn)]/30 bg-[var(--p50)] p-4">
                {asked && <p className="m-0 mb-1 text-xs font-bold tracking-[0.08em] text-[var(--p800)]">SAVOL: {asked}</p>}
                <p className="m-0 text-[15px] leading-relaxed">{advice.answer}</p>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {SECTIONS.map(({ key, title, icon: Icon, tone }) => (advice[key].length > 0 && (
                <div key={key} className="rounded-2xl border border-[var(--pp-line)] p-4">
                  <h3 className="m-0 mb-2 flex items-center gap-2 text-[15px] font-extrabold">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${tone}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>{title}
                  </h3>
                  <ul className="m-0 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed">
                    {advice[key].map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              )))}
            </div>
            <p className="m-0 text-xs text-[var(--pp-muted)]">
              {advice.source === "ai"
                ? "Tahlil sun'iy intellekt (Gemma) tomonidan bazadagi raqamlar asosida tuzilgan, yo'riqnoma xarakterida va xato bo'lishi mumkin."
                : "Tahlil raqamlarga asoslangan qoidalar bo'yicha tuzilgan (AI hozir ulanmagan). Yo'riqnoma xarakterida."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
