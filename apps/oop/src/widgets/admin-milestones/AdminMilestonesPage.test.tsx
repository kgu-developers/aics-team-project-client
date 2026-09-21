import { setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMilestonesPage from './AdminMilestonesPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';

const server = setupServer(
  ...adminCourseHandlers,
  ...adminSectionMilestoneHandlers,
);
const clients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: {
      ...demoAdmin,
      sections: [{ ...demoAdmin.sections[0]!, id: '1' }],
    },
  });
  const root = createRootRoute();
  const listRoute = createRoute({
    component: AdminMilestonesPage,
    getParentRoute: () => root,
    path: '/admin/milestones/',
    validateSearch: (search: Record<string, unknown>) => ({
      sectionId: search.sectionId ? String(search.sectionId) : undefined,
    }),
  });
  const detailRoute = createRoute({
    component: () => <div>마일스톤 상세</div>,
    getParentRoute: () => root,
    path: '/admin/milestones/$milestoneId',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/admin/milestones'] }),
    routeTree: root.addChildren([listRoute, detailRoute]),
  });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return router;
}

describe('AdminMilestonesPage', () => {
  it('공개 상태 옵션을 고르면 상태만 바뀌고 행 상세로 이동하지 않는다', async () => {
    const user = userEvent.setup();
    const router = renderPage();

    const row = await screen.findByRole('row', {
      name: '제안서 마일스톤 보기',
    });
    const trigger = screen.getByRole('combobox', {
      name: 'OOP-01 제안서 공개 상태',
    });
    expect(trigger).toHaveTextContent('공개');

    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: '미공개' }));

    await waitFor(() => expect(trigger).toHaveTextContent('미공개'));
    expect(router.state.location.pathname).toBe('/admin/milestones');
    expect(row).toBeInTheDocument();
    expect(screen.queryByText('마일스톤 상세')).not.toBeInTheDocument();
  });

  it('행의 일반 셀을 클릭하면 상세로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderPage();

    await user.click(
      await screen.findByRole('row', { name: '제안서 마일스톤 보기' }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/milestones/101'),
    );
    expect(await screen.findByText('마일스톤 상세')).toBeInTheDocument();
  });
});
