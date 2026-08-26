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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import AdminTeamDashboard from './AdminTeamDashboard';

import { adminTeamDashboardFixture } from '~/mocks/data/adminTeamDashboard';
import { demoAdminAccessToken } from '~/mocks/data/users';
import { adminTeamDashboardHandlers } from '~/mocks/handlers/adminTeamDashboard';

const server = setupServer(...adminTeamDashboardHandlers);
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
      screen.getByText('AI 기반 팀 프로젝트 관리 서비스'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '← 수강생/팀 관리로' }),
    ).toHaveAttribute('href', '/admin/student-team');
    expect(screen.getByRole('button', { name: '김민준' })).toBeInTheDocument();
    expect(screen.getByText('20231234')).toBeInTheDocument();
    expect(screen.getByText('팀장')).toBeInTheDocument();
    expect(screen.getByText('ENGINE')).toBeInTheDocument();
    expect(screen.getByText('제안서')).toBeInTheDocument();
    expect(screen.getByText('중간 점검')).toBeInTheDocument();
    expect(screen.getByText('발표 자료 제출')).toBeInTheDocument();
    expect(screen.getByText('최종 보고서')).toBeInTheDocument();
    expect(screen.getByText('상호 평가')).toBeInTheDocument();
    expect(screen.queryByText('발표 평가')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '상세보기' })).toHaveLength(3);
    expect(
      screen.getAllByRole('link', { name: '상세보기' })[0],
    ).toHaveAttribute(
      'href',
      '/admin/submissions/submission-oop-01-1-proposal?milestoneId=proposal&sectionId=oop-2026-2-01',
    );
  });

  it('수강생/팀 관리에 등록된 2팀 정보를 표시한다', async () => {
    renderPage('team-1151-2');

    expect(
      await screen.findByRole('heading', {
        name: 'OOP-01반 - 2팀 대시보드',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '박지훈' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '최유진' })).toBeInTheDocument();
    expect(screen.getByText('최종 보고서')).toBeInTheDocument();
    expect(screen.getByText('상호 평가')).toBeInTheDocument();
  });

  it('팀원 이름을 누르면 상세 정보를 표시하고 닫은 뒤 포커스를 돌려준다', async () => {
    const user = userEvent.setup();

    renderPage('team-1151-1');

    const memberButton = await screen.findByRole('button', { name: '김민준' });
    await user.click(memberButton);

    const dialog = await screen.findByRole('dialog', {
      name: '김민준 수강생 정보',
    });

    expect(within(dialog).getByText('컴퓨터공학과')).toBeInTheDocument();
    expect(within(dialog).getByText('1팀')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(memberButton).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('프로젝트 주제와 역할이 없으면 미정 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () =>
          HttpResponse.json({
            ...adminTeamDashboardFixture,
            projectTopic: null,
            members: adminTeamDashboardFixture.members.map((member, index) =>
              index === 0 ? { ...member, projectRole: null } : member,
            ),
          }),
      ),
    );

    renderPage('team-1151-1');

    expect(await screen.findByText('미정')).toBeInTheDocument();
    expect(screen.getByText('역할 미정')).toBeInTheDocument();
  });

  it('존재하지 않는 팀이면 오류 안내를 표시한다', async () => {
    renderPage('not-found');

    expect(
      await screen.findByText('팀 정보를 찾을 수 없습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '수강생/팀 관리로' }),
    ).toHaveAttribute('href', '/admin/student-team');
    expect(
      screen.queryByRole('button', { name: '다시 시도' }),
    ).not.toBeInTheDocument();
  });

  it('응답을 기다리는 동안 로딩 상태를 표시한 뒤 팀 정보를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        async () => {
          await delay(500);
          return HttpResponse.json(adminTeamDashboardFixture);
        },
      ),
    );

    renderPage('team-1151-1');

    expect(await screen.findByRole('status')).toHaveTextContent(
      '팀 정보를 불러오는 중입니다.',
    );
    expect(
      await screen.findByRole(
        'heading',
        {
          name: 'OOP-01반 - 1팀 대시보드',
        },
        { timeout: 2_000 },
      ),
    ).toBeInTheDocument();
  });

  it('접근할 수 없는 팀이면 권한 안내를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () =>
          HttpResponse.json(
            {
              code: 'TEAM_ACCESS_DENIED',
              message: '이 팀에 접근할 수 없습니다.',
            },
            { status: 403 },
          ),
      ),
    );

    renderPage('team-1151-1');

    expect(
      await screen.findByText('이 팀에 접근할 수 없습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('담당 분반과 관리자 권한을 확인해 주세요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '수강생/팀 관리로' }),
    ).toHaveAttribute('href', '/admin/student-team');
    expect(
      screen.queryByRole('button', { name: '다시 시도' }),
    ).not.toBeInTheDocument();
  });

  it('응답을 받지 못하면 네트워크 오류 안내를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () => HttpResponse.error(),
      ),
    );

    renderPage('team-1151-1');

    expect(
      await screen.findByText('네트워크 연결을 확인한 뒤 다시 시도해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled();
    expect(
      screen.getByRole('link', { name: '수강생/팀 관리로' }),
    ).toHaveAttribute('href', '/admin/student-team');
  });

  it('오류가 해결된 뒤 다시 시도하면 팀 정보를 표시한다', async () => {
    const user = userEvent.setup();
    let requestCount = 0;

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () => {
          requestCount += 1;

          return requestCount <= 2
            ? HttpResponse.error()
            : HttpResponse.json(adminTeamDashboardFixture);
        },
      ),
    );

    renderPage('team-1151-1');

    await user.click(await screen.findByRole('button', { name: '다시 시도' }));

    expect(
      await screen.findByRole('heading', {
        name: 'OOP-01반 - 1팀 대시보드',
      }),
    ).toBeInTheDocument();
  });

  it('분반에 마일스톤이 없으면 빈 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () =>
          HttpResponse.json({
            ...adminTeamDashboardFixture,
            milestones: [],
          }),
      ),
    );

    renderPage('team-1151-1');

    expect(
      await screen.findByText('등록된 마일스톤이 없습니다.'),
    ).toBeInTheDocument();
  });

  it('임시 응답에 마일스톤 필드가 없으면 빈 목록으로 처리한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () =>
          HttpResponse.json({
            ...adminTeamDashboardFixture,
            milestones: undefined,
          }),
      ),
    );

    renderPage('team-1151-1');

    expect(
      await screen.findByText('등록된 마일스톤이 없습니다.'),
    ).toBeInTheDocument();
  });

  it('교수자가 설정한 마일스톤 이름과 순서를 그대로 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () =>
          HttpResponse.json({
            ...adminTeamDashboardFixture,
            milestones: [
              {
                id: 'professor-milestone-first',
                title: '교수자 설정 첫 단계',
                deadlineLabel: '2026-08-25',
                submissionId: null,
                status: { kind: 'before-deadline' },
              },
              {
                id: 'professor-milestone-second',
                title: '교수자 설정 두 번째 단계',
                deadlineLabel: '2026-08-30',
                submissionId: null,
                status: { kind: 'before-deadline' },
              },
            ],
          }),
      ),
    );

    renderPage('team-1151-1');

    const progressHeading = await screen.findByRole('heading', {
      name: '진행 현황',
    });
    const progressSection = progressHeading.closest('section');

    expect(progressSection).not.toBeNull();
    expect(
      within(progressSection as HTMLElement)
        .getAllByText(/교수자 설정 .* 단계/)
        .map(label => label.textContent),
    ).toEqual(['교수자 설정 첫 단계', '교수자 설정 두 번째 단계']);
  });
});
