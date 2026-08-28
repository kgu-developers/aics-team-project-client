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
    submissionId: null,
    status: { kind: 'before-deadline' },
  },
  {
    id: 'midterm',
    title: '중간 점검',
    deadlineLabel: '2026-08-15',
    submissionId: 'submission-midterm-team-1',
    status: { kind: 'evaluated' },
  },
  {
    id: 'presentation-submit',
    title: '발표 자료 제출',
    deadlineLabel: '2026-08-17',
    status: {
      kind: 'submitted',
      submittedDateLabel: '2026-08-17',
    },
    submissionId: 'submission-presentation-team-1',
  },
  {
    id: 'presentation-evaluate',
    title: '발표 평가',
    deadlineLabel: '2026-08-20',
    submissionId: null,
    status: { kind: 'evaluated' },
  },
  {
    id: 'final-report',
    title: '최종 보고서',
    deadlineLabel: '2026-12-07',
    submissionId: 'submission-final-report-team-1',
    downloadFiles: [
      {
        downloadUrl: 'data:application/pdf;base64,JVBERi0xLjQKJQ==',
        fileName: 'oop-01-1-final-report.pdf',
        label: '보고서(pdf)',
      },
      {
        downloadUrl:
          'data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
        fileName: 'oop-01-1-final-report.zip',
        label: '전체 파일(zip)',
      },
    ],
    status: { kind: 'submitted', submittedDateLabel: '2026-12-07' },
  },
  {
    id: 'peer-review',
    title: '상호 평가',
    deadlineLabel: '2026-08-30',
    submissionId: null,
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
          teamMemberCount={2}
          teamLeaderName='김ㅇㅇ'
          meetingCount={2}
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
    expect(screen.getByText('제출자 수: 0 / 2')).toBeInTheDocument();
    expect(screen.queryByText('발표 평가')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '회의록: 2개' })[0]).toHaveAttribute(
      'href',
      '/admin/meetings?sectionId=oop-01&teamId=team-1',
    );
    expect(screen.getAllByRole('button', { name: '상세보기' })).toHaveLength(2);
    const detailLinks = screen.getAllByRole('link', { name: '상세보기' });

    expect(detailLinks[0]).toHaveAttribute(
      'href',
      '/admin/submissions/submission-midterm-team-1?milestoneId=midterm&sectionId=oop-01',
    );
    expect(detailLinks[1]).toHaveAttribute(
      'href',
      '/admin/submissions/submission-presentation-team-1?milestoneId=presentation-submit&sectionId=oop-01',
    );
    expect(
      screen.getByRole('link', { name: 'oop-01-1-final-report.pdf' }),
    ).toHaveAttribute('download', 'oop-01-1-final-report.pdf');
    expect(
      screen.getByRole('button', { name: '일괄 다운로드' }),
    ).toBeDisabled();
  });

  it('마일스톤이 없으면 빈 상태를 표시한다', async () => {
    renderProgress([]);

    expect(
      await screen.findByText('등록된 마일스톤이 없습니다.'),
    ).toBeInTheDocument();
  });
});
