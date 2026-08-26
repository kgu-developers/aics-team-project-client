import type { AdminSectionMilestoneSubmissionsResponse } from '@aics/api-client';

type MilestoneId =
  | 'proposal'
  | 'midterm'
  | 'presentation-submit'
  | 'final-report'
  | 'peer-review';

const section = {
  id: 'oop-2026-2-01',
  label: 'OOP-01',
} as const;

const teamSubmissions = [
  {
    id: 'submission-oop-01-1',
    teamId: 'team-1151-1',
    teamName: 'OOP-01 - 1팀',
  },
  {
    id: 'submission-oop-01-2',
    teamId: 'team-1151-2',
    teamName: 'OOP-01 - 2팀',
  },
] as const;

const milestones: Record<MilestoneId, { title: string }> = {
  proposal: { title: '제안서' },
  midterm: { title: '중간 점검' },
  'presentation-submit': { title: '발표 자료 제출' },
  'final-report': { title: '최종 보고서' },
  'peer-review': { title: '상호 평가' },
};

export function getAdminMilestoneSubmissionsFixture(
  milestoneId: string,
): AdminSectionMilestoneSubmissionsResponse | undefined {
  if (!(milestoneId in milestones)) return undefined;

  const typedMilestoneId = milestoneId as MilestoneId;

  return {
    milestone: {
      id: typedMilestoneId,
      title: milestones[typedMilestoneId].title,
    },
    section,
    submissions: teamSubmissions.map((team, index) => ({
      id: `${team.id}-${typedMilestoneId}`,
      meetingRecordCount: null,
      messageCount: null,
      submittedAt: index === 0 ? '2026/09/05' : '2026/09/06',
      summary: {
        attachmentCount: null,
        feedbackCount: null,
        leaderName:
          typedMilestoneId === 'proposal'
            ? index === 0
              ? '김민준'
              : '박지훈'
            : null,
        linkLabel: null,
        presentationFileName: null,
        projectTopic:
          typedMilestoneId === 'proposal'
            ? 'AI 기반 팀 프로젝트 관리 서비스'
            : null,
        reportFileName: null,
        sourceArchiveFileName: null,
        submittedMemberCount: null,
      },
      teamId: team.teamId,
      teamName: team.teamName,
    })),
  };
}
