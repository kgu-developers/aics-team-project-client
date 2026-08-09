import type { AuthLoginResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitRefresh(): Promise<AuthLoginResponse> {
  const response = await apiClient.post<AuthLoginResponse>(
    ENDPOINTS.AUTH.REFRESH,
  );

  return response.data;
}
