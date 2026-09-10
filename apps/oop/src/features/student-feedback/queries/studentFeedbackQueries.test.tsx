import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { teamMessageKeys } from '~/features/team-message/queries';

import { useSubmitMidReportFeedbackMutation } from './useSubmitMidReportFeedbackMutation';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { createTeamMessageHandlers } from '~/mocks/handlers/teamMessages';

const server = setupServer();
const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '7' });
  server.use(...createTeamMessageHandlers());
});
afterEach(() => {
  client.clear();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
function Wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

it('중간보고서 반영 기록은 팀 메시지로 보내고 원래 팀 대화만 갱신한다', async () => {
  const key = teamMessageKeys.messages('7', 'MID_REPORT');
  const other = teamMessageKeys.messages('8', 'MID_REPORT');
  client.setQueryData(key, []);
  client.setQueryData(other, []);
  const { result } = renderHook(() => useSubmitMidReportFeedbackMutation('7'), {
    wrapper: Wrapper,
  });
  const response = await result.current.mutateAsync({
    content: '  검색 흐름을 보완했습니다.  ',
  });
  expect(response).toMatchObject({
    threadId: 70,
    message: '검색 흐름을 보완했습니다.',
    relatedType: 'MID_REPORT',
    senderId: demoStudent.studentNumber,
  });
  expect(response).not.toHaveProperty('submissionId');
  expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(client.getQueryState(other)?.isInvalidated).toBe(false);
});
