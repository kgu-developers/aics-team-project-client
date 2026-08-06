import { fetchCurrentUser, submitRefresh } from '@aics/api-client';

import { useAuthStore } from './authStore';

export async function restoreSession() {
  try {
    const response = await submitRefresh();
    const { setAccessToken, setCurrentUser } = useAuthStore.getState();

    setAccessToken(response.accessToken);
    setCurrentUser(await fetchCurrentUser());
  } catch {
    useAuthStore.getState().clearSession();
  }
}
