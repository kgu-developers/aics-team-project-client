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
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMeetingActionsPage from './AdminMeetingActionsPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';

const server = setupServer(
  ...adminCourseHandlers,
  ...adminMeetingHandlers,
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAMS(':sectionId')}`,
    () => HttpResponse.json({ contents: [{ id: 1, name: '1팀' }] }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage(initialEntry = '/admin/meeting-actions?sectionId=1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const meetingActionsRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminMeetingActionsPage />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/meeting-actions',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([meetingActionsRoute]),
  });

  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: demoAdmin,
  });

  return render(<RouterProvider router={router} />);
}

describe('AdminMeetingActionsPage', () => {
  it('선택한 분반의 액션플랜을 읽기 전용 표로 표시한다', async () => {
    renderPage();

    expect(
      await screen.findByRole('columnheader', { name: '액션 항목' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '팀' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '회의록' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '관리' })).toBeNull();
    expect(screen.getByText('중간 점검 피드백 반영 사항 정리')).toBeVisible();
    expect(screen.getByText('발표 자료 역할별 초안 작성')).toBeVisible();
  });

  it('분반 액션플랜 조회가 403이면 대상 존재 여부를 구분하지 않는 안내를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MEETING_ACTIONS(':sectionId')}`,
        () => HttpResponse.json({}, { status: 403 }),
      ),
    );

    renderPage();

    expect(
      await screen.findByRole('heading', {
        name: '액션플랜을 불러오지 못했습니다.',
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText('담당 분반의 액션플랜만 조회할 수 있습니다.'),
      ).toBeVisible(),
    );
  });
});
