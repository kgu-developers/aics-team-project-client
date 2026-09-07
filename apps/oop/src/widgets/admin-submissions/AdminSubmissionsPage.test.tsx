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
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminSubmissionDetailPage from './AdminSubmissionDetailPage';
import AdminSubmissionsPage from './AdminSubmissionsPage';

import { getAdminMilestoneSubmissionDetailFixture } from '~/mocks/data/adminMilestoneSubmissionDetails';
import { getAdminMilestoneSubmissionsFixture } from '~/mocks/data/adminMilestoneSubmissions';
import { adminPresentationEvaluationsFixture } from '~/mocks/data/adminPresentationEvaluations';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';
import { adminMilestoneSubmissionDetailHandlers } from '~/mocks/handlers/adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from '~/mocks/handlers/adminMilestoneSubmissions';
import {
  adminPresentationEvaluationHandlers,
  resetPresentationEvaluationScenario,
} from '~/mocks/handlers/adminPresentationEvaluations';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';

const server = setupServer(
  ...adminMeetingHandlers,
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminPresentationEvaluationHandlers,
  ...adminSectionMilestoneHandlers,
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetPresentationEvaluationScenario();
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
    history: createMemoryHistory({
      initialEntries: [initialEntry],
    }),
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
  it('마일스톤 목록 응답의 상태와 현재 버전을 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '중간 점검' }));

    expect(
      screen.getByRole('heading', { name: '중간 점검 목록' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('상태: 피드백 제공')).toBeInTheDocument();
    expect(screen.getByText('현재 버전: 2차')).toBeInTheDocument();
    expect(screen.getByText('상태: 승인됨')).toBeInTheDocument();
  });

  it('제안서와 최종 보고서 목록에 서버 상태만 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();

    expect(await screen.findByText('상태: 제출 완료')).toBeInTheDocument();
    expect(screen.getByText('상태: 미제출')).toBeInTheDocument();

    await user.click(await screen.findByRole('tab', { name: '최종 보고서' }));

    expect(await screen.findByText('상태: 완료')).toBeInTheDocument();
    expect(screen.getByText('현재 버전: 1차')).toBeInTheDocument();
    expect(screen.getByText('OOP-01 - 2팀')).toBeInTheDocument();
    expect(screen.getByText('상태: 미제출')).toBeInTheDocument();
  });

  it('선택한 템플릿의 실제 마일스톤 ID로 목록을 조회한다', async () => {
    let requestCount = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS('101')}`,
        () => {
          requestCount += 1;
          return HttpResponse.json(getAdminMilestoneSubmissionsFixture('101'));
        },
      ),
    );
    renderPage();

    await screen.findByText('OOP-01 - 1팀');
    expect(requestCount).toBe(1);
  });

  it('상세·버전 조회 연동 전에는 상세보기를 비활성화한다', async () => {
    renderPage();

    await screen.findByText('OOP-01 - 1팀');
    expect(screen.getAllByRole('button', { name: /상세보기/ })).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: /상세보기/ })[0],
    ).toBeDisabled();
  });

  it('발표 자료 제출도 발표 마일스톤 ID로 목록을 조회한다', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS('103')}`,
        () => {
          requestCount += 1;
          return HttpResponse.json(getAdminMilestoneSubmissionsFixture('103'));
        },
      ),
    );

    renderPage();

    await user.click(
      await screen.findByRole('tab', { name: '발표 자료 제출' }),
    );

    expect(await screen.findByText('발표 순서: 1번')).toBeInTheDocument();
    expect(requestCount).toBe(1);
  });

  it('발표 평가 목록과 팀별 상세보기 링크를 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));

    expect(
      await screen.findByRole('heading', { name: '발표 평가 목록' }),
    ).toBeInTheDocument();
    expect(screen.getByText('프로젝트 완성도')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'OOP-01 - 1팀' }));

    expect(
      await screen.findByRole('heading', {
        name: 'OOP-01 - 1팀 발표 평가',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('프로젝트 완성도')).toHaveLength(1);
    expect(screen.getByText('김민준')).toBeInTheDocument();
    expect(screen.getByText('이서연')).toBeInTheDocument();
    expect(screen.getByText('박지훈')).toBeInTheDocument();
    expect(screen.getByText('최유진')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(10);
  });

  it('발표 순서 설정은 평가 기간 입력 없이 연다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));

    const settingsButton = await screen.findByRole('button', {
      name: '순서 배정 및 평가',
    });
    await waitFor(() => expect(settingsButton).toBeEnabled());
    await user.click(settingsButton);

    expect(
      await screen.findByRole('heading', { name: '발표 순서 설정' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('OOP-01 - 1팀 발표 순서')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('발표 평가 시작 시간'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('발표 평가 종료 시간'),
    ).not.toBeInTheDocument();
  });

  it('발표 순서를 발표 평가 마일스톤에 일괄 저장한다', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;

    server.use(
      http.patch(
        `${API_BASE_URL}${ENDPOINTS.SUBMISSION.PRESENTATION_ORDER('103')}`,
        async ({ request }) => {
          requestBody = await request.json();
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));

    const settingsButton = await screen.findByRole('button', {
      name: '순서 배정 및 평가',
    });
    await waitFor(() => expect(settingsButton).toBeEnabled());
    await user.click(settingsButton);
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(requestBody).toEqual({
        teamOrders: [
          { order: 1, teamId: 1 },
          { order: 2, teamId: 2 },
        ],
      }),
    );
  });

  it('발표 평가 상세 ID가 없으면 팀 이름을 링크로 표시하지 않는다', async () => {
    const user = userEvent.setup();
    const response = structuredClone(adminPresentationEvaluationsFixture);
    response.teams[1]!.submissionId = null;

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS('oop-2026-2-01')}`,
        () => HttpResponse.json(response),
      ),
    );

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '발표 평가' }));

    expect(await screen.findByText('OOP-01 - 2팀')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'OOP-01 - 2팀' }),
    ).not.toBeInTheDocument();
  });

  it('접근할 수 없는 분반의 발표 평가는 설정이나 로딩 상태보다 접근 오류를 먼저 표시한다', async () => {
    renderPage(
      '/admin/submissions?milestoneId=presentation-evaluate&sectionId=not-assigned-section',
    );

    expect(
      await screen.findByText('접근할 수 없는 분반입니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '순서 배정 및 평가' }),
    ).not.toBeInTheDocument();
  });

  it('담당하지 않은 분반의 상세 URL은 제출물 상세 요청을 보내지 않는다', async () => {
    let detailRequestCount = 0;

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSION_DETAIL('submission-oop-01-1-proposal')}`,
        () => {
          detailRequestCount += 1;
          return HttpResponse.json({});
        },
      ),
    );

    renderPage(
      '/admin/submissions/submission-oop-01-1-proposal?milestoneId=proposal&sectionId=not-assigned-section',
    );

    expect(
      await screen.findByText('접근할 수 없는 제출물입니다.'),
    ).toBeInTheDocument();
    expect(detailRequestCount).toBe(0);
  });

  it('상세 응답의 분반이 요청 분반과 다르면 학생 목록 요청을 보내지 않는다', async () => {
    let studentRequestCount = 0;
    const response = structuredClone(
      getAdminMilestoneSubmissionDetailFixture('submission-oop-01-1-proposal')!,
    );
    response.section = { id: 'unexpected-section', label: '다른 분반' };

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSION_DETAIL('submission-oop-01-1-proposal')}`,
        () => HttpResponse.json(response),
      ),
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_STUDENTS(':sectionId')}`,
        () => {
          studentRequestCount += 1;
          return HttpResponse.json([]);
        },
      ),
    );

    renderPage(
      '/admin/submissions/submission-oop-01-1-proposal?milestoneId=proposal&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByText('접근할 수 없는 제출물입니다.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(studentRequestCount).toBe(0));
  });

  it('상호 평가 목록에도 제출 상태와 버전을 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '상호 평가' }));

    expect(await screen.findByText('상태: 제출 완료')).toBeInTheDocument();
    expect(screen.getByText('상태: 미제출')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /상세보기/ })).toHaveLength(2);
  });

  it('미제출 팀의 발표 평가 상세에 다른 팀 학생을 미평가로 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-2-presentation-evaluate?milestoneId=presentation-evaluate&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', {
        name: 'OOP-01 - 2팀 발표 평가',
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('미제출')).toHaveLength(2);
    expect(screen.getAllByText('미평가')).toHaveLength(8);
  });

  it('제출된 제안서를 읽기 전용으로 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-1-proposal?milestoneId=proposal&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 제안서' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('AI 기반 팀 프로젝트 관리 서비스'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: '제안서 피드백' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('제출 상태 · 재제출 완료 · 2026/09/07'),
    ).toBeInTheDocument();
    expect(screen.getByText('김민준 · 2026/09/07')).toBeInTheDocument();
    expect(
      screen.getByText('역할 분담과 프로젝트 범위를 보완했습니다.'),
    ).toBeInTheDocument();
  });

  it('제출된 중간 점검을 읽기 전용으로 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-1-midterm?milestoneId=midterm&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 중간 점검' }),
    ).toBeInTheDocument();
    expect(screen.getByText('프로젝트 제목')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '5. 중간 점검 질문' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: '중간 점검 피드백' }),
    ).toBeInTheDocument();
    expect(screen.getByText('제출 상태 · 최초 제출')).toBeInTheDocument();
    expect(screen.getByText('김민준 · 2026/10/14')).toBeInTheDocument();
    expect(
      screen.getByText('시연 흐름과 테스트 케이스를 보완했습니다.'),
    ).toBeInTheDocument();
  });

  it('제출된 발표 자료를 읽기 전용으로 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-1-presentation-submit?milestoneId=presentation-submit&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', {
        name: 'OOP-01 - 1팀 발표 자료 제출',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'oop-01-1-presentation.pdf',
      }),
    ).toHaveAttribute('download', 'oop-01-1-presentation.pdf');
    expect(
      screen.getByRole('link', { name: 'oop-01-1-source.zip' }),
    ).toHaveAttribute('download', 'oop-01-1-source.zip');
    expect(
      screen.getByRole('link', { name: 'https://youtu.be/demo-oop-01-1' }),
    ).toHaveAttribute('href', 'https://youtu.be/demo-oop-01-1');
    expect(
      screen.getByRole('heading', { name: '시연 URL' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('3. 주요 화면')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('제출 상태 · 최초 제출')).toBeInTheDocument();
  });

  it('상세 응답의 마일스톤 이름을 주소의 임시 검색값보다 우선 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-2-presentation-submit?milestoneId=proposal&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', {
        name: '제출물 > 발표 자료 제출',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '← 발표 자료 제출 목록으로' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '시연 URL' }),
    ).toBeInTheDocument();
  });

  it('상호 평가 상세를 디자인 시스템 표로 표시하고 평가자 정보를 연다', async () => {
    const user = userEvent.setup();

    renderPage(
      '/admin/submissions/submission-oop-01-1-peer-review?milestoneId=peer-review&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 상호 평가' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '평가자' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '김민준' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '이서연' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /평균/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /평균/ })).toHaveAttribute(
      'aria-sort',
      'none',
    );
    expect(screen.getAllByText('미제출')).not.toHaveLength(0);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('30.0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '평균 점수 정렬' }));
    expect(screen.getByRole('columnheader', { name: /평균/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    await user.click(screen.getByRole('button', { name: '김민준' }));
    expect(
      await screen.findByRole('heading', { name: '김민준 평가' }),
    ).toBeInTheDocument();
  });

  it('2팀의 중간 점검도 해당 팀 정보로 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-2-midterm?milestoneId=midterm&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 2팀 중간 점검' }),
    ).toBeInTheDocument();
  });

  it('중간 점검 상세 응답을 기다리는 동안 로딩 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSION_DETAIL('submission-oop-01-1-midterm')}`,
        async () => {
          await delay(100);
          return HttpResponse.json({});
        },
      ),
    );

    renderPage(
      '/admin/submissions/submission-oop-01-1-midterm?milestoneId=midterm&sectionId=oop-2026-2-01',
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      '제출물 상세를 불러오는 중입니다.',
    );
  });

  it('존재하지 않는 중간 점검 상세는 오류 상태를 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-missing-midterm?milestoneId=midterm&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByText('제출물 상세를 불러오지 못했습니다.'),
    ).toBeInTheDocument();
  });

  it('존재하지 않는 발표 자료 상세는 오류 상태를 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-missing-presentation?milestoneId=presentation-submit&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByText('제출물 상세를 불러오지 못했습니다.'),
    ).toBeInTheDocument();
  });

  it('존재하지 않는 상호 평가 상세는 오류 상태를 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-missing-peer-review?milestoneId=peer-review&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByText('제출물 상세를 불러오지 못했습니다.'),
    ).toBeInTheDocument();
  });

  it('알 수 없는 마일스톤 키는 제출 목록 fixture에서 찾지 않는다', () => {
    expect(getAdminMilestoneSubmissionsFixture('constructor')).toBeUndefined();
  });

  it('2팀 발표 자료 상세는 2팀의 제출일과 프로젝트 내용을 사용한다', () => {
    const detail = getAdminMilestoneSubmissionDetailFixture(
      'submission-oop-01-2-presentation-submit',
    );

    expect(detail?.submittedAt).toBe('2026/11/13');
    expect(detail?.presentation?.blocks[1]?.fields[0]?.value).toContain(
      '시간표 관리',
    );
  });
});
