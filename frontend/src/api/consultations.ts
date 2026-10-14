import axiosT from "./baseUrl";

export interface ConsultantInfo {
  id: number;
  name: string;
  title: string;
  bio: string;
  photo: string | null;
  topics: { id: number; name: string }[];
  free_slots?: number;
}

export interface Slot {
  id: number;
  starts_at: string;
  duration_min: number;
  format: "online" | "office";
  is_booked?: boolean;
}

export interface Booking {
  id: number;
  consultant: string;
  client: string;
  starts_at: string;
  duration_min: number;
  format: string;
  topic: string;
  question: string;
  status: "booked" | "done" | "cancelled";
  status_label: string;
  meeting_url: string;
  note: string;
  rating: number | null;
  rating_comment: string;
  created_at: string;
}

const base = "/consultations/";
export const fetchConsultants = async () => (await axiosT.get<ConsultantInfo[]>(base)).data;
export const fetchSlots = async (id: number, days = 21) =>
  (await axiosT.get<{ consultant: ConsultantInfo; slots: Slot[] }>(`${base}${id}/slots/`, { params: { days } })).data;
export const bookSlot = async (slot: number, topic: string, question: string) =>
  (await axiosT.post<Booking>(`${base}book/`, { slot, topic, question })).data;
export const fetchMyBookings = async () => (await axiosT.get<Booking[]>(`${base}my/`)).data;
export const cancelBooking = async (id: number) =>
  (await axiosT.delete<{ cancelled: boolean; limit_refunded: boolean }>(`${base}my/${id}/`)).data;
export const rateBooking = async (id: number, rating: number, rating_comment: string) =>
  (await axiosT.patch<Booking>(`${base}my/${id}/`, { rating, rating_comment })).data;
export const fetchSchedule = async () =>
  (await axiosT.get<{ consultant: ConsultantInfo; slots: Slot[]; bookings: Booking[] }>(`${base}schedule/`)).data;
export const addSlots = async (body: { weekdays: number[]; start: string; end: string; duration_min: number; weeks: number; format: string }) =>
  (await axiosT.post<{ created: number }>(`${base}schedule/`, body)).data;
export const updateScheduleBooking = async (id: number, body: { meeting_url?: string; note?: string; status?: "done" }) =>
  (await axiosT.patch<Booking>(`${base}schedule/bookings/${id}/`, body)).data;
