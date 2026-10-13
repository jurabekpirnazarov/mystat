import axiosT from "./baseUrl";

// Function to clear localStorage and redirect to login
function clearLocalStorageAndRedirect() {
  // Clear all authentication related data
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_data");
  localStorage.removeItem("user_profile");
  
  console.log("LocalStorage cleared, redirecting to login...");
  
  // Redirect to login page
  window.location.href = "/login";
}

export const postRequest = (
  url: string,
  data: Record<string, any>,
  headers?: Record<string, string>
) => {
  return new Promise((resolve, reject) => {
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
          console.log("401 Unauthorized - clearing localStorage and redirecting to login");
          clearLocalStorageAndRedirect();
        }
        reject(error);
      });
  });
};

export const getRequest = (
  url: string,
  params?: Record<string, string>,
  headers?: Record<string, string>
) => {
  return new Promise((resolve, reject) => {
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
          console.log("401 Unauthorized - clearing localStorage and redirecting to login");
          clearLocalStorageAndRedirect();
        }
        reject(error);
      });
  });
};
