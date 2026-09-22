import axios, { AxiosInstance } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let authLogoutCallback: (() => void) | null = null;

export const setAuthLogoutCallback = (callback: (() => void) | null) => {
  authLogoutCallback = callback;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && authLogoutCallback) {
      authLogoutCallback();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
