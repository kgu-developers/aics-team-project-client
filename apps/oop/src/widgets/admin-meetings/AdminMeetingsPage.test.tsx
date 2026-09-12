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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMeetingsPage from './AdminMeetingsPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';

const server = setupServer(
  ...adminMeetingHandlers,
  ...adminSectionMilestoneHandlers,
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  const rootRoute = createRootRoute();
  const meetingsRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminMeetingsPage />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/meetings/',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/admin/meetings/'] }),
    routeTree: rootRoute.addChildren([meetingsRoute]),
  });

  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: demoAdmin,
  });

  return render(<RouterProvider router={router} />);
}

describe('AdminMeetingsPage', () => {
  it('관리자 회의록 목록에 제목을 표시한다', async () => {
    renderPage();

    expect(
      await screen.findByRole('columnheader', { name: '회의 제목' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '발표 자료 구성 논의' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: '회의 내용' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: '단계' }),
    ).not.toBeInTheDocument();
  });

  it('특정 분반을 선택했을 때만 마일스톤 필터를 표시한다', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByLabelText('마일스톤 필터')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'OOP-01' }));
    const milestoneFilter = await screen.findByLabelText('마일스톤 필터');
    expect(milestoneFilter).toBeInTheDocument();

    await user.click(milestoneFilter);
    await user.click(
      await screen.findByRole('option', { name: '3주차 · 제안서' }),
    );
    expect(
      await screen.findByRole('link', { name: '프로젝트 킥오프' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: '발표 자료 구성 논의' }),
      ).not.toBeInTheDocument(),
    );
  });
});
