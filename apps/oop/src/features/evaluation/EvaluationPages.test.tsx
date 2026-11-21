import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren, ReactElement } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import PeerEvaluationPage from './PeerEvaluationPage';
import PresentationEvaluationPage from './PresentationEvaluationPage';
import { evaluationKeys } from './queries/evaluationKeys';

import {
  getMilestonePresentations,
  getMyTeamEvaluations,
  presentationEvaluationMilestoneId,
  resetEvaluationMockData,
  setEvaluationWindowStates,
  teamEvaluationCriteria,
} from '~/mocks/data/evaluation';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { authHandlers } from '~/mocks/handlers/auth';
import { evaluationHandlers } from '~/mocks/handlers/evaluation';
import { sectionHandlers } from '~/mocks/handlers/section';
const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => mockNavigate,
}));
const queryClients: QueryClient[] = [];
const server = setupServer(
  ...authHandlers,
  ...sectionHandlers,
  ...evaluationHandlers,
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetEvaluationMockData();
  setApiAccessToken(demoAccessToken);
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  useAuthStore.getState().markAuthenticated('STUDENT');
  mockNavigate.mockClear();
});
afterEach(() => {
  vi.restoreAllMocks();
  server.resetHandlers();
  queryClients.splice(0).forEach(client => client.clear());
  setApiAccessToken(null);
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function renderPage(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  queryClients.push(queryClient);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastViewport isTopLayer={false}>{children}</ToastViewport>
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  }

  return render(element, { wrapper: Wrapper });
}

async function renderPresentationPage() {
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '7' });
  const result = renderPage(<PresentationEvaluationPage />);
  await userEvent.click(
    await screen.findByRole('button', { name: '평가하기' }),
  );
  return result;
}

