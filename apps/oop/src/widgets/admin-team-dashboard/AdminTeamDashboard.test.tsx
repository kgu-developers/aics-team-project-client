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
import { adminEvaluationResultHandlers } from '~/mocks/handlers/adminEvaluationResults';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';
import { adminMilestoneSubmissionDetailHandlers } from '~/mocks/handlers/adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from '~/mocks/handlers/adminMilestoneSubmissions';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';
import { adminStudentTeamHandlers } from '~/mocks/handlers/adminStudentTeams';

const server = setupServer(
  ...adminEvaluationResultHandlers,
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

function renderPage(teamId: string, sessionSectionId = '1') {
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
          id: sessionSectionId,
          name: '객체지향프로그래밍 01분반',
          role: 'ASSISTANT',
        },
      ],
    },
  });

  return render(<RouterProvider router={router} />);
}

describe('AdminTeamDashboard', () => {
  it('평가자 이름을 클릭하면 상호평가 응답을 포함한 수강생 상세를 표시한다', async () => {
    const user = userEvent.setup();

    renderPage('1');

    await user.click(
      await screen.findByRole(
        'button',
        { name: '김민준 (팀장)' },
        { timeout: 10_000 },
      ),
    );

    expect(
      await screen.findByRole('heading', { name: '김민준 정보' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('API 설계와 팀 조율을 담당했습니다.'),
    ).toBeInTheDocument();
  });

  it('분반 마일스톤마다 teamId 필터 제출 현황과 최신 버전을 연결해 표시한다', async () => {
    const requests = vi.fn();
    const meetingRequests = vi.fn();
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
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`,
        ({ request }) => {
          meetingRequests(new URL(request.url));
          return HttpResponse.json({
            contents: [
              {
                id: 1,
                authorId: '20231234',
                content: '',
                location: '강의실',
                meetingAt: '2026-09-01T00:00:00Z',
                participantCount: 2,
                phase: 'KICKOFF',
                sectionId: 1,
                sectionName: 'OOP-01',
                teamId: 1,
                teamName: '1팀',
                title: '프로젝트 킥오프',
              },
            ],
            pageable: {
              isEnd: true,
              page: 0,
              size: 3,
              totalElements: 1,
              totalPages: 1,
            },
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
    expect(
      screen.getByRole('heading', { name: '발표 평가' }),
    ).toBeInTheDocument();
    const proposalDetailLink = screen
      .getAllByRole('link', { name: '상세보기' })
      .find(link =>
        link.getAttribute('href')?.includes('milestoneId=proposal'),
      );
    expect(proposalDetailLink).toHaveAttribute(
      'href',
      expect.stringContaining('sectionId=%221%22'),
    );
    expect(proposalDetailLink).toHaveAttribute(
      'href',
      expect.stringContaining('apiSectionId='),
    );
    expect(
      await screen.findByRole('link', { name: /프로젝트 킥오프/ }),
    ).toHaveAttribute('href', expect.stringContaining('/admin/meetings/1'));
    expect(
      screen
        .getByRole('region', { name: '회의록' })
        .querySelectorAll('a[href^="/admin/meetings/"]'),
    ).toHaveLength(1);
    expect(
      screen
        .getAllByRole('link', { name: '상세보기' })
        .some(link =>
          link.getAttribute('href')?.includes('/admin/submissions/1001'),
        ),
    ).toBe(true);
    expect(
      screen.getByRole('heading', { name: '발표 평가' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'proposal-v2.pdf' }),
    ).not.toBeInTheDocument();

    await waitFor(() => expect(requests).toHaveBeenCalled());
    const requestUrls = requests.mock.calls.flat().map(String);
    expect(
      requestUrls.some(url => url.includes('/106/submissions?teamId=1')),
    ).toBe(true);
    expect(
      requestUrls.some(url => url.includes('/103/submissions?teamId=1')),
    ).toBe(true);

    await waitFor(() => expect(meetingRequests).toHaveBeenCalledOnce());
    const meetingRequestUrl = meetingRequests.mock.calls[0]?.[0] as URL;
    expect(meetingRequestUrl.searchParams.get('sectionId')).toBe('1');
    expect(meetingRequestUrl.searchParams.get('teamId')).toBe('1');
    expect(meetingRequestUrl.searchParams.get('size')).toBe('3');
  });

  it('팀 분반이 담당 분반과 다르면 종속 요청과 팀 내용을 차단한다', async () => {
    const requests: string[] = [];
    const track = ({ request }: { request: Request }) =>
      requests.push(new URL(request.url).pathname);
    server.events.on('request:start', track);
    renderPage('1', 'oop-2026-2-01');
    expect(
      await screen.findByText('이 팀에 접근할 수 없습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '김민준' }),
    ).not.toBeInTheDocument();
    expect(requests).toEqual([
      new URL(`${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM('1')}`).pathname,
    ]);
    server.events.removeListener('request:start', track);
  });

  it('2팀 대시보드에는 1팀 평가 상세 fixture를 표시하지 않는다', async () => {
    renderPage('2');

    expect(
      await screen.findByText('제출된 발표평가가 없습니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('제출된 상호평가가 없습니다.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '김민준 (팀장)' }),
    ).not.toBeInTheDocument();
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

  it('팀원의 기본 정보를 기존 관리자 상세 모달로 조회한다', async () => {
    const user = userEvent.setup();

    renderPage('1');

    await user.click(await screen.findByRole('button', { name: '김민준' }));

    expect(
      await screen.findByRole('heading', { name: '김민준 정보' }),
    ).toBeInTheDocument();
    expect(screen.getByText('20231234@example.com')).toBeInTheDocument();
    expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('컴퓨터공학과')).toBeInTheDocument();
  });
});

it('issues no dependent requests while team lookup is pending or fails', async () => {
  let release!: (response: Response) => void;
  const requests: string[] = [];
  const track = ({ request }: { request: Request }) =>
    requests.push(new URL(request.url).pathname);
  server.events.on('request:start', track);
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM('1')}`,
      () =>
        new Promise<Response>(resolve => {
          release = resolve;
        }),
    ),
  );
  try {
    renderPage('1');
    await screen.findByText('팀 정보를 불러오는 중입니다.');
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests).toEqual([ENDPOINTS.ADMIN.TEAM('1')]);
    expect(
      screen.queryByRole('button', { name: '김민준' }),
    ).not.toBeInTheDocument();
    release(HttpResponse.json({}, { status: 403 }));
    await screen.findByText('이 팀에 접근할 수 없습니다.');
    expect(requests).toEqual([ENDPOINTS.ADMIN.TEAM('1')]);
  } finally {
    server.events.removeListener('request:start', track);
  }
});
