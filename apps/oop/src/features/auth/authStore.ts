import { setApiAccessToken } from '@aics/api-client';
import type { AuthSessionRole, CurrentUser } from '@aics/core';
import { create } from 'zustand';

/** Why the session ended without the user pressing 로그아웃 in this tab. */
export type SessionEndReason = 'expired' | 'signed-out-elsewhere';

type AuthState = {
  isAuthenticated: boolean;
  sessionRole: AuthSessionRole | null;
  /** Development mock compatibility only. Production auth uses HttpOnly cookies. */
  accessToken: string | null;
  currentUser: CurrentUser | null;
  /** Shown once on the login screen, then cleared by `consumeSessionEndReason`. */
  sessionEndReason: SessionEndReason | null;
  markAuthenticated: (role: AuthSessionRole) => void;
  setAccessToken: (accessToken: string) => void;
  setCurrentUser: (currentUser: CurrentUser) => void;
  clearSession: (reason?: SessionEndReason) => void;
  consumeSessionEndReason: () => SessionEndReason | null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  sessionRole: null,
  accessToken: null,
  currentUser: null,
  sessionEndReason: null,
  markAuthenticated: sessionRole =>
    set({ isAuthenticated: true, sessionEndReason: null, sessionRole }),
  setAccessToken: accessToken => {
    setApiAccessToken(accessToken);
    set({ accessToken, isAuthenticated: true });
  },
  setCurrentUser: currentUser => set({ currentUser }),
  clearSession: reason => {
    setApiAccessToken(null);
    set({
      accessToken: null,
      currentUser: null,
      isAuthenticated: false,
      sessionEndReason: reason ?? null,
      sessionRole: null,
    });
  },
  consumeSessionEndReason: () => {
    const reason = get().sessionEndReason;
    if (reason) set({ sessionEndReason: null });
    return reason;
  },
}));

/**
 * Cookie sessions are authoritative. The access-token fallback keeps existing
 * development fixtures and tests usable while their MSW handlers are migrated.
 */
export function selectHasAuthenticatedSession(state: AuthState) {
  return state.isAuthenticated || Boolean(state.accessToken);
}
