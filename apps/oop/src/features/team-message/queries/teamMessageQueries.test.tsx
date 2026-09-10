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
  describe,
  expect,
  it,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { useSubmitProposalFeedbackResponseMutation } from '~/features/student-feedback/queries';
import { studentHomeKeys } from '~/features/student-home/queries';

import { teamMessageKeys } from './teamMessageKeys';
import { useTeamMessagesQuery } from './useTeamMessagesQuery';

import {
  createTeamMessageData,
  teamMessageProfessorId,
} from '~/mocks/data/teamMessages';
import { demoAccessToken } from '~/mocks/data/users';
import { createTeamMessageHandlers } from '~/mocks/handlers/teamMessages';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  server.use(...createTeamMessageHandlers());
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  useAuthStore.getState().clearSession();
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

describe('team message queries', () => {
  it('대화방이 없는 담당 팀은 방을 먼저 확보한 뒤 빈 메시지 목록을 조회한다', async () => {
    server.use(
      ...createTeamMessageHandlers({
        getAuthenticatedUserId: () => teamMessageProfessorId,
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useTeamMessagesQuery('8', 'PROPOSAL'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it.each([undefined, '', 'team-07', '0', '9007199254740992'])(
    '팀 식별자 %s로 방/메시지를 조회하거나 전송하지 않는다',
    async teamId => {
      let calls = 0;
      server.use(
        http.all('*', () => {
          calls += 1;
          return HttpResponse.json({});
        }),
      );
      const { wrapper } = setup();
      const { result } = renderHook(
        () => ({
          messages: useTeamMessagesQuery(teamId, 'PROPOSAL'),
          submit: useSubmitProposalFeedbackResponseMutation(teamId),
        }),
        { wrapper },
      );
      expect(result.current.messages.fetchStatus).toBe('idle');
      await act(async () => {
        await expect(
          result.current.submit.mutateAsync({ content: '답변' }),
        ).rejects.toThrow('팀 배정');
      });
      expect(calls).toBe(0);
    },
  );

  it('여러 페이지의 제안서 메시지를 모두 조회하고 같은 방의 다른 유형과 구분한다', async () => {
    const messages = createTeamMessageData().messages.filter(
      message => message.relatedType === 'PROPOSAL',
    );
    const requestedPages: number[] = [];
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`,
        ({ request }) => {
          const params = new URL(request.url).searchParams;
          expect(params.get('relatedType')).toBe('PROPOSAL');
          const page = Number(params.get('page'));
          requestedPages.push(page);
          return HttpResponse.json({
            contents: page === 0 ? messages.slice(0, 2) : messages.slice(2),
            pageable: {
              page,
              size: 2,
              totalElements: 3,
              totalPages: 2,
              isEnd: page === 1,
            },
          });
        },
      ),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useTeamMessagesQuery('7', 'PROPOSAL'), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestedPages).toEqual([0, 1]);
    expect(result.current.data?.map(message => message.id)).toEqual([
      701, 702, 704,
    ]);
  });

  it('메시지 답변 후 같은 팀 대화를 재조회하며 문서 제출 상태와 다른 팀 캐시는 바꾸지 않는다', async () => {
    const { client, wrapper } = setup();
    const otherTeam = teamMessageKeys.messages('8', 'PROPOSAL');
    const submissionKey = studentHomeKeys.submission('1', '7', 10);
    client.setQueryData(otherTeam, []);
    client.setQueryData(submissionKey, { status: 'REVISION_REQUESTED' });
    const { result } = renderHook(
      () => ({
        messages: useTeamMessagesQuery('7', 'PROPOSAL'),
        submit: useSubmitProposalFeedbackResponseMutation('7'),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.messages.isSuccess).toBe(true));
    await act(async () => {
      const response = await result.current.submit.mutateAsync({
        content: ' 구현 범위를 반영했습니다. ',
      });
      expect(response).toMatchObject({
        threadId: 70,
        relatedType: 'PROPOSAL',
        message: '구현 범위를 반영했습니다.',
      });
      expect(response).not.toHaveProperty('reviewId');
      expect(response).not.toHaveProperty('relatedId');
    });
    await waitFor(() =>
      expect(result.current.messages.data?.at(-1)?.message).toBe(
        '구현 범위를 반영했습니다.',
      ),
    );
    expect(client.getQueryState(otherTeam)?.isInvalidated).toBe(false);
    expect(client.getQueryData(submissionKey)).toEqual({
      status: 'REVISION_REQUESTED',
    });
    expect(client.getQueryState(submissionKey)?.isInvalidated).toBe(false);
  });

  it('전송 중 팀이 바뀌어도 전송했던 팀의 캐시만 무효화한다', async () => {
    let finish: (() => void) | undefined;
    let started: (() => void) | undefined;
    const received = new Promise<void>(resolve => {
      started = resolve;
    });
    const release = new Promise<void>(resolve => {
      finish = resolve;
    });
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`,
        async () => {
          started?.();
          await release;
          return HttpResponse.json(
            {
              id: 706,
              threadId: 70,
              senderId: '20260001',
              relatedType: 'PROPOSAL',
              message: '답변',
              createdAt: '2026-09-09 12:00',
            },
            { status: 201 },
          );
        },
      ),
    );
    const { client, wrapper } = setup();
    const sourceKey = teamMessageKeys.messages('7', 'PROPOSAL');
    const destinationKey = teamMessageKeys.messages('8', 'PROPOSAL');
    client.setQueryData(sourceKey, []);
    client.setQueryData(destinationKey, []);
    const { result, rerender } = renderHook(
      ({ teamId }) => useSubmitProposalFeedbackResponseMutation(teamId),
      { wrapper, initialProps: { teamId: '7' } },
    );
    let pending!: Promise<unknown>;
    await act(async () => {
      pending = result.current.mutateAsync({ content: '답변' });
      await received;
    });
    rerender({ teamId: '8' });
    await act(async () => {
      finish?.();
      await pending;
    });
    expect(client.getQueryState(sourceKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(destinationKey)?.isInvalidated).toBe(false);
  });

  it('403 전송 실패를 성공으로 저장하거나 자동 재전송하지 않는다', async () => {
    let posts = 0;
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () => {
        posts += 1;
        return HttpResponse.json({ code: 'ACCESS_DENIED' }, { status: 403 });
      }),
    );
    const { client, wrapper } = setup();
    const key = teamMessageKeys.messages('7', 'PROPOSAL');
    client.setQueryData(key, []);
    const { result } = renderHook(
      () => useSubmitProposalFeedbackResponseMutation('7'),
      { wrapper },
    );
    await act(async () => {
      await expect(
        result.current.mutateAsync({ content: '답변' }),
      ).rejects.toMatchObject({ response: { status: 403 } });
    });
    expect(posts).toBe(1);
    expect(client.getQueryData(key)).toEqual([]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  });
});
