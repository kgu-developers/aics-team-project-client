import { AstryxThemeProvider } from '@aics/design-system';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import AdminSubmissionDetailPage from './AdminSubmissionDetailPage';
import AdminSubmissionsPage from './AdminSubmissionsPage';

function renderPage() {
  const rootRoute = createRootRoute();
  const submissionsRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <AdminSubmissionsPage />
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/submissions',
  });
  const submissionDetailRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <AdminSubmissionDetailPage />
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/submissions/$submissionId',
  });
  const router = createRouter({
    history: createMemoryHistory({
      initialEntries: ['/admin/submissions?sectionId=oop-01'],
    }),
    routeTree: rootRoute.addChildren([submissionsRoute, submissionDetailRoute]),
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
    expect(screen.getAllByText('첨부 파일 수: -')).toHaveLength(2);
    expect(screen.getAllByText('피드백: -')).toHaveLength(2);
  });

  it('상세보기에서 선택한 마일스톤 이름을 유지한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(await screen.findByRole('tab', { name: '최종 보고서' }));
    await user.click(screen.getAllByRole('link', { name: '상세보기' })[0]!);

    expect(
      await screen.findByRole('heading', { name: '최종 보고서 상세보기' }),
    ).toBeInTheDocument();
  });
});
