import { API_BASE_URL, ENDPOINTS, submitTeamMessage } from '@aics/api-client';
import type { StudentHomeMilestoneBody } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
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

import MilestoneDetails from './MilestoneDetails';

import { getCurrentMidReport } from '~/mocks/data/midReport';
import { createProjectProposalFixture } from '~/mocks/data/projectProposal';
import {
  createTeamMessageData,
  teamMessageProfessorId,
} from '~/mocks/data/teamMessages';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { createTeamMessageHandlers } from '~/mocks/handlers/teamMessages';
import { renderWithRouter } from '~/test/renderWithRouter';

const server = setupServer();
const clients: QueryClient[] = [];
const body: Extract<StudentHomeMilestoneBody, { kind: 'proposal-feedback' }> = {
  kind: 'proposal-feedback',
  reviewId: 'legacy-review-id-must-not-be-sent',
  feedback: [
    {
      id: 'legacy',
      title: '지난 리뷰',
      content: '서버 확인 전의 오래된 피드백',
    },
  ],
  canSubmitResponse: false,
  responseBlockedReason:
    '제안서를 수정해 다시 제출한 뒤 반영 답변을 남겨 주세요.',
  replyPlaceholder: '피드백을 반영한 내용을 작성해 주세요.',
  sections: [],
  guide: '',
};

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
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  server.events.removeAllListeners();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function renderFeedback(feedbackBody: StudentHomeMilestoneBody = body) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return renderWithRouter(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <MilestoneDetails body={feedbackBody} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}

