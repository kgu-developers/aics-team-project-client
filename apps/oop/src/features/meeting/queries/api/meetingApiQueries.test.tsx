import { API_BASE_URL } from '@aics/api-client';
import type { MeetingApiActionStatus, MeetingPhase } from '@aics/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { meetingKeys } from '../meetingKeys';

import {
  meetingApiKeys,
  useMeetingRecordDetailQuery,
  useMeetingRecordSummariesQuery,
  useRemoveMeetingRecordApiMutation,
  useTeamMeetingActionEntriesQuery,
  useMeetingActionEntriesQuery,
  useSubmitMeetingRecordApiMutation,
  useUpdateMeetingRecordApiMutation,
  useSubmitMeetingActionApiMutation,
  useUpdateMeetingActionApiMutation,
} from './index';

const record = {
  id: 7,
  title: '진행 점검',
  phase: 'MID_CHECK',
  meetingAt: '2026-08-03 14:00',
  authorId: '202600001',
  participantCount: 2,
};
const action = {
  id: 11,
  meetingRecordId: 7,
  content: 'API 계약 확인',
  status: 'IN_PROGRESS',
};
const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
});
afterAll(() => server.close());

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

it.each([
  undefined,
  '',
  '0',
  '-1',
  '1.5',
  'invalid',
  '01',
  ' 7',
  '9223372036854775808',
])(
  '필수 ID가 없거나 유효하지 않으면 네트워크 요청을 보내지 않는다: %s',
  async id => {
    const requests = vi.fn();
    server.use(
      http.get('*', () => {
        requests();
        return HttpResponse.json({ contents: [] });
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(
      () => [
        useMeetingRecordDetailQuery(id),
        useMeetingRecordSummariesQuery(id),
        useTeamMeetingActionEntriesQuery(id),
        useMeetingActionEntriesQuery(id),
      ],
      { wrapper },
    );

    await act(async () => {});
    result.current.forEach(query => expect(query.fetchStatus).toBe('idle'));
    expect(requests).not.toHaveBeenCalled();
  },
);

it('팀 ID가 준비되면 비활성 목록 쿼리가 요청을 시작한다', async () => {
  const requests = vi.fn();
  server.use(
    http.get(`${API_BASE_URL}/teams/10/meeting-records`, () => {
      requests();
      return HttpResponse.json({ contents: [record] });
    }),
  );
  const { wrapper } = setup();
  const { result, rerender } = renderHook(
    ({ teamId }: { teamId?: string }) => useMeetingRecordSummariesQuery(teamId),
    { wrapper, initialProps: {} },
  );
  expect(result.current.fetchStatus).toBe('idle');
  rerender({ teamId: '10' });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.[0]?.id).toBe('7');
  expect(requests).toHaveBeenCalledOnce();
});

it('단계와 상태 필터를 요청에 전달하고 각각 별도 캐시를 유지한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/teams/10/meeting-records`, ({ request }) =>
      HttpResponse.json({
        contents: [
          { ...record, phase: new URL(request.url).searchParams.get('phase') },
        ],
      }),
    ),
    http.get(`${API_BASE_URL}/teams/10/actions`, ({ request }) =>
      HttpResponse.json({
        contents: [
          {
            ...action,
            status: new URL(request.url).searchParams.get('status'),
          },
        ],
      }),
    ),
  );
  const { client, wrapper } = setup();
  const { result, rerender } = renderHook(
    ({
      phase,
      status,
    }: {
      phase: MeetingPhase;
      status: MeetingApiActionStatus;
    }) => ({
      records: useMeetingRecordSummariesQuery('10', phase),
      actions: useTeamMeetingActionEntriesQuery('10', status),
    }),
    { wrapper, initialProps: { phase: 'PROPOSAL', status: 'TODO' } },
  );
  await waitFor(() => {
    expect(result.current.records.data?.[0]?.phase).toBe('PROPOSAL');
    expect(result.current.actions.data?.[0]?.status).toBe('TODO');
  });
  rerender({ phase: 'FINAL', status: 'DONE' });
  await waitFor(() => {
    expect(result.current.records.data?.[0]?.phase).toBe('FINAL');
    expect(result.current.actions.data?.[0]?.status).toBe('DONE');
  });
  expect(
    client.getQueryData(meetingApiKeys.filteredList('10', 'PROPOSAL')),
  ).toMatchObject([{ phase: 'PROPOSAL' }]);
  expect(
    client.getQueryData(meetingApiKeys.filteredTeamActions('10', 'TODO')),
  ).toMatchObject([{ status: 'TODO' }]);
});

