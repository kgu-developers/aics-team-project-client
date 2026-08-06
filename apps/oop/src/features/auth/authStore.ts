import { setApiAccessToken } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';
import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  currentUser: CurrentUser | null;
  setAccessToken: (accessToken: string) => void;
  setCurrentUser: (currentUser: CurrentUser) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>(set => ({
  accessToken: null,
  currentUser: null,
  setAccessToken: accessToken => {
    setApiAccessToken(accessToken);
    set({ accessToken });
  },
  setCurrentUser: currentUser => set({ currentUser }),
  clearSession: () => {
    setApiAccessToken(null);
    set({ accessToken: null, currentUser: null });
  },
}));
