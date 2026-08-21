import axios from "axios";
import toast from "react-hot-toast";
import {
  apiCache,
  getTTLForURL,
  invalidateCacheForRequest,
} from "../utils/apiCache";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const createApiClient = (getAccessToken, setAccessToken, logout) => {
  const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  // Store original adapter from axios
  const originalAdapter = api.defaults.adapter;

  // Attach token
  api.interceptors.request.use((config) => {
    const token = getAccessToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const method = config.method?.toUpperCase() || "GET";
    const params = config.params || {};

    if (method === "GET") {
      // Tell any intermediate proxy/browser not to serve a cached copy
      config.headers["Cache-Control"] = "no-cache";

      const cached = apiCache.get(config.url, params);
      if (cached) {
        config._fromCache = true;
        config.adapter = () =>
          Promise.resolve({
            data: cached,
            status: 200,
            statusText: "OK (from cache)",
            headers: {},
            config,
            request: null,
          });
      }
    }

    return config;
  });

  // Refresh lock to prevent multiple refresh calls
  let isRefreshing = false;
  let refreshPromise = null;

  const refreshAccessToken = async () => {
    const res = await axios.post(
      `${API_URL}/auth/refresh-token`,
      {},
      { withCredentials: true },
    );
    return res.data?.accessToken;
  };

  api.interceptors.response.use(
    (response) => {
      const config = response.config;
      const method = config.method?.toUpperCase() || "GET";
      const params = config.params || {};

      if (config._fromCache) return response;

      if (method === "GET" && response.data) {
        const ttl = getTTLForURL(config.url);
        apiCache.set(config.url, params, response.data, ttl);
      } else if (method !== "GET") {
        invalidateCacheForRequest(method, config.url);
      }

      return response;
    },
    async (error) => {
      const status = error?.response?.status;
      const originalRequest = error?.config;

      // If no response (network/CORS), just reject
      if (!error?.response) return Promise.reject(error);

      // Only handle 401 (and avoid retry loops)
      if (status !== 401 || !originalRequest || originalRequest._retry) {
        return Promise.reject(error);
      }

      // Don't try refresh while already on login page
      if (window.location.pathname.includes("/login")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken()
            .then((newToken) => {
              if (!newToken) throw new Error("No access token from refresh");
              setAccessToken?.(newToken);
              return newToken;
            })
            .finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;

        // Retry original request using SAME axios instance
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api.request(originalRequest);
      } catch (refreshErr) {
        toast.error("Session expired. Please login again.", { duration: 4000 });
        logout?.();

        setTimeout(() => {
          window.location.href = "/login";
        }, 800);

        return Promise.reject(refreshErr);
      }
    },
  );

  return api;
};
