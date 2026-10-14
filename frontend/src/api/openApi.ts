import axiosT from "./baseUrl";

export interface ApiKeyRow {
  id: number;
  name: string;
  prefix: string;
  daily_limit: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  used_today: number;
}

export interface Subscription {
  id: number;
  indicator: string;
  title: string;
  channel: "in_app" | "email" | "telegram";
  channel_label: string;
  is_active: boolean;
  created_at: string;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  events: { id: number; indicator: string; title: string; link: string; date: string }[];
  telegram: { connected: boolean; link: string | null; bot_configured: boolean };
  email: { address: string | null };
  indicators: { code: string; name: string }[];
}

export const listKeys = async () => (await axiosT.get<ApiKeyRow[]>("/open/keys/")).data;
export const createKey = async (name: string) =>
  (await axiosT.post<{ id: number; name: string; prefix: string; key: string; warning: string }>("/open/keys/", { name })).data;
export const revokeKey = async (id: number) => axiosT.delete(`/open/keys/${id}/`);
export const keyUsage = async (id: number) =>
  (await axiosT.get<{ id: number; usage: { date: string; requests: number }[]; endpoints: { endpoint: string; n: number }[] }>(`/open/keys/${id}/`)).data;

export const fetchSubscriptions = async () => (await axiosT.get<SubscriptionsResponse>("/notifications/subscriptions/")).data;
export const subscribe = async (indicator: string, channel: Subscription["channel"], title = "") =>
  (await axiosT.post<Subscription>("/notifications/subscriptions/", { indicator, channel, title })).data;
export const unsubscribe = async (id: number) => axiosT.delete(`/notifications/subscriptions/${id}/`);
