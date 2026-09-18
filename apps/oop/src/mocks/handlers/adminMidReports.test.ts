import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

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