describe('existing proposal feedback form with team messages', () => {
  it('별도 팀원 조회 없이 메시지 응답의 교수와 학생 이름을 표시한다', async () => {
    const paths: string[] = [];
    server.events.on('request:start', ({ request }) => {
      paths.push(new URL(request.url).pathname);
    });
    renderFeedback();
    expect(
      await screen.findByText('검수 학생 (2026-09-01/19:10)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('검수 교수 (2026-09-01/19:00)'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`${demoStudent.studentNumber} (2026-09-01/19:10)`),
    ).not.toBeInTheDocument();
    expect(screen.getByText('피드백 대화')).toBeInTheDocument();
    expect(screen.queryByText('교수 피드백')).not.toBeInTheDocument();
    expect(paths.some(path => path.endsWith('/kickoff'))).toBe(false);
  });

  it.each([undefined, null, '   '])(
    '이름이 %s이면 식별자를 유지하고 답변할 수 있다',
    async senderName => {
      server.use(
        http.get(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () =>
          HttpResponse.json({
            contents: [
              {
                ...createTeamMessageData().messages.find(
                  message => message.id === 702,
                )!,
                senderName,
              },
            ],
            pageable: {
              page: 0,
              size: 100,
              totalElements: 1,
              totalPages: 1,
              isEnd: true,
            },
          }),
        ),
      );
      renderFeedback();
      expect(
        await screen.findByText(
          `${demoStudent.studentNumber} (2026-09-01/19:10)`,
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '답변 보내기' })).toBeEnabled();
    },
  );

  it('교수의 새 메시지에 기존 폼으로 연속 답변하고 재조회하면 대화가 복원된다', async () => {
    let userId = teamMessageProfessorId;
    server.use(
      ...createTeamMessageHandlers({
        getAuthenticatedUserId: () => userId,
      }),
    );
    await submitTeamMessage('7', {
      message: '핵심 기능과 역할 분담을 다시 확인해 주세요.',
      relatedType: 'PROPOSAL',
    });
    userId = demoStudent.studentNumber;
    const requests: unknown[] = [];
    server.events.on('request:start', async ({ request }) => {
      if (request.method === 'POST')
        requests.push(await request.clone().json());
    });
    const user = userEvent.setup();
    const view = renderFeedback();
    expect(
      await screen.findByText('기능별 역할 분담도 함께 정리해 주세요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('핵심 기능과 역할 분담을 다시 확인해 주세요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('서버 확인 전의 오래된 피드백'),
    ).not.toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: /피드백 반영 답변/ });
    const button = screen.getByRole('button', { name: '답변 보내기' });
    expect(button).toBeEnabled();
    await user.type(input, '핵심 기능을 구체화했습니다.');
    await user.click(button);
    expect(
      await screen.findByText('핵심 기능을 구체화했습니다.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(input).toHaveValue(''));
    await user.type(input, '역할 분담도 정리했습니다.');
    await user.click(button);
    expect(
      await screen.findByText('역할 분담도 정리했습니다.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(requests).toEqual([
        {
          message: '핵심 기능을 구체화했습니다.',
          relatedType: 'PROPOSAL',
          relatedId: 19,
        },
        {
          message: '역할 분담도 정리했습니다.',
          relatedType: 'PROPOSAL',
          relatedId: 19,
        },
      ]),
    );
    view.unmount();
    renderFeedback();
    expect(
      await screen.findByText('핵심 기능과 역할 분담을 다시 확인해 주세요.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('핵심 기능을 구체화했습니다.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('역할 분담도 정리했습니다.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '답변 보내기' })).toBeEnabled();
  });

  it('전송 권한이 거부되면 기존 오류 영역에 표시하고 입력을 유지한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () =>
        HttpResponse.json({ code: 'ACCESS_DENIED' }, { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    renderFeedback();
    await screen.findByText('기능별 역할 분담도 함께 정리해 주세요.');
    const input = screen.getByRole('textbox', { name: /피드백 반영 답변/ });
    await user.type(input, '실패해도 유지할 답변');
    await user.click(screen.getByRole('button', { name: '답변 보내기' }));
    expect(
      await screen.findByText('현재 팀의 피드백만 작성할 수 있어요.'),
    ).toBeInTheDocument();
    expect(input).toHaveValue('실패해도 유지할 답변');
  });

  it('교수의 첫 피드백이 아직 없으면 학생 답변을 전송하지 않는다', async () => {
    let posts = 0;
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () =>
        HttpResponse.json({
          contents: [],
          pageable: {
            page: 0,
            size: 100,
            totalElements: 0,
            totalPages: 0,
            isEnd: true,
          },
        }),
      ),
    );
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') posts += 1;
    });
    renderFeedback();
    expect(
      (
        await screen.findAllByText(
          '교수 피드백이 도착하면 답변을 남길 수 있어요.',
        )
      )[0],
    ).toBeInTheDocument();
    const button = screen.getByRole('button', { name: '답변 보내기' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.setup().click(button);
    expect(posts).toBe(0);
  });

  it('팀 정보가 없으면 요청 없이 기존 입력 영역을 비활성화한다', async () => {
    useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: null });
    let calls = 0;
    server.events.on('request:start', () => {
      calls += 1;
    });
    renderFeedback();
    expect(
      screen.getAllByText('팀 배정 정보를 확인한 뒤 다시 시도해 주세요.')[0],
    ).toBeInTheDocument();
    const button = screen.getByRole('button', { name: '답변 보내기' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.setup().click(button);
    expect(calls).toBe(0);
  });

  it('활성 팀이 바뀌면 이전 팀의 작성 중 답변과 메시지를 보여주지 않는다', async () => {
    const user = userEvent.setup();
    renderFeedback();
    await screen.findByText('기능별 역할 분담도 함께 정리해 주세요.');
    await user.type(
      screen.getByRole('textbox', { name: /피드백 반영 답변/ }),
      '이전 팀의 초안',
    );
    act(() =>
      useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '8' }),
    );
    expect(
      screen.getByRole('textbox', { name: /피드백 반영 답변/ }),
    ).toHaveValue('');
    expect(
      screen.queryByText('기능별 역할 분담도 함께 정리해 주세요.'),
    ).not.toBeInTheDocument();
    expect(
      (
        await screen.findAllByText(
          '피드백을 불러오지 못했어요. 최신 화면에서 다시 확인해 주세요.',
        )
      )[0],
    ).toBeInTheDocument();
  });
});

