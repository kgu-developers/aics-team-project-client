import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import {
  adminPeerEvaluationFormHandlers,
  resetAdminPeerEvaluationFormsFixture,
} from './adminPeerEvaluationForms';
import { resetMockSessionState } from '../authSession';
import {
  createAdminSectionMilestoneFixture,
  getAdminSectionMilestoneFixture,
  resetAdminSectionMilestonesFixture,
} from '../data/adminSectionMilestones';
import { demoAdminAccessToken } from '../data/users';

const server = setupServer(...adminPeerEvaluationFormHandlers);
const endpoint = ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_FORM('1');
const headers = {
  Authorization: `Bearer ${demoAdminAccessToken}`,
  'Content-Type': 'application/json',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  resetAdminPeerEvaluationFormsFixture();
  resetAdminSectionMilestonesFixture();
});
afterEach(() => {
  server.resetHandlers();
  resetMockSessionState();
});
afterAll(() => server.close());

it('객체가 아닌 상호평가 양식 입력은 잘못된 요청으로 처리한다', async () => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    body: 'null',
    headers,
    method: 'POST',
  });

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    code: 'INVALID_REQUEST',
  });
});

it('완전한 상호평가 양식을 생성하고 마일스톤 응답 fixture에 연결한다', async () => {
  const milestone = createAdminSectionMilestoneFixture('1', {
    allowResubmissionBeforeDueAt: false,
    schedule: {
      dueAt: '2026-12-15T23:59:00',
      evaluationClosesAt: '2026-12-15T23:59:00',
      evaluationOpensAt: '2026-12-09T09:00:00',
      opensAt: '2026-12-09T09:00:00',
    },
    title: '상호 평가',
    type: 'PEER_EVALUATION',
    weekNumber: 14,
  })!;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    body: JSON.stringify({
      anonymous: false,
      closesAt: '2026-12-15T23:59:00',
      milestoneId: milestone.id,
      opensAt: '2026-12-09T09:00:00',
    }),
    headers,
    method: 'POST',
  });

  expect(response.status).toBe(201);
  const updated = getAdminSectionMilestoneFixture('1', String(milestone.id));
  expect(updated?.peerEvaluationForm).toMatchObject({
    anonymous: false,
    closesAt: '2026-12-15T23:59:00',
    milestoneId: milestone.id,
    opensAt: '2026-12-09T09:00:00',
  });
  expect(updated?.schedule).toMatchObject({
    dueAt: '2026-12-15T23:59:00',
    evaluationClosesAt: '2026-12-15T23:59:00',
    evaluationOpensAt: '2026-12-09T09:00:00',
    opensAt: '2026-12-09T09:00:00',
  });
});

it('이미 양식이 있는 상호평가 마일스톤은 서버 계약과 같은 409를 반환한다', async () => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    body: JSON.stringify({
      anonymous: false,
      closesAt: '2026-12-15T23:59:00',
      milestoneId: 105,
      opensAt: '2026-12-09T09:00:00',
    }),
    headers,
    method: 'POST',
  });

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
    code: 'PEER_EVALUATION_FORM_ALREADY_EXISTS',
  });
});
