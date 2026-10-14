import { Link } from "react-router-dom";
import { Lock, Info } from "lucide-react";
import { asApiError } from "../../api/errors";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

interface Props {
  error: unknown;
  onRetry?: () => void;
  /** 404 (ma'lumot/profil yo'q) holatida qo'shimcha harakat, masalan profilga havola */
  notFoundAction?: React.ReactNode;
}

/**
 * Xizmat xatolari uchun umumiy holat:
 * 403 + upgrade_url — paket limiti tugagan; 404 — tushuntiruvchi bo'sh holat; boshqasi — qayta urinish.
 */
export default function ApiErrorState({ error, onRetry, notFoundAction }: Props) {
  const res = asApiError(error).response;
  const data = res?.data ?? {};
  const detail = typeof data.detail === "string" ? data.detail : undefined;
  if (res?.status === 403 && typeof data.upgrade_url === "string") {
    return (
      <EmptyState
        icon={Lock}
        title="Paket limiti tugagan"
        description={detail ?? "Bu xizmatdan foydalanish uchun paketni kengaytiring."}
        action={
          <Link to={data.upgrade_url} className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Paketni kengaytirish
          </Link>
        }
      />
    );
  }
  if (res?.status === 404 && detail) {
    return <EmptyState icon={Info} title={detail} action={notFoundAction} />;
  }
  return <ErrorState onRetry={onRetry} />;
}
