import {
  isSessionGenerationCurrent,
  observeSessionRecoveryStorage,
  onApiSessionExpired,
  SESSION_RECOVERY_STORAGE_KEY,
  type SessionGeneration,
} from '@aics/api-client';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
  type SessionEndReason,
} from './authStore';

const AUTH_EVENT_KEY = 'aics:auth-event';

type AuthEvent = SessionGeneration & { type: 'logout'; at: number };

/**
 * Tells other tabs of this origin that the user signed out. The `storage`
 * event only fires in *other* tabs, which is exactly the audience.
 */
export function broadcastLogout(generation: SessionGeneration) {
  try {
    const event: AuthEvent = { ...generation, at: Date.now(), type: 'logout' };
    localStorage.setItem(AUTH_EVENT_KEY, JSON.stringify(event));
    localStorage.removeItem(AUTH_EVENT_KEY);
  } catch {
    // Storage can be unavailable (private mode, quota); nothing to sync then.
  }
}

function endSession(reason: SessionEndReason, clearCache: () => void) {
  const state = useAuthStore.getState();
  if (
    !selectHasAuthenticatedSession(state) &&
    state.sessionEndReason !== null
  ) {
    return false;
  }
  state.clearSession(reason);
  clearCache();
  return true;
}

function readGeneration(value: string | null): SessionGeneration | undefined {
  try {
    const parsed = JSON.parse(value ?? 'null') as {
      session?: unknown;
      revision?: unknown;
    } | null;
    if (
      typeof parsed?.session === 'string' &&
      typeof parsed.revision === 'string'
    ) {
      return { session: parsed.session, revision: parsed.revision };
    }
  } catch {
    // Ignore malformed coordination metadata from unrelated or older code.
  }
  return undefined;
}

/**
 * Wires session-ending signals to the auth store:
 * - a final 401 after session recovery means the cookie session is gone
 *   (expired, or revoked by a logout in another tab);
 * - an owned expired recovery marker from another tab;
 * - a generation-bound committed logout broadcast from another tab.
 * Route guards then redirect to /login, which shows the reason once.
 */
export function startSessionSync(clearCache: () => void = () => undefined) {
  let handledLogoutGeneration = '';
  const stopExpired = onApiSessionExpired(generation => {
    if (isSessionGenerationCurrent(generation)) {
      endSession('expired', clearCache);
    }
  });
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_RECOVERY_STORAGE_KEY) {
      const previous = readGeneration(event.oldValue);
      const next = readGeneration(event.newValue);
      if (!next || !isSessionGenerationCurrent(next)) return;
      if (previous?.session !== next.session) {
        endSession('session-changed-elsewhere', clearCache);
      } else {
        observeSessionRecoveryStorage(event.newValue);
      }
      return;
    }
    if (event.key !== AUTH_EVENT_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as Partial<AuthEvent>;
      if (
        parsed.type !== 'logout' ||
        typeof parsed.session !== 'string' ||
        typeof parsed.revision !== 'string' ||
        !isSessionGenerationCurrent({
          session: parsed.session,
          revision: parsed.revision,
        })
      ) {
        return;
      }
      const generationKey = parsed.session + ':' + parsed.revision;
      if (handledLogoutGeneration === generationKey) return;
      handledLogoutGeneration = generationKey;
      // The session commit storage event can arrive first. In that case only
      // refine the reason; private cache was already cleared exactly once.
      if (!endSession('signed-out-elsewhere', clearCache)) {
        const state = useAuthStore.getState();
        if (state.sessionEndReason === 'session-changed-elsewhere') {
          state.clearSession('signed-out-elsewhere');
        }
      }
    } catch {
      // Ignore malformed events written by other code.
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    stopExpired();
    window.removeEventListener('storage', onStorage);
  };
}

export const sessionEndMessages: Record<SessionEndReason, string> = {
  expired: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.',
  'signed-out-elsewhere':
    '다른 탭이나 창에서 로그아웃되었습니다. 계속하려면 다시 로그인해 주세요.',
  'session-changed-elsewhere':
    '다른 탭이나 창에서 로그인 계정이 변경되었습니다. 다시 확인해 주세요.',
};
