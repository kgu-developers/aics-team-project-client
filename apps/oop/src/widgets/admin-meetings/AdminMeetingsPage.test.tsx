import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
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
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMeetingsPage from './AdminMeetingsPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';
import { adminStudentTeamHandlers } from '~/mocks/handlers/adminStudentTeams';

const server = setupServer(
  ...adminMeetingHandlers,
  ...adminSectionMilestoneHandlers,
  ...adminStudentTeamHandlers,
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage(initialEntry = '/admin/meetings/') {
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
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
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
  it('관리자 회의록 목록 행은 전체를 눌러 상세를 볼 수 있게 표시한다', async () => {
    renderPage();

    expect(
      await screen.findByRole('columnheader', { name: '회의 제목' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('row', { name: /발표 자료 구성 논의 회의록 보기/ }),
    ).toHaveAttribute('tabindex', '0');
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

    expect(
      await screen.findByRole('group', { name: '회의록 필터' }),
    ).toContainElement(await screen.findByRole('combobox', { name: '분반' }));
    expect(screen.queryByLabelText('마일스톤 필터')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('팀')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('combobox', { name: '분반' }));
    await user.click(await screen.findByRole('option', { name: 'OOP-01' }));
    const milestoneFilter = await screen.findByLabelText('마일스톤 필터');
    expect(screen.getByLabelText('팀')).toBeInTheDocument();
    expect(milestoneFilter).toBeInTheDocument();

    await user.click(milestoneFilter);
    await user.click(
      await screen.findByRole('option', { name: '3주차 · 제안서' }),
    );
    expect(
      await screen.findByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('row', { name: /발표 자료 구성 논의 회의록 보기/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it('팀 필터 드롭다운으로 팀을 고르면 URL과 목록이 그 팀으로 좁혀진다', async () => {
    const user = userEvent.setup();
    renderPage('/admin/meetings/?sectionId=1');

    await screen.findByRole('row', { name: /발표 자료 구성 논의 회의록 보기/ });
    const teamFilter = await screen.findByRole('combobox', { name: '팀' });
    await waitFor(() => expect(teamFilter).toBeEnabled());
    await user.click(teamFilter);
    await user.click(await screen.findByRole('option', { name: '1팀' }));

    expect(
      await screen.findByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('row', { name: /발표 자료 구성 논의 회의록 보기/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it('분반과 팀 필터가 있는 URL은 해당 팀의 회의록만 표시한다', async () => {
    renderPage('/admin/meetings/?sectionId=oop-2026-2-01&teamId=1');

    expect(
      await screen.findByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /발표 자료 구성 논의 회의록 보기/ }),
    ).not.toBeInTheDocument();
  });
});

it('formats offset-bearing meeting times in Seoul across midnight', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`, () =>
      HttpResponse.json({
        contents: [
          {
            id: 11,
            title: '자정 넘긴 회의',
            authorId: '20230001',
            content: '',
            location: '',
            meetingAt: '2026-09-01T23:30:00Z',
            participantCount: 2,
            phase: 'KICKOFF',
            sectionId: 1,
            sectionName: 'OOP-01',
            teamId: 1,
            teamName: '1팀',
          },
        ],
        pageable: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          isEnd: true,
        },
      }),
    ),
  );
  renderPage();
  expect(await screen.findByText('2026.09.02 08:30')).toBeVisible();
});
