import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import {
  resetMockSessionState,
  revokeMockSession,
  rotateMockSession,
} from '../authSession';
import { adminNotices } from '../data/adminNotices';
import {
  demoAccessToken,
  demoAdminAccessToken,
  demoOtherSectionAccessToken,
  getDemoUserAccount,
} from '../data/users';

import { handlers } from './index';

const server = setupServer(...handlers);
const sectionId = 'oop-2026-2-01';
const adminAccount = getDemoUserAccount(demoAdminAccessToken)!;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockSessionState());
afterEach(() => {
  server.resetHandlers();
  resetMockSessionState();
});
afterAll(() => server.close());

function cookieRequest(name: string, token: string) {
  return new Request(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, {
    headers: { cookie: `${name}=${token}` },
  });
}

const adminEndpoints = [
  ENDPOINTS.ADMIN.MEETING_RECORDS,
  `${ENDPOINTS.ADMIN.MEETING_RECORD('admin-meeting-1')}?sectionId=${sectionId}`,
  ENDPOINTS.ADMIN.MILESTONE_SCHEDULE,
  ENDPOINTS.ADMIN.MILESTONE_SUBMISSION_DETAIL('submission-oop-01-1-proposal'),
  ENDPOINTS.ADMIN.SECTION_MILESTONE_SUBMISSIONS(sectionId, 'proposal'),
  ENDPOINTS.ADMIN.NOTICES,
  ENDPOINTS.ADMIN.NOTICE_DETAIL(adminNotices[0].id),
  ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS(sectionId),
  ENDPOINTS.ADMIN.SECTION_STUDENTS(sectionId),
  `${ENDPOINTS.TEAM.ROOT}?sectionId=${sectionId}`,
  ENDPOINTS.ADMIN.TEAM_DASHBOARD('team-1151-1'),
  ENDPOINTS.PROFILE.ME,
];

it.each(adminEndpoints)(
  '%s: 어드민 Bearer와 갱신 쿠키를 허용하고 미인증·학생·폐기 세션은 거부한다',
  async endpoint => {
    const url = `${API_BASE_URL}${endpoint}`;
    expect((await fetch(url)).status).toBe(401);
    expect(
      (
        await fetch(url, {
          headers: { cookie: `accessToken=${demoAccessToken}` },
        })
      ).status,
    ).toBe(endpoint === ENDPOINTS.PROFILE.ME ? 403 : 401);
    expect(
      (
        await fetch(url, {
          headers: { Authorization: `Bearer ${demoAdminAccessToken}` },
        })
      ).status,
    ).toBe(200);

    const rotated = rotateMockSession(
      cookieRequest('refreshToken', adminAccount.refreshToken),
    );
    if (!rotated) throw new Error('admin fixture session missing');
    const headers = { cookie: `accessToken=${rotated.tokens.accessToken}` };
    expect((await fetch(url, { headers })).status).toBe(200);
    expect(
      (
        await fetch(url, {
          headers: { cookie: `accessToken=${demoAdminAccessToken}` },
        })
      ).status,
    ).toBe(401);

    revokeMockSession(
      cookieRequest('refreshToken', rotated.tokens.refreshToken),
    );
    expect((await fetch(url, { headers })).status).toBe(401);
  },
);

it.each([
  `${ENDPOINTS.ADMIN.MEETING_RECORD('admin-meeting-1')}?sectionId=other-section`,
  ENDPOINTS.ADMIN.SECTION_MILESTONE_SUBMISSIONS('other-section', 'proposal'),
  ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS('other-section'),
])('%s: 유효한 어드민 세션이어도 담당 외 분반은 거부한다', async endpoint => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { cookie: `accessToken=${demoAdminAccessToken}` },
  });
  expect(response.status).toBe(403);
});

it('학생 대시보드는 소속 학생만 허용하고 어드민과 다른 분반 학생은 거부한다', async () => {
  const url = `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD(sectionId)}`;
  expect((await fetch(url)).status).toBe(401);
  for (const [token, expectedStatus] of [
    [demoAccessToken, 200],
    [demoAdminAccessToken, 401],
    [demoOtherSectionAccessToken, 403],
  ] as const) {
    const response = await fetch(url, {
      headers: { cookie: `accessToken=${token}` },
    });
    expect(response.status).toBe(expectedStatus);
  }
});
