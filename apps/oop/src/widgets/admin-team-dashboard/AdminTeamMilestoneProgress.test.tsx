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
import { describe, expect, it } from 'vitest';

import type { TeamMilestoneProgress } from '~/features/admin-team-dashboard/model';

import AdminTeamMilestoneProgress from './AdminTeamMilestoneProgress';

const submittedMilestone: TeamMilestoneProgress = {
  milestone: {
    allowResubmissionBeforeDueAt: false,
    id: 101,
    schedule: { dueAt: '2026-10-15T14:59:00Z' },
    sectionId: 1,
    status: 'PUBLISHED',
    title: '제안서',
    type: 'PROPOSAL',
    weekNumber: 3,
  },
  submission: {
    canSubmitNow: false,
    completedAt: null,
    completedBy: null,
    currentVersion: 2,
    hasPendingReview: true,
    presentationOrder: null,
    projectTitle: 'AI 기반 팀 프로젝트 운영 플랫폼',
    status: 'SUBMITTED',
    statusLabel: '제출 완료',
    submissionId: '1001',
    teamId: '1',
    teamName: '1팀',
  },
  submissionState: 'ready',
  version: {
    artifacts: [
      {
        content: null,
        downloadUrl: 'https://files.example.com/proposal.pdf',
        fileName: 'proposal.pdf',
        label: '파일',
        type: 'FILE',
        url: null,
      },
      {
        content: null,
        downloadUrl: null,
        fileName: null,
        label: '링크',
        type: 'LINK',
        url: 'https://github.com/kgu-developers/example',
      },
    ],
    changeNote: null,
    description: null,
    isLate: false,
    submittedAt: '2026-10-10T09:00:00Z',
    submittedBy: '홍길동',
    version: 2,
  },
  versionState: 'ready',
};

function renderProgress(
  milestones: TeamMilestoneProgress[],
  milestoneListState: 'error' | 'pending' | 'ready' = 'ready',
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const progressRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminTeamMilestoneProgress
            milestoneListState={milestoneListState}
            milestones={milestones}
            sectionId='1'
          />
        </QueryClientProvider>
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
  it('제안서를 제출물 목록과 같은 상태·제출자·주제 요약으로 표시한다', async () => {
    renderProgress([submittedMilestone]);

    expect(await screen.findByText('제안서')).toBeInTheDocument();
    expect(screen.getByText('제출 완료')).toBeInTheDocument();
    expect(screen.getByText('2026.10.10 18:00')).toBeInTheDocument();
    expect(screen.getByText('제출자: 홍길동', { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText('프로젝트 주제: AI 기반 팀 프로젝트 운영 플랫폼'),
    ).toBeInTheDocument();
    expect(screen.getByText('검토 대기 중')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'proposal.pdf' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '상세보기' })).toHaveAttribute(
      'href',
      expect.stringContaining('/admin/submissions/1001'),
    );
  });

  it('미제출 제안서를 제출물 목록과 같은 상태와 비활성 상세보기로 표시한다', async () => {
    renderProgress([
      {
        ...submittedMilestone,
        submission: {
          ...submittedMilestone.submission!,
          currentVersion: 0,
          status: 'NOT_SUBMITTED',
          statusLabel: '미제출',
          submissionId: null,
        },
        version: null,
        versionState: 'idle',
      },
    ]);

    expect(await screen.findByText('미제출')).toBeInTheDocument();
    expect(screen.getByText('프로젝트 주제: AI 기반 팀 프로젝트 운영 플랫폼')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: '상세보기: 아직 제출하지 않은 마일스톤입니다.',
      }),
    ).toBeDisabled();
  });

  it('마일스톤 목록 로딩과 오류를 빈 목록과 구분해 표시한다', async () => {
    renderProgress([], 'pending');

    expect(await screen.findByRole('status')).toHaveTextContent(
      '마일스톤을 불러오는 중입니다.',
    );

    renderProgress([], 'error');

    expect(
      await screen.findByText('마일스톤을 불러오지 못했습니다.'),
    ).toBeInTheDocument();
  });
});
