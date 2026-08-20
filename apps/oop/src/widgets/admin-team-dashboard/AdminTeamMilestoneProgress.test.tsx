import { AstryxThemeProvider } from '@aics/design-system';
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
    id: 'mid-review',
    title: '중간 점검',
    deadlineLabel: '2026-08-15',
    status: { kind: 'not-submitted' },
  },
  {
    id: 'presentation-material',
    title: '발표 자료 제출',
    deadlineLabel: '2026-08-17',
    status: {
      kind: 'submitted',
      submittedDateLabel: '2026-08-17',
    },
  },
  {
    id: 'presentation-evaluation',
    title: '발표 평가',
    deadlineLabel: '2026-08-20',
    status: { kind: 'evaluated' },
  },
];

function renderProgress(items: TeamMilestoneProgress[]) {
  return render(
    <AstryxThemeProvider>
      <AdminTeamMilestoneProgress milestones={items} />
    </AstryxThemeProvider>,
  );
}

describe('AdminTeamMilestoneProgress', () => {
  it('마일스톤별 제출 상태를 구분해서 표시한다', () => {
    renderProgress(milestones);

    expect(screen.getByText('제출 전')).toBeInTheDocument();
    expect(screen.getByText('미제출')).toBeInTheDocument();
    expect(screen.getByText('2026-08-17 제출')).toBeInTheDocument();
    expect(screen.getByText('평가 완료')).toBeInTheDocument();
  });

  it('마일스톤이 없으면 빈 상태를 표시한다', () => {
    renderProgress([]);

    expect(screen.getByText('등록된 마일스톤이 없습니다.')).toBeInTheDocument();
  });
});
