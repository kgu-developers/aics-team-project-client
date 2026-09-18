import { submitRefresh } from '@aics/api-client';
import { isAxiosError } from 'axios';

import { useAuthStore } from './authStore';
import { fetchSessionUser } from './fetchSessionUser';
import { requireSessionRole } from './requireSessionRole';

const RETRY_DELAY_MS = 400;

function isDefinitelySignedOut(error: unknown) {
  return isAxiosError(error) && error.response?.status === 401;
}

async function refreshWithRetry() {
  try {
    return await submitRefresh();
  } catch (error) {
    // A 401 means no usable refresh cookie; anything else (CSRF bootstrap,
    // network hiccup right after reload, 5xx) deserves one more attempt.
    if (isDefinitelySignedOut(error)) throw error;
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    return submitRefresh();
  }
}

export async function restoreSession() {
  const session = useAuthStore.getState();
  session.clearSession();
  try {
    const role = requireSessionRole(await refreshWithRetry());
    const currentUser = await fetchSessionUser(role);
    session.setCurrentUser(currentUser);
    session.markAuthenticated(role);
  } catch (error) {
    session.clearSession();
    if (import.meta.env.DEV) return;
    // Leave a trace for browser QA: which step and status ended the session.
    const status = isAxiosError(error) ? error.response?.status : undefined;
    console.warn(
      '[auth] session restore failed',
      status === undefined ? 'network or unexpected error' : `HTTP ${status}`,
    );
  }
}