describe('KD3-92 학생 평가 화면', () => {
  it('발표 평가 패널은 명시적으로 열리고 Escape로 닫힌 뒤 열기 버튼으로 초점이 돌아온다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '7' });
    renderPage(<PresentationEvaluationPage />);
    const trigger = await screen.findByRole('button', { name: '평가하기' });
    const footerNavigation = screen.getByRole('navigation', {
      name: '발표 팀 이동',
    });
    expect(
      within(footerNavigation).getByLabelText('발표 팀 바로 이동'),
    ).toBeInTheDocument();
    expect(
      within(footerNavigation).queryByRole('button', { name: '평가하기' }),
    ).toBeNull();
    expect(
      screen.queryByRole('region', { name: /평가 입력/ }),
    ).not.toBeInTheDocument();

    await user.click(trigger);
    const sheet = screen.getByRole('dialog', { name: /평가 입력/ });
    expect(sheet).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /평가 입력/ }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(screen.getByRole('button', { name: '다음 팀' }));
    await user.click(trigger);
    const score = screen.getAllByRole('radio', { name: '5점' })[0]!;
    await user.click(score);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    expect(screen.getAllByRole('radio', { name: '5점' })[0]).toBeChecked();
    await user.click(screen.getByRole('button', { name: '닫기' }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('시작 전에는 입력을 잠그고 초안 저장 요청을 보내지 않는다', async () => {
    const user = userEvent.setup();
    setEvaluationWindowStates('OPEN', 'UPCOMING');
    const save = vi.fn();
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_RESPONSES(':formId')}`,
        () => {
          save();
          return HttpResponse.json({});
        },
      ),
    );
    renderPage(<PeerEvaluationPage />);
    const input = await screen.findByRole('textbox', {
      name: /자신의 역할 요약/,
    });
    expect(input).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '다음 설문' }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '제출하기' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('서버의 nullable 초안을 복원해 빈 기여도를 null로 다시 저장한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_TARGETS(':formId')}`,
        () =>
          HttpResponse.json({
            formId: 2026,
            title: '상호평가',
            windowState: 'OPEN',
            windowMessage: '',
            targets: [{ userId: '20260003', name: '팀원', role: '개발' }],
            myResponse: {
              id: 12,
              selfContribution: null,
              projectReviewComment: null,
              answers: [
                {
                  kind: 'TEAMMATE_CONTRIBUTION',
                  targetUserId: '20260003',
                  contributionPercent: null,
                  contributionDetail: null,
                  teammateAssessment: null,
                  comment: null,
                },
              ],
              status: 'DRAFT',
              updatedAt: '2026-09-09T10:00:00',
              submittedAt: null,
            },
          }),
      ),
    );
    let body: unknown;
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_RESPONSES(':formId')}`,
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(
            { code: 'FAILED', message: '저장 실패' },
            { status: 500 },
          );
        },
      ),
    );
    renderPage(<PeerEvaluationPage />);

    expect(
      await screen.findByRole('textbox', { name: /자신의 역할 요약/ }),
    ).toHaveValue('');
    await user.click(screen.getByRole('button', { name: '다음 설문' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패');
    expect(body).toMatchObject({
      answers: [
        expect.objectContaining({ contributionPercent: null }),
        expect.anything(),
      ],
      submit: false,
    });
    expect(screen.getByText('미입력')).toBeInTheDocument();
  });

  it('평가 기간이 종료되면 내역은 보여 주되 상호평가 입력은 잠근다', async () => {
    const user = userEvent.setup();
    setEvaluationWindowStates('CLOSED', 'CLOSED');
    renderPage(<PeerEvaluationPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: '프로젝트 평가' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2. 팀원 기여도' }));
    expect(
      screen.getByText('평가 기간이 아니어서 응답을 수정할 수 없어요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '제출하기' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('최종 제출 충돌 시 성공 처리하지 않고 작성 내용을 유지한다', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const answer = {
      kind: 'TEAMMATE_CONTRIBUTION',
      targetUserId: '20260003',
      contributionPercent: 100,
      contributionDetail: '테스트 기여 내용',
      teammateAssessment: '테스트 한줄평',
      comment: null,
    };
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_TARGETS(':formId')}`,
        () =>
          HttpResponse.json({
            formId: 2026,
            title: '상호평가',
            windowState: 'OPEN',
            windowMessage: '',
            targets: [{ userId: '20260003', name: '팀원', role: '개발' }],
            myResponse: {
              id: 12,
              selfContribution: '테스트 역할',
              projectReviewComment: '테스트 프로젝트 평가',
              answers: [answer, { kind: 'REFLECTION', comment: '테스트 소감' }],
              status: 'DRAFT',
              updatedAt: '2026-09-09T10:00:00',
              submittedAt: null,
            },
          }),
      ),
      http.post(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_RESPONSES(':formId')}`,
        async ({ request }) => {
          submit();
          expect(await request.json()).toMatchObject({
            submit: true,
            selfContribution: '테스트 역할',
            projectReviewComment: '테스트 프로젝트 평가',
            answers: [
              { kind: 'TEAMMATE_CONTRIBUTION', contributionPercent: 100 },
              { kind: 'REFLECTION', comment: '테스트 소감' },
            ],
          });
          return HttpResponse.json(
            {
              code: 'DATA_CONFLICT',
              message: '요청이 기존 데이터와 충돌합니다.',
            },
            { status: 409 },
          );
        },
      ),
    );
    renderPage(<PeerEvaluationPage />);
    await user.click(await screen.findByRole('button', { name: '제출하기' }));
    await user.click(screen.getByRole('button', { name: '최종 제출' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '상호평가를 제출하지 못했어요. 요청이 기존 데이터와 충돌합니다.',
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.queryByText('상호평가를 제출했어요.'),
    ).not.toBeInTheDocument();
    expect(submit).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: '제출하기' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    const retryConfirmation = screen.getByRole('alertdialog', {
      name: '상호평가 최종 제출 확인',
    });
    await user.click(
      within(retryConfirmation).getByRole('button', { name: '계속 수정' }),
    );
    expect(submit).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: '수정' }));
    expect(screen.getByRole('textbox', { name: /기여도/ })).toHaveValue('100');
    expect(screen.getByRole('textbox', { name: /기여 내용/ })).toHaveValue(
      '테스트 기여 내용',
    );
    expect(screen.getByRole('textbox', { name: /한줄평가/ })).toHaveValue(
      '테스트 한줄평',
    );
  });

  it('상호평가의 팀원 기여도와 개인보고서를 한 번에 제출한다', async () => {
    const user = userEvent.setup();
    renderPage(<PeerEvaluationPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: '프로젝트 평가' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('OOP 데모 학생 A 기여도 (%)'),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: /자신의 역할 요약/ }),
      '문서 구조와 평가 화면 구현을 맡았습니다.',
    );
    await user.type(
      screen.getByRole('textbox', { name: /팀 프로젝트 평가/ }),
      '협업은 원활했고 일정 공유는 더 개선할 수 있습니다.',
    );
    await user.type(
      screen.getByRole('textbox', { name: /소감 또는 팀원 칭찬/ }),
      '서로의 작업을 검토한 팀원들을 칭찬합니다.',
    );
    await user.click(screen.getByRole('button', { name: '다음 설문' }));

    const members = [
      { name: 'OOP 데모 학생 B', score: '40' },
      { name: 'OOP 데모 학생 C', score: '30' },
      { name: 'OOP 데모 학생 D', score: '30' },
    ];
    for (const member of members) {
      const row = screen.getByRole('row', { name: new RegExp(member.name) });
      await user.click(within(row).getByRole('button', { name: '평가' }));
      const dialog = screen.getByRole('dialog', {
        name: `${member.name} 기여도 평가`,
      });
      const score = within(dialog).getByRole('textbox', {
        name: /기여도/,
      });
      await user.clear(score);
      await user.type(score, member.score);
      await user.type(
        within(dialog).getByRole('textbox', { name: /기여 내용/ }),
        `${member.name}의 구체적인 구현 기여`,
      );
      await user.type(
        within(dialog).getByRole('textbox', { name: /한줄평가/ }),
        '협업 과정에서 맡은 작업을 완료했습니다.',
      );
      await user.click(
        within(dialog).getByRole('button', { name: '평가 저장' }),
      );

      expect(
        within(
          screen.getByRole('row', { name: new RegExp(member.name) }),
        ).getByText('완료'),
      ).toBeInTheDocument();
    }

    expect(screen.getByText('기여도 합계 100%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '제출하기' }));
    let confirmation = screen.getByRole('alertdialog', {
      name: '상호평가 최종 제출 확인',
    });
    await user.click(
      within(confirmation).getByRole('button', { name: '계속 수정' }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText('기여도 합계 100%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '제출하기' }));
    confirmation = screen.getByRole('alertdialog', {
      name: '상호평가 최종 제출 확인',
    });
    await user.click(
      within(confirmation).getByRole('button', { name: '최종 제출' }),
    );

    expect(
      await screen.findAllByText('상호평가를 제출했어요.'),
    ).not.toHaveLength(0);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/student' });
    expect(screen.queryByText('내 응답 제출 완료')).not.toBeInTheDocument();
  }, 30000);
  it('상호평가 초안을 서버에 저장한 뒤 현재 단계와 응답을 다시 읽는다', async () => {
    const user = userEvent.setup();
    const view = renderPage(<PeerEvaluationPage />);

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: '프로젝트 평가',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '상호평가' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2. 팀원 기여도' }));

    const targetRow = screen.getByRole('row', { name: /OOP 데모 학생 B/ });
    await user.click(within(targetRow).getByRole('button', { name: '평가' }));
    const dialog = screen.getByRole('dialog', {
      name: 'OOP 데모 학생 B 기여도 평가',
    });
    await user.clear(within(dialog).getByRole('textbox', { name: /기여도/ }));
    await user.type(
      within(dialog).getByRole('textbox', { name: /기여도/ }),
      '35',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: /기여 내용/ }),
      '핵심 기능 구현',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: /한줄평가/ }),
      '맡은 작업을 완료했습니다.',
    );
    await user.click(within(dialog).getByRole('button', { name: '평가 저장' }));
    expect(
      screen.queryByRole('button', { name: '임시 저장' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '팀원 기여도 평가' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('row', { name: /OOP 데모 학생 B/ }),
    ).toHaveTextContent('35%');

    view.unmount();
    renderPage(<PeerEvaluationPage />);
    await screen.findByRole('heading', {
      level: 2,
      name: '팀원 기여도 평가',
    });

    expect(
      screen.getByRole('heading', { level: 2, name: '팀원 기여도 평가' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('row', { name: /OOP 데모 학생 B/ }),
    ).toHaveTextContent('35%');
    expect(
      within(screen.getByRole('row', { name: /OOP 데모 학생 B/ })).getByText(
        '완료',
      ),
    ).toBeInTheDocument();
  });

  it('우리 팀 발표는 자료만 보여 주고 평가 입력을 잠근다', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-11-10T15:00:00+09:00').getTime(),
    );
    await renderPresentationPage();

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'CineFlow (7팀)',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('평가 마감까지');
    expect(
      screen.getByText('우리 팀 발표는 평가 대상이 아니에요.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: '5점' })[0]).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: '평가 제출' }),
    ).not.toBeInTheDocument();
  });

  it('오프셋 없는 평가 일정은 타이머와 같은 서울 벽시각으로 표시한다', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-11-10T15:00:00+09:00').getTime(),
    );
    const overview = getMyTeamEvaluations(demoStudent.studentNumber);
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
        () =>
          HttpResponse.json({
            ...overview,
            evaluationOpensAt: '2026-11-10T14:00:00',
            evaluationClosesAt: '2026-11-10T16:00:00',
          }),
      ),
    );

    await renderPresentationPage();

    expect(
      await screen.findByText('2026-11-10/14:00 ~ 2026-11-10/16:00'),
    ).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('평가 마감까지');
  });

  it('다른 팀 발표 자료를 확인하고 평가를 제출한다', async () => {
    const user = userEvent.setup();
    await renderPresentationPage();

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    await user.click(screen.getByRole('button', { name: '다음 팀' }));

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'BookLoop (1팀)',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'bookloop-final-presentation.pdf' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', {
        name: 'bookloop-final-presentation.pdf 미리보기',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '평가 제출' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    for (const option of screen.getAllByRole('radio', { name: '5점' }))
      await user.click(option);
    const submit = screen.getByRole('button', { name: '평가 제출' });
    expect(submit).not.toHaveAttribute('aria-disabled', 'true');
    await user.click(submit);

    expect(
      await screen.findAllByText('BookLoop (1팀) 평가를 제출했어요.'),
    ).not.toHaveLength(0);
    expect(
      await screen.findByText(
        '제출한 평가예요. 기간 안에는 다시 제출해 점수를 고칠 수 있어요.',
      ),
    ).toBeInTheDocument();
    const teamNavigation = screen.getByRole('navigation', {
      name: '팀 발표 빠른 탐색',
    });
    expect(
      within(
        screen.getByRole('dialog', { name: /BookLoop.*평가 입력/ }),
      ).queryByText(/평가 기간이에요/),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(teamNavigation).getByRole('img', { name: '평가 완료' }),
      ).toBeInTheDocument(),
    );
  });

  it('제안서에서 가져온 프로젝트 정보 대신 제출 자료만 보여 준다', async () => {
    await renderPresentationPage();

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    expect(
      screen.getByRole('article', { name: 'CineFlow (7팀) 제출 발표 자료' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /프로젝트 소개|진행 일정|화면 구성|데이터 구성|팀원 역할/,
      }),
    ).not.toBeInTheDocument();
  });

  it('백그라운드 조회만으로는 새로 고침 버튼을 잠그지 않는다', async () => {
    await renderPresentationPage();
    const roster = getMilestonePresentations();
    let finish!: () => void;
    const paused = new Promise<void>(resolve => {
      finish = resolve;
    });
    const fetchRoster = vi.fn(async () => {
      await paused;
      return HttpResponse.json({ contents: roster });
    });
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MILESTONE_PRESENTATIONS(':milestoneId')}`,
        fetchRoster,
      ),
    );
    const query = queryClients.at(-1)!;
    const rosterKey = evaluationKeys.presentationRoster(
      presentationEvaluationMilestoneId,
    );
    let request: Promise<void>;
    try {
      await act(async () => {
        request = query.refetchQueries({ queryKey: rosterKey });
      });
      await waitFor(() => expect(fetchRoster).toHaveBeenCalledOnce());
      const refresh = screen.getByRole('button', {
        name: '발표 자료 새로 고침',
      });
      expect(refresh).toBeEnabled();
      await userEvent.click(refresh);
      expect(refresh).toBeDisabled();
      expect(fetchRoster).toHaveBeenCalledOnce();
    } finally {
      await act(async () => {
        finish();
        await request;
      });
    }
    expect(
      screen.getByRole('button', { name: '발표 자료 새로 고침' }),
    ).toBeEnabled();
  });

  it('발표 자료 새로 고침으로 교체된 파일을 확인한다', async () => {
    const user = userEvent.setup();
    const presentations = getMilestonePresentations();
    const first = presentations[0]!;
    await renderPresentationPage();
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MILESTONE_PRESENTATIONS(':milestoneId')}`,
        () =>
          HttpResponse.json({
            contents: [
              {
                ...first,
                artifacts: [
                  {
                    type: 'FILE',
                    fileId: 77,
                    fileName: 'latest.pdf',
                    mimeType: 'application/pdf',
                    downloadUrl: 'https://files.example.test/latest.pdf',
                  },
                ],
              },
            ],
          }),
      ),
    );

    await user.click(
      screen.getByRole('button', { name: '발표 자료 새로 고침' }),
    );
    expect(
      await screen.findByRole('link', { name: 'latest.pdf' }),
    ).toBeInTheDocument();
  });

  it('자동 조회가 실패해도 수동 새로 고침 오류는 누르기 전까지 표시하지 않는다', async () => {
    await renderPresentationPage();
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MILESTONE_PRESENTATIONS(':milestoneId')}`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    await act(() =>
      queryClients.at(-1)!.refetchQueries({
        queryKey: evaluationKeys.presentationRoster(
          presentationEvaluationMilestoneId,
        ),
      }),
    );
    const message = '새로 고침하지 못해 이전 발표 자료를 보여 드려요.';
    expect(screen.queryByText(message)).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: '발표 자료 새로 고침' }),
    );
    expect(await screen.findByText(message)).toBeVisible();
  });

  it('빈 발표 목록에서도 수동 새로 고침 실패와 재시도 수단을 보여 준다', async () => {
    const url = `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MILESTONE_PRESENTATIONS(':milestoneId')}`;
    server.use(http.get(url, () => HttpResponse.json({ contents: [] })));
    renderPage(<PresentationEvaluationPage />);
    const refresh = await screen.findByRole('button', {
      name: '발표 자료 새로 고침',
    });
    server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));
    await userEvent.click(refresh);
    expect(
      await screen.findByText(
        '발표 자료를 새로 고침하지 못했어요. 다시 시도해 주세요.',
      ),
    ).toBeVisible();
    expect(refresh).toBeEnabled();
  });

  it.each(['CLOSED', 'UPCOMING'] as const)(
    '제출이 거절되면 재조회가 %s인 경우의 안내를 표시한다',
    async windowState => {
      const user = userEvent.setup();
      server.use(
        http.put(
          `${API_BASE_URL}${ENDPOINTS.EVALUATION.TEAM_EVALUATION(':milestoneId', ':teamId')}`,
          () => {
            setEvaluationWindowStates(windowState, 'OPEN');
            return HttpResponse.json(
              {
                code: 'EVALUATION_NOT_OPEN',
                message: '발표 평가 기간이 아니에요.',
              },
              { status: 403 },
            );
          },
        ),
      );
      await renderPresentationPage();
      await user.click(screen.getByRole('button', { name: '다음 팀' }));
      for (const option of screen.getAllByRole('radio', { name: '5점' }))
        await user.click(option);
      await user.click(screen.getByRole('button', { name: '평가 제출' }));
      if (windowState === 'CLOSED') {
        expect(
          await screen.findByText(/평가 시간이 마감되어 제출하지 못했어요/),
        ).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith({
          to: '/student',
          replace: true,
        });
      } else {
        expect(
          await within(
            screen.getByRole('dialog', { name: /평가 입력/ }),
          ).findByText('발표 평가 기간이 아니에요.'),
        ).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
      }
    },
  );

  it('마감 시각이 없는 일반 403은 평가 기간 재조회나 홈 이동 없이 알려 준다', async () => {
    const overview = getMyTeamEvaluations(demoStudent.studentNumber);
    const loadWindow = vi.fn(() =>
      HttpResponse.json({
        ...overview,
        windowState: 'OPEN',
        evaluationClosesAt: null,
      }),
    );
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
        loadWindow,
      ),
      http.put(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.TEAM_EVALUATION(':milestoneId', ':teamId')}`,
        () =>
          HttpResponse.json(
            { code: 'FORBIDDEN', message: '평가 권한이 없어요.' },
            { status: 403 },
          ),
      ),
    );
    await renderPresentationPage();
    await userEvent.click(screen.getByRole('button', { name: '다음 팀' }));
    for (const option of screen.getAllByRole('radio', { name: '5점' }))
      await userEvent.click(option);
    const previousRequests = loadWindow.mock.calls.length;
    await userEvent.click(screen.getByRole('button', { name: '평가 제출' }));
    expect(
      await within(
        screen.getByRole('dialog', { name: /평가 입력/ }),
      ).findByText('평가 권한이 없어요.'),
    ).toBeVisible();
    expect(loadWindow).toHaveBeenCalledTimes(previousRequests);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('5점을 초과하는 평가 항목은 범위를 제한한 숫자 입력으로 제출한다', async () => {
    const user = userEvent.setup();
    const overview = getMyTeamEvaluations(demoStudent.studentNumber);
    let submittedBody: unknown;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
        () =>
          HttpResponse.json({
            ...overview,
            criteria: [
              {
                id: 99,
                title: '100점 발표 완성도',
                maxScore: 100,
                displayOrder: 1,
              },
            ],
          }),
      ),
      http.put(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.TEAM_EVALUATION(':milestoneId', ':teamId')}`,
        async ({ request }) => {
          submittedBody = await request.json();
          return HttpResponse.json({
            id: 1,
            teamId: 1,
            scores: [{ criterionId: 99, score: 100 }],
            submittedAt: '2026-11-10T15:00:00+09:00',
          });
        },
      ),
    );

    await renderPresentationPage();
    await user.click(await screen.findByRole('button', { name: '다음 팀' }));

    const score = screen.getByRole('textbox', {
      name: /100점 발표 완성도 \(최대 100점\)/,
    });
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await user.type(score, '101');
    expect(score).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: '평가 제출' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await user.clear(score);
    await user.type(score, '100');
    await user.click(screen.getByRole('button', { name: '평가 제출' }));
    await waitFor(() =>
      expect(submittedBody).toEqual({
        scores: [{ criterionId: 99, score: 100 }],
      }),
    );
  });

  it('제출한 평가 점수를 다시 열 때 복원한다', async () => {
    const user = userEvent.setup();
    const overview = getMyTeamEvaluations(demoStudent.studentNumber);
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
        () =>
          HttpResponse.json({
            ...overview,
            evaluations: [
              {
                id: 1,
                teamId: 1,
                scores: teamEvaluationCriteria.map(criterion => ({
                  criterionId: criterion.id,
                  score: 4,
                })),
                submittedAt: '2026-11-10T15:00:00+09:00',
              },
            ],
          }),
      ),
    );

    await renderPresentationPage();

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    await user.click(screen.getByRole('button', { name: '다음 팀' }));

    for (const option of await screen.findAllByRole('radio', { name: '4점' }))
      expect(option).toBeChecked();
    expect(
      screen.getByRole('button', { name: '평가 다시 제출' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('제출한 발표 평가의 재제출은 확인 전 요청하지 않고 취소해도 점수를 유지한다', async () => {
    const user = userEvent.setup();
    const overview = getMyTeamEvaluations(demoStudent.studentNumber);
    const submit = vi.fn(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
        () =>
          HttpResponse.json({
            ...overview,
            evaluations: [
              {
                id: 1,
                teamId: 1,
                scores: teamEvaluationCriteria.map(criterion => ({
                  criterionId: criterion.id,
                  score: 4,
                })),
                submittedAt: '2026-11-10T15:00:00+09:00',
              },
            ],
          }),
      ),
      http.put(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.TEAM_EVALUATION(':milestoneId', ':teamId')}`,
        () => {
          submit();
          return HttpResponse.json({
            id: 1,
            teamId: 1,
            scores: teamEvaluationCriteria.map(criterion => ({
              criterionId: criterion.id,
              score: 4,
            })),
            submittedAt: '2026-11-10T15:00:00+09:00',
          });
        },
      ),
    );

    await renderPresentationPage();
    await user.click(await screen.findByRole('button', { name: '다음 팀' }));
    const score = (await screen.findAllByRole('radio', { name: '4점' }))[0]!;

    await user.click(screen.getByRole('button', { name: '평가 다시 제출' }));
    expect(submit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '계속 수정' }));
    expect(score).toBeChecked();
    expect(submit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '평가 다시 제출' }));
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('alertdialog', {
        name: '발표 평가 다시 제출 확인',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: /평가 입력/ }),
    ).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '평가 다시 제출' }));
    await user.click(screen.getByRole('button', { name: '다시 제출' }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
  });

  it('마감 시각이 지나면 평가 기간 상태를 다시 읽어 입력을 잠근다', async () => {
    const user = userEvent.setup();
    const overview = getMyTeamEvaluations(demoStudent.studentNumber);
    let requestCount = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
        () => {
          requestCount += 1;
          return HttpResponse.json({
            ...overview,
            evaluationClosesAt: new Date(Date.now() - 1000).toISOString(),
            windowState: requestCount === 1 ? 'OPEN' : 'CLOSED',
          });
        },
      ),
    );

    await renderPresentationPage();

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    await user.click(screen.getByRole('button', { name: '다음 팀' }));
    await waitFor(() => expect(requestCount).toBeGreaterThan(1));

    expect(
      await screen.findAllByText(
        '평가가 마감되어 자료와 제출한 점수만 확인할 수 있어요.',
      ),
    ).not.toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: '평가 제출' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('서버가 아직 OPEN이어도 마감이 지난 타이머는 00:00:00으로 남기지 않는다', async () => {
    const overview = getMyTeamEvaluations(demoStudent.studentNumber);
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
        () =>
          HttpResponse.json({
            ...overview,
            evaluationClosesAt: new Date(Date.now() - 1000).toISOString(),
            windowState: 'OPEN',
          }),
      ),
    );

    await renderPresentationPage();

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    await waitFor(() =>
      expect(screen.queryByRole('timer')).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(/00:00:00/)).not.toBeInTheDocument();
  });

  it('평가 기간 전에는 자료만 보여 주고 제출을 막는다', async () => {
    const user = userEvent.setup();
    setEvaluationWindowStates('UPCOMING', 'OPEN');
    await renderPresentationPage();

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    await user.click(screen.getByRole('button', { name: '다음 팀' }));

    expect(
      await screen.findAllByText(
        '평가 기간이 시작되면 점수를 입력할 수 있어요.',
      ),
    ).not.toHaveLength(0);
    expect(screen.getAllByRole('radio', { name: '5점' })[0]).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: '평가 제출' }),
    ).not.toBeInTheDocument();
  });
});

it('live multi-section membership blocks evaluation reads and writes even after retry', async () => {
  useAuthStore.getState().markAuthenticated('STUDENT');
  const writes = vi.fn();
  const reads = vi.fn();
  const sections = [1, 2].map(id => ({
    id,
    code: `OOP-${id}`,
    name: `${id}분반`,
    status: 'ACTIVE',
  }));
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({
        studentNumber: demoStudent.studentNumber,
        name: '학생',
        email: '',
        globalRole: 'USER',
        sections,
        teamId: 7,
      }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
      HttpResponse.json({ contents: [sections[0]] }),
    ),
    http.post('*', () => {
      writes();
      return new HttpResponse(null, { status: 500 });
    }),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.EVALUATION.CONTEXT(':sectionId')}`,
      () => {
        reads();
        return HttpResponse.json({});
      },
    ),
  );
  try {
    renderPage(
      <>
        <PeerEvaluationPage />
        <PresentationEvaluationPage />
      </>,
    );

    expect(
      await screen.findAllByText(/선택한 분반의 팀 소속을 확인할 수 없어요/),
    ).toHaveLength(2);
    await userEvent
      .setup()
      .click(
        screen.getAllByRole('button', { name: '소속 정보 다시 시도' })[0]!,
      );
    expect(writes).not.toHaveBeenCalled();
    expect(reads).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
  }
});