it.each([401, 403, 404, 500])(
  '조회 %s 오류를 빈 목록이나 기존 화면 데이터로 바꾸지 않는다',
  async status => {
    server.use(http.get('*', () => new HttpResponse(null, { status })));
    const { wrapper } = setup();
    const { result } = renderHook(
      () => [
        useMeetingRecordDetailQuery('7'),
        useMeetingRecordSummariesQuery('10'),
        useMeetingActionEntriesQuery('7'),
        useTeamMeetingActionEntriesQuery('10'),
      ],
      { wrapper },
    );
    await waitFor(() =>
      result.current.forEach(query => expect(query.isError).toBe(true)),
    );
    result.current.forEach(query => {
      expect(query.data).toBeUndefined();
      expect(query.error).toMatchObject({ response: { status } });
    });
  },
);

function seedCache(client: QueryClient) {
  const keys = {
    allRecords: meetingApiKeys.filteredList('10'),
    proposalRecords: meetingApiKeys.filteredList('10', 'PROPOSAL'),
    finalRecords: meetingApiKeys.filteredList('10', 'FINAL'),
    detail: meetingApiKeys.detail('7'),
    actions: meetingApiKeys.recordActions('7'),
    allTeamActions: meetingApiKeys.filteredTeamActions('10'),
    todoActions: meetingApiKeys.filteredTeamActions('10', 'TODO'),
    otherRecords: meetingApiKeys.filteredList('20'),
    otherDetail: meetingApiKeys.detail('8'),
    otherActions: meetingApiKeys.recordActions('8'),
    otherTeamActions: meetingApiKeys.filteredTeamActions('20'),
    legacy: meetingKeys.list('10'),
  };
  Object.values(keys).forEach(key =>
    client.setQueryData(key, [{ id: 'cached' }]),
  );
  return keys;
}

function expectInvalidated(
  client: QueryClient,
  keys: ReturnType<typeof seedCache>,
  expected: (keyof ReturnType<typeof seedCache>)[],
) {
  for (const name of Object.keys(keys) as (keyof typeof keys)[]) {
    expect(client.getQueryState(keys[name])?.isInvalidated, name).toBe(
      expected.includes(name),
    );
  }
}

it('생성 후 해당 팀의 모든 단계 목록을 무효화하고 다른 캐시는 유지한다', async () => {
  server.use(
    http.post(`${API_BASE_URL}/teams/10/meeting-records`, () =>
      HttpResponse.json(record, { status: 201 }),
    ),
  );
  const { client, wrapper } = setup();
  const keys = seedCache(client);
  const { result } = renderHook(() => useSubmitMeetingRecordApiMutation(), {
    wrapper,
  });
  await act(() =>
    result.current.mutateAsync({
      teamId: '10',
      input: {
        title: '진행 점검',
        meetingAt: '2026-08-03T14:00:00',
        phase: 'MID_CHECK',
        content: '회의 내용',
      },
    }),
  );
  expectInvalidated(client, keys, [
    'allRecords',
    'proposalRecords',
    'finalRecords',
  ]);
});

it('수정 후 상세와 해당 팀의 모든 단계 목록을 무효화한다', async () => {
  server.use(
    http.patch(`${API_BASE_URL}/meeting-records/7`, () =>
      HttpResponse.json(record),
    ),
  );
  const { client, wrapper } = setup();
  const keys = seedCache(client);
  const { result } = renderHook(() => useUpdateMeetingRecordApiMutation(), {
    wrapper,
  });
  await act(() =>
    result.current.mutateAsync({
      teamId: '10',
      meetingId: '7',
      input: { phase: 'FINAL' },
    }),
  );
  expectInvalidated(client, keys, [
    'detail',
    'allRecords',
    'proposalRecords',
    'finalRecords',
  ]);
});

