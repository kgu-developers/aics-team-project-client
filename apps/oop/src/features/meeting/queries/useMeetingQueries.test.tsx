import {
  submitMeetingActionApi,
  updateMeetingActionApi,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { meetingApiKeys } from './api/meetingApiKeys';
import { useSubmitMeetingActionMutation } from './useSubmitMeetingActionMutation';
import { useUpdateMeetingActionMutation } from './useUpdateMeetingActionMutation';
vi.mock('@aics/api-client', async importOriginal => ({
  ...(await importOriginal<typeof import('@aics/api-client')>()),
  submitMeetingActionApi: vi.fn(),
  updateMeetingActionApi: vi.fn(),
}));
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  clients.push(client);
  const keys = [
    meetingApiKeys.recordActions('19'),
    meetingApiKeys.teamActions('7'),
  ];
  keys.forEach(key => client.setQueryData(key, []));
  function wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return { client, keys, wrapper };
}

afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  vi.resetAllMocks();
});
it('액션 생성 후 회의록과 팀 액션 캐시를 무효화한다', async () => {
  const { client, keys, wrapper } = setup();
  const { result } = renderHook(useSubmitMeetingActionMutation, { wrapper });
  await act(async () => {
    await result.current.mutateAsync({
      meetingId: '19',
      teamId: '7',
      input: { content: 'API 계약 정리' },
    });
  });
  expect(submitMeetingActionApi).toHaveBeenCalledWith('19', {
    content: 'API 계약 정리',
  });
  keys.forEach(key =>
    expect(client.getQueryState(key)?.isInvalidated).toBe(true),
  );
});
it('액션 상태 변경 후 회의록과 팀 액션 캐시를 무효화한다', async () => {
  const { client, keys, wrapper } = setup();
  const { result } = renderHook(useUpdateMeetingActionMutation, { wrapper });
  await act(async () => {
    await result.current.mutateAsync({
      actionId: '41',
      meetingId: '19',
      teamId: '7',
      input: { status: 'DONE' },
    });
  });
  expect(updateMeetingActionApi).toHaveBeenCalledWith('41', { status: 'DONE' });
  keys.forEach(key =>
    expect(client.getQueryState(key)?.isInvalidated).toBe(true),
  );
});
it('숫자 서버 ID가 없으면 변경 요청을 보내지 않는다', async () => {
  const { wrapper } = setup();
  const { result } = renderHook(useSubmitMeetingActionMutation, { wrapper });
  await act(async () => {
    await expect(
      result.current.mutateAsync({
        meetingId: 'meeting-1',
        teamId: '7',
        input: { content: '내용' },
      }),
    ).rejects.toThrow('유효한 팀');
  });
  expect(submitMeetingActionApi).not.toHaveBeenCalled();
});
