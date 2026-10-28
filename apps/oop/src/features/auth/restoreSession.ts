import {
  submitRefresh,
  getSessionSnapshot,
  assertSessionCurrent,
  assertSessionFinalizationCurrent,
} from '@aics/api-client';
import { isAxiosError } from 'axios';

import { useAuthStore } from './authStore';
import { fetchSessionUser } from './fetchSessionUser';
import { requireSessionRole } from './requireSessionRole';

export async function restoreSession() {
  const session = useAuthStore.getState();
  session.clearSession();
  const restoreSnapshot = getSessionSnapshot();
  try {
    const role = requireSessionRole(await submitRefresh());
    const finalizationSnapshot = getSessionSnapshot();
    const currentUser = await fetchSessionUser(role);
    assertSessionFinalizationCurrent(finalizationSnapshot);
    session.setCurrentUser(currentUser);
    session.markAuthenticated(role);
  } catch (error) {
    try {
      assertSessionCurrent(restoreSnapshot);
    } catch {
      return;
    }
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
