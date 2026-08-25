import { AstryxThemeProvider } from '@aics/design-system';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TeamMilestoneProgress } from '~/features/admin-team-dashboard/model';

import AdminTeamMilestoneProgress from './AdminTeamMilestoneProgress';

const milestones: TeamMilestoneProgress[] = [
  {
    id: 'proposal',
    title: '제안서',
    deadlineLabel: '2026-08-10',
    status: { kind: 'before-deadline' },
  },
  {
    id: 'midterm',
    title: '중간 점검',
    deadlineLabel: '2026-08-15',
    status: { kind: 'not-submitted' },
  },
  {
    id: 'presentation-submit',
    title: '발표 자료 제출',
    deadlineLabel: '2026-08-17',
    status: {
      kind: 'submitted',
      submittedDateLabel: '2026-08-17',
    },
  },
  {
    id: 'presentation-evaluate',
    title: '발표 평가',
    deadlineLabel: '2026-08-20',
    status: { kind: 'evaluated' },
  },
  {
    id: 'final-report',
    title: '최종 보고서',
    deadlineLabel: '2026-08-27',
    status: { kind: 'before-deadline' },
  },
  {
    id: 'peer-review',
    title: '상호 평가',
    deadlineLabel: '2026-08-30',
    status: { kind: 'before-deadline' },
  },
];

function renderProgress(items: TeamMilestoneProgress[]) {
  const rootRoute = createRootRoute();
  const progressRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <AdminTeamMilestoneProgress
          milestones={items}
          projectTopic='구독 관리 가계부 프로젝트'
          sectionId='oop-01'
          teamId='team-1'
          teamLeaderName='김ㅇㅇ'
        />
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/'] }),
    routeTree: rootRoute.addChildren([progressRoute]),
  });

  return render(<RouterProvider router={router} />);
}

describe('AdminTeamMilestoneProgress', () => {
  it('발표 평가를 제외한 제출물 카드를 표시하고 미제출 카드는 비활성화한다', async () => {
    renderProgress(milestones);

    expect(await screen.findByText('제안서')).toBeInTheDocument();
    expect(screen.getByText('중간 점검')).toBeInTheDocument();
    expect(screen.getByText('발표 자료 제출')).toBeInTheDocument();
    expect(screen.getByText('최종 보고서')).toBeInTheDocument();
    expect(screen.getByText('상호 평가')).toBeInTheDocument();
    expect(screen.queryByText('발표 평가')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '상세보기' })).toHaveLength(4);
    expect(screen.getByRole('link', { name: '상세보기' })).toHaveAttribute(
      'href',
      '/admin/submissions/team-1-presentation-submit?milestoneId=presentation-submit&sectionId=oop-01',
    );
  });

  it('마일스톤이 없으면 빈 상태를 표시한다', async () => {
    renderProgress([]);

    expect(
      await screen.findByText('등록된 마일스톤이 없습니다.'),
    ).toBeInTheDocument();
  });
});