describe('중간보고서 피드백 메시지', () => {
  const midBody: StudentHomeMilestoneBody = {
    kind: 'mid-review-feedback',
    teamId: '7',
    feedback: [],
    canSubmitResponse: false,
    sections: [],
    guide: '',
  };
  it('학생의 첫 반영 기록과 교수 답변을 같은 대화에 저장하고 재조회한다', async () => {
    const messages: Array<Record<string, unknown>> = [];
    const requests: { path: string; method: string }[] = [];
    server.events.on('request:start', ({ request }) => {
      requests.push({
        path: new URL(request.url).pathname,
        method: request.method,
      });
    });
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`,
        ({ request }) => {
          expect(new URL(request.url).searchParams.get('relatedType')).toBe(
            'MID_REPORT',
          );
          return HttpResponse.json({
            contents: [...messages].reverse(),
            pageable: {
              page: 0,
              size: 100,
              totalElements: messages.length,
              totalPages: 1,
              isEnd: true,
            },
          });
        },
      ),
      http.post(
        `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`,
        async ({ request }) => {
          const input = await request.json();
          expect(input).toEqual({
            message: '대면 피드백을 기록했습니다.',
            relatedType: 'MID_REPORT',
            relatedId: 701,
          });
          const message = {
            id: 901,
            threadId: 70,
            senderId: demoStudent.studentNumber,
            senderName: '검수 학생',
            createdAt: '2026-09-10 10:00',
            ...(input as object),
          };
          messages.push({ ...message, important: false, read: false });
          return HttpResponse.json(message, { status: 201 });
        },
      ),
    );
    const view = renderFeedback(midBody);
    const button = await screen.findByRole('button', {
      name: '반영 방향 보내기',
    });
    await waitFor(() =>
      expect(button).not.toHaveAttribute('aria-disabled', 'true'),
    );
    await userEvent.setup().click(button);
    await userEvent
      .setup()
      .type(
        screen.getByRole('textbox', { name: /대면 피드백 반영 내용/ }),
        '대면 피드백을 기록했습니다.',
      );
    await userEvent
      .setup()
      .click(screen.getAllByRole('button', { name: '반영 방향 보내기' })[1]!);
    expect(
      await screen.findByText('대면 피드백을 기록했습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /대면 피드백 반영 내용/ }),
    ).not.toBeInTheDocument();
    messages.push({
      id: 902,
      threadId: 70,
      senderId: teamMessageProfessorId,
      senderName: '검수 교수',
      relatedType: 'MID_REPORT',
      message: '반영 내용을 확인했습니다.',
      createdAt: '2026-09-10 10:10',
      important: false,
      read: false,
    });
    view.unmount();
    renderFeedback(midBody);
    expect(
      await screen.findByText('반영 내용을 확인했습니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('대면 피드백을 기록했습니다.')).toBeInTheDocument();
    expect(screen.getByText('피드백 대화')).toBeInTheDocument();
    expect(screen.queryByText('교수 추가 답변')).not.toBeInTheDocument();
    expect(
      screen.getByText('검수 교수 (2026-09-10/19:10)'),
    ).toBeInTheDocument();
    expect(
      requests.some(
        ({ path, method }) =>
          method !== 'GET' &&
          (path.includes('/submissions') ||
            path.includes('/reviews') ||
            path.includes('/mid-reports')),
      ),
    ).toBe(false);
    expect(requests).toContainEqual({
      method: 'GET',
      path: ENDPOINTS.MID_REPORT.CURRENT,
    });
  });
  it('전송 실패 시 입력을 보존하고 제안서 대화는 섞지 않는다', async () => {
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () =>
        HttpResponse.json({ code: 'ACCESS_DENIED' }, { status: 403 }),
      ),
    );
    renderFeedback(midBody);
    expect(
      await screen.findByText('중간보고서에는 구현 진행 상황을 기록해 주세요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('기능별 역할 분담도 함께 정리해 주세요.'),
    ).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '반영 방향 보내기' }));
    const input = screen.getByRole('textbox', {
      name: /대면 피드백 반영 내용/,
    });
    await userEvent.setup().type(input, '보존할 기록');
    await userEvent
      .setup()
      .click(screen.getAllByRole('button', { name: '반영 방향 보내기' })[1]!);
    expect(
      await screen.findByText('현재 팀의 피드백만 작성할 수 있어요.'),
    ).toBeInTheDocument();
    expect(input).toHaveValue('보존할 기록');
  });
});

describe('피드백 단계별 노출', () => {
  it('제안서는 제출 전에는 피드백 영역을 그리지 않고, 대기 중에는 안내만 보여 준다', async () => {
    const { unmount } = renderFeedback({
      ...body,
      feedbackStage: 'not-submitted',
    });
    expect(screen.queryByText('피드백 대화')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /피드백 반영 답변/ }),
    ).not.toBeInTheDocument();
    unmount();

    renderFeedback({ ...body, feedbackStage: 'awaiting-feedback' });
    expect(
      await screen.findByText(/제출 완료 · 피드백 대기 중/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /피드백 반영 답변/ }),
    ).not.toBeInTheDocument();
  });

  it('완료된 제안서는 입력 없이 피드백 대화 이력을 유지한다', async () => {
    renderFeedback({ ...body, feedbackStage: 'completed' });

    expect(await screen.findByText('피드백 대화')).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /피드백 반영 답변/ }),
    ).not.toBeInTheDocument();
  });

  it('교수·조교가 먼저 보낸 중간보고서 메시지를 반영 방향 대기 중에도 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () =>
        HttpResponse.json({
          contents: [
            {
              id: 990,
              threadId: 70,
              senderId: teamMessageProfessorId,
              senderName: '검수 교수',
              relatedType: 'MID_REPORT',
              message: '대면 피드백 일정을 먼저 안내합니다.',
              important: false,
              read: false,
              createdAt: '2026-09-10 09:00',
            },
          ],
          pageable: {
            page: 0,
            size: 100,
            totalElements: 1,
            totalPages: 1,
            isEnd: true,
          },
        }),
      ),
    );
    renderFeedback({
      kind: 'mid-review-feedback',
      teamId: '7',
      feedbackStage: 'awaiting-feedback',
      feedback: [],
      canSubmitResponse: false,
      sections: [],
      guide: '',
    });

    expect(
      await screen.findByText('대면 피드백 일정을 먼저 안내합니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('피드백 대화')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '반영 방향 보내기' }),
    ).toBeInTheDocument();
  });

  it('중간보고서는 첫 반영 방향만 모달로 보내고, 보낸 뒤에는 입력 없이 대화만 보인다', async () => {
    const messages: Array<Record<string, unknown>> = [];
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () =>
        HttpResponse.json({
          contents: [...messages].reverse(),
          pageable: {
            page: 0,
            size: 100,
            totalElements: messages.length,
            totalPages: 1,
            isEnd: true,
          },
        }),
      ),
      http.post(
        `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`,
        async ({ request }) => {
          const input = (await request.json()) as object;
          const message = {
            id: 901,
            threadId: 70,
            senderId: demoStudent.studentNumber,
            senderName: '검수 학생',
            createdAt: '2026-09-10 10:00',
            ...input,
          };
          messages.push({ ...message, important: false, read: false });
          return HttpResponse.json(message, { status: 201 });
        },
      ),
    );
    const midBody: StudentHomeMilestoneBody = {
      kind: 'mid-review-feedback',
      teamId: '7',
      feedbackStage: 'awaiting-feedback',
      feedback: [],
      canSubmitResponse: false,
      sections: [],
      guide: '',
    };
    const user = userEvent.setup();
    const view = renderFeedback(midBody);

    expect(
      screen.queryByRole('textbox', { name: /대면 피드백 반영 내용/ }),
    ).not.toBeInTheDocument();
    const open = await screen.findByRole('button', {
      name: '반영 방향 보내기',
    });
    await waitFor(() =>
      expect(open).not.toHaveAttribute('aria-disabled', 'true'),
    );
    await user.click(open);
    const dialog = await screen.findByRole('dialog', {
      name: '대면 피드백 반영 방향 보내기',
    });
    await user.type(
      within(dialog).getByRole('textbox', { name: /대면 피드백 반영 내용/ }),
      '대면 피드백을 기록했습니다.',
    );
    await user.click(
      within(dialog).getByRole('button', { name: '반영 방향 보내기' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '대면 피드백 반영 방향 보내기' }),
      ).not.toBeInTheDocument(),
    );

    // The home recomputes the stage from messages; simulate that hand-off.
    view.rerender(
      <AstryxThemeProvider>
        <QueryClientProvider client={clients[clients.length - 1]!}>
          <MilestoneDetails
            body={{ ...midBody, feedbackStage: 'feedback-arrived' }}
          />
        </QueryClientProvider>
      </AstryxThemeProvider>,
    );
    expect(
      await screen.findByText('대면 피드백을 기록했습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /대면 피드백 반영 내용/ }),
    ).not.toBeInTheDocument();
  });
});
