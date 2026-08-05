import { setApiAccessToken } from '@aics/api-client';
import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>(set => ({
  accessToken: null,
  setAccessToken: accessToken => {
    setApiAccessToken(accessToken);
    set({ accessToken });
  },
  clearSession: () => {
    setApiAccessToken(null);
    set({ accessToken: null });
  },
}));
