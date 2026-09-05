import { submitRefresh } from '@aics/api-client';

import { useAuthStore } from './authStore';
import { fetchSessionUser } from './fetchSessionUser';
import { requireSessionRole } from './requireSessionRole';

export async function restoreSession() {
  const session = useAuthStore.getState();
  session.clearSession();
  try {
    const role = requireSessionRole(await submitRefresh());
    const currentUser = await fetchSessionUser(role);
    session.setCurrentUser(currentUser);
    session.markAuthenticated(role);
  } catch {
    session.clearSession();
  }
}
