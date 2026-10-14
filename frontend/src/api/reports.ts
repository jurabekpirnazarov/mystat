import { Report, ServicePackagesResponse, CpiResponse, YearsMonthsResponse } from '../types';
import { reports_calendar, service_package_api, calculator_services_api, years_months_api } from './apiUrls';
import axiosT from './baseUrl';

export const getReportsByStir = async (stir: string): Promise<Report[]> => {
  try {
    const url = `${reports_calendar}/${stir}`;
    
    const response = await axiosT.get(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const getServicePackages = async (): Promise<ServicePackagesResponse> => {
  try {
    const response = await axiosT.get(service_package_api, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching service packages:', error);
    throw error;
  }
};

export const getCpiData = async (params: {
  start_year: string;
  start_month: string;
  end_year: string;
  end_month: string;
}): Promise<CpiResponse> => {
  try {
    const queryParams = new URLSearchParams({
      start_year: params.start_year,
      start_month: params.start_month,
      end_year: params.end_year,
      end_month: params.end_month
    });
    
    const response = await axiosT.get(`${calculator_services_api}?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching CPI data:', error);
    throw error;
  }
};

export const getYearsMonths = async (): Promise<YearsMonthsResponse> => {
  try {
    const response = await axiosT.get(years_months_api, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching years and months:', error);
    throw error;
  }
};