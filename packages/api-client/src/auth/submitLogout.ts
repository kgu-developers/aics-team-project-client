import type { AuthLogoutResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitLogout(): Promise<AuthLogoutResponse> {
  const response = await apiClient.post<AuthLogoutResponse>(
    ENDPOINTS.AUTH.LOGOUT,
  );

  return response.data;
}
