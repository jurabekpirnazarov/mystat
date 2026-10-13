import { getRequest } from '../api/request';
import { interactive_services } from '../api/apiUrls';

// Cache for services data
let servicesCache: any[] | null = null;

// Fetch all services from API
export const fetchAllServices = async (): Promise<any[]> => {
  if (servicesCache) {
    console.log('fetchAllServices: Using cached services');
    return servicesCache;
  }
  
  try {
    console.log('fetchAllServices: Fetching from API:', interactive_services);
    const response: any = await getRequest(interactive_services);
    console.log('fetchAllServices: API response:', response);
    
    servicesCache = response.results || response || [];
    console.log('fetchAllServices: Cached services:', servicesCache);
    
    return servicesCache || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Get service ID by slug from API data
export const getServiceIdBySlug = async (slug: string): Promise<number | null> => {
  try {
    console.log('getServiceIdBySlug: Looking for slug:', slug);
    const services = await fetchAllServices();
    console.log('getServiceIdBySlug: Available services:', services);
    
    const service = services.find((s: any) => s.slug === slug);
    console.log('getServiceIdBySlug: Found service:', service);
    
    return service?.id || null;
  } catch (error) {
    console.error('Error getting service ID by slug:', error);
    return null;
  }
};

// Get service ID by current route
export const getServiceIdByRoute = async (pathname: string): Promise<number | null> => {
  console.log('getServiceIdByRoute: pathname =', pathname);
  
  // Remove leading slash and get first part of path
  const pathParts = pathname.replace(/^\//, '').split('/');
  const routeKey = pathParts[0];
  
  console.log('getServiceIdByRoute: routeKey =', routeKey);
  
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
  console.log('getServiceIdByRoute: slug =', slug);
  
  if (!slug) {
    console.log('getServiceIdByRoute: No slug found for routeKey:', routeKey);
    return null;
  }
  
  const serviceId = await getServiceIdBySlug(slug);
  console.log('getServiceIdByRoute: serviceId =', serviceId);
  
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