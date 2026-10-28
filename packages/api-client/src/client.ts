import axios from 'axios';

import { getApiAccessToken } from './auth/accessToken';
import {
  assertSessionCurrent,
  getSessionSnapshot,
  isSessionRecoveryEnabled,
  notifyApiSessionExpired,
  recoverSession,
  waitForSessionRecovery,
  type SessionSnapshot,
  SessionRefreshError,
} from './auth/sessionRecovery';
import { notifyApiUnauthorized } from './auth/unauthorizedListener';
import { ENDPOINTS } from './constants/endpoints';
import { authTransport } from './transport';

export { API_BASE_URL } from './transport';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Keep 401 refresh/expiry handling with the credential-validation form. */
    skipSessionRecovery?: boolean;
    sessionAttempt?: { snapshot: SessionSnapshot; replayed: boolean };
  }
}

export const apiClient = axios.create(authTransport.defaults);
const authEndpoints = new Set<string>(Object.values(ENDPOINTS.AUTH));
const definitiveSessionExpiryErrors = new WeakSet<object>();

export function isDefinitiveSessionExpiry(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    definitiveSessionExpiryErrors.has(error)
  );
}

function markDefinitiveSessionExpiry<T extends object>(error: T) {
  definitiveSessionExpiryErrors.add(error);
  return error;
}

apiClient.interceptors.request.use(async config => {
  if (!authEndpoints.has(config.url ?? '')) {
    config.sessionAttempt ??= {
      snapshot: getSessionSnapshot(),
      replayed: false,
    };
    assertSessionCurrent(config.sessionAttempt.snapshot);
    if (isSessionRecoveryEnabled()) {
      await waitForSessionRecovery(
        config.sessionAttempt.snapshot,
        config.signal ?? undefined,
      );
      assertSessionCurrent(config.sessionAttempt.snapshot);
    }
  }
  const accessToken = getApiAccessToken();
  if (import.meta.env.DEV && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => {
    if (response.config.sessionAttempt) {
      assertSessionCurrent(response.config.sessionAttempt.snapshot);
    }
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;
    const config = error.config;
    if (!config?.sessionAttempt) throw error;
    const attempt = config.sessionAttempt;
    assertSessionCurrent(attempt.snapshot);
    if (error.response?.status !== 401) throw error;
    if (config.skipSessionRecovery) throw error;
    if (!attempt.replayed && isSessionRecoveryEnabled()) {
      try {
        await recoverSession(attempt.snapshot);
      } catch (refreshError) {
        assertSessionCurrent(attempt.snapshot);
        if (
          refreshError instanceof SessionRefreshError &&
          refreshError.expired
        ) {
          notifyApiSessionExpired(getSessionSnapshot());
          notifyApiUnauthorized(error);
          // Preserve the original Axios 401 contract for existing domain UI.
          throw markDefinitiveSessionExpiry(error);
        }
        throw refreshError;
      }
      assertSessionCurrent(attempt.snapshot);
      if (config.signal?.aborted) throw new axios.CanceledError();
      attempt.replayed = true;
      // Axios will read the current CSRF cookie again when dispatching.
      config.headers.delete('X-XSRF-TOKEN');
      return apiClient.request(config);
    }
    notifyApiSessionExpired(getSessionSnapshot());
    notifyApiUnauthorized(error);
    throw markDefinitiveSessionExpiry(error);
  },
);
