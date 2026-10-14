import { getRequest } from '../api/request';
import { interactive_services } from '../api/apiUrls';
import { toList, type ListPayload } from '../api/listResponse';

// Cache for services data
interface ServiceSlug {
  id: number;
  slug: string | null;
}

let servicesCache: ServiceSlug[] | null = null;

// Fetch all services from API
export const fetchAllServices = async (): Promise<ServiceSlug[]> => {
  if (servicesCache) {
    return servicesCache;
  }
  
  try {
    const response = await getRequest<ListPayload<ServiceSlug>>(interactive_services);
    
    servicesCache = toList(response);
    
    return servicesCache || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Get service ID by slug from API data
export const getServiceIdBySlug = async (slug: string): Promise<number | null> => {
  try {
    const services = await fetchAllServices();
    
    const service = services.find((s) => s.slug === slug);
    
    return service?.id || null;
  } catch (error) {
    console.error('Error getting service ID by slug:', error);
    return null;
  }
};

// Get service ID by current route
export const getServiceIdByRoute = async (pathname: string): Promise<number | null> => {
  
  // Remove leading slash and get first part of path
  const pathParts = pathname.replace(/^\//, '').split('/');
  const routeKey = pathParts[0];
  
  
  // Map route to service slug
  const routeToSlug: { [key: string]: string } = {
    'book-store': 'books',
    'books': 'books',
    'industry': 'industry',
    'external-trade': 'ex-trade',
    'ex-trade': 'ex-trade', // Add direct mapping for ex-trade route
    'cpi-calculator': 'cpi-calculator',
    'statistical-classifications': 'statistical-classifications',
    'report-calendar': 'report-calendar',
    'orginfo': 'orginfo',
    'organizations': 'orginfo',
    'organizations-ktut': 'organizations-ktut'
  };
  
  const slug = routeToSlug[routeKey];
  
  if (!slug) {
    return null;
  }
  
  const serviceId = await getServiceIdBySlug(slug);
  
  return serviceId;
};

// Get service ID by page component name
export const getServiceIdByPageName = async (pageName: string): Promise<number | null> => {
  const pageToSlug: { [key: string]: string } = {
    'BookStore': 'books',
    'Industry': 'industry',
    'ExternalTrade': 'ex-trade',
    'CpiCalculator': 'cpi-calculator',
    'StatisticalClassifications': 'statistical-classifications',
    'ReportCalendar': 'report-calendar',
    'OrgInfoPage': 'orginfo',
    'OrganizationsKtut': 'organizations-ktut'
  };
  
  const slug = pageToSlug[pageName];
  if (!slug) return null;
  
  return await getServiceIdBySlug(slug);
};