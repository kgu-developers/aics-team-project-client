import { setApiAccessToken } from '@aics/api-client';
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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminPresentationProgressPage from './AdminPresentationProgressPage';

import { resetMockSessionState } from '~/mocks/authSession';
import { presentationEvaluationMilestoneId } from '~/mocks/data/evaluation';
import {
  demoAdmin,
  demoPresentationProfessor,
  demoPresentationProfessorAccessToken,
} from '~/mocks/data/users';
import { evaluationHandlers } from '~/mocks/handlers/evaluation';

const server = setupServer(...evaluationHandlers);
const queryClients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockSessionState());
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
      <AdminPresentationProgressPage
        milestoneId={presentationEvaluationMilestoneId}
        sectionId='oop-2026-2-01'
      />
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
  expect(screen.getByText(/CineFlow \(7팀\)/)).toBeVisible();
  expect(screen.getByRole('link', { name: /presentation/i })).toBeVisible();
  expect(screen.getByRole('button', { name: '이전 팀' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: '다음 팀' }));

  expect(screen.getByText('2번째 발표')).toBeVisible();
  expect(screen.getByRole('button', { name: '이전 팀' })).toBeEnabled();
});

it('조교에게는 교수 전용 진행 화면과 자료 요청을 노출하지 않는다', async () => {
  useAuthStore.setState({ currentUser: demoAdmin });

  renderPage();

  expect(await screen.findByText('담당 교수 전용 화면입니다.')).toBeVisible();
  expect(screen.queryByText('발표 자료를 불러오는 중입니다.')).toBeNull();
});
