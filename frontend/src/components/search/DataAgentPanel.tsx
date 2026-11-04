import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Bot, Check, ChevronDown, Download, Eye, History, Loader2, ShoppingCart, X } from "lucide-react";
import {
  agentAccept, agentDecline, agentDownload, agentHistory, agentQuote,
  type AgentItem, type AgentPurchase, type AgentQuote,
} from "../../api/dataAgent";
import { formatSom, notifyCreditsChanged } from "../../api/credits";
import { useAuth } from "../../contexts/AuthContext";
import { loginUrl } from "../../utils/loginRedirect";
import DataPreview, { SamplePeek } from "./DataPreview";

/** Savdo ma'lumoti so'rovi: "shakar eksport", "1701 import 2024" ... Boshqa so'rovlarda agent chaqirilmaydi. */
export const TRADE_INTENT = /eksport|import|export|экспорт|импорт|\b\d{4,6}\b|tashqi savdo/i;

const money = (n: number) => formatSom(n);

/**
 * AI agent paneli: so'rov bo'yicha tashqi savdo ma'lumotini topadi, to'plamlar va narxni (server hisoblaydi) ko'rsatadi.
 * Foydalanuvchi "Qabul qilaman" desa hamyondan yechiladi; "Rad etaman" desa taklif o'chadi. Sotib olingan to'plam
 * (ma'lumot + davr) qayta to'lovsiz yuklanadi va tarixda turadi. Agent pul yechmaydi: faqat topadi va narxlaydi.
 */
