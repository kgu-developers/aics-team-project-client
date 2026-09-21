import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { adminSectionMilestoneHandlers } from './adminSectionMilestones';
import { resetMockSessionState } from '../authSession';
import {
  getAdminSectionMilestoneFixture,
  resetAdminSectionMilestonesFixture,
} from '../data/adminSectionMilestones';
import { demoAdminAccessToken } from '../data/users';

const server = setupServer(...adminSectionMilestoneHandlers);
const endpoint = ENDPOINTS.ADMIN.SECTION_MILESTONES('1');
const headers = {
  Authorization: `Bearer ${demoAdminAccessToken}`,
  'Content-Type': 'application/json',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  resetAdminSectionMilestonesFixture();
});
afterEach(() => {
  server.resetHandlers();
  resetMockSessionState();
});
afterAll(() => server.close());

it('상호평가 생성은 일치하는 시작·종료 별칭과 종료 dueAt을 요구한다', async () => {
  const input = {
    allowResubmissionBeforeDueAt: false,
    schedule: {
      dueAt: '2026-12-20T23:59:00',
      evaluationClosesAt: '2026-12-20T23:59:00',
      evaluationOpensAt: '2026-12-16T09:00:00',
      opensAt: '2026-12-16T09:00:00',
    },
    title: '상호 평가',
    type: 'PEER_EVALUATION',
    weekNumber: 14,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    body: JSON.stringify(input),
    headers,
    method: 'POST',
  });

  expect(response.status).toBe(201);
  const { id } = (await response.json()) as { id: number };
  expect(getAdminSectionMilestoneFixture('1', String(id))).toMatchObject({
    peerEvaluationForm: null,
    schedule: input.schedule,
    type: 'PEER_EVALUATION',
  });
});

it('종료 dueAt만 있는 이전 상호평가 생성 본문은 거부한다', async () => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    body: JSON.stringify({
      allowResubmissionBeforeDueAt: false,
      schedule: { dueAt: '2026-12-20T23:59:00' },
      title: '상호 평가',
      type: 'PEER_EVALUATION',
      weekNumber: 14,
    }),
    headers,
    method: 'POST',
  });

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    code: 'INVALID_MILESTONE_REQUEST',
  });
});
