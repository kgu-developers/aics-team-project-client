import { fetchCurrentUser } from '@aics/api-client';
import type { AuthSessionRole } from '@aics/core';
export async function fetchSessionUser(role: AuthSessionRole) {
  const currentUser = await fetchCurrentUser(role);
  return currentUser;
}
