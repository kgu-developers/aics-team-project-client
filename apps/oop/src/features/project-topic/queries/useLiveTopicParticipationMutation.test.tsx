import { API_BASE_URL } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';
import { useLiveTopicParticipationMutation } from './useLiveTopicParticipationMutation';

const server = setupServer(
  http.post(`${API_BASE_URL}/api/v1/topic-candidates/17/vote`, () =>
    HttpResponse.json(
      { id: 1, candidateId: 17, voterUserId: '20260001' },
      { status: 201 },
    ),
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('투표 후 현재 팀 후보와 현재 분반 홈만 갱신하고 다른 분반 캐시를 보존한다', async () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const currentCandidates = topicKeys.candidates('4', '20260001', '1');
  const otherCandidates = topicKeys.candidates('5', '20260001', '2');
  const currentHome = studentHomeKeys.dashboard('1');
  const otherHome = studentHomeKeys.dashboard('2');
  for (const key of [
    currentCandidates,
    otherCandidates,
    currentHome,
    otherHome,
  ])
    client.setQueryData(key, { value: 'retained' });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  const view = renderHook(() => useLiveTopicParticipationMutation('4', '1'), {
    wrapper: Wrapper,
  });
  try {
    await act(async () => {
      await view.result.current.mutateAsync({
        type: 'vote',
        candidateId: '17',
      });
    });
    expect(client.getQueryState(currentCandidates)?.isInvalidated).toBe(true);
    expect(client.getQueryState(currentHome)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherCandidates)?.isInvalidated).toBe(false);
    expect(client.getQueryState(otherHome)?.isInvalidated).toBe(false);
    expect(client.getQueryData(otherHome)).toEqual({ value: 'retained' });
  } finally {
    view.unmount();
    client.clear();
  }
});
