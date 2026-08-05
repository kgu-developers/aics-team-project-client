import type { CurrentUser } from '@aics/core';

import { apiClient } from '../client';

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>('/me');

  return response.data;
}
