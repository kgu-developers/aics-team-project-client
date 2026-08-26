import { setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminSubmissionDetailPage from './AdminSubmissionDetailPage';
import AdminSubmissionsPage from './AdminSubmissionsPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMilestoneSubmissionDetailHandlers } from '~/mocks/handlers/adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from '~/mocks/handlers/adminMilestoneSubmissions';

const server = setupServer(
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
  server.resetHandlers();
});
afterAll(() => server.close());

function renderPage(
  initialEntry = '/admin/submissions?sectionId=oop-2026-2-01',
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  const rootRoute = createRootRoute();
  const submissionsRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminSubmissionsPage />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/submissions',
  });
  const submissionDetailRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminSubmissionDetailPage />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/submissions/$submissionId',
  });
  const router = createRouter({
    history: createMemoryHistory({
      initialEntries: [initialEntry],
    }),
    routeTree: rootRoute.addChildren([submissionsRoute, submissionDetailRoute]),
  });

  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: demoAdmin,
  });

  return render(<RouterProvider router={router} />);
}

describe('AdminSubmissionsPage', () => {
  it('마일스톤 탭에 맞는 제출 목록 요약을 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '중간 점검' }));

    expect(
      screen.getByRole('heading', { name: '중간 점검 목록' }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText('첨부 파일 수: -')).toHaveLength(2);
    expect(screen.getAllByText('피드백: -')).toHaveLength(2);
  });

  it('상세보기에서 선택한 마일스톤 이름을 유지한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '최종 보고서' }));
    await user.click(screen.getAllByRole('link', { name: '상세보기' })[0]!);

    expect(
      await screen.findByRole('heading', { name: '최종 보고서 상세보기' }),
    ).toBeInTheDocument();
  });

  it('제출된 제안서를 읽기 전용으로 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-1-proposal?milestoneId=proposal&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 제안서' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('AI 기반 팀 프로젝트 관리 서비스'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
