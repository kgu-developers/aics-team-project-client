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
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminSubmissionDetailPage from './AdminSubmissionDetailPage';
import AdminSubmissionsPage from './AdminSubmissionsPage';

import { resetMockSessionState } from '~/mocks/authSession';
import {
  getAdminMilestoneSubmissionsFixture,
  resetAdminMilestoneSubmissionsFixture,
  updatePresentationOrderFixture,
} from '~/mocks/data/adminMilestoneSubmissions';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminEvaluationResultHandlers } from '~/mocks/handlers/adminEvaluationResults';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';
import {
  adminMidReportHandlers,
  resetAdminMidReportScenario,
} from '~/mocks/handlers/adminMidReports';
import { adminMilestoneSubmissionDetailHandlers } from '~/mocks/handlers/adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from '~/mocks/handlers/adminMilestoneSubmissions';
import {
  adminPresentationEvaluationHandlers,
  resetPresentationEvaluationScenario,
} from '~/mocks/handlers/adminPresentationEvaluations';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';
import { createTeamMessageHandlers } from '~/mocks/handlers/teamMessages';

const server = setupServer(
  ...adminMeetingHandlers,
  ...adminMidReportHandlers,
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminPresentationEvaluationHandlers,
  ...adminEvaluationResultHandlers,
  ...adminSectionMilestoneHandlers,
  ...createTeamMessageHandlers(),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockSessionState());
afterEach(() => {
  resetAdminMilestoneSubmissionsFixture();
  resetAdminMidReportScenario();
  resetPresentationEvaluationScenario();
  resetMockSessionState();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
  server.resetHandlers();
});
afterAll(() => server.close());

function renderPage(
  initialEntry = '/admin/submissions?sectionId=oop-2026-2-01',
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  const rootRoute = createRootRoute();
  const submissionsRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminSubmissionsPage />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/submissions',
  });
  const submissionDetailRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminSubmissionDetailPage />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/submissions/$submissionId',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([submissionsRoute, submissionDetailRoute]),
  });

  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: demoAdmin,
  });

  return render(<RouterProvider router={router} />);
}

