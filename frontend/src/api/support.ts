import axiosT from "./baseUrl";

export interface SearchItem {
  id: number | string;
  title: string;
  subtitle: string;
  url: string;
}
export interface SearchGroup {
  type: string;
  label: string;
  items: SearchItem[];
}

export const globalSearch = async (q: string) =>
  (await axiosT.get<{ query: string; groups: SearchGroup[] }>("/common/search/", { params: { q } })).data.groups;

export interface AssistantReply {
  found: boolean;
  answers: { id: number; question: string; answer: string; url: string }[];
  links: { title: string; url: string }[];
}

export const askAssistant = async (message: string) =>
  (await axiosT.post<AssistantReply>("/common/assistant/", { message })).data;

export interface SupportMessage {
  text: string;
  from_operator: boolean;
  created_at: string;
}
export interface SupportThread {
  id: number;
  created_at: string;
  messages: SupportMessage[];
  token?: string;
}

export const startSupportThread = async (payload: { text: string; name?: string; phone_number?: string }) =>
  (await axiosT.post<SupportThread>("/common/support/", payload)).data;

export const fetchSupportThread = async (id: number, token?: string) =>
  (await axiosT.get<SupportThread>(`/common/support/${id}/`, { params: token ? { token } : {} })).data;

export const postSupportMessage = async (id: number, text: string, token?: string) =>
  (await axiosT.post<SupportThread>(`/common/support/${id}/`, { text }, { params: token ? { token } : {} })).data;
