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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminSubmissionDetailPage from './AdminSubmissionDetailPage';
import AdminSubmissionsPage from './AdminSubmissionsPage';

import { adminPresentationEvaluationsFixture } from '~/mocks/data/adminPresentationEvaluations';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMilestoneSubmissionDetailHandlers } from '~/mocks/handlers/adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from '~/mocks/handlers/adminMilestoneSubmissions';
import { adminPresentationEvaluationHandlers } from '~/mocks/handlers/adminPresentationEvaluations';

const server = setupServer(
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminPresentationEvaluationHandlers,
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
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
  it('마일스톤 탭에 맞는 제출 목록 요약을 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '중간 점검' }));

    expect(
      screen.getByRole('heading', { name: '중간 점검 목록' }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText('첨부 파일 수: -')).toHaveLength(2);
    expect(screen.getAllByText('피드백: -')).toHaveLength(2);
  });

  it('제출 완료된 상세보기에서 선택한 마일스톤 이름을 유지한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '중간 점검' }));
    await user.click(screen.getAllByRole('link', { name: '상세보기' })[0]!);

    expect(
      await screen.findByRole('heading', { name: '중간 점검 상세보기' }),
    ).toBeInTheDocument();
  });

  it('최종 보고서 PDF와 ZIP 다운로드 링크를 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '최종 보고서' }));

    expect(screen.getAllByRole('link', { name: 'PDF 다운로드' })).toHaveLength(
      2,
    );
    expect(screen.getAllByRole('link', { name: 'ZIP 다운로드' })).toHaveLength(
      2,
    );
    expect(
      screen.getAllByRole('link', { name: 'PDF 다운로드' })[0],
    ).toHaveAttribute('download', 'oop-01-1-final-report.pdf');
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
    expect(screen.getAllByText('-')).toHaveLength(8);
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

  it('상호 평가 제출자 수에 따라 상세보기를 활성화한다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '상호 평가' }));

    expect(await screen.findByText('제출자 수: 1 / 2')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '상세보기' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '상세보기' })).toHaveLength(1);
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
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('제출된 중간 점검을 읽기 전용으로 표시한다', async () => {
    renderPage(
      '/admin/submissions/submission-oop-01-1-midterm?milestoneId=midterm&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 1팀 중간 점검' }),
    ).toBeInTheDocument();
    expect(screen.getByText('중점 시연 기능')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
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
    expect(screen.getByText('oop-01-1-presentation.pdf')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'https://youtu.be/demo-oop-01-1' }),
    ).toHaveAttribute('href', 'https://youtu.be/demo-oop-01-1');
    expect(screen.getByText('3. 주요 화면')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
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
      screen.getByRole('columnheader', { name: '평균' }),
    ).toBeInTheDocument();

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
});
