import axios from "axios";
import { getToken } from "../utils/storage.js";

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Attach JWT Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Normalize errors and handle 401 auto-logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = new Error();

    if (error.response) {
      // Server returned a response with an error status
      normalizedError.status = error.response.status;
      normalizedError.message =
        error.response.data?.message || `Request failed with status ${error.response.status}`;
      if (error.response.data?.errors) {
        normalizedError.fieldErrors = error.response.data.errors;
      }

      // Check for 401 Unauthorized
      if (error.response.status === 401) {
        const url = error.config?.url || "";
        const isAuthCredentialRequest =
          url.includes("/auth/login") || url.includes("/auth/register");

        // Do not auto-logout if the failure is just invalid login/register credentials
        if (!isAuthCredentialRequest && typeof onUnauthorized === "function") {
          onUnauthorized();
        }
      }
    } else if (error.request) {
      // Server did not respond (network down, timeout, CORS error)
      normalizedError.status = 0;
      normalizedError.message = "Cannot reach the server. Please try again.";
    } else {
      normalizedError.status = 0;
      normalizedError.message = error.message || "An unexpected error occurred.";
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
