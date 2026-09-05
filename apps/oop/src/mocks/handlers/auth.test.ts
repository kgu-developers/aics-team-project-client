import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { authHandlers, resetDemoPasswordState } from './auth';
import { mockCsrfHeaderName, mockCsrfToken } from '../authSession';
import {
  demoAccessToken,
  demoCredentials,
  demoPartnerStudent,
  demoStudent,
  demoUserAccounts,
} from '../data/users';

const server = setupServer(...authHandlers);
const account = demoUserAccounts[0];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetDemoPasswordState();
});
afterAll(() => server.close());

function sessionHeaders({ csrf = true } = {}) {
  return {
    Cookie: [
      `accessToken=${demoAccessToken}`,
      `refreshToken=${account.refreshToken}`,
      `XSRF-TOKEN=${mockCsrfToken}`,
    ].join('; '),
    ...(csrf ? { [mockCsrfHeaderName]: mockCsrfToken } : {}),
  };
}

function login(password: string = demoCredentials.password) {
  return fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentNumber: demoStudent.studentNumber,
      password,
    }),
  });
}

function updatePassword(
  input: Record<string, unknown>,
  studentNumber = demoStudent.studentNumber,
  headers = sessionHeaders(),
) {
  return fetch(`${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD(studentNumber)}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

describe('authHandlers password contract', () => {
  it('CSRF가 없으면 인증 쿠키가 있어도 비밀번호 변경을 거부한다', async () => {
    const response = await updatePassword(
      {
        currentPassword: demoCredentials.password,
        password: 'new-password',
      },
      demoStudent.studentNumber,
      sessionHeaders({ csrf: false }),
    );

    expect(response.status).toBe(403);
  });

  it('다른 사용자의 학번으로 변경을 요청하면 403을 응답한다', async () => {
    const response = await updatePassword(
      {
        currentPassword: demoCredentials.password,
        password: 'new-password',
      },
      demoPartnerStudent.studentNumber,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: 'ACCESS_DENIED',
      message: '본인의 비밀번호만 변경할 수 있습니다.',
    });
  });

  it('현재 비밀번호가 틀리면 INVALID_CREDENTIALS 401을 응답한다', async () => {
    const response = await updatePassword({
      currentPassword: 'wrong-password',
      password: 'new-password',
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it.each(['a'.repeat(7), 'a'.repeat(65), '가'.repeat(24) + 'a', '        '])(
    '서버 비밀번호 제한을 벗어나면 400을 응답한다 (%s)',
    async password => {
      const response = await updatePassword({
        currentPassword: demoCredentials.password,
        password,
      });
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ code: 'INVALID_INPUT' });
    },
  );

  it('인증 세션이 없으면 비밀번호 변경을 거부한다', async () => {
    const response = await updatePassword(
      { currentPassword: demoCredentials.password, password: 'new-password' },
      demoStudent.studentNumber,
      {
        Cookie: `XSRF-TOKEN=${mockCsrfToken}`,
        [mockCsrfHeaderName]: mockCsrfToken,
      },
    );
    expect(response.status).toBe(401);
  });

  it('성공 시 200 문자열을 응답하고 기존 세션을 폐기한다', async () => {
    const newPassword = 'oop-new-password';
    const updated = await updatePassword({
      currentPassword: demoCredentials.password,
      password: newPassword,
    });
    const expiredMe = await fetch(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, {
      headers: sessionHeaders(),
    });
    const expiredRefresh = await fetch(
      `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
      { method: 'POST', headers: sessionHeaders() },
    );
    expect(expiredMe.status).toBe(401);
    expect(expiredRefresh.status).toBe(401);
    const oldPasswordLogin = await login();
    const newPasswordLogin = await login(newPassword);

    expect(updated.status).toBe(200);
    await expect(updated.text()).resolves.toBe('Password changed successfully');
    expect(oldPasswordLogin.status).toBe(401);
    expect(newPasswordLogin.status).toBe(200);
  });
});
