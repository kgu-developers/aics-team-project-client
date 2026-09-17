import type { AuthRefreshResponse } from '@aics/core';

import { retryAfterCsrfRotation } from './retryAfterCsrfRotation';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitRefresh(): Promise<AuthRefreshResponse> {
  return retryAfterCsrfRotation(async () => {
    const response = await apiClient.post<AuthRefreshResponse>(
      ENDPOINTS.AUTH.REFRESH,
    );

    return response.data;
  });
}
