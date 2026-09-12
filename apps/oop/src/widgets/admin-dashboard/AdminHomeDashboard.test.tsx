import { AstryxThemeProvider } from '@aics/design-system';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminHomeDashboard from './AdminHomeDashboard';

import { demoAdmin } from '~/mocks/data/users';

vi.mock('~/features/admin-meeting/queries', () => ({
  useAdminMeetingRecordListQuery: () => ({
    data: {
      contents: [
        {
          authorId: '20260001',
          content: '발표 자료의 핵심 흐름과 역할을 확정한다.',
          id: 2,
          location: '온라인',
          meetingAt: '2026-10-08 00:00',
          participantCount: 2,
          phase: 'MID_CHECK',
          sectionId: 1,
          sectionName: 'OOP-01',
          teamId: 12,
          teamName: '2팀',
        },
      ],
      pageable: {
        isEnd: true,
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      },
    },
    isError: false,
    isPending: false,
  }),
}));

vi.mock('~/features/admin-milestone-review/queries', () => ({
  useAdminAccessibleSectionMilestonesQuery: () => [],
}));

vi.mock('~/features/admin-notices/queries', () => ({
  useAdminNoticesQuery: () => ({
    data: { notices: [] },
    isError: false,
    isPending: false,
  }),
}));

function renderPage() {
  const rootRoute = createRootRoute();
  const homeRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <AdminHomeDashboard />
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin',
  });
  const meetingsRoute = createRoute({
    component: () => <div>회의록 목록</div>,
    getParentRoute: () => rootRoute,
    path: '/admin/meetings',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/admin'] }),
    routeTree: rootRoute.addChildren([homeRoute, meetingsRoute]),
  });

  useAuthStore.setState({ currentUser: demoAdmin });
  return render(<RouterProvider router={router} />);
}

describe('AdminHomeDashboard', () => {
  it('현재 회의록 목록 계약의 contents를 홈 위젯에 표시한다', async () => {
    renderPage();

    expect(
      await screen.findByText('발표 자료의 핵심 흐름과 역할을 확정한다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('OOP-01 · 2팀')).toBeInTheDocument();
    expect(screen.getByText('2026-10-08')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: '발표 자료의 핵심 흐름과 역할을 확정한다.',
      }),
    ).toHaveAttribute('href', '/admin/meetings');
    expect(
      screen.queryByText('등록된 회의록이 없습니다.'),
    ).not.toBeInTheDocument();
  });
});
