import { setApiAccessToken } from '@aics/api-client';
import type { AuthSessionRole, CurrentUser } from '@aics/core';
import { create } from 'zustand';

type AuthState = {
  isAuthenticated: boolean;
  sessionRole: AuthSessionRole | null;
  /** Development mock compatibility only. Production auth uses HttpOnly cookies. */
  accessToken: string | null;
  currentUser: CurrentUser | null;
  markAuthenticated: (role: AuthSessionRole) => void;
  setAccessToken: (accessToken: string) => void;
  setCurrentUser: (currentUser: CurrentUser) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>(set => ({
  isAuthenticated: false,
  sessionRole: null,
  accessToken: null,
  currentUser: null,
  markAuthenticated: sessionRole => set({ isAuthenticated: true, sessionRole }),
  setAccessToken: accessToken => {
    setApiAccessToken(accessToken);
    set({ accessToken, isAuthenticated: true });
  },
  setCurrentUser: currentUser => set({ currentUser }),
  clearSession: () => {
    setApiAccessToken(null);
    set({
      accessToken: null,
      currentUser: null,
      isAuthenticated: false,
      sessionRole: null,
    });
  },
}));

/**
 * Cookie sessions are authoritative. The access-token fallback keeps existing
 * development fixtures and tests usable while their MSW handlers are migrated.
 */
export function selectHasAuthenticatedSession(state: AuthState) {
  return state.isAuthenticated || Boolean(state.accessToken);
}
