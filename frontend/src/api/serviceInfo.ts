import { getRequest } from './request';
import { service_info } from './apiUrls';

export interface ServiceItem {
  id: number;
  service: number;
  name_uz: string;
  name_ru: string;
  name_cry: string;
  is_active: boolean;
}

export interface Organization {
  id: number;
  name: string;
}

export interface RatingCounts {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
}

export interface ReviewUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  display_name?: string;
}

export interface ServiceReview {
  id: number;
  user: ReviewUser;
  value: number;
  comment: string;
  created_at: string;
  created_humanized: string;
}

export interface ServiceInfoData {
  id: number;
  orders: number;
  items: ServiceItem[];
  organization: Organization;
  youtube_link: string | null;
  oferta: string | null;
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
  requires_login?: boolean;
  is_active: boolean;
  is_popular: boolean;
  average_rating: number;
  ratings_total: number;
  rating_counts: RatingCounts;
  reviews: ServiceReview[];
  user_rating: number | null;
  in_package: string | null;
}

export const getServiceInfo = async (serviceId: number): Promise<ServiceInfoData> => {
  const response = await getRequest(service_info(serviceId));
  return response as ServiceInfoData;
};