export default function DataAgentPanel({ query }: { query: string }) {
  const { isAuthenticated } = useAuth();
  const [quote, setQuote] = useState<AgentQuote | null>(null);
  const [hs, setHs] = useState("");
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; short?: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AgentPurchase[] | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => setHs(""), [query]);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setDismissed(false);
    agentQuote({ query, hs: hs || undefined }, signal)
      .then((q) => {
        setQuote(q);
        setPicked(new Set(q.items.filter((i) => !i.owned).map((i) => i.id)));
      })
      .catch((e) => !axios.isCancel(e) && setQuote(null))
      .finally(() => !signal?.aborted && setLoading(false));
    // isAuthenticated: kirgandan keyin taklif (offer) qayta tuziladi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, hs, isAuthenticated]);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => load(ctrl.signal), 500);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [load]);

  const loadHistory = useCallback(() => agentHistory().then(setHistory).catch(() => setHistory([])), []);
  useEffect(() => {
    if (showHistory && isAuthenticated) void loadHistory();
  }, [showHistory, isAuthenticated, loadHistory]);

  if (dismissed) return null;
  if (loading && !quote) {
    return <section className="mt-8 flex items-center gap-3 rounded-[20px] border border-mg-border bg-mg-surface p-5 text-sm text-mg-muted" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />AI agent savdo ma'lumotini qidirmoqda…</section>;
  }
  if (!quote || (!quote.found && !quote.questions.length && !quote.message)) return null;

  const chosen = quote.items.filter((i) => picked.has(i.id) && !i.owned);
  const subtotal = chosen.reduce((a, i) => a + i.price, 0);
  const pct = chosen.length >= 3 ? quote.bundle?.["3"] ?? 0 : chosen.length === 2 ? quote.bundle?.["2"] ?? 0 : 0;
  const step = quote.round_to ?? 500;
  const total = pct ? Math.ceil((subtotal * (100 - pct)) / 100 / step) * step : subtotal;
  const balance = quote.balance ?? 0;
  const short = total - balance;

  const toggleOpen = (id: string) => setOpen((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const accept = async () => {
    if (!quote.offer_id) return;
    setBusy(true);
    setError(null);
    try {
      const r = await agentAccept(quote.offer_id, chosen.map((i) => i.id));
      notifyCreditsChanged(r.balance);
      load();
      if (showHistory) void loadHistory();
    } catch (e) {
      const d = axios.isAxiosError(e) ? e.response?.data as { code?: string; detail?: string; required?: number; balance?: number } | undefined : undefined;
      if (d?.code === "insufficient") setError({ text: "Hamyonda mablag' yetarli emas.", short: (d.required ?? total) - (d.balance ?? balance) });
      else setError({ text: d?.detail ?? "Qabul qilib bo'lmadi. Qayta urinib ko'ring." });
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (quote.offer_id) await agentDecline(quote.offer_id).catch(() => undefined);
    setDismissed(true);
  };

  const dl = (p: Pick<AgentPurchase, "id" | "kind" | "hs">, file: "xlsx" | "csv") => agentDownload(p, file).catch(() => setError({ text: "Faylni yuklab bo'lmadi." }));
  const itemPurchase = (i: AgentItem) => (i.purchase_id ? { id: i.purchase_id, kind: i.kind, hs: quote.product?.code ?? "" } : null);

  return (
    <section className="mt-8 overflow-hidden rounded-[24px] border border-[var(--btn)]/30 bg-mg-surface" aria-labelledby="data-agent">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-white" style={{ background: "linear-gradient(135deg, var(--p800), var(--btn))" }}>
        <h2 id="data-agent" className="m-0 flex items-center gap-2 text-lg font-extrabold"><Bot className="h-5 w-5" aria-hidden="true" />AI agent: savdo ma'lumoti</h2>
        {isAuthenticated && (
          <button type="button" onClick={() => setShowHistory((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25">
            <History className="h-4 w-4" aria-hidden="true" />Sotib olinganlar
          </button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {quote.message && <p className="m-0 text-[15px] text-mg-muted">{quote.message}</p>}

        {quote.questions.map((q) => (
          <div key={q.id}>
            <p className="m-0 mb-2 font-semibold">{q.text}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((o) => (
                <button key={o.value} type="button" onClick={() => setHs(o.value)}
                  className="rounded-2xl border border-mg-border px-4 py-2.5 text-left text-sm hover:border-[var(--btn)] hover:bg-mg-info">
                  {o.label}{o.suggested && <span className="ml-2 rounded-full bg-[var(--p50)] px-2 py-0.5 text-xs font-semibold text-[var(--p800)]">tavsiya</span>}
                </button>
              ))}
            </div>
          </div>
        ))}

        {quote.found && quote.product && (
          <>
            <p className="m-0 text-[15px]">
              <b>{quote.product.name}</b> (HS {quote.product.code}) bo'yicha {quote.flows.length === 2 ? "eksport va import" : quote.flows[0] === 1 ? "eksport" : "import"} ma'lumoti topildi.
              Kerakli to'plamlarni tanlang; narxni ko'rib, qabul qilsangiz hamyondan yechiladi.
            </p>
            {!!quote.warnings?.length && (
              <div role="note" className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                <b>Ma'lumot sifati:</b> {quote.warnings.join(" · ")}
              </div>
            )}
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {quote.items.map((i) => {
                const p = itemPurchase(i);
                return (
                  <li key={i.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${i.owned ? "border-[#1eb53a]/40 bg-[#E4F7E8]/40 dark:bg-transparent" : "border-mg-border"}`}>
                    {i.owned
                      ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1eb53a] text-white" aria-label="Sotib olingan"><Check className="h-4 w-4" aria-hidden="true" /></span>
                      : <input type="checkbox" checked={picked.has(i.id)} onChange={() => toggle(i.id)} disabled={!quote.offer_id} aria-label={i.title} className="h-5 w-5 accent-[var(--btn)]" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{i.title} <span className="font-normal text-mg-muted">· {i.rows} qator</span></span>
                      <span className="block text-[13px] text-mg-muted">{i.description}</span>
                      {i.sample && <span className="mt-0.5 block text-[13px] text-mg-muted">{i.sample.coverage}</span>}
                    </span>
                    {i.owned && p ? (
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#12691F]">Sotib olingan, qayta to'lov yo'q</span>
                        <button type="button" onClick={() => dl(p, "xlsx")} className="inline-flex items-center gap-1 rounded-full border border-mg-border px-3 py-1 text-xs font-semibold hover:bg-mg-info"><Download className="h-3.5 w-3.5" aria-hidden="true" />XLSX</button>
                        <button type="button" onClick={() => dl(p, "csv")} className="rounded-full border border-mg-border px-3 py-1 text-xs font-semibold hover:bg-mg-info">CSV</button>
                      </span>
                    ) : (
                      <span className="mono text-[15px] font-bold">{money(i.price)}</span>
                    )}
                    {i.owned && p && (
                      <button type="button" onClick={() => toggleOpen(i.id)} aria-expanded={open.has(i.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--btn)] px-3 py-1 text-xs font-bold text-white hover:brightness-110">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />Ma'lumotni ko'rish
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open.has(i.id) ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                    )}
                    {i.owned && p && open.has(i.id) && <DataPreview purchaseId={p.id} />}
                    {i.sample && <SamplePeek sample={i.sample} />}
                  </li>
                );
              })}
            </ul>

            {chosen.length > 0 && (
              <div className="rounded-2xl bg-[var(--p50)] p-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="text-sm text-mg-text">
                    {pct > 0 && <p className="m-0">Jami {money(subtotal)}, to'plam chegirmasi {pct}%</p>}
                    <p className="m-0 text-lg font-extrabold">To'lov: {money(total)}</p>
                    {isAuthenticated && <p className="m-0 text-xs text-mg-muted">Hamyon balansi: {money(balance)}</p>}
                  </div>
                  {isAuthenticated ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={accept} disabled={busy || short > 0}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--btn)] px-5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
                        Qabul qilaman: {money(total)} yechiladi
                      </button>
                      <button type="button" onClick={decline} className="inline-flex h-11 items-center gap-1.5 rounded-full border border-mg-border px-4 text-sm font-semibold hover:bg-mg-surface"><X className="h-4 w-4" aria-hidden="true" />Rad etaman</button>
                    </div>
                  ) : (
                    <Link to={loginUrl(`/search?q=${encodeURIComponent(query)}`)} className="inline-flex h-11 items-center rounded-full bg-[var(--btn)] px-5 text-sm font-bold text-white hover:no-underline">
                      Sotib olish uchun kirish / ro'yxatdan o'tish
                    </Link>
                  )}
                </div>
                {isAuthenticated && short > 0 && (
                  <p role="alert" className="m-0 mt-3 text-sm text-[#B3263F]">Hamyonda {money(short)} yetishmaydi. <Link to="/cabinet/credits" className="font-semibold">Hamyonni to'ldirish</Link></p>
                )}
              </div>
            )}
            {chosen.length === 0 && quote.items.every((i) => i.owned) && <p className="m-0 text-sm text-[#12691F]">Barcha to'plamlar sotib olingan: yuqoridan qayta to'lovsiz yuklab oling.</p>}
          </>
        )}

        {error && (
          <p role="alert" className="m-0 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.text}{error.short ? ` ${money(error.short)} yetishmaydi.` : ""}{error.short ? <> <Link to="/cabinet/credits" className="font-semibold">Hamyonni to'ldirish</Link></> : null}
          </p>
        )}

        {showHistory && isAuthenticated && (
          <div className="rounded-2xl border border-mg-border p-4">
            <h3 className="m-0 mb-2 text-[15px] font-extrabold">Sotib olingan ma'lumotlar tarixi</h3>
            {!history ? <p className="m-0 text-sm text-mg-muted">Yuklanmoqda…</p> : history.length === 0 ? <p className="m-0 text-sm text-mg-muted">Hali sotib olinmagan.</p> : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {history.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1"><b>{p.title}</b> · HS {p.hs} · {p.flows.join(", ")} · {new Date(p.created_at).toLocaleDateString("uz-UZ")} · {money(p.price)}
                      <span className="block text-xs text-mg-muted">So'rov: {p.query}</span></span>
                    <button type="button" onClick={() => dl(p, "xlsx")} className="inline-flex items-center gap-1 rounded-full border border-mg-border px-3 py-1 text-xs font-semibold hover:bg-mg-info"><Download className="h-3.5 w-3.5" aria-hidden="true" />XLSX</button>
                    <button type="button" onClick={() => dl(p, "csv")} className="rounded-full border border-mg-border px-3 py-1 text-xs font-semibold hover:bg-mg-info">CSV</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="m-0 text-xs text-mg-muted">Agent faqat ma'lumotni topadi va narxni hisoblaydi. Pul faqat siz "Qabul qilaman" bosganingizda yechiladi. Bir marta sotib olingan ma'lumot va davr qayta to'lovsiz ochiladi.</p>
      </div>
    </section>
  );
}
