import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { authHandlers, resetDemoPasswordState } from './auth';
import { demoAccessToken, demoCredentials, demoStudent } from '../data/users';

const server = setupServer(...authHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetDemoPasswordState();
});
afterAll(() => server.close());

function updatePassword(
  input: Record<string, unknown>,
  accessToken = demoAccessToken,
) {
  return fetch(`${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

describe('authHandlers password change', () => {
  it('인증되지 않은 비밀번호 변경 요청을 거부한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: demoCredentials.password,
          newPassword: 'new-password',
        }),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('현재 비밀번호가 틀리면 변경하지 않는다', async () => {
    const response = await updatePassword({
      currentPassword: 'wrong-password',
      newPassword: 'new-password',
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_CURRENT_PASSWORD',
    });
  });

  it('8자 미만 또는 현재 비밀번호와 같은 새 비밀번호를 거부한다', async () => {
    const tooShortResponse = await updatePassword({
      currentPassword: demoCredentials.password,
      newPassword: 'short',
    });
    const unchangedResponse = await updatePassword({
      currentPassword: demoCredentials.password,
      newPassword: demoCredentials.password,
    });

    expect(tooShortResponse.status).toBe(400);
    await expect(tooShortResponse.json()).resolves.toMatchObject({
      code: 'INVALID_NEW_PASSWORD',
    });
    expect(unchangedResponse.status).toBe(400);
    await expect(unchangedResponse.json()).resolves.toMatchObject({
      code: 'PASSWORD_UNCHANGED',
    });
  });

  it('변경한 비밀번호는 다음 로그인에 사용된다', async () => {
    const newPassword = 'oop-new-password';
    const updateResponse = await updatePassword({
      currentPassword: demoCredentials.password,
      newPassword,
    });
    const oldPasswordLogin = await fetch(
      `${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: demoStudent.studentNumber,
          password: demoCredentials.password,
        }),
      },
    );
    const newPasswordLogin = await fetch(
      `${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: demoStudent.studentNumber,
          password: newPassword,
        }),
      },
    );

    expect(updateResponse.status).toBe(204);
    expect(oldPasswordLogin.status).toBe(401);
    expect(newPasswordLogin.status).toBe(200);
  });
});
