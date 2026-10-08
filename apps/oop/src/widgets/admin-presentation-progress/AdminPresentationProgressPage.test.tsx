import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminPresentationProgressPage from './AdminPresentationProgressPage';

import {
  issueMockSession,
  mockSessionResponseHeaders,
  resetMockSessionState,
} from '~/mocks/authSession';
import { getAdminMilestonePresentations } from '~/mocks/data/evaluation';
import {
  demoAdmin,
  demoPresentationProfessor,
  demoPresentationProfessorAccessToken,
  demoUserAccounts,
} from '~/mocks/data/users';
import { adminMilestoneSubmissionDetailHandlers } from '~/mocks/handlers/adminMilestoneSubmissionDetails';
import { adminPresentationEvaluationHandlers } from '~/mocks/handlers/adminPresentationEvaluations';
import { adminRequiredArtifactHandlers } from '~/mocks/handlers/adminRequiredArtifacts';
import { evaluationHandlers } from '~/mocks/handlers/evaluation';

const server = setupServer(
  ...evaluationHandlers,
  ...adminPresentationEvaluationHandlers,
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminRequiredArtifactHandlers,
);
const queryClients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  mockSessionResponseHeaders(
    issueMockSession(
      demoUserAccounts.find(
        account => account.accessToken === demoPresentationProfessorAccessToken,
      )!,
    ),
  );
});
afterEach(() => {
  server.resetHandlers();
  queryClients.splice(0).forEach(queryClient => queryClient.clear());
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  queryClients.push(queryClient);
  const rootRoute = createRootRoute({ component: Outlet });
  const progressRoute = createRoute({
    component: () => (
      <AdminPresentationProgressPage milestoneId='103' sectionId='1' />
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/presentation-progress',
  });
  const submissionsRoute = createRoute({
    component: () => <div>발표 평가 목록</div>,
    getParentRoute: () => rootRoute,
    path: '/admin/submissions',
  });
  const router = createRouter({
    history: createMemoryHistory({
      initialEntries: ['/admin/presentation-progress'],
    }),
    routeTree: rootRoute.addChildren([progressRoute, submissionsRoute]),
  });

  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}

it('담당 교수는 발표 순서에 따라 제안서와 제출 자료를 확인한다', async () => {
  const user = userEvent.setup();
  setApiAccessToken(demoPresentationProfessorAccessToken);
  useAuthStore.setState({
    accessToken: demoPresentationProfessorAccessToken,
    currentUser: demoPresentationProfessor,
  });

  renderPage();

  await screen.findByRole('heading', { name: '발표 자료 보기·평가' });
  expect(screen.getByText('1번째 발표')).toBeVisible();
  expect(
    screen.getByText('OOP-01 - 1팀 · CineFlow · 영화관 통합 관리 시스템'),
  ).toBeVisible();
  expect(screen.getByText(/1번 발표 · OOP-01 - 1팀 · 1 \/ \d+/)).toBeVisible();
  const screenHeading = screen.getByRole('heading', { name: '화면 구성' });
  const materialsHeading = screen.getByRole('heading', { name: '발표 자료' });
  expect(screenHeading.compareDocumentPosition(materialsHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  const materialsSection = screen.getByRole('region', { name: '발표 자료' });
  expect(
    await within(materialsSection).findByRole('link', {
      name: '프레젠테이션 자료',
    }),
  ).toBeVisible();
  expect(
    await within(materialsSection).findByText(
      '파일명: presentation-material-v2.pdf',
    ),
  ).toBeVisible();
  expect(
    within(materialsSection).getByText(
      '발표 핵심 흐름: 문제 정의 → 해결 방식 → 시연 → 회고',
    ),
  ).toBeVisible();
  expect(within(materialsSection).getAllByText('텍스트')).toHaveLength(1);
  expect(
    await within(materialsSection).findByText('발표 자료 보완본'),
  ).toBeVisible();
  expect(
    await within(materialsSection).findByRole('link', { name: '시연 영상' }),
  ).toHaveAttribute('href', 'https://demo.example.com/cineflow');
  expect(screen.getByRole('button', { name: '이전 팀' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: '다음 팀' }));

  expect(screen.getByText('2번째 발표')).toBeVisible();
  expect(screen.getByText(/2번 발표 · OOP-01 - 2팀 · 2 \/ \d+/)).toBeVisible();
  expect(screen.getByRole('button', { name: '이전 팀' })).toBeEnabled();
});

it('하단 팀 이동에서도 저장하지 않은 교수자 평가는 확인한 뒤 이동한다', async () => {
  const user = userEvent.setup();
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATION_PROFESSOR('1', '103', '1')}`,
      () =>
        HttpResponse.json({
          editable: true,
          memo: null,
          milestoneId: 103,
          scores: [
            {
              criterionId: 1,
              maxScore: 5,
              score: null,
              title: '프로젝트 완성도',
            },
            {
              criterionId: 2,
              maxScore: 5,
              score: null,
              title: '기능 구성과 구현',
            },
            {
              criterionId: 3,
              maxScore: 5,
              score: null,
              title: '발표 전달력',
            },
          ],
          submittedAt: null,
          teamId: 1,
        }),
    ),
  );
  setApiAccessToken(demoPresentationProfessorAccessToken);
  useAuthStore.setState({
    accessToken: demoPresentationProfessorAccessToken,
    currentUser: demoPresentationProfessor,
  });

  renderPage();

  const memo = await screen.findByLabelText('교수자 메모');
  expect(memo).toBeEnabled();
  await user.type(memo, '저장 전 메모');
  await user.click(screen.getByRole('button', { name: '다음 팀' }));

  expect(
    await screen.findByRole('alertdialog', {
      name: '저장하지 않은 교수자 평가가 있습니다',
    }),
  ).toBeVisible();
  expect(screen.getByText('1번째 발표')).toBeVisible();
});

it('제출 이력이 없으면 최신 제출 상세 조회 로딩 문구를 남기지 않는다', async () => {
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION_VERSIONS('1008')}`,
      () => HttpResponse.json({ contents: [] }),
    ),
  );
  setApiAccessToken(demoPresentationProfessorAccessToken);
  useAuthStore.setState({
    accessToken: demoPresentationProfessorAccessToken,
    currentUser: demoPresentationProfessor,
  });

  renderPage();

  const materialsSection = await screen.findByRole('region', {
    name: '발표 자료',
  });
  await waitFor(() => {
    expect(
      within(materialsSection).queryByText(
        '최신 제출 내용을 불러오는 중입니다.',
      ),
    ).not.toBeInTheDocument();
  });
});

it('발표 자료 응답에 역할이 없으면 킥오프 정보에서 팀원 역할을 보완한다', async () => {
  const presentations = getAdminMilestonePresentations();
  const firstPresentation = presentations[0]!;
  const kickoff = firstPresentation.project?.teamOperation;
  if (!kickoff)
    throw new Error('팀원 역할 보완용 킥오프 fixture가 필요합니다.');

  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MILESTONE_PRESENTATIONS('103')}`,
      () =>
        HttpResponse.json({
          contents: presentations.map((presentation, index) =>
            index === 0 && presentation.project
              ? {
                  ...presentation,
                  project: { ...presentation.project, teamOperation: null },
                }
              : presentation,
          ),
        }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('1')}`, () =>
      HttpResponse.json(kickoff),
    ),
  );
  setApiAccessToken(demoPresentationProfessorAccessToken);
  useAuthStore.setState({
    accessToken: demoPresentationProfessorAccessToken,
    currentUser: demoPresentationProfessor,
  });

  renderPage();

  expect(await screen.findByText('OOP 데모 학생 A · 팀장')).toBeVisible();
  expect(screen.getByText('개발')).toBeVisible();
});

