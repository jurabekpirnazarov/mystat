import { ArrowRight, Calculator, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ServiceModal from "./modals/ServiceModal";
import OfferTermsModal from "./modals/OfferTermsModal";
import { useOrder } from "../contexts/OrdersContext";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ContractNotificationModal from "./modals/ContractNotificationModal";
import { getServicePackages } from "../api/reports";
import type { ServicePackage } from "../types";
import { stripHtml } from "../utils/format";
import { formatInt } from "../utils/statPublic";

/**
 * Bosh sahifa: tarif paketlari. Narx — haqiqiy oraliq (API `price_range`: BHM × tarmoq koeffitsienti, QQSsiz);
 * ilgari hamma tarifda "412 000" (1 BHM) ko'rinardi, 4-tarif esa tarmoqqa qarab 16,5 mln gacha. Kartochkada faqat
 * paketdagi xizmat yo'nalishlari (ilgari 5 taga yetkazish uchun "API kirish", "24/7 yordam" qo'shilardi).
 * Tarif tanlash oqimi (ServiceModal -> oferta -> kabinet) o'zgarmagan.
 */

interface TariffCard {
  id: string;
  order: number;
  name: string;
  description: string;
  price: number;
  range: ServicePackage["price_range"];
  days: number;
  services: string[];
}

const plain = (html: string) => stripHtml(html).replace(/\s+/g, " ").replace(/:$/, "");

function toCards(packages: ServicePackage[]): TariffCard[] {
  return packages
    .map((pkg) => ({
      id: String(pkg.id),
      order: parseInt(pkg.name_uz, 10) || pkg.id,
      name: plain(pkg.name_uz || pkg.name_ru || pkg.name_cry),
      description: plain(pkg.description_uz || pkg.description_ru || pkg.description_cry),
      price: parseFloat(pkg.price) || 0,
      range: pkg.price_range,
      days: pkg.duration_days,
      services: pkg.package_services.map((s) => plain(s.name_uz || s.name_ru || s.name_cry)),
    }))
    .sort((a, b) => a.order - b.order);
}

function PriceBlock({ card }: { card: TariffCard }) {
  const r = card.range;
  const period = card.days >= 360 ? "yiliga" : card.days ? `${card.days} kunga` : "";
  if (r?.personal || !r || r.min === r.max) {
    return (
      <div>
        <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
          {card.price ? `${formatInt(card.price)}` : "—"} <span className="text-sm font-medium text-slate-500">so'm</span>
        </p>
        <p className="text-xs text-slate-500">{[period, "QQSsiz", r?.personal ? "tashkilotingiz tarmog'i bo'yicha" : null].filter(Boolean).join(" · ")}</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs text-slate-500">narxi</p>
      <p className="text-xl font-bold tabular-nums leading-tight text-slate-900 dark:text-white">
        {formatInt(r.min)} – {formatInt(r.max)} <span className="text-sm font-medium text-slate-500">so'm</span>
      </p>
      <p className="text-xs text-slate-500">{[period, "QQSsiz", "tashkilot tarmog'iga qarab"].filter(Boolean).join(" · ")}</p>
    </div>
  );
}

const TariffComponent = () => {
  const navigate = useNavigate();
  const { addItem } = useOrder();
  const { isAuthenticated, setNav } = useAuth();
  const [id, setId] = useState("");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const [cards, setCards] = useState<TariffCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getServicePackages()
      .then((response) => { setCards(toCards(response.results)); setError(null); })
      .catch((err) => { console.error("Error fetching service packages:", err); setError("Tarif paketlarini yuklashda xatolik yuz berdi"); })
      .finally(() => setLoading(false));
  }, []);

  const handlePayment = () => {
    setIsServiceModalOpen(false);
    navigate("/cabinet", { state: { name: "contracts", contract: true } });
  };

  const handleOffer = () => {
    setIsServiceModalOpen(false);
    setIsOffer(true);
  };

  const handleDirect = () => {
    if (id) addItem(id);
    navigate("/cabinet", { state: { name: "payments", contract: false } });
  };

  const onNext = (planId: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      setNav("");
    } else {
      setIsServiceModalOpen(true);
      setId(planId);
    }
  };

  return (
    <>
      <section aria-labelledby="tariffs-title" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="border-l-4 border-blue-900 pl-4 dark:border-blue-400">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-900 dark:text-blue-300">Pullik xizmatlar</p>
            <h2 id="tariffs-title" className="mt-1 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Tarif paketlari</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">
              Yuridik va jismoniy shaxslar uchun statistik xizmatlar to'plami. Narx BHM asosida, tashkilot tarmog'iga qarab.
            </p>
          </div>
          <Link to="/tariffs" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:border-blue-800 hover:text-blue-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            <Calculator className="h-4 w-4" aria-hidden="true" />Taqqoslash va narx kalkulyatori
          </Link>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-gray-700" />)
          ) : error ? (
            <div className="col-span-full rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              {error}
              <button type="button" onClick={() => window.location.reload()} className="ml-3 underline">Qayta yuklash</button>
            </div>
          ) : (
            cards.map((card) => (
              <article key={card.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                <header className="border-b border-slate-100 p-5 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 text-lg font-bold text-white dark:bg-blue-700">{card.order}</span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{card.name}</h3>
                      {card.description && <p className="truncate text-xs text-slate-500" title={card.description}>{card.description}</p>}
                    </div>
                  </div>
                  <div className="mt-4"><PriceBlock card={card} /></div>
                </header>

                <div className="flex flex-1 flex-col p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{card.services.length} ta xizmat yo'nalishi</p>
                  <ul className="flex-1 space-y-2.5">
                    {card.services.slice(0, 4).map((name) => (
                      <li key={name} className="flex gap-2 text-sm text-slate-700 dark:text-gray-200">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                        <span className="line-clamp-2" title={name}>{name}</span>
                      </li>
                    ))}
                    {card.services.length > 4 && (
                      <li className="pl-6 text-xs text-slate-500">va yana {card.services.length - 4} ta yo'nalish</li>
                    )}
                  </ul>
                  <div className="mt-5 space-y-2">
                    <button type="button" onClick={() => onNext(card.id)}
                      className="w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600">
                      Tarifni tanlash
                    </button>
                    <Link to={`/tariff/${card.id}`} className="flex w-full items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-blue-900 hover:bg-slate-50 dark:text-blue-300 dark:hover:bg-gray-700">
                      Tarkibi batafsil <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <ServiceModal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} onPayment={handlePayment} onOffer={handleOffer} id={id} />
      <OfferTermsModal isOpen={isOffer} onClose={() => setIsOffer(false)} onPayment={handleDirect} />
      <ContractNotificationModal isVisible={isContractModalOpen} onClose={() => setIsContractModalOpen(false)} />
    </>
  );
};

export default TariffComponent;
