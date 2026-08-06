import type { AuthLoginInput, AuthLoginResponse } from '@aics/core';

import { apiClient } from '../client';

export async function submitLogin(
  input: AuthLoginInput,
): Promise<AuthLoginResponse> {
  const response = await apiClient.post<AuthLoginResponse>(
    '/auth/login',
    input,
  );

  return response.data;
}
