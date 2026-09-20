import { onApiUnauthorized } from '@aics/api-client';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
  type SessionEndReason,
} from './authStore';

const AUTH_EVENT_KEY = 'aics:auth-event';

type AuthEvent = { type: 'logout'; at: number };

/**
 * Tells other tabs of this origin that the user signed out. The `storage`
 * event only fires in *other* tabs, which is exactly the audience.
 */
export function broadcastLogout() {
  try {
    const event: AuthEvent = { at: Date.now(), type: 'logout' };
    localStorage.setItem(AUTH_EVENT_KEY, JSON.stringify(event));
    localStorage.removeItem(AUTH_EVENT_KEY);
  } catch {
    // Storage can be unavailable (private mode, quota); nothing to sync then.
  }
}

function endSession(reason: SessionEndReason) {
  const state = useAuthStore.getState();
  if (!selectHasAuthenticatedSession(state)) return;
  state.clearSession(reason);
}

/**
 * Wires session-ending signals to the auth store:
 * - a 401 from any non-auth API call means the cookie session is gone
 *   (expired, or revoked by a logout in another tab);
 * - a logout broadcast from another tab.
 * Route guards then redirect to /login, which shows the reason once.
 */
export function startSessionSync() {
  const stopUnauthorized = onApiUnauthorized(() => endSession('expired'));
  const onStorage = (event: StorageEvent) => {
    if (event.key !== AUTH_EVENT_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as Partial<AuthEvent>;
      if (parsed.type === 'logout') endSession('signed-out-elsewhere');
    } catch {
      // Ignore malformed events written by other code.
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    stopUnauthorized();
    window.removeEventListener('storage', onStorage);
  };
}

export const sessionEndMessages: Record<SessionEndReason, string> = {
  expired: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.',
  'signed-out-elsewhere':
    '다른 탭이나 창에서 로그아웃되었습니다. 계속하려면 다시 로그인해 주세요.',
};
