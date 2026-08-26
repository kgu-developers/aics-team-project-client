import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
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
  getPresentationEvaluationOverview,
  resetEvaluationMockData,
  setEvaluationWindowStates,
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

describe('KD3-92 학생 평가 화면', () => {
  it('평가 기간이 종료되면 내역은 보여 주되 상호평가 입력은 잠근다', async () => {
    const user = userEvent.setup();
    setEvaluationWindowStates('CLOSED', 'CLOSED');
    renderPage(<PeerEvaluationPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: '프로젝트 평가' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2. 팀원 기여도' }));
    expect(
      screen.getByText('평가 기간이 종료되어 내 제출 내역만 확인할 수 있어요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '제출하기' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('현재 팀 평가를 완료한 뒤 팀별로 제출한다', async () => {
    const user = userEvent.setup();
    renderPage(<PresentationEvaluationPage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: '발표 평가' }),
    ).toBeInTheDocument();
    expect(screen.getByText('프로젝트 완성도')).toBeInTheDocument();
    expect(screen.getByText('기능 구성과 구현')).toBeInTheDocument();
    expect(screen.getByText('발표 전달력')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /제출 PDF 미리보기/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('bookloop-final-presentation.pdf', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'PDF 원본 열기' })).toHaveAttribute(
      'href',
      '/evaluation/bookloop-presentation.pdf',
    );
    expect(screen.getByAltText('도서 검색 화면 미리보기')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: '발표 팀 진행 상황' }),
    ).not.toBeInTheDocument();
    const evaluationForm = screen.getByRole('region', { name: '발표 평가' });
    const teamNavigation = screen.getByRole('navigation', {
      name: '발표 팀 이동',
    });
    const teamSubmit = screen.getByRole('region', {
      name: '현재 팀 발표 평가 제출',
    });
    const teamContent = screen.getByRole('region', {
      name: 'BookLoop · 도서 대여 관리 프로그램',
    });
    const actionFooter = screen.getByLabelText('발표 평가 작업');
    expect(teamContent).toContainElement(evaluationForm);
    expect(actionFooter).toContainElement(teamNavigation);
    expect(actionFooter).toContainElement(teamSubmit);
    expect(
      evaluationForm.compareDocumentPosition(teamNavigation) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      teamNavigation.compareDocumentPosition(teamSubmit) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.getByText(/발표 수업 시간/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '임시 저장' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '제출하기' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    for (const option of screen.getAllByRole('radio', { name: '4점' }))
      await user.click(option);
    expect(
      screen.getByRole('button', { name: '제출하기' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('button', { name: '제출하기' }));

    expect(
      await screen.findByText('BookLoop (1팀) 발표 평가를 제출했어요.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '제출 완료' })).toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );

    await user.click(screen.getByRole('button', { name: '다음 팀' }));
    expect(
      screen.getByRole('region', {
        name: 'CafeQueue · 카페 주문 관리 프로그램',
      }),
    ).toBeInTheDocument();
    for (const option of screen.getAllByRole('radio', { name: '5점' }))
      await user.click(option);
    expect(
      screen.getByRole('button', { name: '제출하기' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('button', { name: '제출하기' }));

    expect(
      await screen.findByText('CafeQueue (3팀) 발표 평가를 제출했어요.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '제출 완료' })).toHaveAttribute(
        'aria-disabled',
        'true',
      ),
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

  it('발표평가 점수를 팀 이동 시 서버 초안에 저장하고 복원한다', async () => {
    const user = userEvent.setup();
    const view = renderPage(<PresentationEvaluationPage />);

    await screen.findByRole('heading', { level: 1, name: '발표 평가' });
    const firstFourPointOption = screen.getAllByRole('radio', {
      name: '4점',
    })[0];
    expect(firstFourPointOption).toBeDefined();
    await user.click(firstFourPointOption!);
    await user.click(screen.getByRole('button', { name: '다음 팀' }));

    view.unmount();
    renderPage(<PresentationEvaluationPage />);
    await screen.findByRole('heading', { level: 1, name: '발표 평가' });

    expect(screen.getAllByRole('radio', { name: '4점' })[0]).toBeChecked();
  });

  it('수업 시작 refetch에서 추가된 팀의 서버 초안 점수로 제출을 활성화한다', async () => {
    const overview = getPresentationEvaluationOverview(
      demoStudent.studentNumber,
    );
    const initialTeam = overview.teams.find(team => team.id === 'team-03');
    const savedTeam = overview.teams.find(team => team.id === 'team-01');
    if (!initialTeam || !savedTeam)
      throw new Error('발표 평가 회귀 테스트 팀 fixture가 필요합니다.');

    let requestCount = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
        () => {
          requestCount += 1;
          if (requestCount === 1)
            return HttpResponse.json({
              ...overview,
              evaluationOpensAt: new Date(Date.now() - 1_000).toISOString(),
              myEvaluations: [],
              teams: [initialTeam],
              windowState: 'UPCOMING' as const,
            });

          return HttpResponse.json({
            ...overview,
            myEvaluations: [
              {
                id: 'presentation-evaluation-refetched-draft',
                rateeTeamId: savedTeam.id,
                scores: [
                  { criterionId: 'project-completeness', score: 4 },
                  { criterionId: 'feature-implementation', score: 4 },
                  { criterionId: 'presentation-delivery', score: 4 },
                ],
                status: 'DRAFT' as const,
                updatedAt: new Date().toISOString(),
              },
            ],
            teams: [savedTeam],
            windowState: 'OPEN' as const,
          });
        },
      ),
    );

    renderPage(<PresentationEvaluationPage />);

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: savedTeam.presentation.projectTitle,
      }),
    ).toBeInTheDocument();
    await waitFor(() => expect(requestCount).toBeGreaterThan(1));
    for (const option of screen.getAllByRole('radio', { name: '4점' }))
      expect(option).toBeChecked();
    expect(
      screen.getByRole('button', { name: '제출하기' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('학생이 변경할 수 없는 발표 진행 상태 배지를 표시하지 않는다', async () => {
    const user = userEvent.setup();
    renderPage(<PresentationEvaluationPage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: '발표 평가' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음 팀' }));
    expect(screen.queryByText('현재 발표')).not.toBeInTheDocument();
    expect(screen.queryByText('발표 예정')).not.toBeInTheDocument();
    expect(screen.queryByText('발표 완료')).not.toBeInTheDocument();
  });

  it('발표 수업 전에는 자료만 보여 주고 평가 입력과 제출을 잠근다', async () => {
    setEvaluationWindowStates('UPCOMING', 'OPEN');
    renderPage(<PresentationEvaluationPage />);

    expect(
      await screen.findByText(
        '발표 평가 수업 시간이 아직 시작되지 않았어요. 발표 자료는 미리 확인할 수 있어요.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('평가 시작까지');
    expect(
      screen.getByRole('region', { name: /제출 PDF 미리보기/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: '4점' })[0]).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: '제출하기' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      screen.getByText(
        '수업 시간이 시작되기 전에는 발표 자료만 확인할 수 있어요.',
      ),
    ).toBeInTheDocument();
  });

  it('발표 수업 종료 후에도 평가 입력과 팀별 제출을 허용한다', async () => {
    const user = userEvent.setup();
    setEvaluationWindowStates('CLOSED', 'OPEN');
    renderPage(<PresentationEvaluationPage />);

    expect(
      await screen.findByText(
        '발표 수업은 종료됐지만 아직 제출하지 않은 평가는 계속 작성할 수 있어요.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('radio', { name: '4점' })[0],
    ).not.toHaveAttribute('aria-disabled');
    for (const option of screen.getAllByRole('radio', { name: '4점' }))
      await user.click(option);
    expect(
      screen.getByRole('button', { name: '제출하기' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByText(
        '발표 수업은 종료됐지만 평가는 계속 작성하고 제출할 수 있어요.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '제출하기' }));
    expect(
      await screen.findAllByText('BookLoop (1팀) 발표 평가를 제출했어요.'),
    ).not.toHaveLength(0);
  });
});
