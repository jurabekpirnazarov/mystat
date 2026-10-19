import { LucideIcon } from "lucide-react";

export interface TariffFeature {
  name: string;
  count?: number;
}

export interface TariffItem {
  id: string;
  name: string;
  price: number;
  list: TariffFeature[];
  isSimple?: boolean;
}

export interface Feature {
  name: string;
  included: boolean;
  value?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  popular?: boolean;
  features: Feature[];
  detailedFeatures: {
    category: string;
    desc: string;
    icon: LucideIcon;
    items: Feature[];
  }[];
}

export interface DropdownOption {
  id: string;
  label: string;
  value: string;
}

export interface DropdownProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  options?: DropdownOption[];
  isOpen?: boolean;
  onToggle?: (id: string) => void;
  content?: React.ReactNode;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface ServiceInfo {
  title: string;
  rating: number;
  reviews: string;
  usage: string;
  totalUsage: string;
}

export interface TokenRefreshType {
  access: string;
  refresh: string;
}

export interface InteractiveServiceItem {
  id: number;
  service: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  is_active: boolean;
}

export interface InteractiveService {
  id: number;
  orders: number;
  items: InteractiveServiceItem[];
  name_uz: string;
  name_ru: string;
  name_cry: string;
  description_uz: string;
  description_ru: string;
  description_cry: string;
  duration: string;
  slug: string;
  icon: string | null;
  is_free: boolean;
  requires_login?: boolean; // sahifa ochiq, lekin ma'lumot uchun kirish kerak
  is_active: boolean;
  is_popular: boolean;
  average_rating?: number;
  in_package?: boolean; // Tarif bo'yicha sotib olingan xizmat ekanligini bildiradi
}

export interface InteractiveServicesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: InteractiveService[];
}

export interface CartItem {
  bookId: number;
  quantity: number;
  category: 'elektron' | 'bosma' | 'disk';
}

export interface Book {
  id: number;
  name: string;
  year: number;
  file_url: string;
  image_url: string;
  category?: 'elektron' | 'bosma' | 'disk';
  price?: number;
  description?: string;
  author?: string;
  publisher?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Report {
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
  organization_name?: string; // optional company name from API
}

// Service Package API Types
export interface ServiceItem {
  id: number;
  package: number;
  package_service: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  limit: number;
}

export interface PackageService {
  id: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  slug: string;
  service_items: ServiceItem[];
}

export interface ServicePackage {
  id: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  description_uz: string;
  description_ru: string;
  description_cry: string;
  price: string;
  is_active: boolean;
  duration_days: number;
  file: string | null;
  package_services: PackageService[];
}

export interface ServicePackagesResponse {
  count: number;
  page_count: number;
  next: string | null;
  previous: string | null;
  results: ServicePackage[];
}

// CPI Calculator API Types
export interface CpiDataItem {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  values: string;
  year: string;
}

export interface CpiResponse {
  result: CpiDataItem[];
}

// Years and Months API Types
export interface YearsMonthsResponse {
  years: number[];
  months: string[];
}
