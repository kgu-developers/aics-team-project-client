import { ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { demoUserAccounts } from '../data/users';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const refreshCookieName = 'oop_refresh_token';

const initialDemoPasswords: ReadonlyMap<string, string> = new Map(
  demoUserAccounts.map(account => [
    account.accessToken,
    account.credentials.password,
  ]),
);
const demoPasswords = new Map<string, string>(initialDemoPasswords);

/** Reset mutable password state between mock scenarios/tests. */
export function resetDemoPasswordState() {
  demoPasswords.clear();
  initialDemoPasswords.forEach((password, accessToken) => {
    demoPasswords.set(accessToken, password);
  });
}

function getRefreshCookieHeader(value: string) {
  return `${refreshCookieName}=${value}; HttpOnly; Path=/auth; SameSite=Lax`;
}

function getRefreshToken(request: Request) {
  return request.headers
    .get('cookie')
    ?.split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${refreshCookieName}=`))
    ?.slice(`${refreshCookieName}=`.length);
}

function getAuthenticatedAccount(request: Request) {
  const authorization = request.headers.get('authorization');
  return demoUserAccounts.find(
    ({ accessToken }) => authorization === `Bearer ${accessToken}`,
  );
}

export const authHandlers = [
  http.post(`${apiBaseUrl}${ENDPOINTS.AUTH.LOGIN}`, async ({ request }) => {
    const input = (await request.json()) as {
      studentNumber?: string;
      password?: string;
    };

    if (input.studentNumber === 'network-error') {
      return HttpResponse.error();
    }

    if (input.studentNumber === '40300000') {
      return HttpResponse.json(
        {
          code: 'ACCOUNT_ACCESS_DENIED',
          message: '현재 계정은 이 OOP 분반에 접근할 수 없습니다.',
        },
        { status: 403 },
      );
    }

    const account = demoUserAccounts.find(
      ({ accessToken, credentials }) =>
        input.studentNumber === credentials.studentNumber &&
        input.password === demoPasswords.get(accessToken),
    );

    if (!account) {
      return HttpResponse.json(
        {
          code: 'INVALID_CREDENTIALS',
          message: '학번 또는 비밀번호를 확인해 주세요.',
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      { accessToken: account.accessToken },
      {
        headers: { 'Set-Cookie': getRefreshCookieHeader(account.refreshToken) },
      },
    );
  }),

  http.post(`${apiBaseUrl}${ENDPOINTS.AUTH.REFRESH}`, ({ request }) => {
    const refreshToken = getRefreshToken(request);
    const account = demoUserAccounts.find(
      candidate => candidate.refreshToken === refreshToken,
    );

    if (!account) {
      return HttpResponse.json(
        {
          code: 'REFRESH_TOKEN_MISSING',
          message: '세션이 만료되었습니다. 다시 로그인해 주세요.',
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(
      { accessToken: account.accessToken },
      {
        headers: { 'Set-Cookie': getRefreshCookieHeader(account.refreshToken) },
      },
    );
  }),

  http.post(`${apiBaseUrl}${ENDPOINTS.AUTH.LOGOUT}`, () =>
    HttpResponse.json(null, {
      headers: {
        'Set-Cookie': `${refreshCookieName}=; HttpOnly; Max-Age=0; Path=/auth; SameSite=Lax`,
      },
    }),
  ),

  http.patch(
    `${apiBaseUrl}${ENDPOINTS.PROFILE.PASSWORD}`,
    async ({ request }) => {
      const account = getAuthenticatedAccount(request);
      if (!account) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      let input: {
        currentPassword?: unknown;
        newPassword?: unknown;
      };
      try {
        input = (await request.json()) as typeof input;
      } catch {
        return HttpResponse.json(
          {
            code: 'INVALID_PASSWORD_INPUT',
            message: '비밀번호 변경 요청 형식이 올바르지 않습니다.',
          },
          { status: 400 },
        );
      }

      if (
        typeof input?.currentPassword !== 'string' ||
        typeof input.newPassword !== 'string'
      ) {
        return HttpResponse.json(
          {
            code: 'INVALID_PASSWORD_INPUT',
            message: '현재 비밀번호와 새 비밀번호를 입력해 주세요.',
          },
          { status: 400 },
        );
      }

      if (input.newPassword.length < 8) {
        return HttpResponse.json(
          {
            code: 'INVALID_NEW_PASSWORD',
            message: '새 비밀번호는 8자 이상이어야 합니다.',
          },
          { status: 400 },
        );
      }

      if (input.currentPassword === input.newPassword) {
        return HttpResponse.json(
          {
            code: 'PASSWORD_UNCHANGED',
            message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
          },
          { status: 400 },
        );
      }

      if (input.currentPassword !== demoPasswords.get(account.accessToken)) {
        return HttpResponse.json(
          {
            code: 'INVALID_CURRENT_PASSWORD',
            message: '현재 비밀번호가 올바르지 않습니다.',
          },
          { status: 401 },
        );
      }

      demoPasswords.set(account.accessToken, input.newPassword);
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.get(`${apiBaseUrl}${ENDPOINTS.AUTH.ME}`, ({ request }) => {
    const authorization = request.headers.get('authorization');

    const account = demoUserAccounts.find(
      ({ accessToken }) => authorization === `Bearer ${accessToken}`,
    );

    if (!account) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    return HttpResponse.json(account.user);
  }),
];
