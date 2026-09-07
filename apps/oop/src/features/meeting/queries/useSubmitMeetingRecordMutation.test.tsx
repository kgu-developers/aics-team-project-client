import {
  API_BASE_URL,
  apiClient,
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

import { useSubmitMeetingRecordMutation } from './useSubmitMeetingRecordMutation';

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
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return renderHook(() => useSubmitMeetingRecordMutation(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
const input = {
  title: '  첫 회의  ',
  heldAt: '2026-09-08T00:30:00',
  location: '',
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '결정 사항', marks: [{ type: 'bold' }] },
        ],
      },
    ],
  },
  participantUserIds: ['20260001'],
  actions: [],
};
const variables = { input, teamId: '7', phase: 'MID_CHECK' as const };

it('회의록만 생성하고 학번·현지 시각·본문 서식을 보존한다', async () => {
  const writes: string[] = [];
  const bodies: unknown[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method !== 'GET')
      writes.push(`${request.method} ${request.url}`);
  });
  server.use(
    http.post(
      `${API_BASE_URL}/teams/7/meeting-records`,
      async ({ request }) => {
        bodies.push(await request.clone().json());
        return undefined;
      },
    ),
  );
  const { result } = setup();
  let id = '';
  await act(async () => {
    id = (await result.current.mutateAsync(variables)).id;
  });
  expect(writes).toEqual([`POST ${API_BASE_URL}/teams/7/meeting-records`]);
  expect(bodies).toEqual([
    {
      title: '첫 회의',
      meetingAt: input.heldAt,
      phase: 'MID_CHECK',
      content: JSON.stringify(input.content),
      location: '',
      participantIds: ['20260001'],
    },
  ]);
  const record = await fetchMeetingRecordDetail(id);
  expect(record).toMatchObject({
    title: '첫 회의',
    meetingAt: input.heldAt,
    participantIds: ['20260001'],
  });
  expect(JSON.parse(record.content)).toEqual(input.content);
});

it.each(['', '0', '-1', 'team-7'])(
  '유효하지 않은 팀 ID %s로는 API를 호출하지 않는다',
  async teamId => {
    const request = vi.fn();
    server.events.on('request:start', request);
    const { result } = setup();
    await act(async () => {
      await expect(
        result.current.mutateAsync({ ...variables, teamId }),
      ).rejects.toThrow('유효한 팀');
    });
    expect(request).not.toHaveBeenCalled();
  },
);

it('회의 단계가 없으면 API를 호출하지 않는다', async () => {
  const request = vi.fn();
  server.events.on('request:start', request);
  const { result } = setup();
  await act(async () => {
    await expect(
      result.current.mutateAsync({ ...variables, phase: undefined }),
    ).rejects.toThrow('회의 단계');
  });
  expect(request).not.toHaveBeenCalled();
});

it.each([400, 403, 409, 503, 'network'] as const)(
  '생성 실패 %s는 자동 재전송하지 않고 저장 결과의 불확실성을 구분한다',
  async status => {
    const request = vi.fn();
    server.use(
      http.post(`${API_BASE_URL}/teams/7/meeting-records`, () => {
        request();
        return status === 'network'
          ? HttpResponse.error()
          : HttpResponse.json(
              { code: status === 409 ? 'DATA_CONFLICT' : 'ERROR' },
              { status },
            );
      }),
    );
    const { result } = setup();
    await act(async () => {
      await expect(result.current.mutateAsync(variables)).rejects.toMatchObject(
        { uncertain: status === 503 || status === 'network' },
      );
    });
    expect(request).toHaveBeenCalledTimes(1);
    if (status === 409)
      expect(result.current.error?.message).toContain('서버 데이터 충돌');
  },
);
