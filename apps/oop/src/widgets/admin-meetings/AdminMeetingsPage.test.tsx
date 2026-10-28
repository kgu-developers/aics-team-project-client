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
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMeetingsPage from './AdminMeetingsPage';

import { resetMockSessionState } from '~/mocks/authSession';
import { resetAdminCoursesMockData } from '~/mocks/data/adminCourses';
import {
  demoAdmin,
  demoAdminAccessToken,
  demoNoticeProfessor,
  demoNoticeProfessorAccessToken,
} from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';

const server = setupServer(
  ...adminCourseHandlers,
  ...adminMeetingHandlers,
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAMS(':sectionId')}`,
    () =>
      HttpResponse.json({
        contents: [
          { id: 1, name: '1팀' },
          { id: 2, name: '2팀' },
        ],
      }),
  ),
);

function positiveId(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function nonNegativePage(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function validateMeetingSearch(search: Record<string, unknown>) {
  return {
    page: nonNegativePage(search.page),
    sectionId: positiveId(search.sectionId),
    teamId: positiveId(search.teamId),
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  resetAdminCoursesMockData();
});
afterEach(() => {
  window.localStorage.clear();
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage(
  initialEntry = '/admin/meetings/',
  currentUser = demoAdmin,
  accessToken = demoAdminAccessToken,
) {
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
    validateSearch: validateMeetingSearch,
  });
  const meetingDetailRoute = createRoute({
    component: () => <div>회의록 상세</div>,
    getParentRoute: () => rootRoute,
    path: '/admin/meetings/$meetingId',
    validateSearch: validateMeetingSearch,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([meetingsRoute, meetingDetailRoute]),
  });

  setApiAccessToken(accessToken);
  useAuthStore.setState({
    accessToken,
    currentUser,
  });

  return { ...render(<RouterProvider router={router} />), router };
}

describe('AdminMeetingsPage', () => {
  it('관리자 회의록 목록은 읽음 상태와 핵심 5개 열을 표시하고 행 전체를 눌러 상세를 볼 수 있게 한다', async () => {
    const { container } = renderPage();

    await screen.findByRole('columnheader', { name: '회의 제목' });
    expect(
      screen.getByRole('columnheader', { name: '읽음 상태' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('columnheader').map(header => header.textContent),
    ).toEqual(['', '분반', '팀', '회의 제목', '회의 일자', '작성자']);
    expect(screen.getAllByText('OOP-01 · 월요일 1-2교시')).not.toHaveLength(0);
    expect(
      screen.getByRole('row', { name: /발표 자료 구성 논의 회의록 보기/ }),
    ).toHaveAttribute('tabindex', '0');
    expect(
      screen.queryByRole('columnheader', { name: '회의 내용' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: '회의 단계' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: '참석' }),
    ).not.toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-unread-indicator="true"]'),
    ).not.toHaveLength(0);
  });

  it('회의록 목록을 페이지당 10개로 요청한다', async () => {
    let requestedSize: string | null = null;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`,
        ({ request }) => {
          requestedSize = new URL(request.url).searchParams.get('size');
          return HttpResponse.json({
            contents: [],
            pageable: {
              isEnd: true,
              page: 0,
              size: 10,
              totalElements: 0,
              totalPages: 0,
            },
          });
        },
      ),
    );

    renderPage();
    await screen.findByText('등록된 회의록이 없습니다.');
    expect(requestedSize).toBe('10');
  });

  it('학생 회의 단계와 연결되지 않는 마일스톤 필터를 제공하지 않는다', async () => {
    renderPage('/admin/meetings/?sectionId=1&milestoneId=3');

    expect(screen.queryByLabelText('마일스톤 필터')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('row', {
        name: /발표 자료 구성 논의 회의록 보기/,
      }),
    ).toBeInTheDocument();
  });

  it('분반과 팀 필터가 있는 URL은 해당 팀의 회의록만 표시한다', async () => {
    renderPage('/admin/meetings/?sectionId=1&teamId=1');

    expect(
      await screen.findByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /발표 자료 구성 논의 회의록 보기/ }),
    ).not.toBeInTheDocument();
  });

  it('필터링한 회의록을 열 때 현재 목록 필터를 상세 URL에 유지한다', async () => {
    const user = userEvent.setup();
    const { router } = renderPage('/admin/meetings/?sectionId=1&teamId=1');

    await user.click(
      await screen.findByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/meetings/1'),
    );
    expect(router.state.location.search).toMatchObject({
      sectionId: 1,
      teamId: 1,
    });
  });

  it('선택한 분반과 팀 기준의 회의록 수정 이력을 목록 아래에 표시한다', async () => {
    const user = userEvent.setup();
    renderPage('/admin/meetings/?sectionId=1&teamId=1');

    const editLogsToggle = await screen.findByRole('button', {
      name: '회의록 수정 이력 (2건)',
    });
    expect(editLogsToggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText(
        '중간 점검 피드백 반영 담당자가 실제 논의 내용과 달라 역할 분담을 바로잡았습니다.',
      ),
    ).not.toBeInTheDocument();

    await user.click(editLogsToggle);
    expect(editLogsToggle).toHaveAttribute('aria-expanded', 'true');

    expect(
      await screen.findByText(
        '중간 점검 피드백 반영 담당자가 실제 논의 내용과 달라 역할 분담을 바로잡았습니다.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(
        '발표 자료의 구성 순서가 회의에서 합의한 흐름과 달라 결정 사항에 맞게 수정했습니다.',
      ),
    ).not.toBeInTheDocument();
  });

  it('전체 분반 URL에 남은 teamId는 회의록 목록 필터에 사용하지 않는다', async () => {
    renderPage('/admin/meetings/?teamId=1');

    expect(
      await screen.findByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('row', {
        name: /발표 자료 구성 논의 회의록 보기/,
      }),
    ).toBeInTheDocument();
  });

  it('선택한 분반의 팀 드롭다운으로 회의록을 필터링한다', async () => {
    const user = userEvent.setup();
    renderPage('/admin/meetings/?sectionId=1');

    const teamFilter = await screen.findByRole('combobox', { name: '팀' });
    await user.click(teamFilter);
    await user.click(await screen.findByRole('option', { name: '2팀' }));

    expect(
      await screen.findByRole('row', {
        name: /발표 자료 구성 논의 회의록 보기/,
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it('분반 단위 회의록 화면에서 담당 교수만 전체 팀 전송을 선택할 수 있다', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_SECTION('1')}`,
        async ({ request }) => {
          expect(await request.json()).toEqual({ message: '전체 회의 안내' });
          return HttpResponse.json({ sentCount: 2 }, { status: 201 });
        },
      ),
    );
    renderPage(
      '/admin/meetings/?sectionId=1',
      demoNoticeProfessor,
      demoNoticeProfessorAccessToken,
    );

    await user.click(
      await screen.findByRole('button', { name: '일반 메시지 보내기' }),
    );
    const panel = await screen.findByRole('complementary', {
      name: '일반 메시지 작성 패널',
    });
    await user.click(within(panel).getByRole('combobox', { name: '팀' }));
    await user.click(await screen.findByRole('option', { name: '전체 팀' }));
    await user.type(
      within(panel).getByRole('textbox', { name: '일반 메시지 내용' }),
      '전체 회의 안내',
    );
    await user.click(within(panel).getByRole('button', { name: '보내기' }));
    await user.click(
      await screen.findByRole('button', { name: '전체 팀에 보내기' }),
    );

    expect(
      await within(panel).findByText(
        '전체 2개 팀에 일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.',
      ),
    ).toBeVisible();
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
  expect(await screen.findByText('2026-09-02/08:30')).toBeVisible();
});
