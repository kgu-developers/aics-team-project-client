import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
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

import {
  getMyTeamEvaluations,
  resetEvaluationMockData,
  setEvaluationWindowStates,
  teamEvaluationCriteria,
} from '~/mocks/data/evaluation';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { evaluationHandlers } from '~/mocks/handlers/evaluation';

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => mockNavigate,
}));

const server = setupServer(...evaluationHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetEvaluationMockData();
  setApiAccessToken(demoAccessToken);
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  mockNavigate.mockClear();
});
afterEach(() => {
  server.resetHandlers();
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

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  }

  return render(element, { wrapper: Wrapper });
}

function renderPresentationPage() {
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '7' });
  return renderPage(<PresentationEvaluationPage />);
}

describe('KD3-92 학생 평가 화면', () => {
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
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '상호평가를 제출하지 못했어요. 요청이 기존 데이터와 충돌합니다.',
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.queryByText('상호평가를 제출했어요.'),
    ).not.toBeInTheDocument();
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

    expect(
      await screen.findByText('상호평가를 제출했어요.'),
    ).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/student' });
    expect(screen.queryByText('내 응답 제출 완료')).not.toBeInTheDocument();
  });

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
    renderPresentationPage();

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'CineFlow · 영화관 통합 관리 시스템',
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

  it('다른 팀 발표 자료를 확인하고 평가를 제출한다', async () => {
    const user = userEvent.setup();
    renderPresentationPage();

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    await user.click(screen.getByRole('button', { name: '다음 팀' }));

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'BookLoop · 도서 대여 관리 프로그램',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'bookloop-final-presentation.pdf' }),
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
    renderPresentationPage();

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    await user.click(screen.getByRole('button', { name: '다음 팀' }));

    for (const option of await screen.findAllByRole('radio', { name: '4점' }))
      expect(option).toBeChecked();
    expect(
      screen.getByRole('button', { name: '평가 다시 제출' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('평가 기간 전에는 자료만 보여 주고 제출을 막는다', async () => {
    const user = userEvent.setup();
    setEvaluationWindowStates('UPCOMING', 'OPEN');
    renderPresentationPage();

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
