import type { AuthLoginInput, AuthLoginResponse } from '@aics/core';

import { changeCookieSession } from './sessionRecovery';
import { ENDPOINTS } from '../constants/endpoints';
import { authTransport } from '../transport';

export async function submitLogin(
  input: AuthLoginInput,
): Promise<AuthLoginResponse> {
  return changeCookieSession(async () => {
    const response = await authTransport.post<AuthLoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      input,
      { timeout: 15_000 },
    );

    return response.data;
  });
}
