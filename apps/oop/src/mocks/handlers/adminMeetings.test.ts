import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { resetMockSessionState } from '../authSession';
import { demoAdminAccessToken } from '../data/users';

import { adminMeetingHandlers } from './adminMeetings';

const server = setupServer(...adminMeetingHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockSessionState());
afterEach(() => {
  server.resetHandlers();
  resetMockSessionState();
});
afterAll(() => server.close());

it('목록의 필터·페이지네이션 후에도 회의록 ID로 같은 상세를 조회한다', async () => {
  const listResponse = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}?teamId=11&page=0&size=1`,
    { headers: { Authorization: `Bearer ${demoAdminAccessToken}` } },
  );
  const list = (await listResponse.json()) as {
    contents: Array<{ id: number }>;
  };

  expect(listResponse.status).toBe(200);
  expect(list.contents.map(record => record.id)).toEqual([1]);

  const detailResponse = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD_DETAIL(list.contents[0].id)}`,
    { headers: { Authorization: `Bearer ${demoAdminAccessToken}` } },
  );
  const detail = (await detailResponse.json()) as {
    id: number;
    title: string;
  };

  expect(detailResponse.status).toBe(200);
  expect(detail).toMatchObject({ id: 1, title: '프로젝트 킥오프' });
});
