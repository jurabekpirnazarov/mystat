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
  category_name?: string;
  is_synthetic?: boolean;
}

export interface StatisticalClassificationResponse {
  count: number;
  page_count: number;
  next: string | null;
  previous: string | null;
  results: StatisticalClassificationItem[];
}

export const getStatisticalClassifications = async (params?: {
  search?: string;
  category?: number;
  limit?: number;
}): Promise<StatisticalClassificationResponse> => {
  const query: Record<string, string> = { limit: String(params?.limit ?? 500) };
  if (params?.search) query.search = params.search;
  if (params?.category) query.category = String(params.category);
  const response = await getRequest(statistic_classification, query);
  return response as StatisticalClassificationResponse;
};

export interface StatisticalClassificationCategory {
  id: number;
  name: string;
  items_count: number;
  is_synthetic?: boolean;
}

export const getStatisticalClassificationCategories = async (): Promise<StatisticalClassificationCategory[]> => {
  return (await getRequest(`${statistic_classification}/categories/`)) as StatisticalClassificationCategory[];
};