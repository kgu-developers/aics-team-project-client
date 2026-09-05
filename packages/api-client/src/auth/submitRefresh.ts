import type { AuthRefreshResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitRefresh(): Promise<AuthRefreshResponse> {
  const response = await apiClient.post<AuthRefreshResponse>(
    ENDPOINTS.AUTH.REFRESH,
  );

  return response.data;
}
