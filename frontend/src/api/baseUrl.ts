import axios from "axios";

import { host, refresh_token } from "./apiUrls";
import { getStorage, getStorageR, setStorage, setStorageR } from "./storage";

const axiosT = axios.create({
  baseURL: host + "api",
  timeout: 20000,
});

axiosT.interceptors.request.use(
  (config) => {
    const token = getStorage();
    if (token && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Backend refresh token'ni aylantiradi (ROTATE_REFRESH_TOKENS) va eskisini blacklist qiladi,
// shuning uchun bir vaqtda kelgan bir nechta 401 uchun faqat bitta refresh so'rovi yuboriladi.
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = getStorageR();
    refreshPromise = (
      refreshToken
        ? axios
            .post(
              `${host}api${refresh_token}`,
              { refresh: refreshToken },
              { headers: { "Content-Type": "application/json" } }
            )
            .then((response) => {
              const { access, refresh } = response.data;
              setStorage(access);
              if (refresh) {
                setStorageR(refresh);
              }
              return access as string;
            })
        : Promise.reject(new Error("No refresh token"))
    ).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

axiosT.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if token is expired or invalid
    if (
      originalRequest &&
      (error.response?.status === 401 ||
       error.response?.status === 403 ||
       error.response?.data?.code === "token_not_valid") &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const access = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosT(originalRequest);
      } catch (refreshError) {
        clearLocalStorageAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Function to clear localStorage and redirect to login
function clearLocalStorageAndRedirect() {
  // Clear all authentication related data
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_data");
  localStorage.removeItem("user_profile");
  
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export const headerConfig = () => {
  return {
    Authorization: `Bearer ${getStorage()}`,
    "Content-Type": "application/json",
  };
};

export default axiosT;
