import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMilestoneDetailPage from './AdminMilestoneDetailPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminRequiredArtifactHandlers } from '~/mocks/handlers/adminRequiredArtifacts';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';

// Real dialog; simplify only the date pickers.
vi.mock('@aics/design-system', async importOriginal => ({
  ...(await importOriginal<typeof import('@aics/design-system')>()),
  DateInput: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label={label}
      onChange={event => onChange(event.target.value)}
      type='date'
      value={value ?? ''}
    />
  ),
  TimeInput: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label={label}
      onChange={event => onChange(event.target.value)}
      type='time'
      value={value ?? ''}
    />
  ),
}));

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
    currentUser: { ...demoAdmin, sections: [{ ...demoAdmin.sections[0]!, id: '1' }] },
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

function fill(dialog: HTMLElement, opens: [string, string], closes: [string, string]) {
  fireEvent.change(within(dialog).getByLabelText('평가 시작 날짜'), {
    target: { value: opens[0] },
  });
  fireEvent.change(within(dialog).getByLabelText('평가 시작 시간'), {
    target: { value: opens[1] },
  });
  fireEvent.change(within(dialog).getByLabelText('평가 종료 날짜'), {
    target: { value: closes[0] },
  });
  fireEvent.change(within(dialog).getByLabelText('평가 종료 시간'), {
    target: { value: closes[1] },
  });
}

describe('AdminMilestoneDetailPage 발표 평가 기간', () => {
  it('평가 기간 전용 API로 발표 평가 기간을 추가하고 상세에 반영한다', async () => {
    const patches: unknown[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'PATCH' && request.url.endsWith('/evaluation-window'))
        void request.clone().json().then(body => patches.push(body));
    });
    const user = userEvent.setup();
    renderPage('106');

    expect(
      await screen.findByText(/발표 평가 기간이 없으면/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '발표 평가 기간 설정' }));
    const dialog = await screen.findByRole('dialog', { name: '발표 평가 기간 설정' });
    fill(dialog, ['2026-11-14', '09:00'], ['2026-11-20', '18:00']);
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(patches).toEqual([
        {
          evaluationClosesAt: '2026-11-20T18:00:00',
          evaluationOpensAt: '2026-11-14T09:00:00',
        },
      ]),
    );
    expect(await screen.findByText(/발표 평가 기간이 설정되어 있어/)).toBeInTheDocument();
    expect(screen.getByText('평가 시작 일시')).toBeInTheDocument();
    server.events.removeAllListeners();
  });

  it('평가 시작이 자료 제출 마감보다 빠르면 요청 없이 이유를 안내한다', async () => {
    const user = userEvent.setup();
    renderPage('106');
    await user.click(
      await screen.findByRole('button', { name: '발표 평가 기간 설정' }),
    );
    const dialog = await screen.findByRole('dialog', { name: '발표 평가 기간 설정' });
    // dueAt of milestone 106 is 2026-11-13T14:59:00Z (= 11-13 23:59 KST)
    fill(dialog, ['2026-11-10', '09:00'], ['2026-11-20', '18:00']);
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      '평가 시작 일시는 제출 마감 일시 이후여야 합니다',
    );
  });

  it('서버가 400을 돌려주면 상태 코드와 함께 실패를 표시한다', async () => {
    server.use(
      http.patch(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE_EVALUATION_WINDOW('1', '106')}`,
        () =>
          HttpResponse.json({ code: 'INVALID_MILESTONE_REQUEST' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderPage('106');
    await user.click(
      await screen.findByRole('button', { name: '발표 평가 기간 설정' }),
    );
    const dialog = await screen.findByRole('dialog', { name: '발표 평가 기간 설정' });
    fill(dialog, ['2026-11-14', '09:00'], ['2026-11-20', '18:00']);
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      '(HTTP 400 · INVALID_MILESTONE_REQUEST)',
    );
  });
});
