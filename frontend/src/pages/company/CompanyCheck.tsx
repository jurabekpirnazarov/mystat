import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, FileDown, Search, ShieldCheck } from "lucide-react";
import { fetchCompanyCard, searchCompanies, type CardSearchRow, type CompanyCard } from "../../api/companyCard";
import { ApiErrorState, EmptyState, PageHeader, Skeleton } from "../../components/ui";
import CompanyScoreBadge from "../../components/company-score/CompanyScoreBadge";
import { CardBadges, CertificateLink, DisciplineBlock, PassportBlock, ProductionBlock } from "../../components/company-card/CardBlocks";
import { exportElementToPdf } from "../../utils/exportPdf";
import NotFoundCard from "../../components/company-card/NotFoundCard";
import { formatDateTime } from "../../utils/format";

/**
 * IHAMKOR_MUQOBIL.md IH-08: "Kontragentni tekshirish" — STIR yoki nom → bepul karta (pasport, xulosa belgilari,
 * statistik hisobotlar, ishlab chiqarish). Hammasi real manbalardan; ball faqat ochiq bo'lsa va belgisi bilan.
 * STIR URL'da (`/check?stir=`), havolani ulashish mumkin.
 */
export default function CompanyCheck() {
  const [params, setParams] = useSearchParams();
  const stir = params.get("stir") ?? "";
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(stir || q);
  const [card, setCard] = useState<CompanyCard | null>(null);
  const [rows, setRows] = useState<CardSearchRow[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Kontragentni tekshirish — my.stat.uz"; }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(null);
    if (/^\d{9}$/.test(stir)) {
      setLoading(true);
      setRows(null);
      fetchCompanyCard(stir, ctrl.signal).then(setCard)
        .catch((e) => { if (!ctrl.signal.aborted) { setError(e); setCard(null); } })
        .finally(() => !ctrl.signal.aborted && setLoading(false));
    } else if (q.length >= 3) {
      setLoading(true);
      setCard(null);
      searchCompanies(q, ctrl.signal).then(setRows)
        .catch((e) => !ctrl.signal.aborted && setError(e))
        .finally(() => !ctrl.signal.aborted && setLoading(false));
    } else {
      setCard(null);
      setRows(null);
    }
    return () => ctrl.abort();
  }, [stir, q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (/^\d{9}$/.test(v)) setParams({ stir: v });
    else if (v.length >= 3) setParams({ q: v });
  };

  return (
    <div className="py-2">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Kontragentni tekshirish"
          description="Bitim oldidan: korxonaning statistik rekvizitlari, majburiy hisobotlari va ishlab chiqarishi — rasmiy statistik manbalardan, bepul."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Xizmatlar", to: "/services" }, { label: "Kontragentni tekshirish" }]}
        />

        <form onSubmit={submit} className="mb-6 flex gap-2">
          <label htmlFor="check-q" className="sr-only">STIR yoki korxona nomi</label>
          <input id="check-q" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off"
            placeholder="STIR (9 raqam) yoki korxona nomi"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          <button type="submit" disabled={input.trim().length < 3}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            <Search className="h-4 w-4" aria-hidden="true" />Tekshirish
          </button>
        </form>

        {loading ? (
          <div className="space-y-4"><Skeleton variant="card" /><Skeleton variant="table" rows={5} /></div>
        ) : error && stir && (error as { response?: { status?: number } }).response?.status === 404 ? (
          <NotFoundCard stir={stir} onSearchByName={() => {
            setInput("");
            document.querySelector<HTMLInputElement>("main form input")?.focus();
          }} />
        ) : error ? (
          <ApiErrorState error={error} />
        ) : card ? (
          <div className="space-y-4">
          {/* IH-11: "Karta xulosasi" PDF — shu blok (sarlavha, belgilar, bo'limlar, izoh) sahifadagi ko'rinishida */}
          <div ref={cardRef} className="space-y-4">
            <p className="text-xs text-gray-500">my.stat.uz · Kontragent kartasi · {formatDateTime(new Date().toISOString())}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{card.passport.name ?? `STIR ${card.stir}`}</h2>
                <p className="text-sm text-gray-500">STIR {card.stir}{card.passport.okpo ? ` · OKPO ${card.passport.okpo}` : ""}</p>
              </div>
              {card.score && <CompanyScoreBadge score={card.score} size="md" to={card.links.profile} />}
            </div>
            <CardBadges badges={card.badges} />
            <PassportBlock p={card.passport} />
            <div className="grid gap-4 lg:grid-cols-2">
              <DisciplineBlock d={card.discipline} />
              <ProductionBlock p={card.production} />
            </div>
            <p className="flex gap-2 text-xs text-gray-500"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{card.note}</p>
          </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pdfBusy}
                onClick={async () => {
                  if (!cardRef.current) return;
                  setPdfBusy(true);
                  try { await exportElementToPdf(cardRef.current, `kontragent-${card.stir}.pdf`, !!card.score?.is_synthetic); }
                  finally { setPdfBusy(false); }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:border-blue-300 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                <FileDown className="h-4 w-4 text-blue-600" aria-hidden="true" />{pdfBusy ? "Tayyorlanmoqda..." : "Karta xulosasi (PDF)"}
              </button>
              <CertificateLink to={card.links.certificate} />
              <Link to="/methodology/company-card" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-blue-700 dark:text-gray-300">
                <BookOpen className="h-4 w-4" aria-hidden="true" />Manbalar va cheklovlar
              </Link>
              {card.score && (
                <Link to={card.links.profile} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Korxona profili va ball tarkibi <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        ) : rows ? (
          rows.length === 0 ? (
            <EmptyState title="Korxona topilmadi" description="STIR'ni to'liq (9 raqam) kiriting yoki nomning boshqa qismini yozing." />
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
              {rows.map((r) => (
                <li key={r.stir}>
                  <Link to={`/check?stir=${r.stir}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-900 dark:text-white">{r.name}</span>
                      <span className="text-xs text-gray-500">
                        STIR {r.stir}{r.district ? ` · ${r.district}` : ""}{r.products ? ` · ${r.products} mahsulot turi` : ""}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="text-sm text-gray-500">STIR yoki korxona nomini kiriting. Karta bepul va ro'yxatdan o'tishni talab qilmaydi.</p>
        )}
      </div>
    </div>
  );
}
