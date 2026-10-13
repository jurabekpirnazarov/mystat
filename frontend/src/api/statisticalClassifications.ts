import { getRequest } from './request';
import { statistic_classification } from './apiUrls';

export interface StatisticalClassificationItem {
  id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  analog_uz: string;
  analog_ru: string;
  analog_cry: string;
  confirm_document: string;
  date: string;
  file: string | null;
  slug: string | null;
  category: number;
}

export interface StatisticalClassificationResponse {
  count: number;
  page_count: number;
  next: string | null;
  previous: string | null;
  results: StatisticalClassificationItem[];
}

export const getStatisticalClassifications = async (params?: {
  page?: number;
  search?: string;
  category?: number;
}): Promise<StatisticalClassificationResponse> => {
  const response = await getRequest(statistic_classification, params as Record<string, string>);
  return response as StatisticalClassificationResponse;
};