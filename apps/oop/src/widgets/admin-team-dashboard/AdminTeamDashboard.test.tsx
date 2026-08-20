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
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import AdminTeamDashboard from './AdminTeamDashboard';

import { demoAdminAccessToken } from '~/mocks/data/users';
import { adminTeamDashboardHandlers } from '~/mocks/handlers/adminTeamDashboard';

const server = setupServer(...adminTeamDashboardHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  setApiAccessToken(null);
  server.resetHandlers();
});
afterAll(() => server.close());

function renderPage(teamId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const teamDashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/teams/$teamId',
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminTeamDashboard />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([teamDashboardRoute]),
    history: createMemoryHistory({
      initialEntries: [`/admin/teams/${teamId}`],
    }),
  });

  setApiAccessToken(demoAdminAccessToken);

  return render(<RouterProvider router={router} />);
}

describe('AdminTeamDashboard', () => {
  it('정상 팀 정보를 표시한다', async () => {
    renderPage('team-1151-1');

    expect(
      await screen.findByRole('heading', {
        name: 'OOP-01반 - 1팀 대시보드',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('프로젝트 주제: AI 기반 팀 프로젝트 관리 서비스'),
    ).toBeInTheDocument();
    expect(screen.getByText(/김민준 \/ 20231234/)).toBeInTheDocument();
  });

  it('존재하지 않는 팀이면 오류 안내를 표시한다', async () => {
    renderPage('not-found');

    expect(
      await screen.findByText('팀 정보를 불러오지 못했습니다.'),
    ).toBeInTheDocument();
  });
});
