import { submitRefresh } from '@aics/api-client';

import { useAuthStore } from './authStore';

export async function restoreSession() {
  try {
    const response = await submitRefresh();
    useAuthStore.getState().setAccessToken(response.accessToken);
  } catch {
    useAuthStore.getState().clearSession();
  }
}
