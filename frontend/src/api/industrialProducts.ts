import { getRequest } from './request';
import { industrial_products_api, industry_service } from './apiUrls';

export interface IndustrialProduct {
  id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  section: string | null;
  section_name: string | null;
  razdel: string | null;
  razdel_name: string | null;
  skp: string | null;
  skp_name: string | null;
  soato: string | null;
  okpo: string | null;
  inn: string | null;
  name: string | null;
  adress: string | null;
  phone: string | null;
}

export interface IndustrialProductsResponse {
  count: number;
  page_count: number;
  next: string | null;
  previous: string | null;
  results: IndustrialProduct[];
}

export const getIndustrialProducts = async (params?: {
  page?: number;
  search?: string;
  limit?: number;
}): Promise<IndustrialProductsResponse> => {
  const response = await getRequest(industrial_products_api, params as Record<string, string>);
  return response as IndustrialProductsResponse;
};

// New Industry Categories API
export interface IndustryCategory {
  id: number;
  children: IndustryCategory[];
  name_uz: string | null;
  name_ru: string | null;
  name_cry: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean | null;
  parent: number | null;
}

// Detailed Industrial Product for Step 3
export interface DetailedIndustrialProduct {
  id: number;
  category: {
    id: number;
    children: IndustryCategory[];
    name_uz: string | null;
    name_ru: string | null;
    name_cry: string | null;
    created_at: string | null;
    updated_at: string | null;
    is_active: boolean | null;
    parent: number;
  };
  skp: {
    id: number;
    code: string;
    name: string;
    created_at: string | null;
    updated_at: string | null;
    is_active: boolean | null;
  };
  soato: string;
  okpo: number;
  inn: string;
  name: string;
  adress: string;
  phone: string;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean | null;
}

export interface DetailedIndustrialProductsResponse {
  count: number;
  page_count: number;
  next: string | null;
  previous: string | null;
  results: DetailedIndustrialProduct[];
}

export interface IndustryCategoriesResponse {
  count: number;
  page_count: number;
  next: string | null;
  previous: string | null;
  results: IndustryCategory[];
}

export const getIndustryCategories = async (): Promise<IndustryCategory[]> => {
  console.log('🚀 Fetching industry categories from:', industry_service);
  const response = await getRequest(industry_service);
  console.log('📥 Industry categories response:', response);
  
  // Check if response has results array (paginated response)
  if (response && typeof response === 'object' && 'results' in response) {
    const paginatedResponse = response as IndustryCategoriesResponse;
    console.log('✅ Found paginated response with', paginatedResponse.results.length, 'categories');
    return paginatedResponse.results;
  }
  
  // Fallback for direct array response
  if (Array.isArray(response)) {
    console.log('✅ Found direct array response with', response.length, 'categories');
    return response as IndustryCategory[];
  }
  
  console.warn('⚠️ Unexpected response format:', response);
  return [];
};

// Get industrial products filtered by category ID
export const getIndustrialProductsByCategory = async (categoryId: number, params?: {
  page?: number;
  search?: string;
  limit?: number;
}): Promise<DetailedIndustrialProductsResponse> => {
  const apiUrl = `${industrial_products_api}${categoryId}/`;
  console.log('🏭 Fetching industrial products for category:', categoryId, 'from:', apiUrl);
  
  const response = await getRequest(apiUrl, params as Record<string, string>);
  console.log('📦 Industrial products response:', response);
  
  return response as DetailedIndustrialProductsResponse;
};