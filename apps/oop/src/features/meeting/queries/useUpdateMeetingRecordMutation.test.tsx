import {
  API_BASE_URL,
  apiClient,
  fetchMeetingRecordDetail,
  fetchMeetingActionEntries,
  fetchMeetingRecordSummaries,
  fetchTeamMeetingActionEntries,
  updateMeetingRecordApi,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';

import { studentHomeKeys } from '~/features/student-home/queries/studentHomeKeys';

import { mapStudentMeeting } from '../model/studentMeeting';
import { meetingApiKeys } from './api/meetingApiKeys';
import { meetingKeys } from './meetingKeys';
import { useUpdateMeetingRecordMutation } from './useUpdateMeetingRecordMutation';

import { meetingApiRecord, meetingApiTeam } from '~/mocks/data/meetingApi';
import { demoAccessToken } from '~/mocks/data/users';
import { createMeetingApiHandlers } from '~/mocks/handlers/meetingApi';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  apiClient.defaults.headers.common.Authorization = `Bearer ${demoAccessToken}`;
  server.use(...createMeetingApiHandlers());
});
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
  clients.splice(0).forEach(client => client.clear());
  delete apiClient.defaults.headers.common.Authorization;
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

const original = mapStudentMeeting(
  { ...meetingApiRecord, id: '19', teamId: '7', location: '301호' },
  [],
  meetingApiTeam,
);
const input = {
  title: '수정한 회의록',
  heldAt: '2026-09-07T09:30:00',
  content: original.content,
  location: original.location,
  participantUserIds: original.participants.map(person => person.userId),
  actions: [],
};
const variables = {
  teamId: '7',
  meetingId: '19',
  original,
  phase: 'MID_CHECK' as const,
  input,
  confirmOwnership: async () => true,
};
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    client,
    ...renderHook(() => useUpdateMeetingRecordMutation(), { wrapper }),
  };
}

it('변경한 제목만 PATCH하고 상세·목록·팀 액션의 회의 제목이 일치한다', async () => {
  const bodies: unknown[] = [];
  const writes: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method !== 'GET') writes.push(request.method);
  });
  server.use(
    http.patch(`${API_BASE_URL}/meeting-records/19`, async ({ request }) => {
      bodies.push(await request.clone().json());
      return undefined;
    }),
  );
  const { result, client } = setup();
  const keys = [
    meetingApiKeys.detail('19'),
    meetingApiKeys.filteredList('7', 'MID_CHECK'),
    meetingApiKeys.filteredTeamActions('7', 'TODO'),
    meetingKeys.list('7'),
    studentHomeKeys.dashboard('section-1'),
  ];
  keys.forEach(key => client.setQueryData(key, { cached: true }));
  client.setQueryData(meetingApiKeys.list('8'), { other: true });
  await act(() => result.current.mutateAsync(variables));
  expect(bodies).toEqual([{ title: input.title }]);
  expect(writes).toEqual(['PATCH']);
  keys.forEach(key =>
    expect(client.getQueryState(key)?.isInvalidated).toBe(true),
  );
  expect(client.getQueryState(meetingApiKeys.list('8'))?.isInvalidated).toBe(
    false,
  );
  expect(await fetchMeetingRecordDetail('19')).toMatchObject({
    title: input.title,
    content: meetingApiRecord.content,
    meetingAt: meetingApiRecord.meetingAt,
  });
  expect((await fetchMeetingRecordSummaries('7'))[0]?.title).toBe(input.title);
  expect(
    (await fetchTeamMeetingActionEntries('7'))[0]?.meetingRecord.title,
  ).toBe(input.title);
  expect(await fetchMeetingActionEntries('19')).toHaveLength(1);
});

it('변경 사항이 없으면 PUT·PATCH 요청을 보내지 않는다', async () => {
  const request = vi.fn();
  server.events.on('request:start', request);
  const { result } = setup();
  await act(() =>
    result.current.mutateAsync({
      ...variables,
      input: { ...input, title: original.title },
    }),
  );
  expect(request).not.toHaveBeenCalled();
});

it.each([undefined, async () => false])(
  '저장 직전 잠금 소유권을 확인하지 못하면 PATCH를 보내지 않는다',
  async confirmOwnership => {
    const request = vi.fn();
    server.events.on('request:start', request);
    const { result } = setup();
    await act(async () => {
      await expect(
        result.current.mutateAsync({ ...variables, confirmOwnership }),
      ).rejects.toThrow('편집 잠금');
    });
    expect(request).not.toHaveBeenCalled();
  },
);

it.each([
  { teamId: '' },
  { teamId: '0' },
  { meetingId: '' },
  { meetingId: 'meeting-19' },
  { original: undefined },
  { phase: undefined },
  { teamId: '8' },
  { meetingId: '20' },
])('원본 또는 필수 ID가 일치하지 않으면 요청하지 않는다: %j', async patch => {
  const request = vi.fn();
  server.events.on('request:start', request);
  const { result } = setup();
  await act(async () => {
    await expect(
      result.current.mutateAsync({ ...variables, ...patch }),
    ).rejects.toThrow('유효한');
  });
  expect(request).not.toHaveBeenCalled();
});

it.each([400, 401, 403, 404, 409, 503, 'network'] as const)(
  '실패 %s에서는 자동 재전송하지 않고 입력 오류·편집 차단·결과 불확실을 구분한다',
  async status => {
    const request = vi.fn();
    server.use(
      http.patch(`${API_BASE_URL}/meeting-records/19`, () => {
        request();
        return status === 'network'
          ? HttpResponse.error()
          : HttpResponse.json({ code: 'ERROR' }, { status });
      }),
    );
    const { result } = setup();
    await act(async () => {
      await expect(result.current.mutateAsync(variables)).rejects.toMatchObject(
        {
          uncertain: status === 503 || status === 'network',
          blocksRetry: status !== 400,
        },
      );
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect((await fetchMeetingRecordDetail('19')).title).toBe(original.title);
  },
);

it('MSW PATCH는 null·누락 필드를 유지하고 장소·참석자 해제를 반영한다', async () => {
  await apiClient.patch('/meeting-records/19', {
    title: null,
    content: null,
    location: null,
  });
  expect(await fetchMeetingRecordDetail('19')).toMatchObject({
    title: original.title,
    location: '301호',
  });
  const result = await updateMeetingRecordApi('19', {
    location: '',
    participantIds: [],
  });
  expect(result).not.toHaveProperty('content');
  expect(await fetchMeetingRecordDetail('19')).toMatchObject({
    location: '',
    participantIds: [],
    content: meetingApiRecord.content,
  });
});

it.each([
  { title: '  ' },
  { phase: 'UNKNOWN' },
  { content: '' },
  { meetingAt: '2026-02-31T00:30:00' },
  { participantIds: '20260001' },
])('MSW는 유효하지 않은 수정 요청을 400으로 거절한다: %j', async input => {
  await expect(
    apiClient.patch('/meeting-records/19', input),
  ).rejects.toMatchObject({ response: { status: 400 } });
  expect((await fetchMeetingRecordDetail('19')).title).toBe(original.title);
});

it('MSW는 인증되지 않은 수정과 존재하지 않는 회의록을 거절한다', async () => {
  await expect(
    updateMeetingRecordApi('999', { title: '없음' }),
  ).rejects.toMatchObject({ response: { status: 404 } });
  delete apiClient.defaults.headers.common.Authorization;
  await expect(
    updateMeetingRecordApi('19', { title: '익명' }),
  ).rejects.toMatchObject({ response: { status: 401 } });
});
