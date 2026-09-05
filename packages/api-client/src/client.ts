import axios from 'axios';

import { getApiAccessToken } from './auth/accessToken';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  const accessToken = getApiAccessToken();

  if (import.meta.env.DEV && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
