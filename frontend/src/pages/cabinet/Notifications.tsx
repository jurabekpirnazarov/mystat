import { useState } from "react";
import { BellOff } from "lucide-react";
import { fetchNotifications, type AppNotification, type NotificationGroup } from "../../api/notifications";
import { useNotifications } from "../../contexts/NotificationsContext";
import useApi from "../../hooks/useApi";
import NotificationItem, { GROUP_META } from "../../components/notifications/NotificationItem";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";

const PAGE = 20;

interface Props {
  onNavigate: (tab: string) => void;
}

/** Kabinetdagi to'liq xabarnomalar ro'yxati: tur va holat bo'yicha filtr. U-03. */
export default function Notifications({ onNavigate }: Props) {
  const [group, setGroup] = useState<NotificationGroup | "">("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const { markRead, markAllRead, unreadCount } = useNotifications();

  const { data, loading, error, reload } = useApi(
    () => fetchNotifications({ group: group || undefined, is_read: unreadOnly ? false : undefined }),
    [group, unreadOnly]
  );
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const items = (data ?? []).map((n) => (overrides[n.id] ? { ...n, is_read: true } : n));

  const handleRead = async (n: AppNotification) => {
    await markRead(n.id);
    setOverrides((o) => ({ ...o, [n.id]: true }));
  };

  const handleOpen = async (n: AppNotification) => {
    if (!n.is_read) await handleRead(n);
    if (n.group === "contract") onNavigate("contracts");
    else if (n.group === "payment") onNavigate("payments");
  };

  const handleAllRead = async () => {
    await markAllRead();
    reload();
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition ${
      active
        ? "bg-blue-600 border-blue-600 text-white"
        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
    }`;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Xabarnomalar</h2>
        {unreadCount > 0 && (
          <button type="button" onClick={handleAllRead} className="text-sm font-medium text-blue-600 hover:underline">
            Hammasini o'qilgan qilish ({unreadCount})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filtr">
        <button type="button" className={chip(group === "")} onClick={() => setGroup("")}>Hammasi</button>
        {(Object.keys(GROUP_META) as NotificationGroup[]).map((g) => (
          <button key={g} type="button" className={chip(group === g)} onClick={() => setGroup(g)}>
            {GROUP_META[g].label}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="rounded" />
          Faqat o'qilmaganlar
        </label>
      </div>

      {loading && !data ? (
        <Skeleton rows={6} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon={BellOff} title="Xabarnomalar yo'q" description="Yangi xabarlar shu yerda paydo bo'ladi." />
      ) : (
        <div className="space-y-2">
          {items.slice(0, visible).map((n) => (
            <NotificationItem key={n.id} notification={n} onOpen={handleOpen} onMarkRead={handleRead} />
          ))}
          {items.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE)}
              className="w-full mt-2 py-2 text-sm font-medium text-blue-600 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              Yana ko'rsatish ({items.length - visible})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
