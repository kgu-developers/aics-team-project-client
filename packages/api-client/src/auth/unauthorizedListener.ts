import type { AxiosError } from 'axios';

type UnauthorizedListener = (error: AxiosError) => void;

const listeners = new Set<UnauthorizedListener>();

/**
 * Subscribes to 401 responses from `apiClient`. Auth endpoints themselves
 * (login/refresh/logout) are excluded, because a failed login or an expired
 * refresh is handled by their callers.
 */
export function onApiUnauthorized(listener: UnauthorizedListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyApiUnauthorized(error: AxiosError) {
  listeners.forEach(listener => listener(error));
}
