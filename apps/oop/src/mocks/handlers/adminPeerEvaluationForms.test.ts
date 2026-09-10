import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { resetMockSessionState } from '../authSession';
import {
  adminPeerEvaluationFormHandlers,
  resetAdminPeerEvaluationFormsFixture,
} from './adminPeerEvaluationForms';
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
