import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { fetchContractPreview } from "../../api/contracts";
import useApi from "../../hooks/useApi";
import { ApiErrorState, Skeleton } from "../ui";
import { formatMoney } from "../../utils/format";

interface Props {
  packageId: number;
  pending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

const LABELS: [keyof Awaited<ReturnType<typeof fetchContractPreview>>["requisites"], string][] = [
  ["name", "Korxona nomi"],
  ["tin", "STIR"],
  ["director", "Rahbar"],
  ["address", "Manzil"],
  ["district", "Tuman"],
  ["sector", "Tarmoq (OKED)"],
];

/**
 * K-01 + K-08: shartnoma yaratishdan oldin rekvizitlarni tekshirish va matnni oldindan ko'rish.
 * Bu bosqich bazaga hech narsa yozmaydi; "Tasdiqlayman" belgilanmaguncha shartnoma yaratilmaydi.
 */
export default function ContractConfirm({ packageId, pending, onBack, onConfirm }: Props) {
  const { data, loading, error, reload } = useApi(() => fetchContractPreview(packageId), [packageId]);
  const [confirmed, setConfirmed] = useState(false);
  const [showText, setShowText] = useState(false);

  return (
    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
      {loading && !data ? (
        <Skeleton variant="table" rows={6} />
      ) : error ? (
        <ApiErrorState
          error={error}
          onRetry={reload}
          notFoundAction={<Link to="/cabinet" state={{ name: "profile" }} className="text-blue-600 underline">Profilga o'tish</Link>}
        />
      ) : data ? (
        <>
          <div>
            <h3 className="font-semibold mb-2">Rekvizitlarni tekshiring</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              {LABELS.map(([key, label]) => (
                <div key={key} className="sm:contents">
                  <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className={`sm:col-span-2 ${data.requisites[key] ? "" : "text-red-600"}`}>
                    {data.requisites[key] || "ko'rsatilmagan"}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-gray-500">
              Xato bo'lsa, avval{" "}
              <Link to="/cabinet" state={{ name: "profile" }} className="text-blue-600 underline">
                profilda tuzating
              </Link>{" "}
              — shartnomaga aynan shu ma'lumotlar tushadi.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-sm">
            <div className="flex justify-between"><span>Paket</span><b>{data.package.name}</b></div>
            <div className="flex justify-between"><span>Narx (QQSsiz)</span><span>{formatMoney(data.pricing.price)}</span></div>
            <div className="flex justify-between"><span>QQS {data.pricing.vat_percent}%</span><span>{formatMoney(data.pricing.vat)}</span></div>
            <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
              <span>Jami</span><span>{formatMoney(data.pricing.total)}</span>
            </div>
          </div>

          <div>
            <button type="button" onClick={() => setShowText((v) => !v)} aria-expanded={showText}
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" /> Shartnoma matnini ko'rish {showText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showText && (
              <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-3 max-h-64 overflow-y-auto">
                {!data.template_found && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">To'liq shablon bu muhitda topilmadi — asosiy shartlar qisqacha ko'rsatilmoqda.</p>
                )}
                {data.parts.map((p, i) => (
                  <div key={i}>
                    <p className="font-semibold">{p.title}</p>
                    <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{p.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>Rekvizitlarni tekshirdim va tasdiqlayman. Shartnoma DIDOX orqali imzolash uchun yuboriladi.</span>
          </label>
          <p className="text-xs text-gray-500">To'lov shartnoma imzolangandan keyin bank o'tkazmasi orqali amalga oshiriladi.</p>
        </>
      ) : null}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="w-1/3 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600">
          Orqaga
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!confirmed || pending || !data}
          className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Shartnoma tuzish
        </button>
      </div>
    </div>
  );
}
