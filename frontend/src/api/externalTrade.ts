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
  country_group: any;
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
  parent: any;
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
  parent: any;
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
  [key: string]: any;
}

// API Functions for External Trade

// Get countries list
export const getCountries = async (): Promise<Country[]> => {
  try {
    console.log('getCountries: Fetching countries from API');
    const response = await getRequest(countries_api) as any;
    console.log('getCountries: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
};

// Get country groups
export const getCountryGroups = async (): Promise<CountryGroup[]> => {
  try {
    console.log('getCountryGroups: Fetching country groups from API');
    const response = await getRequest(country_groups_api) as any;
    console.log('getCountryGroups: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching country groups:', error);
    return [];
  }
};

// Get available years
export const getYears = async (): Promise<Year[]> => {
  try {
    console.log('getYears: Fetching years from API');
    const response = await getRequest(years_api) as any;
    console.log('getYears: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching years:', error);
    return [];
  }
};

// Get regions
export const getRegions = async (): Promise<Region[]> => {
  try {
    console.log('getRegions: Fetching regions from API');
    const response = await getRequest(regions_api) as any;
    console.log('getRegions: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

// Get product categories
export const getProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    console.log('getProductCategories: Fetching product categories from API');
    const response = await getRequest(product_categories_api) as any;
    console.log('getProductCategories: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return [];
  }
};

// Get product subcategories by category ID
export const getProductSubcategories = async (categoryId: number): Promise<ProductSubcategory[]> => {
  try {
    console.log('getProductSubcategories: Fetching subcategories for category:', categoryId);
    const response = await getRequest(product_subcategories_api, { category: categoryId.toString() }) as any;
    console.log('getProductSubcategories: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching product subcategories:', error);
    return [];
  }
};

// Get products by subcategory ID
export const getProducts = async (subcategoryId: number): Promise<Product[]> => {
  try {
    console.log('getProducts: Fetching products for subcategory:', subcategoryId);
    const response = await getRequest(product_products_api, { subcategory: subcategoryId.toString() }) as any;
    console.log('getProducts: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Get SITC sections
export const getSitcSections = async (): Promise<SitcSection[]> => {
  try {
    console.log('getSitcSections: Fetching SITC sections from API');
    const response = await getRequest(sitc1_api) as any;
    console.log('getSitcSections: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching SITC sections:', error);
    return [];
  }
};

// Get SITC divisions by section ID
export const getSitcDivisions = async (sectionId: number): Promise<SitcSection[]> => {
  try {
    console.log('getSitcDivisions: Fetching SITC divisions for section:', sectionId);
    const response = await getRequest(sitc2_api, { section: sectionId.toString() }) as any;
    console.log('getSitcDivisions: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching SITC divisions:', error);
    return [];
  }
};

// Get SITC groups by division ID
export const getSitcGroups = async (divisionId: number): Promise<SitcSection[]> => {
  try {
    console.log('getSitcGroups: Fetching SITC groups for division:', divisionId);
    const response = await getRequest(sitc3_api, { division: divisionId.toString() }) as any;
    console.log('getSitcGroups: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching SITC groups:', error);
    return [];
  }
};

// Get SITC subgroups by group ID
export const getSitcSubgroups = async (groupId: number): Promise<SitcSection[]> => {
  try {
    console.log('getSitcSubgroups: Fetching SITC subgroups for group:', groupId);
    const response = await getRequest(sitc4_api, { group: groupId.toString() }) as any;
    console.log('getSitcSubgroups: Response:', response);
    return response?.results || response || [];
  } catch (error) {
    console.error('Error fetching SITC subgroups:', error);
    return [];
  }
};

// Get trade data using POST request
export const getTradeData = async (params: TradeDataRequest): Promise<TradeDataResponse[]> => {
  try {
    console.log('getTradeData: Sending request with params:', params);
    const response = await postRequest(post_get_data_api, params) as any;
    console.log('getTradeData: Response:', response);
    
    // Handle different response formats
    if (response?.results && Array.isArray(response.results)) {
      return response.results;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn('getTradeData: Unexpected response format:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching trade data:', error);
    throw error;
  }
};

// Get trade data using GET request (alternative endpoint)
export const getTradeDataGet = async (params: Record<string, string>): Promise<TradeDataResponse[]> => {
  try {
    console.log('getTradeDataGet: Sending GET request with params:', params);
    const response = await getRequest(get_analyze_data_api, params) as any;
    console.log('getTradeDataGet: Response:', response);
    
    // Handle different response formats
    if (response?.results && Array.isArray(response.results)) {
      return response.results;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn('getTradeDataGet: Unexpected response format:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching trade data with GET:', error);
    throw error;
  }
};