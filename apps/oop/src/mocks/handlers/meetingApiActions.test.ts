import {
  API_BASE_URL,
  apiClient,
  fetchMeetingActionEntries,
  fetchTeamMeetingActionEntries,
  submitMeetingActionApi,
  updateMeetingActionApi,
} from '@aics/api-client';
import { setupServer } from 'msw/node';
import { beforeAll, beforeEach, afterEach, afterAll, expect, it } from 'vitest';

import { createMeetingApiHandlers } from './meetingApi';
import { demoAccessToken } from '../data/users';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  apiClient.defaults.headers.common.Authorization = `Bearer ${demoAccessToken}`;
  server.use(...createMeetingApiHandlers());
});
afterEach(() => {
  server.resetHandlers();
  delete apiClient.defaults.headers.common.Authorization;
});
afterAll(() => server.close());

it('등록·수정·해제 후 회의별/팀별 조회가 같은 액션과 회의록 제목을 반환한다', async () => {
  const created = await submitMeetingActionApi('19', {
    content: '새 작업',
    assigneeId: '20260001',
    dueAt: '2026-09-10T23:59:00',
  });
  expect(created).toMatchObject({
    status: 'TODO',
    dueAt: '2026-09-10 23:59',
    assignee: { userId: '20260001' },
  });
  await updateMeetingActionApi(created.id, {
    status: 'DONE',
    clearAssignee: true,
    clearDueAt: true,
  });
  const completed = await fetchTeamMeetingActionEntries('7', 'DONE');
  expect(completed).toEqual([
    {
      ...created,
      status: 'DONE',
      assignee: null,
      dueAt: null,
      meetingRecord: { id: '19', title: '진행 점검 회의' },
    },
  ]);
  expect(
    (await fetchMeetingActionEntries('19')).find(
      action => action.id === created.id,
    ),
  ).toMatchObject({ status: 'DONE', assignee: null, dueAt: null });
});

it('인증 없는 등록과 다른 팀 조회를 거절한다', async () => {
  await expect(fetchTeamMeetingActionEntries('8')).rejects.toMatchObject({
    response: { status: 403 },
  });
  delete apiClient.defaults.headers.common.Authorization;
  await expect(
    submitMeetingActionApi('19', { content: '작업' }),
  ).rejects.toMatchObject({ response: { status: 401 } });
});
it.each([
  { content: '' },
  { content: '작업', assigneeId: '99999999' },
  { content: '작업', dueAt: '2026-09-10' },
])('잘못된 등록 입력을 거절한다: %j', async input => {
  await expect(submitMeetingActionApi('19', input)).rejects.toMatchObject({
    response: { status: 400 },
  });
});
it('없는 회의록/액션과 지원하지 않는 상태를 거절한다', async () => {
  await expect(
    submitMeetingActionApi('999', { content: '작업' }),
  ).rejects.toMatchObject({ response: { status: 404 } });
  await expect(
    updateMeetingActionApi('999', { status: 'DONE' }),
  ).rejects.toMatchObject({ response: { status: 404 } });
  await expect(
    apiClient.get(`${API_BASE_URL}/teams/7/actions`, {
      params: { status: 'EXCLUDED' },
    }),
  ).rejects.toMatchObject({ response: { status: 400 } });
});
