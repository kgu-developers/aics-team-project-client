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
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminTeamDashboard from './AdminTeamDashboard';

import { getAdminMilestoneSubmissionsFixture } from '~/mocks/data/adminMilestoneSubmissions';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';
import { adminMilestoneSubmissionDetailHandlers } from '~/mocks/handlers/adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from '~/mocks/handlers/adminMilestoneSubmissions';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';
import { adminStudentTeamHandlers } from '~/mocks/handlers/adminStudentTeams';

const server = setupServer(
  ...adminMeetingHandlers,
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminSectionMilestoneHandlers,
  ...adminStudentTeamHandlers,
);
const originalDialogCloseDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalDialogShowModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });

  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.open = false;
    },
  });
});
afterEach(() => {
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
  server.resetHandlers();
});
afterAll(() => {
  server.close();

  if (originalDialogShowModalDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      ...originalDialogShowModalDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  }

  if (originalDialogCloseDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      ...originalDialogCloseDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

function renderPage(teamId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
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
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: {
      ...demoAdmin,
      sections: [
        {
          code: 'OOP-01',
          id: '1',
          name: '객체지향프로그래밍 01분반',
          role: 'ASSISTANT',
        },
      ],
    },
  });

  return render(<RouterProvider router={router} />);
}

describe('AdminTeamDashboard', () => {
  it('분반 마일스톤마다 teamId 필터 제출 현황과 최신 버전을 연결해 표시한다', async () => {
    const requests = vi.fn();
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS(':milestoneId')}`,
        ({ params, request }) => {
          requests(new URL(request.url));
          const fixture = getAdminMilestoneSubmissionsFixture(
            String(params.milestoneId),
          );
          const teamSubmission = fixture?.contents.find(
            submission => submission.teamId === 1,
          );

          return HttpResponse.json({
            contents: teamSubmission ? [teamSubmission] : [],
          });
        },
      ),
    );

    renderPage('1');

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 대시보드' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('AI 기반 팀 프로젝트 관리 서비스'),
    ).toBeInTheDocument();
    expect(screen.getByText('수정 요청')).toBeInTheDocument();
    expect(screen.getByText('2026.09.07 18:00')).toBeInTheDocument();
    expect(screen.getByText('발표 자료 제출')).toBeInTheDocument();
    expect(screen.getByText('presentation.pdf')).toBeInTheDocument();
    expect(screen.queryByText('발표 평가')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'proposal-v2.pdf' }),
    ).not.toBeInTheDocument();

    await waitFor(() => expect(requests).toHaveBeenCalled());
    expect(requests.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ search: '?teamId=1' })],
      ]),
    );
    expect(requests.mock.calls).not.toEqual(
      expect.arrayContaining([
        [
          expect.objectContaining({
            pathname: expect.stringContaining('/103/'),
          }),
        ],
      ]),
    );
    expect(requests.mock.calls).toEqual(
      expect.arrayContaining([
        [
          expect.objectContaining({
            pathname: expect.stringContaining('/106/'),
          }),
        ],
      ]),
    );
  });

  it('팀 상세 조회에 실패하면 마일스톤 요청 없이 팀 오류 안내를 표시한다', async () => {
    const submissionsRequest = vi.fn();
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM(':teamId')}`, () =>
        HttpResponse.json(
          { code: 'TEAM_NOT_FOUND', message: '팀을 찾을 수 없습니다.' },
          { status: 404 },
        ),
      ),
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS(':milestoneId')}`,
        () => {
          submissionsRequest();
          return HttpResponse.json({ contents: [] });
        },
      ),
    );

    renderPage('999');

    expect(
      await screen.findByText('팀 정보를 찾을 수 없습니다.'),
    ).toBeInTheDocument();
    expect(submissionsRequest).not.toHaveBeenCalled();
  });
});
