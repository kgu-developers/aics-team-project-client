import type { AuthLogoutResponse } from '@aics/core';

import { retryAfterCsrfRotation } from './retryAfterCsrfRotation';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitLogout(): Promise<AuthLogoutResponse> {
  return retryAfterCsrfRotation(async () => {
    const response = await apiClient.post<AuthLogoutResponse>(
      ENDPOINTS.AUTH.LOGOUT,
    );

    return response.data;
  });
}