it('삭제 성공 후 상세와 회의별 액션을 제거하고 해당 팀의 필터 목록을 무효화한다', async () => {
  server.use(
    http.delete(
      `${API_BASE_URL}/meeting-records/7`,
      () => new HttpResponse(null, { status: 204 }),
    ),
  );
  const { client, wrapper } = setup();
  const keys = seedCache(client);
  const { result } = renderHook(() => useRemoveMeetingRecordApiMutation(), {
    wrapper,
  });
  await act(() => result.current.mutateAsync({ teamId: '10', meetingId: '7' }));
  expect(client.getQueryData(keys.detail)).toBeUndefined();
  expect(client.getQueryData(keys.actions)).toBeUndefined();
  for (const [name, key] of Object.entries(keys)) {
    if (name === 'detail' || name === 'actions') continue;
    expect(client.getQueryState(key)?.isInvalidated, name).toBe(
      [
        'allRecords',
        'proposalRecords',
        'finalRecords',
        'allTeamActions',
        'todoActions',
      ].includes(name),
    );
  }
});

it.each([
  [
    '생성',
    useSubmitMeetingActionApiMutation,
    http.post,
    '/meeting-records/7/actions',
    201,
  ],
  [
    '수정',
    useUpdateMeetingActionApiMutation,
    http.patch,
    '/meeting-actions/11',
    200,
  ],
] as const)(
  '액션 %s 후 회의별·팀별 모든 상태 목록을 무효화한다',
  async (_name, useActionMutation, handler, path, status) => {
    server.use(
      handler(`${API_BASE_URL}${path}`, () =>
        HttpResponse.json(action, { status }),
      ),
    );
    const { client, wrapper } = setup();
    const keys = seedCache(client);
    const { result } = renderHook(() => useActionMutation(), { wrapper });
    await act(() =>
      result.current.mutateAsync({
        teamId: '10',
        meetingId: '7',
        actionId: '11',
        input: { content: '확인', status: 'IN_PROGRESS' },
      }),
    );
    expectInvalidated(client, keys, [
      'actions',
      'allTeamActions',
      'todoActions',
    ]);
  },
);

it('저장과 삭제가 실패하면 기존 캐시를 지우거나 무효화하지 않는다', async () => {
  server.use(http.all('*', () => new HttpResponse(null, { status: 403 })));
  const { client, wrapper } = setup();
  const keys = seedCache(client);
  const { result } = renderHook(
    () => ({
      create: useSubmitMeetingRecordApiMutation(),
      update: useUpdateMeetingRecordApiMutation(),
      remove: useRemoveMeetingRecordApiMutation(),
      createAction: useSubmitMeetingActionApiMutation(),
      updateAction: useUpdateMeetingActionApiMutation(),
    }),
    { wrapper },
  );
  await act(async () => {
    const requests = [
      result.current.create.mutateAsync({
        teamId: '10',
        input: {
          title: '진행 점검',
          meetingAt: '2026-08-03T14:00:00',
          phase: 'FINAL',
          content: '내용',
        },
      }),
      result.current.update.mutateAsync({
        teamId: '10',
        meetingId: '7',
        input: { content: '내용' },
      }),
      result.current.remove.mutateAsync({ teamId: '10', meetingId: '7' }),
      result.current.createAction.mutateAsync({
        teamId: '10',
        meetingId: '7',
        input: { content: '작업' },
      }),
      result.current.updateAction.mutateAsync({
        teamId: '10',
        meetingId: '7',
        actionId: '11',
        input: { status: 'DONE' },
      }),
    ];
    const responses = await Promise.allSettled(requests);
    responses.forEach(response =>
      expect(response).toMatchObject({
        status: 'rejected',
        reason: { response: { status: 403 } },
      }),
    );
  });
  expectInvalidated(client, keys, []);
  Object.values(keys).forEach(key =>
    expect(client.getQueryData(key)).toEqual([{ id: 'cached' }]),
  );
});
