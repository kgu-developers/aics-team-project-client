import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { adminSectionMilestoneHandlers } from './adminSectionMilestones';
import { resetMockSessionState } from '../authSession';
import {
  getAdminSectionMilestoneFixture,
  resetAdminSectionMilestonesFixture,
} from '../data/adminSectionMilestones';
import {
  createAdminSection,
  resetAdminSectionsMockData,
} from '../data/adminSections';
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
  resetAdminSectionsMockData();
  resetAdminSectionMilestonesFixture();
});
afterEach(() => {
  server.resetHandlers();
  resetAdminSectionsMockData();
  resetMockSessionState();
});
afterAll(() => server.close());

it('새로 등록한 분반은 마일스톤이 아직 없어도 빈 목록으로 응답한다', async () => {
  const section = createAdminSection({
    capacity: 40,
    classTime: '수요일 3-4교시',
    code: 'OOP-02',
    courseId: 1,
    professorId: '20260002',
  });

  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES(String(section!.id))}`,
    { headers },
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ content: [] });
});

it('문자열 ID로 저장된 분반 fixture에도 마일스톤을 생성한다', async () => {
  const sectionId = 'oop-2026-2-01';
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES(sectionId)}`,
    {
      body: JSON.stringify({
        allowResubmissionBeforeDueAt: true,
        schedule: {
          dueAt: '2026-12-20T23:59:00',
          opensAt: '2026-12-16T09:00:00',
        },
        title: '문자열 분반 제안서',
        type: 'PROPOSAL',
        weekNumber: 14,
      }),
      headers,
      method: 'POST',
    },
  );

  expect(response.status).toBe(201);
  const { id } = (await response.json()) as { id: number };
  expect(getAdminSectionMilestoneFixture(sectionId, String(id))).toMatchObject({
    title: '문자열 분반 제안서',
    type: 'PROPOSAL',
  });
});

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

it('운영 데이터가 없는 DRAFT 마일스톤을 삭제하고 204로 응답한다', async () => {
  const createResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
    body: JSON.stringify({
      allowResubmissionBeforeDueAt: true,
      schedule: {
        dueAt: '2026-12-20T23:59:00',
        opensAt: '2026-12-16T09:00:00',
      },
      title: '삭제 가능한 초안',
      type: 'PROPOSAL',
      weekNumber: 14,
    }),
    headers,
    method: 'POST',
  });
  const { id } = (await createResponse.json()) as { id: number };

  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', String(id))}`,
    { headers, method: 'DELETE' },
  );

  expect(response.status).toBe(204);
  expect(getAdminSectionMilestoneFixture('1', String(id))).toBeUndefined();
});

it('운영 데이터가 있는 DRAFT 마일스톤 삭제를 409로 거부한다', async () => {
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '102')}`,
    { headers, method: 'DELETE' },
  );

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
    code: 'MILESTONE_DELETE_CONFLICT',
  });
  expect(getAdminSectionMilestoneFixture('1', '102')).toBeDefined();
});

it('DRAFT가 아닌 마일스톤 삭제를 409로 거부하고 기존 데이터를 유지한다', async () => {
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
    { headers, method: 'DELETE' },
  );

  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
    code: 'MILESTONE_DELETE_CONFLICT',
  });
  expect(getAdminSectionMilestoneFixture('1', '101')).toBeDefined();
});
