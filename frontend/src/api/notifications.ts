import axiosT from "./baseUrl";

export type NotificationGroup = "contract" | "payment" | "system";

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type: string;
  group: NotificationGroup;
  is_synthetic: boolean;
}

export interface NotificationFilters {
  is_read?: boolean;
  group?: NotificationGroup;
  limit?: number;
}

export const fetchNotifications = async (filters: NotificationFilters = {}): Promise<AppNotification[]> => {
  const params: Record<string, string> = {};
  if (filters.is_read !== undefined) params.is_read = String(filters.is_read);
  if (filters.group) params.group = filters.group;
  if (filters.limit) params.limit = String(filters.limit);
  const { data } = await axiosT.get<AppNotification[]>("/notifications/me", { params });
  return data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const { data } = await axiosT.get<{ count: number }>("/notifications/me/unread-count/");
  return data.count;
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await axiosT.patch(`/notifications/me/${id}`, { is_read: true });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await axiosT.patch("/notifications/me");
};
