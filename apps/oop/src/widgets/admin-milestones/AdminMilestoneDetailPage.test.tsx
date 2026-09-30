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
import { render, screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMilestoneDetailPage from './AdminMilestoneDetailPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminRequiredArtifactHandlers } from '~/mocks/handlers/adminRequiredArtifacts';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';

const server = setupServer(
  ...adminSectionMilestoneHandlers,
  ...adminRequiredArtifactHandlers,
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

function renderPage(milestoneId: string) {
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
  const route = createRoute({
    component: AdminMilestoneDetailPage,
    getParentRoute: () => root,
    path: '/admin/milestones/$milestoneId',
    validateSearch: (search: Record<string, unknown>) => ({
      sectionId: search.sectionId ? String(search.sectionId) : undefined,
    }),
  });
  const router = createRouter({
    history: createMemoryHistory({
      initialEntries: [`/admin/milestones/${milestoneId}?sectionId=1`],
    }),
    routeTree: root.addChildren([route]),
  });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}

describe('AdminMilestoneDetailPage 발표 평가 안내', () => {
  it('발표 평가는 제출물 관리 화면에서 시작하도록 안내한다', async () => {
    renderPage('106');

    expect(
      await screen.findByText(
        /제출물 관리의 발표 평가 탭에서 평가를 시작할 수 있습니다/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '발표 평가 관리로 이동' }),
    ).toBeVisible();
  });
});
