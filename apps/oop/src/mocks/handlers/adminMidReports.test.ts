import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';

import { resetMockSessionState } from '../authSession';
import {
  adminMidReportHandlers,
  resetAdminMidReportScenario,
} from './adminMidReports';
import { adminMilestoneSubmissionsHandlers } from './adminMilestoneSubmissions';
import { demoAdminAccessToken } from '../data/users';

const server = setupServer(
  ...adminMidReportHandlers,
  ...adminMilestoneSubmissionsHandlers,
);
const headers = { Authorization: `Bearer ${demoAdminAccessToken}` };

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockSessionState());
afterEach(() => {
  server.resetHandlers();
  resetAdminMidReportScenario();
});
afterAll(() => server.close());

it('중간점검 피드백 후 상세와 제출물 목록 모두 수정 요청 상태를 반환한다', async () => {
  const feedbackResponse = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('1', '1')}/feedback`,
    {
      body: JSON.stringify({ message: '수정 요청을 반영해 주세요.' }),
      headers: { ...headers, 'Content-Type': 'application/json' },
      method: 'POST',
    },
  );
  expect(feedbackResponse.status).toBe(200);

  const [detailResponse, listResponse] = await Promise.all([
    fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('1', '1')}`,
      { headers },
    ),
    fetch(`${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS('102')}`, {
      headers,
    }),
  ]);

  await expect(detailResponse.json()).resolves.toMatchObject({
    status: 'REVISION_REQUESTED',
  });
  const list = (await listResponse.json()) as {
    contents: Array<{ canSubmitNow: boolean; status: string; teamId: number }>;
  };
  expect(list.contents).toContainEqual(
    expect.objectContaining({
      canSubmitNow: true,
      status: 'REVISION_REQUESTED',
      teamId: 1,
    }),
  );
});

it('교수자가 현재 버전으로 최종 확인하면 완료 시각을 반환하고, 새 수정 요청은 확인을 다시 연다', async () => {
  const base = `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('1', '1')}`;
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };
  await fetch(`${base}/feedback`, {
    body: JSON.stringify({ message: '반영 내용을 확인해 주세요.' }),
    headers: jsonHeaders,
    method: 'POST',
  });

  const conflict = await fetch(`${base}/feedback/complete`, {
    body: JSON.stringify({ version: 99 }),
    headers: jsonHeaders,
    method: 'PATCH',
  });
  expect(conflict.status).toBe(409);

  const completed = await fetch(`${base}/feedback/complete`, {
    body: JSON.stringify({ version: 1 }),
    headers: jsonHeaders,
    method: 'PATCH',
  });
  expect(completed.status).toBe(200);
  await expect(completed.json()).resolves.toMatchObject({
    status: 'SUBMITTED',
    revision: {
      completedAt: expect.any(String),
      completedBy: expect.any(String),
    },
  });

  await fetch(`${base}/feedback`, {
    body: JSON.stringify({ message: '추가 수정 요청입니다.' }),
    headers: jsonHeaders,
    method: 'POST',
  });
  const reopened = await fetch(base, { headers });
  await expect(reopened.json()).resolves.toMatchObject({
    status: 'REVISION_REQUESTED',
    revision: { completedAt: null },
  });
});

it('최종 확인 상태는 핸들러를 다시 불러와도 유지되고 새 수정 요청 시 해제된다', async () => {
  const base = `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('1', '1')}`;
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };
  await fetch(`${base}/feedback`, {
    body: JSON.stringify({ message: '수정 요청입니다.' }),
    headers: jsonHeaders,
    method: 'POST',
  });
  const completed = await fetch(`${base}/feedback/complete`, {
    body: JSON.stringify({ version: 1 }),
    headers: jsonHeaders,
    method: 'PATCH',
  });
  expect(completed.status).toBe(200);

  vi.resetModules();
  const { adminMidReportHandlers: reloadedHandlers } =
    await import('./adminMidReports');
  server.use(...reloadedHandlers);
  const afterReload = await fetch(base, { headers });
  await expect(afterReload.json()).resolves.toMatchObject({
    status: 'SUBMITTED',
    revision: { completedAt: expect.any(String) },
  });

  await fetch(`${base}/feedback`, {
    body: JSON.stringify({ message: '추가 수정 요청입니다.' }),
    headers: jsonHeaders,
    method: 'POST',
  });
  const reopened = await fetch(base, { headers });
  await expect(reopened.json()).resolves.toMatchObject({
    status: 'REVISION_REQUESTED',
    revision: { completedAt: null },
  });
});

it('없는 보고서와 허용되지 않은 분반을 서로 다른 상태로 응답한다', async () => {
  const complete = (sectionId: string, teamId: string) =>
    fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT_FEEDBACK_COMPLETE(sectionId, teamId)}`,
      {
        body: JSON.stringify({ version: 1 }),
        headers: { ...headers, 'Content-Type': 'application/json' },
        method: 'PATCH',
      },
    );

  const missing = await complete('1', '99');
  expect(missing.status).toBe(404);
  await expect(missing.json()).resolves.toMatchObject({
    code: 'MID_REPORT_NOT_FOUND',
  });

  const forbidden = await complete('99', '1');
  expect(forbidden.status).toBe(403);
  await expect(forbidden.json()).resolves.toMatchObject({ code: 'FORBIDDEN' });
});
