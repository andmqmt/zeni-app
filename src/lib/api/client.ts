import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

console.log('API Base URL:', API_BASE);

export const api = axios.create({ 
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// Hard‑enforce credentials + auth header on every request (some environments / adapters
// may drop instance-level withCredentials, so we set it per-request too).
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.withCredentials = true; // guarantee cookies (equivalent to fetch credentials: 'include')
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (process.env.NODE_ENV === 'development') {
    // Lightweight debug line – helps verify in DevTools that header & credentials are set
    // (You can remove later if too noisy.)
    // eslint-disable-next-line no-console
    console.debug('[api] ->', config.method?.toUpperCase(), config.url, 'withCredentials:', config.withCredentials);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error?.response?.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
