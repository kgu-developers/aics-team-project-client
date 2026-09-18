import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { resetMockSessionState } from '../authSession';
import { adminProjectProposalHandlers } from './adminProjectProposal';
import {
  adminProposalFeedbackHandlers,
  resetAdminProposalFeedbackScenario,
} from './adminProposalFeedbacks';
import { demoAdminAccessToken } from '../data/users';

const server = setupServer(
  ...adminProjectProposalHandlers,
  ...adminProposalFeedbackHandlers,
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockSessionState());
afterEach(() => server.resetHandlers());
afterEach(() => resetAdminProposalFeedbackScenario());
afterAll(() => server.close());

it('담당 조교는 분반 팀의 제안서를 조회할 수 있다', async () => {
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('2')}`,
    {
      headers: { Authorization: `Bearer ${demoAdminAccessToken}` },
    },
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    teamId: 2,
    teamOperation: {
      id: 2,
      members: [
        { name: '박지훈', studentNumber: '20239876' },
        { name: '최유진', studentNumber: '20234567' },
      ],
      name: '2팀',
    },
  });
});

it('완료된 제안서에 피드백을 등록하면 수정 요청 상태로 다시 연다', async () => {
  const headers = {
    Authorization: `Bearer ${demoAdminAccessToken}`,
  };
  const projectUrl = `${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('1')}`;

  const beforeFeedback = await fetch(projectUrl, { headers });
  await expect(beforeFeedback.json()).resolves.toMatchObject({
    proposalCompletedAt: '2026-09-12T11:00:00',
  });

  const feedbackResponse = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_PROPOSAL('1', '1')}/feedback`,
    {
      body: JSON.stringify({ message: '수정 요청을 반영해 주세요.' }),
      headers: { ...headers, 'Content-Type': 'application/json' },
      method: 'POST',
    },
  );
  expect(feedbackResponse.status).toBe(200);

  const afterFeedback = await fetch(projectUrl, { headers });
  await expect(afterFeedback.json()).resolves.toMatchObject({
    proposalCompletedAt: null,
  });
});
