import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  type AppNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";

const POLL_MS = 60_000;
const RECENT_LIMIT = 10;

interface NotificationsContextType {
  unreadCount: number;
  recent: AppNotification[];
  loadingRecent: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

/** Xabarnomalar endi bazada (B-05): o'qilgan holati sahifa yangilanganda yo'qolmaydi. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<AppNotification[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      setUnreadCount(await fetchUnreadCount());
    } catch {
      /* tarmoq xatosi — hisoblagich eski qiymatda qoladi */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingRecent(true);
    try {
      const [list, count] = await Promise.all([fetchNotifications({ limit: RECENT_LIMIT }), fetchUnreadCount()]);
      setRecent(list);
      setUnreadCount(count);
    } catch {
      /* UI bo'sh holatni ko'rsatadi */
    } finally {
      setLoadingRecent(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecent([]);
      return;
    }
    refreshCount();
    const timer = window.setInterval(refreshCount, POLL_MS);
    const onFocus = () => refreshCount();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, refreshCount]);

  const markRead = useCallback(async (id: number) => {
    await markNotificationRead(id);
    setRecent((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setRecent((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({ unreadCount, recent, loadingRecent, refresh, markRead, markAllRead }),
    [unreadCount, recent, loadingRecent, refresh, markRead, markAllRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
