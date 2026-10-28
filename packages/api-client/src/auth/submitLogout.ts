import type { AuthLogoutResponse } from '@aics/core';

import { retryAfterCsrfRotation } from './retryAfterCsrfRotation';
import {
  changeCookieSessionWithCommit,
  type CookieSessionCommit,
} from './sessionRecovery';
import { ENDPOINTS } from '../constants/endpoints';
import { authTransport } from '../transport';

export function submitLogout(): Promise<AuthLogoutResponse>;
export function submitLogout(options: {
  withCommit: true;
}): Promise<CookieSessionCommit<AuthLogoutResponse>>;
export async function submitLogout(options?: { withCommit: true }) {
  const commit = await changeCookieSessionWithCommit<AuthLogoutResponse>(() =>
    retryAfterCsrfRotation(async () => {
      const response = await authTransport.post<AuthLogoutResponse>(
        ENDPOINTS.AUTH.LOGOUT,
        undefined,
        { timeout: 15_000 },
      );

      return response.data;
    }),
  );
  return options?.withCommit ? commit : commit.response;
}
