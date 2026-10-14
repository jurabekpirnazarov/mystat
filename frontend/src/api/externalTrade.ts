import { toList, type ListPayload } from './listResponse';
import { getRequest, postRequest } from './request';
import { 
  countries_api, 
  country_groups_api, 
  years_api, 
  regions_api,
  product_categories_api,
  product_subcategories_api,
  product_products_api,
  sitc1_api,
  sitc2_api,
  sitc3_api,
  sitc4_api,
  get_analyze_data_api,
  post_get_data_api
} from './apiUrls';

// Interface for external trade API responses (matching actual API structure)
export interface Country {
  id: number;
  ctrana: string;  // country code in API response
  name: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  name_cry: string;
  kod_kont: string;
  country_group: unknown;
}

export interface CountryGroup {
  id: number;
  name_uz: string;
  name_ru: string;
  name_en: string;
  name_cry: string;
  code: string;
}

export interface Year {
  id: number;
  year: number;
}

export interface Region {
  id: number;
  name: string;
  code: string;
}

export interface ProductCategory {
  id: number;
  code: string;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  name_cry2: string;
  parent: string | null;
  level: number;
  level_display: string;
}

export interface ProductSubcategory {
  id: number;
  code: string;
  name: string;
  name_uz?: string;
  name_ru?: string;
  products?: Product[];
}

export interface Product {
  id: number;
  code: string;
  name: string;
  name_uz?: string;
  name_ru?: string;
}

export interface SitcSection {
  id: number;
  code: string;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  parent: string | null;
  level: number;
  level_display: string;
}

export interface TradeDataRequest {
  years: number[];           // Required - array of years
  quarters: string[];        // Required - array of quarters (Q1, Q2, etc.)
  months: string[];          // Required - array of months (M1, M2, etc.)
  trade_flow: number;        // Required - numeric trade flow ID
  countries: string[];       // Required - array of country codes
  country_groups: string[];  // Required - array of country group codes
  regions: string[];         // Required - array of region codes
  hs2_codes: string[];       // Required - array of HS2 codes
  hs4_codes: string[];       // Required - array of HS4 codes  
  hs6_codes: string[];       // Required - array of HS6 codes
  sitc1_codes: string[];     // Required - array of SITC1 codes
  sitc2_codes: string[];     // Required - array of SITC2 codes
  sitc3_codes: string[];     // Required - array of SITC3 codes
  sitc4_codes: string[];     // Required - array of SITC4 codes
  group_by: string[];        // Required - array of grouping methods
}

export interface TradeDataResponse {
  id: number;
  trade_type: number;
  trade_type_display: string;
  product: number;
  product_name: string;
  unit: number;
  unit_name: string;
  year: number;
  year_value: number;
  month: string;
  month_display: string;
  country_name: string;
  region: number;
  region_name: string;
  sitc: number;
  sitc_name: string;
  value: string | number;
  quantity: string | number;
  [key: string]: unknown;
}

// API Functions for External Trade

// Get countries list
export const getCountries = async (): Promise<Country[]> => {
  try {
    const response = await getRequest<ListPayload<Country>>(countries_api);
    return toList(response);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

// Get country groups
export const getCountryGroups = async (): Promise<CountryGroup[]> => {
  try {
    const response = await getRequest<ListPayload<CountryGroup>>(country_groups_api);
    return toList(response);
  } catch (error) {
    console.error('Error fetching country groups:', error);
    return [];
  }
};

// Get available years
export const getYears = async (): Promise<Year[]> => {
  try {
    const response = await getRequest<ListPayload<Year>>(years_api);
    return toList(response);
  } catch (error) {
    console.error('Error fetching years:', error);
    return [];
  }
};

// Get regions
export const getRegions = async (): Promise<Region[]> => {
  try {
    const response = await getRequest<ListPayload<Region>>(regions_api);
    return toList(response);
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

// Get product categories
export const getProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    const response = await getRequest<ListPayload<ProductCategory>>(product_categories_api);
    return toList(response);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return [];
  }
};

// Get product subcategories by category ID
export const getProductSubcategories = async (categoryId: number): Promise<ProductSubcategory[]> => {
  try {
    const response = await getRequest<ListPayload<ProductSubcategory>>(product_subcategories_api, { category: categoryId.toString() });
    return toList(response);
  } catch (error) {
    console.error('Error fetching product subcategories:', error);
    return [];
  }
};

// Get products by subcategory ID
export const getProducts = async (subcategoryId: number): Promise<Product[]> => {
  try {
    const response = await getRequest<ListPayload<Product>>(product_products_api, { subcategory: subcategoryId.toString() });
    return toList(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Get SITC sections
export const getSitcSections = async (): Promise<SitcSection[]> => {
  try {
    const response = await getRequest<ListPayload<SitcSection>>(sitc1_api);
    return toList(response);
  } catch (error) {
    console.error('Error fetching SITC sections:', error);
    return [];
  }
};

// Get SITC divisions by section ID
export const getSitcDivisions = async (sectionId: number): Promise<SitcSection[]> => {
  try {
    const response = await getRequest<ListPayload<SitcSection>>(sitc2_api, { section: sectionId.toString() });
    return toList(response);
  } catch (error) {
    console.error('Error fetching SITC divisions:', error);
    return [];
  }
};

// Get SITC groups by division ID
export const getSitcGroups = async (divisionId: number): Promise<SitcSection[]> => {
  try {
    const response = await getRequest<ListPayload<SitcSection>>(sitc3_api, { division: divisionId.toString() });
    return toList(response);
  } catch (error) {
    console.error('Error fetching SITC groups:', error);
    return [];
  }
};

// Get SITC subgroups by group ID
export const getSitcSubgroups = async (groupId: number): Promise<SitcSection[]> => {
  try {
    const response = await getRequest<ListPayload<SitcSection>>(sitc4_api, { group: groupId.toString() });
    return toList(response);
  } catch (error) {
    console.error('Error fetching SITC subgroups:', error);
    return [];
  }
};

// Get trade data using POST request
export const getTradeData = async (params: TradeDataRequest): Promise<TradeDataResponse[]> => {
  try {
    const response = await postRequest<ListPayload<TradeDataResponse>>(post_get_data_api, params);
    
    return toList(response);
  } catch (error) {
    console.error('Error fetching trade data:', error);
    throw error;
  }
};

// Get trade data using GET request (alternative endpoint)
export const getTradeDataGet = async (params: Record<string, string>): Promise<TradeDataResponse[]> => {
  try {
    const response = await getRequest<ListPayload<TradeDataResponse>>(get_analyze_data_api, params);
    
    return toList(response);
  } catch (error) {
    console.error('Error fetching trade data with GET:', error);
    throw error;
  }
};