import type { AdminSectionMilestoneDto } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminHomeDashboard from './AdminHomeDashboard';

import { demoAdmin } from '~/mocks/data/users';

const dashboardState = vi.hoisted(() => ({
  meetingContent: '',
  milestones: [] as AdminSectionMilestoneDto[],
  noticeError: false,
  noticeScopeStatus: 'ready',
  notices: [] as {
    id: number;
    sectionId: number;
    title: string;
    content: string;
    publishedAt: string;
  }[],
}));
beforeEach(() => {
  dashboardState.meetingContent = '발표 자료의 핵심 흐름과 역할을 확정한다.';
  dashboardState.milestones = [];
  dashboardState.noticeError = false;
  dashboardState.noticeScopeStatus = 'ready';
  dashboardState.notices = [
    {
      id: 10,
      sectionId: 1,
      title: '계약 공지',
      content: '본문',
      publishedAt: '2026-09-14T15:30:00Z',
    },
  ];
});
afterEach(() => useAuthStore.setState({ currentUser: null }));

vi.mock('~/features/admin-meeting/queries', () => ({
  useAdminMeetingRecordListQuery: () => ({
    data: {
      contents: [
        {
          authorId: '20260001',
          content: dashboardState.meetingContent,
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

vi.mock('~/features/admin-message/queries', () => ({
  useAdminMessagesQuery: () => ({
    data: {
      contents: [
        {
          createdAt: '2026-10-09 10:00',
          id: 1,
          message: '제안서 보완 사항을 확인해 주세요.',
          read: false,
          sectionId: 1,
          sectionName: '객체지향프로그래밍',
          teamId: 7,
          teamName: '1팀',
        },
      ],
      unreadCount: 1,
    },
    isError: false,
    isPending: false,
  }),
}));

vi.mock('~/features/admin-milestone-review/queries', () => ({
  useAdminAccessibleSectionMilestonesQuery: (sectionIds: string[]) =>
    sectionIds.map(() => ({
      data: { content: dashboardState.milestones },
      isError: false,
      isPending: false,
    })),
}));

vi.mock('~/features/admin-notices/queries', () => ({
  useAdminAccessibleNoticesQuery: () => ({
    data: dashboardState.notices,
    isError: dashboardState.noticeError,
    scopeStatus: dashboardState.noticeScopeStatus,
    isPending: false,
  }),
}));

function renderPage(user = demoAdmin) {
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
  const teamMessagesRoute = createRoute({
    component: () => <div>팀 대화</div>,
    getParentRoute: () => rootRoute,
    path: '/admin/messages/teams/$teamId',
  });
  const submissionsRoute = createRoute({
    component: () => <div>제출물 목록</div>,
    getParentRoute: () => rootRoute,
    path: '/admin/submissions/',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/admin'] }),
    routeTree: rootRoute.addChildren([
      homeRoute,
      meetingsRoute,
      teamMessagesRoute,
      submissionsRoute,
    ]),
  });

  useAuthStore.setState({ currentUser: user });
  return render(<RouterProvider router={router} />);
}

describe('AdminHomeDashboard', () => {
  it('분반별 일정에서 마일스톤 유형에 맞는 제출물 탭으로 이동한다', async () => {
    dashboardState.milestones = [
      {
        allowResubmissionBeforeDueAt: false,
        id: 101,
        schedule: { dueAt: '2026-10-08T23:59:00' },
        sectionId: 1,
        status: 'PUBLISHED',
        title: '제안서',
        type: 'PROPOSAL',
        weekNumber: 3,
      },
      {
        allowResubmissionBeforeDueAt: false,
        id: 102,
        schedule: { dueAt: '2026-10-29T23:59:00' },
        sectionId: 1,
        status: 'PUBLISHED',
        title: '중간 점검',
        type: 'MID_REPORT',
        weekNumber: 6,
      },
    ];

    renderPage();

    const submissionLinks = await screen.findAllByRole('link');
    const [proposalLink, midReportLink] = submissionLinks.filter(link =>
      link.getAttribute('href')?.startsWith('/admin/submissions'),
    );

    expect(proposalLink).toBeDefined();
    expect(midReportLink).toBeDefined();
    expect(
      new URL(
        proposalLink!.getAttribute('href')!,
        'https://aics.test',
      ).searchParams.get('milestoneId'),
    ).toBe('proposal');
    expect(
      new URL(
        midReportLink!.getAttribute('href')!,
        'https://aics.test',
      ).searchParams.get('milestoneId'),
    ).toBe('midterm');
  });

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

  it('홈의 회의록·쪽지함 분반 표시는 현재 분반 코드로 갱신한다', async () => {
    renderPage({
      ...demoAdmin,
      sections: [
        {
          ...demoAdmin.sections[0]!,
          code: '변경된 분반명',
          id: '1',
          name: '과거 분반명',
        },
      ],
    });

    expect(await screen.findByText('변경된 분반명 · 2팀')).toBeInTheDocument();
    expect(screen.getByText('변경된 분반명 · 1팀')).toBeInTheDocument();
    expect(screen.queryByText('OOP-01 · 2팀')).not.toBeInTheDocument();
    expect(
      screen.queryByText('객체지향프로그래밍 · 1팀'),
    ).not.toBeInTheDocument();
  });

  it('홈 쪽지함은 통합 쪽지함 응답의 미확인 수와 메시지로 표시한다', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: '쪽지함 · 미확인 1건' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '제안서 보완 사항을 확인해 주세요.' }),
    ).toHaveAttribute('href', '/admin/messages/teams/7');
  });
});

it('공지 상세 링크에 응답의 분반 ID를 전달한다', async () => {
  renderPage();
  expect(
    await screen.findByRole('link', { name: '계약 공지' }),
  ).toHaveAttribute('href', '/admin/notices/10?sectionId=1');
});

it.each([
  [
    JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '안건 정리' }] },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '담당자 배정' }],
                },
              ],
            },
          ],
        },
      ],
    }),
    '안건 정리 담당자 배정',
  ],
  [
    JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '가'.repeat(60) }],
        },
      ],
    }),
    `${'가'.repeat(45)}…`,
  ],
  [
    JSON.stringify({ type: 'doc', content: [] }),
    '작성된 회의 내용이 없습니다.',
  ],
])(
  '회의 JSON %s에서 읽을 수 있는 미리보기를 만든다',
  async (content, preview) => {
    dashboardState.meetingContent = content;
    const { container } = renderPage();
    expect(
      await screen.findByRole('link', { name: preview }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain('"type":"doc"');
  },
);

it('성공한 공지 옆에 일부 분반의 조회 실패를 표시한다', async () => {
  dashboardState.noticeError = true;
  renderPage();
  const link = await screen.findByRole('link', { name: '계약 공지' });
  expect(link).toBeInTheDocument();
  const panel = link.closest('section')!;
  expect(within(panel).getByRole('alert')).toHaveTextContent(
    '일부 분반의 공지사항을 불러오지 못했습니다.',
  );
});

it('모든 공지 조회 실패에서는 빈 목록 대신 오류 안내를 표시한다', async () => {
  dashboardState.notices = [];
  dashboardState.noticeError = true;
  renderPage();
  expect(
    await screen.findByText('공지사항을 불러오지 못했습니다.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('등록된 공지사항이 없습니다.'),
  ).not.toBeInTheDocument();
});

it('공지 게시 시각을 서울 기준 자정 넘김으로 표시한다', async () => {
  renderPage();
  const link = await screen.findByRole('link', { name: '계약 공지' });
  expect(
    within(link.closest('li')!).getByText('2026.09.15 00:30'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('오프셋 없는 공지 게시 시각을 서울 현지 시각으로 표시한다', async () => {
  dashboardState.notices[0]!.publishedAt = '2026-08-27T15:00:00';
  renderPage();
  const link = await screen.findByRole('link', { name: '계약 공지' });
  expect(
    within(link.closest('li')!).getByText('2026.08.27 15:00'),
  ).toBeInTheDocument();
});

it.each(['0x1', '1e0', ' 1 ', '2'])(
  '공지 분반 %s는 잘못 매칭하지 않고 목록과 같은 폴백을 표시한다',
  async id => {
    renderPage({
      ...demoAdmin,
      sections: demoAdmin.sections.map(section => ({ ...section, id })),
    });
    const link = await screen.findByRole('link', { name: '계약 공지' });
    expect(
      within(link.closest('li')!).getByText('알 수 없는 분반'),
    ).toBeInTheDocument();
  },
);

it('정상 십진 분반 ID의 공지에는 분반명을 표시한다', async () => {
  renderPage();
  const link = await screen.findByRole('link', { name: '계약 공지' });
  expect(within(link.closest('li')!).getByText('OOP-01')).toBeInTheDocument();
});

it('공지의 분반 표시는 응답의 이름 대신 현재 분반 코드를 사용한다', async () => {
  renderPage({
    ...demoAdmin,
    sections: demoAdmin.sections.map(section =>
      section.id === '1'
        ? { ...section, code: '변경된 분반 코드', name: '이전 분반명' }
        : section,
    ),
  });
  const link = await screen.findByRole('link', { name: '계약 공지' });
  expect(
    within(link.closest('li')!).getByText('변경된 분반 코드'),
  ).toBeInTheDocument();
  expect(
    within(link.closest('li')!).queryByText('이전 분반명'),
  ).not.toBeInTheDocument();
});

it.each([false, true])(
  '분반 상태 누락을 공지 없음으로 표시하지 않고 안내한다 (조회 결과 있음: %s)',
  async hasNotices => {
    dashboardState.noticeScopeStatus = 'unknown-status';
    if (!hasNotices) dashboardState.notices = [];
    renderPage();
    const message = await screen.findByText(
      '일부 담당 분반의 운영 상태를 확인할 수 없어 해당 분반의 공지사항을 표시할 수 없습니다.',
    );
    expect(message).toBeInTheDocument();
    expect(
      screen.queryByText('등록된 공지사항이 없습니다.'),
    ).not.toBeInTheDocument();
    if (hasNotices) {
      expect(message).toHaveAttribute('role', 'alert');
      expect(
        screen.getByRole('link', { name: '계약 공지' }),
      ).toBeInTheDocument();
    }
  },
);

it('활성 담당 분반이 없으면 공지 없음 대신 조회 전제조건을 안내한다', async () => {
  dashboardState.noticeScopeStatus = 'no-active-sections';
  dashboardState.notices = [];
  renderPage();
  expect(
    await screen.findByText('공지사항을 표시할 활성 담당 분반이 없습니다.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('등록된 공지사항이 없습니다.'),
  ).not.toBeInTheDocument();
});

it('활성 분반을 정상 조회한 빈 목록에만 공지 없음을 표시한다', async () => {
  dashboardState.notices = [];
  renderPage();
  expect(
    await screen.findByText('등록된 공지사항이 없습니다.'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('분반 상태 누락과 다른 활성 분반의 조회 실패를 함께 알린다', async () => {
  dashboardState.noticeScopeStatus = 'unknown-status';
  dashboardState.noticeError = true;
  renderPage();
  const link = await screen.findByRole('link', { name: '계약 공지' });
  const alert = within(link.closest('section')!).getByRole('alert');
  expect(alert).toHaveTextContent(
    '일부 담당 분반의 운영 상태를 확인할 수 없어 해당 분반의 공지사항을 표시할 수 없습니다.',
  );
  expect(alert).toHaveTextContent(
    '일부 분반의 공지사항을 불러오지 못했습니다.',
  );
});