describe('AdminSubmissionsPage', () => {
  it('제안서 목록에 팀별 프로젝트 주제를 표시한다', async () => {
    renderPage();

    expect(
      await screen.findByText('프로젝트 주제: AI 기반 팀 프로젝트 관리 서비스'),
    ).toBeInTheDocument();
    expect(screen.getByText('프로젝트 주제: -')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '회의록 1건' })).toHaveAttribute(
      'href',
      '/admin/meetings?sectionId=oop-2026-2-01&teamId=%221%22',
    );
    expect(screen.getByRole('link', { name: '회의록 0건' })).toHaveAttribute(
      'href',
      '/admin/meetings?sectionId=oop-2026-2-01&teamId=%222%22',
    );
  });

  it('제안서와 중간 점검 목록은 왼쪽에 상태와 제출 정보를 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '중간 점검' }));

    expect(await screen.findByText('피드백 제공')).toBeInTheDocument();
    expect(await screen.findByText('2026.10.14 18:00')).toBeInTheDocument();
    expect(screen.getByText('제출자: 20230001')).toBeInTheDocument();
    expect(screen.queryByText('현재 버전: 2차')).not.toBeInTheDocument();
  });

  it('제출 팀은 상세보기로 이동하고 미제출 팀은 상세보기가 비활성화된다', async () => {
    const user = userEvent.setup();

    renderPage();

    const detailLink = await screen.findByRole('link', { name: '상세보기' });
    expect(screen.getByRole('button', { name: '상세보기' })).toBeDisabled();

    await user.click(detailLink);
    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 제출물' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: '연결된 회의록 (1건)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '프로젝트 킥오프' }),
    ).toHaveAttribute('href', '/admin/meetings/1');
  });

  it('제안서와 중간 점검 상세에서 현재 제출물에 연결된 피드백을 회의록보다 먼저 표시한다', async () => {
    const user = userEvent.setup();
    const midReportFeedbackRequest = vi.fn();

    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('oop-2026-2-01', '1')}/feedback`,
        async ({ request }) => {
          midReportFeedbackRequest(await request.json());
          return HttpResponse.json({
            createdAt: '2026-09-13 16:00',
            message: '중간보고서 수정 요청을 전송합니다.',
            messageId: 702,
            midReportId: 401,
            senderId: demoAdmin.id,
            senderName: demoAdmin.name,
            teamId: 1,
          });
        },
      ),
    );

    renderPage(
      '/admin/submissions/1001?milestoneId=proposal&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: '제안서 피드백' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('제안서의 문제 정의와 구현 범위를 보완해 주세요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('다른 제안서 제출물에 연결된 피드백입니다.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '연결된 회의록 (1건)' }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: '제안서 피드백 내용' }),
      '제안서 피드백을 상세 화면에서 바로 보냅니다.',
    );
    await user.click(screen.getByRole('button', { name: '피드백 보내기' }));
    expect(
      await screen.findByText('제안서 피드백을 상세 화면에서 바로 보냅니다.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: '제안서 목록으로' }));
    await user.click(await screen.findByRole('tab', { name: '중간 점검' }));
    const midtermDetailLinks = await screen.findAllByRole('link', {
      name: '상세보기',
    });
    await user.click(midtermDetailLinks[0]!);

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 중간보고서' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('GUI 화면 흐름과 예외 처리 계획을 보완해 주세요.'),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: '중간 점검 피드백 내용' }),
      '중간보고서 수정 요청을 전송합니다.',
    );
    await user.click(screen.getByRole('button', { name: '수정 요청 보내기' }));
    await waitFor(() =>
      expect(midReportFeedbackRequest).toHaveBeenCalledWith({
        message: '중간보고서 수정 요청을 전송합니다.',
      }),
    );
  });

  it('연결된 회의록이 여러 페이지면 다음 페이지를 조회한다', async () => {
    const user = userEvent.setup();
    const requestedPages = vi.fn();

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`,
        ({ request }) => {
          const page = Number(
            new URL(request.url).searchParams.get('page') ?? '0',
          );
          requestedPages(page);

          return HttpResponse.json({
            contents: [
              {
                authorId: '20230001',
                content: '',
                id: page === 0 ? 1 : 2,
                location: null,
                meetingAt: '2026-10-01 00:00',
                participantCount: 2,
                phase: 'PROPOSAL',
                sectionId: 1,
                sectionName: 'OOP-01',
                teamId: 1,
                teamName: '1팀',
                title: page === 0 ? '첫 번째 회의록' : '두 번째 회의록',
              },
            ],
            pageable: {
              isEnd: page === 1,
              page,
              size: 100,
              totalElements: 101,
              totalPages: 2,
            },
          });
        },
      ),
    );

    renderPage(
      '/admin/submissions/1001?milestoneId=proposal&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('link', { name: '첫 번째 회의록' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(
      await screen.findByRole('link', { name: '두 번째 회의록' }),
    ).toBeInTheDocument();
    expect(requestedPages).toHaveBeenCalledWith(0);
    expect(requestedPages).toHaveBeenCalledWith(1);
  });

  it('제출 버전과 아티팩트를 서버 계약 기준으로 표시하고 이전 버전을 선택한다', async () => {
    const user = userEvent.setup();

    renderPage(
      '/admin/submissions/1001?milestoneId=proposal&sectionId=oop-2026-2-01',
    );

    expect(await screen.findByText('보완된 제안서')).toBeInTheDocument();
    expect(screen.getByText('피드백 반영')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'proposal-v2.pdf' }),
    ).toHaveAttribute('download', 'proposal-v2.pdf');
    expect(
      screen.getByRole('link', {
        name: 'https://github.com/kgu-developers/example',
      }),
    ).toHaveAttribute('target', '_blank');

    await user.click(screen.getByRole('button', { name: /1차 · 20230001/ }));

    expect(
      await screen.findByText('초기 제안서 내용입니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'proposal-v1.pdf' }),
    ).toHaveAttribute('download', 'proposal-v1.pdf');
  });

  it('버전 목록 순서와 관계없이 현재 버전을 먼저 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION_VERSIONS('1001')}`,
        () =>
          HttpResponse.json({
            contents: [
              {
                description: '초기 제안서',
                late: false,
                submittedAt: '2026-09-01T09:00:00Z',
                submittedBy: '20230001',
                version: 1,
              },
              {
                changeNote: '피드백 반영',
                description: '보완된 제안서',
                late: false,
                submittedAt: '2026-09-07T09:00:00Z',
                submittedBy: '20230001',
                version: 2,
              },
            ],
          }),
      ),
    );

    renderPage(
      '/admin/submissions/1001?milestoneId=proposal&sectionId=oop-2026-2-01',
    );

    expect(await screen.findByText('보완된 제안서')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'proposal-v2.pdf' }),
    ).toBeInTheDocument();
  });

  it('중간 점검은 팀 식별자로 전용 조회 API의 블록과 제출 상태를 표시한다', async () => {
    renderPage(
      '/admin/submissions/1003?milestoneId=midterm&sectionId=oop-2026-2-01&teamId=1',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 중간보고서' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/상태: SUBMITTED · 현재 버전: 1차/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '3. 핵심 로직/엔진 설계' }),
    ).toBeInTheDocument();
  });

  it('중간 점검 2팀을 팀 식별자로 분리해 조회한다', async () => {
    renderPage(
      '/admin/submissions/1004?milestoneId=midterm&sectionId=oop-2026-2-01&teamId=2',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 2팀 중간보고서' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'PRE' &&
          element.textContent?.includes('캠퍼스 학습 일정 관리 서비스'),
      ),
    ).toBeInTheDocument();
  });

  it('담당하지 않은 분반의 상세 URL은 서버 요청을 보내지 않는다', async () => {
    let detailRequestCount = 0;
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION('1001')}`, () => {
        detailRequestCount += 1;
        return HttpResponse.json({});
      }),
    );

    renderPage(
      '/admin/submissions/1001?milestoneId=proposal&sectionId=not-assigned-section',
    );

    expect(
      await screen.findByText('접근할 수 없는 제출물입니다.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(detailRequestCount).toBe(0));
  });

  it('최종 보고서는 상세보기 대신 제출물 ZIP 다운로드를 제공한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '최종 보고서' }));

    expect(await screen.findByText('OOP-01 - 2팀')).toBeInTheDocument();
    expect(screen.getByText('미제출')).toBeInTheDocument();
    const finalDownloadButtons = screen.getAllByRole('button', {
      name: '일괄 다운로드',
    });
    expect(finalDownloadButtons[0]).toBeEnabled();
    expect(finalDownloadButtons[1]).toBeDisabled();
    expect(
      await screen.findByRole('link', { name: 'final-report.pdf' }),
    ).toHaveAttribute('download', 'final-report.pdf');
    expect(
      screen.getByRole('link', { name: 'final-deliverable.zip' }),
    ).toHaveAttribute('download', 'final-deliverable.zip');
    expect(screen.getByText('현재 버전: 1차')).toBeInTheDocument();
    expect(screen.getByText('제출자: 20230001')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '상세보기' }),
    ).not.toBeInTheDocument();
  });

  it('발표 자료 제출은 현재 파일과 발표 순서를 표시하고 ZIP 다운로드만 제공한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(
      await screen.findByRole('tab', { name: '발표 자료 제출' }),
    );

    expect(await screen.findByText('현재 버전: 1차')).toBeInTheDocument();
    expect(screen.getByText('발표 순서: 1번')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'presentation.pdf' }),
    ).toHaveAttribute('download', 'presentation.pdf');
    expect(
      screen.getByRole('link', { name: 'presentation-demo.zip' }),
    ).toHaveAttribute('download', 'presentation-demo.zip');
    expect(
      screen.getByRole('link', { name: 'https://youtu.be/demo-oop-01-1' }),
    ).toHaveAttribute('target', '_blank');
    const presentationDownloadButtons = screen.getAllByRole('button', {
      name: '일괄 다운로드',
    });
    expect(presentationDownloadButtons[0]).toBeEnabled();
    expect(presentationDownloadButtons[1]).toBeDisabled();
    expect(
      screen.queryByRole('link', { name: '상세보기' }),
    ).not.toBeInTheDocument();
  });

  it('발표 평가 마일스톤을 찾아 순서 설정을 제공한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));

    const settingsButton = await screen.findByRole('button', {
      name: '순서 배정 및 평가',
    });
    await waitFor(() => expect(settingsButton).toBeEnabled());

    await user.click(screen.getByRole('button', { name: '순서 배정 및 평가' }));
    expect(
      await screen.findByRole('heading', { name: '발표 순서 설정' }),
    ).toBeInTheDocument();
  });

  it('발표 평가 설정에서 분반별 평가 항목을 조회하고 생성한다', async () => {
    const user = userEvent.setup();
    const createRequest = vi.fn();

    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('oop-2026-2-01')}`,
        async ({ request }) => {
          createRequest(await request.json());
          return HttpResponse.json({ id: 4 }, { status: 201 });
        },
      ),
    );

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));
    await user.click(
      await screen.findByRole('button', { name: '순서 배정 및 평가' }),
    );

    expect(await screen.findByText('프로젝트 완성도')).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: /평가 항목명/ }),
      '문제 해결 과정',
    );
    await user.type(screen.getByRole('spinbutton', { name: '배점' }), '20');
    await user.click(screen.getByRole('button', { name: '평가 항목 추가' }));

    await waitFor(() =>
      expect(createRequest).toHaveBeenCalledWith({
        displayOrder: 3,
        maxScore: 20,
        title: '문제 해결 과정',
      }),
    );
  });

  it('발표 평가 목록에서 팀을 선택하면 평가자별 결과와 회의록을 조회한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));
    await user.click(
      await screen.findByRole('button', { name: 'OOP-01 - 1팀' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'OOP-01 - 1팀 발표 평가 결과',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('테스트 평가자')).toBeInTheDocument();
    expect(
      screen.getByText(/OOP-01 - 1팀 프로젝트 킥오프/),
    ).toBeInTheDocument();
  });

  it('발표 자료 제출 fixture의 최신 버전을 조회한다', async () => {
    renderPage(
      '/admin/submissions/1011?milestoneId=presentation-submit&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 제출물' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'presentation.pdf' }),
    ).toHaveAttribute('download', 'presentation.pdf');
  });

  it('상호 평가 목록에서 팀별 결과 상세로 이동한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '상호 평가' }));

    const teamLink = await screen.findByRole('link', {
      name: 'OOP-01 - 1팀',
    });
    expect(teamLink).toHaveAttribute(
      'href',
      '/admin/evaluations/peer/teams/1?formId=501&sectionId=oop-2026-2-01',
    );
  });

  it('알 수 없는 마일스톤 키는 제출 목록 fixture에서 찾지 않는다', () => {
    expect(getAdminMilestoneSubmissionsFixture('constructor')).toBeUndefined();
  });

  it('발표 순서 fixture는 초기화 후 원래 순서로 돌아온다', () => {
    updatePresentationOrderFixture([
      { order: 2, teamId: 1 },
      { order: 1, teamId: 2 },
    ]);

    expect(
      getAdminMilestoneSubmissionsFixture('103')?.contents[0]
        ?.presentationOrder,
    ).toBe(2);

    resetAdminMilestoneSubmissionsFixture();

    expect(
      getAdminMilestoneSubmissionsFixture('103')?.contents[0]
        ?.presentationOrder,
    ).toBe(1);
  });
});
