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
import { render, screen, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminEvaluationDetailPage from './AdminEvaluationDetailPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminEvaluationResultHandlers } from '~/mocks/handlers/adminEvaluationResults';

const server = setupServer(...adminEvaluationResultHandlers);
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
  const route = createRoute({
    component: AdminEvaluationDetailPage,
    getParentRoute: () => root,
    path: '/admin/evaluations/$evaluationType/teams/$teamId',
    validateSearch: (search: Record<string, unknown>) => ({
      formId: search.formId ? Number(search.formId) : undefined,
      sectionId: search.sectionId ? String(search.sectionId) : undefined,
    }),
  });
  const router = createRouter({
    history: createMemoryHistory({
      initialEntries: [
        '/admin/evaluations/peer/teams/1?sectionId=1&formId=501',
      ],
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

describe('AdminEvaluationDetailPage 상호평가 결과', () => {
  it('팀원별 받은 기여도와 평가자별 제출 상태를 함께 표시한다', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: '팀원 기여도 요약' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2/2명 제출')).toBeInTheDocument();

    const leaderCard = screen.getByRole('article', {
      name: '김민준 기여도 요약',
    });
    expect(within(leaderCard).getByText('팀장')).toBeInTheDocument();
    expect(within(leaderCard).getByText('50%')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '제출 상태' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('제출 완료')).toHaveLength(2);
  });
});
