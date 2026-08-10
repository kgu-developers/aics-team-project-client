import type { AuthLoginInput, AuthLoginResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitLogin(
  input: AuthLoginInput,
): Promise<AuthLoginResponse> {
  const response = await apiClient.post<AuthLoginResponse>(
    ENDPOINTS.AUTH.LOGIN,
    input,
  );

  return response.data;
}
