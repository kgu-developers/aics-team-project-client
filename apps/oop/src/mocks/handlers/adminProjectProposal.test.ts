import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { resetMockSessionState } from '../authSession';
import { adminProjectProposalHandlers } from './adminProjectProposal';
import { demoAdminAccessToken } from '../data/users';

const server = setupServer(...adminProjectProposalHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockSessionState());
afterEach(() => server.resetHandlers());
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
    teamOperation: { id: 2, name: '2팀' },
  });
});
