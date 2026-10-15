import { Check, CreditCard, FileSignature, Info } from "lucide-react";
import type { AppNotification, NotificationGroup } from "../../api/notifications";
import { timeAgo } from "../../utils/format";
import DemoBadge from "../ui/DemoBadge";

export const GROUP_META: Record<NotificationGroup, { label: string; icon: typeof Info; color: string }> = {
  contract: { label: "Shartnoma", icon: FileSignature, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300" },
  payment: { label: "To'lov", icon: CreditCard, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  system: { label: "Tizim", icon: Info, color: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300" },
};

interface Props {
  notification: AppNotification;
  onOpen?: (n: AppNotification) => void;
  onMarkRead?: (n: AppNotification) => void;
  compact?: boolean;
}

export default function NotificationItem({ notification: n, onOpen, onMarkRead, compact = false }: Props) {
  const meta = GROUP_META[n.group] ?? GROUP_META.system;
  const Icon = meta.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(n)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen?.(n)}
      className={`flex gap-3 rounded-lg border p-3 text-left transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        n.is_read
          ? "border-gray-200 dark:border-gray-700"
          : "border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-900/10"
      } ${onOpen ? "cursor-pointer" : ""}`}
    >
      <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${meta.color}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-sm text-gray-900 dark:text-white truncate ${n.is_read ? "" : "font-semibold"}`}>{n.title}</p>
          <DemoBadge show={n.is_synthetic} />
        </div>
        {!compact && <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{n.message}</p>}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {meta.label} · {timeAgo(n.created_at)}
        </p>
      </div>
      {!n.is_read && onMarkRead && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(n);
          }}
          aria-label="O'qilgan deb belgilash"
          title="O'qilgan deb belgilash"
          className="self-start p-1.5 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
