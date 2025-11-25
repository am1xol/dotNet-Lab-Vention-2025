import axios from 'axios';
import { useAuthStore } from '../store/auth-store';

const API_BASE_URL = 'http://localhost:8080';

interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  error?: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken, logout } = useAuthStore.getState();

        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}/api/Auth/refresh`,
          {
            refreshToken: refreshToken,
          }
        );

        const data = response.data;

        if (data.success && data.accessToken && data.refreshToken) {
          const authStore = useAuthStore.getState();

          authStore.login(authStore.user!, {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

          processQueue(null, data.accessToken);

          return api(originalRequest);
        } else {
          throw new Error(data.error || 'Refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      console.error('API Error:', error.response?.status, error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default api;
