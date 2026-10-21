import axiosT from "./baseUrl";

/** MYGOV_DIZAYN MG-10, MG-11: backend `apps/portal` (`/api/portal/`). */
export interface ServiceShortStats {
  usage: number;
  rating: number | null;
  ratings: number;
}
export interface ServiceStats {
  service_number: number;
  period: "all" | "year" | "month";
  usage_count: number;
  usage_total: number;
  since: string | null;
  rating_avg: number | null;
  rating_count: number;
  comment_count: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  monthly: { month: string; count: number }[];
  is_sample: boolean;
}
export interface Review {
  id: number;
  author: string;
  score: number;
  comment: string;
  created_at: string;
  is_sample: boolean;
  is_mine: boolean;
  helpful: number;
  unhelpful: number;
  my_vote: boolean | null;
}
export interface ReviewsResponse {
  count: number;
  results: Review[];
  my_review: { score: number; comment: string; is_published: boolean } | null;
}

let allStats: Promise<{ items: Record<string, ServiceShortStats>; is_sample: boolean }> | null = null;

/** Barcha xizmatlarning qisqa ko'rsatkichlari — sahifa davomida bir marta so'raladi. */
export function fetchAllServiceStats() {
  allStats ??= axiosT.get("/portal/services/stats/").then((r) => r.data).catch(() => {
    allStats = null;
    return { items: {}, is_sample: false };
  });
  return allStats;
}

export const fetchServiceStats = async (n: number, period = "all") =>
  (await axiosT.get<ServiceStats>(`/portal/services/${n}/stats/`, { params: { period } })).data;

export const recordServiceUse = (n: number) => axiosT.post(`/portal/services/${n}/use/`).catch(() => undefined);

export const fetchReviews = async (n: number, ordering = "recent", limit = 10) =>
  (await axiosT.get<ReviewsResponse>(`/portal/services/${n}/reviews/`, { params: { ordering, limit } })).data;

export const postReview = async (n: number, score: number, comment: string) => {
  allStats = null;
  return (await axiosT.post<{ moderation: boolean }>(`/portal/services/${n}/reviews/`, { score, comment })).data;
};

export const voteReview = async (id: number, helpful: boolean) =>
  (await axiosT.post<{ helpful: number; unhelpful: number; my_vote: boolean }>(`/portal/reviews/${id}/vote/`, { helpful })).data;

export const fetchPageFeedback = async (path: string) =>
  (await axiosT.get<{ likes: number; dislikes: number }>("/portal/page-feedback/", { params: { path } })).data;

export const postPageFeedback = (body: { path: string; liked: boolean; comment?: string; lang: string }) =>
  axiosT.post("/portal/page-feedback/", body);

export const postTypoReport = (body: { path: string; text: string; comment?: string; lang: string }) =>
  axiosT.post("/portal/typo-report/", body);
