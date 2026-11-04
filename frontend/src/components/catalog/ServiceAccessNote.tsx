import { Link } from "react-router-dom";
import { Lock, Wallet } from "lucide-react";
import type { ServiceCatalogItem } from "../../config/serviceCatalog";
import { useAuth } from "../../contexts/AuthContext";
import { useLang } from "../../i18n/LangContext";
import { loginUrl } from "../../utils/loginRedirect";

/**
 * Qidiruv natijasidagi xizmat ostida: tarif/kirish sharti va keyingi qadam.
 * Mehmon uchun — xizmat auditoriyasiga mos rol bilan kirish/ro'yxatdan o'tish (`/login?role=…&next=…`);
 * kirganga — tarif paketi bo'lsa limit va "Tariflar" havolasi.
 */
export default function ServiceAccessNote({ s }: { s: ServiceCatalogItem }) {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  if (s.status !== "live" || s.access === "open") return null;
  const role = s.users === "legal" ? "legal" : s.users === "individual" ? "individual" : undefined;
  const tariffBased = s.access === "package" || s.access === "priced" || s.access === "credits";
  return (
    <div className="-mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-b-mg border border-t-0 border-mg-border bg-mg-info px-4 py-2 text-[13px] text-mg-text">
      {tariffBased ? <Wallet className="h-4 w-4 shrink-0 text-mg-primary" aria-hidden="true" /> : <Lock className="h-4 w-4 shrink-0 text-mg-primary" aria-hidden="true" />}
      <span className="min-w-0 flex-1">{t(s.price)}</span>
      {!isAuthenticated && (
        <Link to={loginUrl(s.route, role)} className="font-semibold text-mg-primary hover:underline">
          {t({ uz: "Kirish / ro'yxatdan o'tish", ru: "Войти / зарегистрироваться" })}
        </Link>
      )}
      {tariffBased && <Link to="/tariffs" className="font-semibold text-mg-primary hover:underline">{t({ uz: "Tariflar", ru: "Тарифы" })}</Link>}
    </div>
  );
}
