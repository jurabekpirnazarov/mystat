import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationsContext";
import type { AppNotification } from "../../api/notifications";
import NotificationItem from "./NotificationItem";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

/** Header'dagi qo'ng'iroqcha: o'qilmaganlar soni + so'nggi 10 ta xabar. U-03. */
export default function NotificationBell() {
  const { unreadCount, recent, loadingRecent, refresh, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openNotification = async (n: AppNotification) => {
    if (!n.is_read) await markRead(n.id);
    setOpen(false);
    navigate("/cabinet", { state: { name: n.group === "contract" ? "contracts" : n.group === "payment" ? "payments" : "notifications" } });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Xabarnomalar${unreadCount ? `, ${unreadCount} ta o'qilmagan` : ""}`}
        aria-expanded={open}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-mg-border bg-mg-surface text-mg-heading shadow-sm transition hover:border-mg-primary/40 hover:text-mg-primary"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[1.15rem] h-[1.15rem] px-1 ring-2 ring-white bg-red-600 text-white rounded-full flex items-center justify-center text-[11px] font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-900 dark:text-white">Xabarnomalar</p>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-medium text-blue-600 hover:underline">
                Hammasini o'qilgan qilish
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto p-2 space-y-2">
            {loadingRecent && recent.length === 0 ? (
              <Skeleton rows={4} className="p-2" />
            ) : recent.length === 0 ? (
              <EmptyState title="Xabarnomalar yo'q" className="py-8" />
            ) : (
              recent.map((n) => (
                <NotificationItem key={n.id} notification={n} compact onOpen={openNotification} onMarkRead={(x) => markRead(x.id)} />
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/cabinet", { state: { name: "notifications" } });
            }}
            className="w-full px-4 py-3 text-sm font-medium text-blue-600 border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-b-xl"
          >
            Barchasini ko'rish
          </button>
        </div>
      )}
    </div>
  );
}
