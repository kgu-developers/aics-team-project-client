import type { AuthLoginResponse } from '@aics/core';

import { apiClient } from '../client';

export async function submitRefresh(): Promise<AuthLoginResponse> {
  const response = await apiClient.post<AuthLoginResponse>('/auth/refresh');

  return response.data;
}
