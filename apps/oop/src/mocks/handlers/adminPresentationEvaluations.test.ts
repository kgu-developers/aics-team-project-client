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

import {
  adminPresentationEvaluationHandlers,
  resetPresentationEvaluationScenario,
} from './adminPresentationEvaluations';
import { resetMockSessionState } from '../authSession';
import { demoAdminAccessToken } from '../data/users';

const server = setupServer(...adminPresentationEvaluationHandlers);
const collectionEndpoint = ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1');
const itemEndpoint = ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERION('1', '1');
const headers = {
  Authorization: `Bearer ${demoAdminAccessToken}`,
  'Content-Type': 'application/json',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  resetPresentationEvaluationScenario();
});
afterEach(() => {
  server.resetHandlers();
  resetMockSessionState();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

it('평가가 종료된 뒤에도 시작된 발표 평가 항목의 생성·수정·삭제를 막는다', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-12-01T00:00:00.000Z'));

  const createResponse = await fetch(`${API_BASE_URL}${collectionEndpoint}`, {
    body: JSON.stringify({
      displayOrder: 3,
      maxScore: 5,
      title: '추가 항목',
    }),
    headers,
    method: 'POST',
  });
  const updateResponse = await fetch(`${API_BASE_URL}${itemEndpoint}`, {
    body: JSON.stringify({
      displayOrder: 0,
      maxScore: 5,
      title: '수정 항목',
    }),
    headers,
    method: 'PATCH',
  });
  const removeResponse = await fetch(`${API_BASE_URL}${itemEndpoint}`, {
    headers,
    method: 'DELETE',
  });

  await expect(createResponse.json()).resolves.toMatchObject({
    code: 'TEAM_EVALUATION_CRITERION_LOCKED',
  });
  expect(updateResponse.status).toBe(409);
  expect(removeResponse.status).toBe(409);
});
