import axiosT from "./baseUrl";
import { redirectToLogin } from "../utils/loginRedirect";

// Function to clear localStorage and redirect to login
function clearLocalStorageAndRedirect() {
  // Clear all authentication related data
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_data");
  localStorage.removeItem("user_profile");

  redirectToLogin();
}

export const postRequest = <T = unknown>(
  url: string,
  data: Record<string, unknown> | FormData | object,
  headers?: Record<string, string>
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    // Get token from localStorage and merge with custom headers
    const token = localStorage.getItem("access_token");
    const mergedHeaders = { ...headers };
    
    // Always add token if available, even if interceptor exists (for redundancy)
    if (token && token !== "undefined") {
      mergedHeaders["Authorization"] = `Bearer ${token}`;
    }
    
    axiosT
      .post(url, data, {
        headers: mergedHeaders,
      })
      .then((response) => {
        resolve(response.data); // Return only data, not full response
      })
      .catch((error) => {
        // Handle 401 errors specifically
        if (error.response?.status === 401) {
          clearLocalStorageAndRedirect();
        }
        reject(error);
      });
  });
};

export const getRequest = <T = unknown>(
  url: string,
  params?: Record<string, string>,
  headers?: Record<string, string>
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    // Get token from localStorage and merge with custom headers
    const token = localStorage.getItem("access_token");
    const mergedHeaders = { ...headers };
    
    // Always add token if available, even if interceptor exists (for redundancy)
    if (token && token !== "undefined") {
      mergedHeaders["Authorization"] = `Bearer ${token}`;
    }
    
    axiosT
      .get(url, { params, headers: mergedHeaders })
      .then((response) => {
        resolve(response.data); // Return only data, not full response
      })
      .catch((error) => {
        // Handle 401 errors specifically
        if (error.response?.status === 401) {
          clearLocalStorageAndRedirect();
        }
        reject(error);
      });
  });
};
