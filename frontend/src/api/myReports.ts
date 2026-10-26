import axiosT from "./baseUrl";

export interface MyReportItem {
  report_id: string;
  type_uz: string;
  formsname_uz: string;
  srok_uz: string;
  report_type: "monthly" | "quarterly" | "yearly" | null;
  next_deadline: string | null;
  days_left: number | null;
  last_deadline: string | null;
  reminded: boolean;
  days_before: number | null;
  has_guide: boolean;
  year_deadlines: string[];
}

/** HT-02/03: majburiyat × davr qatori. `flag` — muddatdan hisoblanadigan belgi, `status` — manba holati. */
export type ReportStatus = "not_started" | "submitted" | "accepted" | "rejected" | "unknown";
export type ReportFlag = "due_soon" | "overdue";

export interface MyReportRow {
  report_id: string;
  type_uz: string;
  formsname_uz: string;
  report_type: "monthly" | "quarterly" | "yearly" | null;
  period: string | null;
  period_label: string | null;
  due: string;
  days_left: number;
  deadline_source: "rule" | "override" | "legacy";
  status: ReportStatus;
  status_label: string;
  flag: ReportFlag | null;
  flag_label: string | null;
  submitted_at: string | null;
  reminded: boolean;
}

export interface MyReports {
  organization: { name: string; tin: string };
  year: number;
  today: string;
  submission_status_available: boolean;
  is_synthetic: boolean;
  items: MyReportItem[];
  rows: MyReportRow[];
  submit_system: { name: string; url: string } | null;
  list_as_of: string | null;
}

export interface ReportGuideResponse {
  report_id: string;
  type_uz: string;
  formsname_uz: string;
  srok_uz: string;
  report_type: string | null;
  auto?: {
    organizations_count: number;
    periodicity: string | null;
    rule: string | null;
    next_deadline: string | null;
    regulations_path: string;
  };
  guide: {
    summary: string;
    steps: string;
    common_errors: string;
    legal_basis: string;
    sample_file: string | null;
    is_synthetic: boolean;
  } | null;
}

export const fetchMyReports = async (year?: number) =>
  (await axiosT.get<MyReports>("/additional-services/my-reports/", { params: year ? { year } : {} })).data;

export const fetchReportGuide = async (id: string) =>
  (await axiosT.get<ReportGuideResponse>(`/additional-services/report-guide/${encodeURIComponent(id)}/`)).data;

export const setReportReminder = async (id: string, daysBefore: number | null) => {
  const url = `/additional-services/reportlist/${encodeURIComponent(id)}/remind/`;
  if (daysBefore === null) return (await axiosT.delete(url)).data;
  return (await axiosT.post(url, { days_before: daysBefore })).data;
};

const BASE = "/additional-services";
export interface CalendarFeed { enabled: boolean; url: string | null }

export const fetchCalendarFeed = async () => (await axiosT.get<CalendarFeed>(`${BASE}/calendar-feed/`)).data;
export const enableCalendarFeed = async (regenerate = false) =>
  (await axiosT.post<CalendarFeed>(`${BASE}/calendar-feed/`, { regenerate })).data;
export const disableCalendarFeed = async () => (await axiosT.delete<CalendarFeed>(`${BASE}/calendar-feed/`)).data;

export const fetchReminderPref = async () => (await axiosT.get<{ enabled: boolean }>(`${BASE}/report-reminder-settings/`)).data;
export const setReminderPref = async (enabled: boolean) =>
  (await axiosT.put<{ enabled: boolean }>(`${BASE}/report-reminder-settings/`, { enabled })).data;
