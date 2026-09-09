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

import AdminSubmissionDetailPage from './AdminSubmissionDetailPage';
import AdminSubmissionsPage from './AdminSubmissionsPage';

import {
  getAdminMilestoneSubmissionsFixture,
  resetAdminMilestoneSubmissionsFixture,
  updatePresentationOrderFixture,
} from '~/mocks/data/adminMilestoneSubmissions';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMilestoneSubmissionDetailHandlers } from '~/mocks/handlers/adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from '~/mocks/handlers/adminMilestoneSubmissions';
import { adminPresentationEvaluationHandlers } from '~/mocks/handlers/adminPresentationEvaluations';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';

const server = setupServer(
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminPresentationEvaluationHandlers,
  ...adminSectionMilestoneHandlers,
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetAdminMilestoneSubmissionsFixture();
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

  it('중간 점검의 현재 버전과 버전 이력을 일치하게 표시한다', async () => {
    const user = userEvent.setup();

    renderPage(
      '/admin/submissions/1003?milestoneId=midterm&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findAllByText(
        (_, element) =>
          element?.textContent?.includes('현재 버전: 2차') ?? false,
      ),
    ).not.toHaveLength(0);
    expect(
      screen.getByRole('button', { name: /2차 · 20230001/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /1차 · 20230001/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /1차 · 20230001/ }));
    expect(
      await screen.findByText('초기 중간 점검 결과입니다.'),
    ).toBeInTheDocument();
  });

  it('중간 점검 2팀의 제출 상세와 버전 정보를 표시한다', async () => {
    renderPage(
      '/admin/submissions/1004?milestoneId=midterm&sectionId=oop-2026-2-01',
    );

    expect(
      await screen.findByRole('heading', { name: 'OOP-01 - 2팀 제출물' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'midterm-team-2.pdf' }),
    ).toHaveAttribute('download', 'midterm-team-2.pdf');
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
    expect(screen.getByRole('link', { name: '일괄 다운로드' })).toHaveAttribute(
      'href',
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION_DOWNLOAD('1005')}`,
    );
    expect(
      screen.getByRole('button', { name: '일괄 다운로드' }),
    ).toBeDisabled();
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
    expect(screen.getByRole('link', { name: '일괄 다운로드' })).toHaveAttribute(
      'href',
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION_DOWNLOAD('1008')}`,
    );
    expect(
      screen.queryByRole('link', { name: '상세보기' }),
    ).not.toBeInTheDocument();
  });

  it('상호 평가는 전용 표 조회 계약 전까지 범용 버전 상세로 이동하지 않는다', async () => {
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('tab', { name: '상호 평가' }));

    const detailButtons = await screen.findAllByTitle(
      '이 마일스톤의 전용 상세 조회 API 확인 후 제공 예정입니다.',
    );
    expect(detailButtons).not.toHaveLength(0);
    detailButtons.forEach(button => expect(button).toBeDisabled());
  });

  it('알 수 없는 마일스톤 키는 제출 목록 fixture에서 찾지 않는다', () => {
    expect(getAdminMilestoneSubmissionsFixture('constructor')).toBeUndefined();
  });

  it('발표 순서 fixture는 초기화 후 원래 순서로 돌아온다', () => {
    updatePresentationOrderFixture([
      { order: 2, teamId: 11 },
      { order: 1, teamId: 12 },
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
