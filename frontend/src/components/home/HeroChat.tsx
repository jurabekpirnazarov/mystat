import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Send, Sparkles, X } from "lucide-react";
import axiosT from "../../api/baseUrl";
import { SERVICES, matchesFilters, type ServiceCatalogItem } from "../../config/serviceCatalog";
import { translate, useLang } from "../../i18n/LangContext";
import { searchUrl } from "../../config/searchFilters";
import { TRADE_INTENT } from "../search/DataAgentPanel";

interface Msg {
  role: "user" | "assistant";
  content: string;
  links?: { title: string; url: string }[];
  services?: ServiceCatalogItem[];
  tradeQuery?: string;
}

const QUICK = ["Hisobotni qanday topshiraman?", "Korxonani qanday tekshiraman?", "Shakar eksporti haqida ma'lumot kerak", "Tariflar qanday?"];

/** Eng mos 3 ta xizmat (katalogdan, mijoz tomonida: AI'ga katalog yuborilmaydi). */
const relatedServices = (text: string) => {
  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const seen = new Map<number, ServiceCatalogItem>();
  for (const w of words) for (const s of SERVICES) if (s.status === "live" && !seen.has(s.number) && matchesFilters(s, null, null, w)) seen.set(s.number, s);
  return [...seen.values()].slice(0, 3);
};

/**
 * Bosh sahifa hero'sidagi chatbot: savolga FAQ manbasiga tayanib (AI yoqilgan bo'lsa Gemma, bo'lmasa FAQ) javob beradi,
 * mos xizmatlarni ko'rsatadi, tashqi savdo so'rovini qidiruvga (AI agent, ma'lumot va narx) yo'naltiradi.
 */
export default function HeroChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "Salom! Men my.stat.uz yordamchisiman. Xizmatlar, hisobot topshirish, tariflar yoki statistik ma'lumotlar bo'yicha so'rang." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const send = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const history = next.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const r = await axiosT.post<{ answer: string; source: string; links: { title: string; url: string }[] }>("/common/chat/", { messages: history });
      setMsgs([...next, { role: "assistant", content: r.data.answer, links: r.data.links, services: relatedServices(q), tradeQuery: TRADE_INTENT.test(q) ? q : undefined }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Hozir javob bera olmayapman. Birozdan keyin qayta urinib ko'ring yoki murojaat yuboring.", links: [{ title: "Murojaat yuborish", url: "/contact" }] }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Chatbot" className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:justify-end sm:p-6" onClick={onClose}>
      <div className="flex h-[min(640px,92vh)] w-full max-w-[440px] flex-col overflow-hidden rounded-[24px] bg-[var(--pp-card)] text-[var(--pp-text)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 text-white" style={{ background: "linear-gradient(135deg, var(--p800), var(--btn))" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15"><Bot className="h-5 w-5" aria-hidden="true" /></span>
            <div className="leading-tight"><b className="block text-base">AI yordamchi</b><span className="text-xs text-white/80">Savolingizga javob beradi</span></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-full p-2 hover:bg-white/15"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] space-y-2 rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${m.role === "user" ? "bg-[var(--btn)] text-white" : "bg-[var(--pp-soft)]"}`}>
                <p className="m-0 whitespace-pre-wrap">{m.content}</p>
                {m.tradeQuery && (
                  <button type="button" onClick={() => { onClose(); navigate(searchUrl(m.tradeQuery!)); }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--btn)] px-3 py-1.5 text-xs font-bold text-white">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />Ma'lumot va narxni ko'rish
                  </button>
                )}
                {m.services?.map((s) => (
                  <Link key={s.number} to={`/service/${s.number}`} onClick={onClose} className="block rounded-xl border border-[var(--pp-line)] bg-[var(--pp-card)] px-3 py-2 text-[13px] font-semibold text-[var(--pp-text)] hover:no-underline">
                    {translate(s.title, "uz")}<span className="block text-xs font-normal text-[var(--pp-muted)]">{translate(s.duration, "uz")}</span>
                  </Link>
                ))}
                {m.links?.slice(0, 3).map((l) => <Link key={l.url + l.title} to={l.url} onClick={onClose} className="block text-[13px] font-semibold">{l.title} →</Link>)}
              </div>
            </div>
          ))}
          {busy && <div className="flex"><div className="rounded-2xl bg-[var(--pp-soft)] px-4 py-2.5 text-sm text-[var(--pp-muted)]" role="status">Yozmoqda…</div></div>}
          <div ref={end} />
        </div>

        {msgs.length < 3 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {QUICK.map((q) => <button key={q} type="button" onClick={() => void send(q)} className="rounded-full border border-[var(--pp-line)] px-3 py-1.5 text-xs text-[var(--pp-muted)] hover:border-[var(--btn)] hover:text-[var(--pp-text)]">{q}</button>)}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); void send(text); }} className="flex gap-2 border-t border-[var(--pp-line)] p-3">
          <label htmlFor="hero-chat-q" className="sr-only">{t({ uz: "Savol", ru: "Вопрос" })}</label>
          <input id="hero-chat-q" ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Savolingizni yozing…"
            className="h-11 min-w-0 flex-1 rounded-2xl border border-[var(--pp-line)] bg-[var(--pp-bg)] px-4 text-[14px] outline-none focus:border-[var(--btn)]" />
          <button type="submit" disabled={busy || !text.trim()} aria-label="Yuborish" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--btn)] text-white disabled:opacity-50"><Send className="h-4 w-4" aria-hidden="true" /></button>
        </form>
      </div>
    </div>
  );
}
