import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = "Ma'lumotni yuklab bo'lmadi",
  description = "Internet aloqasini tekshirib, qayta urinib ko'ring.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Qayta urinish
        </button>
      )}
    </div>
  );
}
