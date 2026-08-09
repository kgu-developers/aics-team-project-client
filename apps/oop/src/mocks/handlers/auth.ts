import { ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { demoUserAccounts } from '../data/users';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const refreshCookieName = 'oop_refresh_token';

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
      ({ credentials }) =>
        input.studentNumber === credentials.studentNumber &&
        input.password === credentials.password,
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
