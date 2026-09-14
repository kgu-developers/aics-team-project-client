import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
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

import { useAuthStore } from '~/features/auth/authStore';
import { teamMessageKeys } from '~/features/team-message/queries';

import { useSubmitMidReportFeedbackMutation } from './useSubmitMidReportFeedbackMutation';
import { useSubmitProposalFeedbackResponseMutation } from './useSubmitProposalFeedbackResponseMutation';

import { getCurrentMidReport } from '~/mocks/data/midReport';
import { createProjectProposalFixture } from '~/mocks/data/projectProposal';
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
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('7')}`,
      () => {
        const project = createProjectProposalFixture();
        return HttpResponse.json({
          ...project,
          teamId: 7,
          teamOperation: { ...project.teamOperation, id: 7 },
        });
      },
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`, () =>
      HttpResponse.json({ ...getCurrentMidReport(), id: 701, teamId: 7 }),
    ),
    ...createTeamMessageHandlers(),
  );
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

const feedbackHooks = [
  useSubmitProposalFeedbackResponseMutation,
  useSubmitMidReportFeedbackMutation,
];
it.each(feedbackHooks)(
  '%s preserves input variables in success callbacks and mutation state',
  async useFeedback => {
    const { result } = renderHook(() => useFeedback('7'), { wrapper: Wrapper });
    const input = { content: '  원본 입력  ' };
    const onSuccess = vi.fn();
    const onSettled = vi.fn();
    await act(async () => {
      await result.current.mutateAsync(input, { onSuccess, onSettled });
    });
    expect(onSuccess.mock.calls[0]?.[1]).toBe(input);
    expect(onSettled.mock.calls[0]?.[2]).toBe(input);
    await waitFor(() => expect(result.current.variables).toBe(input));
    expect(result.current.data?.message).toBe('원본 입력');
  },
);
it.each(feedbackHooks)(
  '%s preserves input variables on error without retrying',
  async useFeedback => {
    let posts = 0;
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () => {
        posts++;
        return HttpResponse.json({ code: 'ACCESS_DENIED' }, { status: 403 });
      }),
    );
    const { result } = renderHook(() => useFeedback('7'), { wrapper: Wrapper });
    const input = { content: '실패한 원본 입력' };
    const onError = vi.fn();
    const onSettled = vi.fn();
    act(() => result.current.mutate(input, { onError, onSettled }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError.mock.calls[0]?.[1]).toBe(input);
    expect(onSettled.mock.calls[0]?.[2]).toBe(input);
    await waitFor(() => expect(result.current.variables).toBe(input));
    expect(posts).toBe(1);
  },
);

it.each([
  [useSubmitProposalFeedbackResponseMutation, 'PROPOSAL', 19],
  [useSubmitMidReportFeedbackMutation, 'MID_REPORT', 701],
] as const)(
  '%s sends the actual document ID with feedback',
  async (useFeedback, relatedType, relatedId) => {
    let body: unknown;
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`,
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({
            id: 900,
            threadId: 70,
            senderId: demoStudent.studentNumber,
            createdAt: '2026-09-13 10:00',
            ...(body as object),
          });
        },
      ),
    );
    const { result } = renderHook(() => useFeedback('7'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ content: '답변' });
    });
    expect(body).toEqual({ message: '답변', relatedType, relatedId });
  },
);

it.each(feedbackHooks)(
  '%s never posts feedback for another team document',
  async useFeedback => {
    let posts = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('7')}`,
        () => HttpResponse.json(createProjectProposalFixture()),
      ),
      http.get(`${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`, () =>
        HttpResponse.json({ ...getCurrentMidReport(), id: 701, teamId: 8 }),
      ),
      http.post(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () => {
        posts++;
        return HttpResponse.json({});
      }),
    );
    const { result } = renderHook(() => useFeedback('7'), { wrapper: Wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ content: '답변' }),
      ).rejects.toThrow();
    });
    expect(posts).toBe(0);
  },
);
