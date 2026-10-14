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

export interface MyReports {
  organization: { name: string; tin: string };
  year: number;
  today: string;
  submission_status_available: boolean;
  is_synthetic: boolean;
  items: MyReportItem[];
}

export interface ReportGuideResponse {
  report_id: string;
  type_uz: string;
  formsname_uz: string;
  srok_uz: string;
  report_type: string | null;
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