it('담당 교수는 선택한 팀의 발표 자료 제출 이력과 버전별 파일을 확인한다', async () => {
  const user = userEvent.setup();
  setApiAccessToken(demoPresentationProfessorAccessToken);
  useAuthStore.setState({
    accessToken: demoPresentationProfessorAccessToken,
    currentUser: demoPresentationProfessor,
  });

  renderPage();

  await screen.findByRole('heading', { name: '발표 자료 보기·평가' });
  expect(
    screen.queryByRole('heading', { name: '발표 자료 제출 이력' }),
  ).toBeNull();

  await user.click(screen.getByRole('button', { name: '제출 이력' }));

  expect(
    await screen.findByRole('heading', { name: '발표 자료 제출 이력' }),
  ).toBeVisible();
  const historyDialog = screen.getByRole('dialog', {
    name: '발표 자료 제출 이력',
  });
  expect(
    await within(historyDialog).findByText(
      '데모 흐름과 화면 전환 설명을 보완했습니다.',
    ),
  ).toBeVisible();
  expect(
    await within(historyDialog).findByText('발표 자료 보완본'),
  ).toBeVisible();
  expect(
    await within(historyDialog).findByRole('link', {
      name: '프레젠테이션 자료',
    }),
  ).toBeVisible();
  expect(
    await within(historyDialog).findByText(
      '파일명: presentation-material-v2.pdf',
    ),
  ).toBeVisible();

  await user.click(screen.getByRole('button', { name: /v1 · 20230001/ }));

  expect(
    await within(historyDialog).findByRole('link', {
      name: '프레젠테이션 자료',
    }),
  ).toBeVisible();
  expect(
    within(historyDialog).getByText('파일명: presentation-material.pdf'),
  ).toBeVisible();
});

it('조교에게는 교수 전용 진행 화면과 자료 요청을 노출하지 않는다', async () => {
  useAuthStore.setState({ currentUser: demoAdmin });

  renderPage();

  expect(await screen.findByText('담당 교수 전용 화면입니다.')).toBeVisible();
  expect(screen.queryByText('발표 자료를 불러오는 중입니다.')).toBeNull();
});
