import {
  API_BASE_URL,
  apiClient,
  fetchMeetingActionEntries,
  fetchTeamMeetingActionEntries,
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

import { meetingApiKeys } from './api/meetingApiKeys';
import { useRemoveMeetingActionMutation } from './useRemoveMeetingActionMutation';

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
  const hook = renderHook(() => useRemoveMeetingActionMutation(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, client };
}
it('204 삭제 후 회의별·팀별·홈 공용 캐시를 무효화하고 다른 팀은 보존한다', async () => {
  const { result, client } = setup();
  const action = (await fetchMeetingActionEntries('19'))[0]!;
  const keys = [
    meetingApiKeys.recordActions('19'),
    meetingApiKeys.filteredTeamActions('7'),
    meetingApiKeys.filteredTeamActions('7', 'TODO'),
  ];
  keys.forEach(key => client.setQueryData(key, [action]));
  const other = meetingApiKeys.filteredTeamActions('8');
  client.setQueryData(other, []);
  await act(async () => {
    await result.current.mutateAsync({
      actionId: action.id,
      meetingId: '19',
      teamId: '7',
    });
  });
  expect(await fetchMeetingActionEntries('19')).toEqual([]);
  expect(await fetchTeamMeetingActionEntries('7')).toEqual([]);
  keys.forEach(key =>
    expect(client.getQueryState(key)?.isInvalidated).toBe(true),
  );
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
});

it.each([401, 403, 404])(
  '삭제 %s 오류를 성공으로 처리하지 않는다',
  async status => {
    server.use(
      http.delete(API_BASE_URL + '/meeting-actions/:id', () =>
        HttpResponse.json({ code: 'ACCESS_DENIED' }, { status }),
      ),
    );
    const { result } = setup();
    await act(async () => {
      await expect(
        result.current.mutateAsync({
          actionId: '41',
          meetingId: '19',
          teamId: '7',
        }),
      ).rejects.toMatchObject({ response: { status } });
    });
    expect(await fetchMeetingActionEntries('19')).toHaveLength(1);
  },
);

it.each([
  { actionId: '', meetingId: '19', teamId: '7' },
  { actionId: '41', meetingId: '', teamId: '7' },
  { actionId: '41', meetingId: '19', teamId: '' },
  { actionId: 'named-action', meetingId: '19', teamId: '7' },
])(
  '필수 식별자가 없거나 잘못되면 삭제 요청을 보내지 않는다: %j',
  async variables => {
    const request = vi.fn();
    server.use(
      http.delete('*', () => {
        request();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = setup();
    await act(async () => {
      await expect(result.current.mutateAsync(variables)).rejects.toThrow(
        '유효한 팀',
      );
    });
    expect(request).not.toHaveBeenCalled();
  },
);
