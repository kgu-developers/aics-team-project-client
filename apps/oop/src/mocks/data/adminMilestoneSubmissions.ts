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

const submissionDetailsByMilestone: Partial<
  Record<
    MilestoneId,
    ReadonlyArray<{ submittedAt: string; submissionId: string }>
  >
> = {
  proposal: [
    {
      submissionId: 'submission-oop-01-1-proposal',
      submittedAt: '2026/09/05',
    },
    {
      submissionId: 'submission-oop-01-2-proposal',
      submittedAt: '2026/09/06',
    },
  ],
  midterm: [
    {
      submissionId: 'submission-oop-01-1-midterm',
      submittedAt: '2026/10/12',
    },
    {
      submissionId: 'submission-oop-01-2-midterm',
      submittedAt: '2026/10/13',
    },
  ],
  'presentation-submit': [
    {
      submissionId: 'submission-oop-01-1-presentation-submit',
      submittedAt: '2026/11/12',
    },
    {
      submissionId: 'submission-oop-01-2-presentation-submit',
      submittedAt: '2026/11/13',
    },
  ],
};

export function getAdminMilestoneSubmissionsFixture(
  milestoneId: string,
): AdminSectionMilestoneSubmissionsResponse | undefined {
  if (!(milestoneId in milestones)) return undefined;

  const typedMilestoneId = milestoneId as MilestoneId;
  const submissionDetails = submissionDetailsByMilestone[typedMilestoneId];

  return {
    milestone: {
      id: typedMilestoneId,
      title: milestones[typedMilestoneId].title,
    },
    section,
    submissions: teamSubmissions.map((team, index) => {
      const submissionDetail = submissionDetails?.[index] ?? null;

      return {
        id: `${team.id}-${typedMilestoneId}`,
        meetingRecordCount: null,
        messageCount: null,
        submissionId: submissionDetail?.submissionId ?? null,
        submittedAt: submissionDetail?.submittedAt ?? null,
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
      };
    }),
  };
}
