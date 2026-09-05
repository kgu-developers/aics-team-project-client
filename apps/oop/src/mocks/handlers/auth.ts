import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  AuthLoginResponse,
  AuthLogoutResponse,
  AuthRefreshResponse,
  AuthSessionRole,
  CurrentUserResponse,
  UserGlobalRole,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  expiredMockSessionResponseHeaders,
  getMockAuthenticatedAccount,
  hasValidMockCsrfToken,
  issueMockSession,
  mockSessionResponseHeaders,
  resetMockSessionState,
  revokeMockSession,
  rotateMockSession,
} from '../authSession';
import { demoUserAccounts } from '../data/users';

const initialDemoPasswords: ReadonlyMap<string, string> = new Map(
  demoUserAccounts.map(account => [
    account.credentials.studentNumber,
    account.credentials.password,
  ]),
);
const demoPasswords = new Map<string, string>(initialDemoPasswords);

/** Reset mutable authentication state between mock scenarios/tests. */
export function resetDemoPasswordState() {
  demoPasswords.clear();
  initialDemoPasswords.forEach((password, studentNumber) => {
    demoPasswords.set(studentNumber, password);
  });
  resetMockSessionState();
}

function csrfForbidden() {
  return new HttpResponse(null, { status: 403 });
}

function unauthorized(code?: string) {
  return code
    ? HttpResponse.json({ code }, { status: 401 })
    : new HttpResponse(null, { status: 401 });
}

function invalidInput() {
  return HttpResponse.json({ code: 'INVALID_INPUT' }, { status: 400 });
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toAuthSessionRole(role: UserGlobalRole): AuthSessionRole {
  return role === 'PROFESSOR' ? 'ADMIN' : role;
}

function toServerGlobalRole(
  role: UserGlobalRole,
): CurrentUserResponse['globalRole'] {
  return role === 'PROFESSOR' ? 'ADMIN' : 'USER';
}

function toServerTeamId(teamId: string | undefined) {
  if (!teamId) return undefined;

  const numericId = teamId.match(/\d+$/)?.[0];
  if (!numericId) return undefined;

  const id = Number(numericId);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function toCurrentUserResponse(
  account: (typeof demoUserAccounts)[number],
): CurrentUserResponse {
  const sections = account.user.sections.map((section, index) => ({
    id: section.id.endsWith('02') ? 2 : index + 1,
    code: section.code,
    name: section.name,
  }));
  const teamId = toServerTeamId(account.user.currentTeam?.id);

  return {
    studentNumber: account.user.studentNumber,
    email: account.user.email,
    name: account.user.name,
    globalRole: toServerGlobalRole(account.user.globalRole),
    phone: '010-0000-0000',
    sections,
    ...(teamId ? { teamId } : {}),
  };
}

/** Cookie-session operations that can be switched to the real backend. */
export const authSessionHandlers = [
  http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, async ({ request }) => {
    let input: { studentNumber?: unknown; password?: unknown };
    try {
      input = (await request.json()) as typeof input;
    } catch {
      return invalidInput();
    }

    if (
      !isNonBlankString(input.studentNumber) ||
      !isNonBlankString(input.password)
    ) {
      return invalidInput();
    }

    const account = demoUserAccounts.find(
      candidate =>
        input.studentNumber === candidate.credentials.studentNumber &&
        input.password ===
          demoPasswords.get(candidate.credentials.studentNumber),
    );

    if (!account) {
      return HttpResponse.json<AuthLoginResponse>(
        { message: '학번 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 },
      );
    }

    const session = issueMockSession(account);
    return HttpResponse.json<AuthLoginResponse>(
      {
        message: 'Login Successfully',
        role: toAuthSessionRole(account.user.globalRole),
      },
      { headers: mockSessionResponseHeaders(session), status: 200 },
    );
  }),

  http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, ({ request }) => {
    if (!hasValidMockCsrfToken(request)) return csrfForbidden();

    const session = rotateMockSession(request);
    if (!session) {
      return HttpResponse.json<AuthRefreshResponse>(
        { message: 'refreshToken이 없거나 유효하지 않습니다.' },
        { status: 401 },
      );
    }

    return HttpResponse.json<AuthRefreshResponse>(
      {
        message: 'Refresh Successfully',
        role: toAuthSessionRole(session.account.user.globalRole),
      },
      { headers: mockSessionResponseHeaders(session), status: 200 },
    );
  }),

  http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`, ({ request }) => {
    if (!hasValidMockCsrfToken(request)) return csrfForbidden();

    revokeMockSession(request);
    return HttpResponse.json<AuthLogoutResponse>(
      { message: 'Logout Successfully' },
      { headers: expiredMockSessionResponseHeaders(), status: 200 },
    );
  }),
];

/** Account operations that can be switched to the real backend independently. */
export const userHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, ({ request }) => {
    const account = getMockAuthenticatedAccount(request);
    return account
      ? HttpResponse.json<CurrentUserResponse>(toCurrentUserResponse(account))
      : unauthorized();
  }),

  http.patch(
    `${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD}`,
    async ({ request }) => {
      const account = getMockAuthenticatedAccount(request);
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

      if (
        input.currentPassword !==
        demoPasswords.get(account.credentials.studentNumber)
      ) {
        return HttpResponse.json(
          {
            code: 'INVALID_CURRENT_PASSWORD',
            message: '현재 비밀번호가 올바르지 않습니다.',
          },
          { status: 401 },
        );
      }

      demoPasswords.set(account.credentials.studentNumber, input.newPassword);
      return new HttpResponse(null, { status: 204 });
    },
  ),
];

/** Backward-compatible full auth fixture collection for existing tests. */
export const authHandlers = [...authSessionHandlers, ...userHandlers];
