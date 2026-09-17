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
import { createProjectProposalFixture } from '~/mocks/data/projectProposal';
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
  http.get(
    `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM(':teamId')}`,
    () => HttpResponse.json({ code: 'PROJECT_NOT_FOUND' }, { status: 404 }),
  ),
  ...adminMeetingHandlers,
  ...adminMidReportHandlers,
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminEvaluationResultHandlers,
  ...adminPresentationEvaluationHandlers,
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

function renderPage(initialEntry = '/admin/submissions?sectionId=1') {
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
    validateSearch: search =>
      search as { milestoneId?: string; sectionId?: string },
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
    validateSearch: search =>
      search as { milestoneId?: string; sectionId?: string; teamId?: string },
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
  it.each(['2026-09-13T10:00:00'])(
    '제출 완료된 제안서는 일반 제출 버전 없이도 프로젝트 문서·이미지를 조회하며 전송 실패 시 입력을 유지한다 (%s)',
    async completedAt => {
      const project = {
        ...createProjectProposalFixture(),
        teamId: 1,
        teamOperation: {
          ...createProjectProposalFixture().teamOperation,
          id: 1,
        },
        proposalCompletedAt: completedAt,
        screenConfiguration: [
          {
            title: '도서 검색',
            description: '제출한 화면',
            imageFileId: 41,
            imageUrl: 'https://example.test/screen.png',
          },
        ],
      };
      const response = getAdminMilestoneSubmissionsFixture('101')!;
      response.contents[0] = {
        ...response.contents[0]!,
        currentVersion: 0,
        status: 'NOT_SUBMITTED',
      };
      server.use(
        http.get(
          `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS('101')}`,
          () => HttpResponse.json(response),
        ),
        http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION('1001')}`, () =>
          HttpResponse.json(response.contents[0]),
        ),
        http.get(
          `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('1')}`,
          () => HttpResponse.json(project),
        ),
      );
      const user = userEvent.setup();
      renderPage();
      await user.click(await screen.findByRole('link', { name: '상세보기' }));
      expect(
        await screen.findByRole('heading', { name: project.title }),
      ).toBeVisible();
      expect(screen.getByText(project.goal)).toBeVisible();
      expect(screen.getByRole('img', { name: '도서 검색' })).toHaveAttribute(
        'src',
        'https://example.test/screen.png',
      );
      expect(screen.getByText(/제출 완료 ·/)).toBeVisible();
      expect(
        screen.queryByText('표시할 제출 버전이 없습니다.'),
      ).not.toBeInTheDocument();
      const posted = vi.fn();
      server.use(
        http.post(
          `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_PROPOSAL('1', '1')}/feedback`,
          async ({ request }) => {
            posted(await request.json());
            return HttpResponse.json(
              {
                code: 'DATA_CONFLICT',
                message: '요청이 기존 데이터와 충돌합니다.',
              },
              { status: 409 },
            );
          },
        ),
      );
      await user.type(
        screen.getByRole('textbox', { name: '제안서 피드백 내용' }),
        '예외 처리를 보완해 주세요.',
      );
      await user.click(screen.getByRole('button', { name: '피드백 보내기' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        '피드백을 보내지 못했습니다.',
      );
      expect(posted).toHaveBeenCalledExactlyOnceWith({
        message: '예외 처리를 보완해 주세요.',
      });
      expect(
        screen.getByRole('textbox', { name: '제안서 피드백 내용' }),
      ).toHaveValue('예외 처리를 보완해 주세요.');
    },
  );

  it('저장한 발표 순서를 설정 창 재진입 후에도 제출 목록 API에서 복원한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));
    const open = await screen.findByRole('button', {
      name: '순서 배정 및 평가',
    });
    await waitFor(() => expect(open).toBeEnabled());
    await user.click(open);
    await user.click(
      screen.getByRole('combobox', { name: 'OOP-01 - 1팀 발표 순서' }),
    );
    await user.click(screen.getByRole('option', { name: '2번' }));
    await user.click(
      screen.getByRole('combobox', { name: 'OOP-01 - 2팀 발표 순서' }),
    );
    await user.click(screen.getByRole('option', { name: '1번' }));
    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await user.click(open);
    expect(
      screen.getByRole('combobox', { name: 'OOP-01 - 1팀 발표 순서' }),
    ).toHaveTextContent('2번');
    expect(
      screen.getByRole('combobox', { name: 'OOP-01 - 2팀 발표 순서' }),
    ).toHaveTextContent('1번');
  });

  it('발표 평가 결과 Excel 다운로드 버튼을 표시하지 않는다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));

    expect(
      screen.queryByRole('button', { name: '엑셀 다운로드' }),
    ).not.toBeInTheDocument();
  });

  it('제안서 목록에 팀별 프로젝트 주제를 표시한다', async () => {
    renderPage();

    expect(
      await screen.findByText('프로젝트 주제: AI 기반 팀 프로젝트 관리 서비스'),
    ).toBeInTheDocument();
    expect(screen.getByText('프로젝트 주제: -')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '회의록 1건' })).toHaveAttribute(
      'href',
      '/admin/meetings?sectionId=%221%22&teamId=%221%22',
    );
    expect(screen.getByRole('link', { name: '회의록 0건' })).toHaveAttribute(
      'href',
      '/admin/meetings?sectionId=%221%22&teamId=%222%22',
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
      screen.getByRole('row', { name: /프로젝트 킥오프 회의록 보기/ }),
    ).toHaveAttribute('tabindex', '0');
  });

  it('제안서와 중간 점검 상세에서 현재 제출물에 연결된 피드백을 회의록보다 먼저 표시한다', async () => {
    const user = userEvent.setup();
    const midReportFeedbackRequest = vi.fn();
    const proposalFeedbacks = [
      {
        createdAt: '2026-09-01 09:30',
        message: '제안서의 문제 정의와 구현 범위를 보완해 주세요.',
        messageId: 710,
        projectId: 1001,
        senderId: demoAdmin.studentNumber,
        senderName: demoAdmin.name,
      },
    ];

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_PROPOSAL('1', '1')}/feedbacks`,
        () =>
          HttpResponse.json({
            contents: proposalFeedbacks,
            pageable: {
              isEnd: true,
              page: 0,
              size: 100,
              totalElements: proposalFeedbacks.length,
              totalPages: 1,
            },
          }),
      ),
      http.post(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_PROPOSAL('1', '1')}/feedback`,
        async ({ request }) => {
          const body = (await request.json()) as { message: string };
          const feedback = {
            createdAt: '2026-09-13 16:00',
            message: body.message,
            messageId: 713,
            projectId: 1001,
            senderId: demoAdmin.studentNumber,
            senderName: demoAdmin.name,
            teamId: 1,
          };
          proposalFeedbacks.push(feedback);
          return HttpResponse.json(feedback);
        },
      ),
      http.get(
        `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('1')}`,
        () => {
          const project = createProjectProposalFixture();
          return HttpResponse.json({
            ...project,
            id: 1001,
            teamId: 1,
            teamOperation: { ...project.teamOperation, id: 1 },
          });
        },
      ),
      http.post(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('1', '1')}/feedback`,
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

    renderPage('/admin/submissions/1001?milestoneId=proposal&sectionId=1');

    expect(
      await screen.findByRole('heading', { name: '제안서 피드백' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('제안서의 문제 정의와 구현 범위를 보완해 주세요.'),
    ).toBeInTheDocument();
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
    expect(
      await screen.findByRole('heading', { name: '연결된 회의록 (1건)' }),
    ).toBeInTheDocument();
    const midReportFeedbackHeading = screen.getByRole('heading', {
      name: '중간 점검 피드백',
    });
    const midReportMeetingsHeading = screen.getByRole('heading', {
      name: '연결된 회의록 (1건)',
    });
    expect(
      midReportFeedbackHeading.compareDocumentPosition(
        midReportMeetingsHeading,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

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

    renderPage('/admin/submissions/1001?milestoneId=proposal&sectionId=1');

    expect(
      await screen.findByRole('row', { name: /첫 번째 회의록 회의록 보기/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(
      await screen.findByRole('row', { name: /두 번째 회의록 회의록 보기/ }),
    ).toBeInTheDocument();
    expect(requestedPages).toHaveBeenCalledWith(0);
    expect(requestedPages).toHaveBeenCalledWith(1);
  });

  it('제출 버전과 아티팩트를 서버 계약 기준으로 표시하고 이전 버전을 선택한다', async () => {
    const user = userEvent.setup();

    renderPage('/admin/submissions/1001?milestoneId=proposal&sectionId=1');

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
                submittedAt: '2026-09-07T23:30:00Z',
                submittedBy: '20230001',
                version: 2,
              },
            ],
          }),
      ),
    );

    renderPage('/admin/submissions/1001?milestoneId=proposal&sectionId=1');

    expect(await screen.findByText('보완된 제안서')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /2차 · 20230001 · 2026.09.08 08:30/ }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'proposal-v2.pdf' }),
    ).toBeInTheDocument();
  });

  it('중간 점검은 팀 식별자로 전용 조회 API의 블록과 제출 상태를 표시한다', async () => {
    renderPage(
      '/admin/submissions/1003?milestoneId=midterm&sectionId=1&teamId=1',
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
      '/admin/submissions/1004?milestoneId=midterm&sectionId=1&teamId=2',
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
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
        () =>
          HttpResponse.json({
            contents: [
              {
                displayOrder: 0,
                id: 1,
                maxScore: 5,
                title: '프로젝트 완성도',
              },
              {
                displayOrder: 1,
                id: 2,
                maxScore: 5,
                title: '기능 구성과 구현',
              },
              {
                displayOrder: 2,
                id: 3,
                maxScore: 5,
                title: '발표 전달력',
              },
            ],
          }),
      ),
      http.post(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
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

    expect(
      await screen.findByText(/프로젝트 완성도 · 5점/),
    ).toBeInTheDocument();

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

  it('발표 평가 목록의 팀 행은 결과 상세로 이동할 수 있게 표시한다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));
    expect(
      await screen.findByRole('row', { name: /OOP-01 - 1팀 발표 평가 보기/ }),
    ).toHaveAttribute('tabindex', '0');
  });

  it('발표 자료 제출 fixture의 최신 버전을 조회한다', async () => {
    renderPage(
      '/admin/submissions/1011?milestoneId=presentation-submit&sectionId=1',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 제출물' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'presentation.pdf' }),
    ).toHaveAttribute('download', 'presentation.pdf');
  });

  it('상호 평가 목록의 팀 행은 결과 상세로 이동할 수 있게 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '상호 평가' }));

    expect(
      await screen.findByRole('row', { name: /OOP-01 - 1팀 상호평가 보기/ }),
    ).toHaveAttribute('tabindex', '0');
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
