import {
  API_BASE_URL,
  apiClient,
  fetchMeetingActionEntries,
  fetchMeetingRecordDetail,
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

import { useCreateMeetingWithActions } from './useCreateMeetingWithActions';

import { demoAccessToken } from '~/mocks/data/users';
import { createMeetingApiHandlers } from '~/mocks/handlers/meetingApi';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  apiClient.defaults.headers.common.Authorization = 'Bearer ' + demoAccessToken;
  server.use(...createMeetingApiHandlers());
});
afterEach(() => {
  server.resetHandlers();
  clients.splice(0).forEach(client => client.clear());
  delete apiClient.defaults.headers.common.Authorization;
  vi.unstubAllEnvs();
});
afterAll(() => server.close());
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return renderHook(() => useCreateMeetingWithActions(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
const variables = {
  teamId: '7',
  phase: 'MID_CHECK' as const,
  input: {
    title: '복구 검증 회의',
    heldAt: '2026-09-09T15:30:00',
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '결정 사항' }] },
      ],
    },
    participantUserIds: ['20260001'],
    actions: [{ content: '첫 번째 액션' }, { content: '두 번째 액션' }],
  },
};

it('두 번째 액션 실패 후 재시도하면 회의록과 첫 번째 액션을 다시 만들지 않는다', async () => {
  let records = 0;
  const writes: string[] = [];
  let fail = true;
  server.use(
    http.post(API_BASE_URL + '/teams/7/meeting-records', () => {
      records++;
      return undefined;
    }),
    http.post(
      API_BASE_URL + '/meeting-records/:id/actions',
      async ({ request }) => {
        const body = (await request.clone().json()) as { content: string };
        writes.push(body.content);
        if (body.content === '두 번째 액션' && fail)
          return HttpResponse.json({ code: 'DATA_CONFLICT' }, { status: 409 });
        return undefined;
      },
    ),
  );
  const { result } = setup();
  await act(async () => {
    expect(await result.current.save(variables)).toBeUndefined();
  });
  const id = result.current.meetingId!;
  expect(id).toBeTruthy();
  expect(result.current.savedActionIndexes).toEqual([0]);
  expect(result.current.isUncertain).toBe(false);
  expect(result.current.error).toContain('서버 데이터 충돌');
  expect(await fetchMeetingRecordDetail(id)).toMatchObject({
    title: variables.input.title,
  });
  expect(await fetchMeetingActionEntries(id)).toHaveLength(1);
  fail = false;
  await act(async () => {
    expect(await result.current.save(variables)).toEqual({ id });
  });
  expect(records).toBe(1);
  expect(writes).toEqual(['첫 번째 액션', '두 번째 액션', '두 번째 액션']);
  expect(
    (await fetchMeetingActionEntries(id)).map(action => action.content),
  ).toEqual(['첫 번째 액션', '두 번째 액션']);
  expect(result.current.savedActionIndexes).toEqual([0, 1]);
});

it('액션 응답 유실 뒤에는 재시도해도 POST를 다시 보내지 않고 회의록 ID를 유지한다', async () => {
  const post = vi.fn(() => HttpResponse.error());
  server.use(http.post(API_BASE_URL + '/meeting-records/:id/actions', post));
  const { result } = setup();
  await act(async () => {
    await result.current.save(variables);
  });
  const id = result.current.meetingId;
  expect(id).toBeTruthy();
  expect(result.current.isUncertain).toBe(true);
  await act(async () => {
    await result.current.save(variables);
  });
  expect(post).toHaveBeenCalledTimes(1);
  expect(result.current.meetingId).toBe(id);
});

it('회의록 응답 유실 뒤에는 새 회의록이나 액션을 재등록하지 않는다', async () => {
  const recordPost = vi.fn(() => HttpResponse.error());
  const actionPost = vi.fn(() => HttpResponse.error());
  server.use(
    http.post(API_BASE_URL + '/teams/7/meeting-records', recordPost),
    http.post(API_BASE_URL + '/meeting-records/:id/actions', actionPost),
  );
  const { result } = setup();
  await act(async () => {
    await result.current.save(variables);
  });
  await act(async () => {
    await result.current.save(variables);
  });
  expect(result.current.isUncertain).toBe(true);
  expect(recordPost).toHaveBeenCalledTimes(1);
  expect(actionPost).not.toHaveBeenCalled();
});

it('연속 저장 호출은 한 번만 실행한다', async () => {
  let records = 0;
  server.use(
    http.post(API_BASE_URL + '/teams/7/meeting-records', () => {
      records++;
      return undefined;
    }),
  );
  const { result } = setup();
  await act(async () => {
    await Promise.all([
      result.current.save(variables),
      result.current.save(variables),
    ]);
  });
  expect(records).toBe(1);
  expect(
    await fetchMeetingActionEntries(result.current.meetingId!),
  ).toHaveLength(2);
});
