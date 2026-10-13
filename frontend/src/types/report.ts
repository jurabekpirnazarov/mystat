export interface ReportData {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  type: string;
  srok: string;
  formsname: string;
  type_uz: string;
  srok_uz: string;
  formsname_uz: string;
  report_type: string;
}

export interface ReportCalendarResponse {
  org_name: string;
  data: ReportData[];
}

export interface CompanyInfo {
  stir: string;
  companyName: string;
}