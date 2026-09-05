import { fetchCurrentUser } from '@aics/api-client';
import type { AuthSessionRole } from '@aics/core';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

export async function fetchSessionUser(role: AuthSessionRole) {
  const currentUser = await fetchCurrentUser(role);
  if (
    isMockDevelopmentMode(import.meta.env.DEV, import.meta.env.VITE_ENABLE_MSW)
  ) {
    const { resolveDemoCurrentUser } =
      await import('~/mocks/resolveDemoCurrentUser');
    return resolveDemoCurrentUser(currentUser);
  }
  return currentUser;
}
