import type { AdminSectionMilestoneSubmissionsResponse } from '@aics/api-client';

import { getAdminPeerEvaluationProgress } from './adminPeerEvaluationProgress';
import { getAdminSubmissionFiles } from './adminSubmissionFiles';

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
    ReadonlyArray<{ submittedAt: string | null; submissionId: string | null }>
  >
> = {
  'peer-review': [
    {
      submissionId: 'submission-oop-01-1-peer-review',
      submittedAt: '2026/12/14',
    },
    { submissionId: null, submittedAt: null },
  ],
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
  'final-report': [
    {
      submissionId: 'submission-oop-01-1-final-report',
      submittedAt: '2026/12/07',
    },
    {
      submissionId: 'submission-oop-01-2-final-report',
      submittedAt: '2026/12/08',
    },
  ],
};

export function getAdminMilestoneSubmissionsFixture(
  milestoneId: string,
): AdminSectionMilestoneSubmissionsResponse | undefined {
  if (!Object.hasOwn(milestones, milestoneId)) return undefined;

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
      const peerEvaluationProgress = getAdminPeerEvaluationProgress(
        team.teamId,
      );
      const submissionFiles = getAdminSubmissionFiles(team.teamId);

      return {
        id: `${team.id}-${typedMilestoneId}`,
        meetingRecordCount: null,
        messageCount: null,
        submissionId: submissionDetail?.submissionId ?? null,
        submittedAt: submissionDetail?.submittedAt ?? null,
        summary: {
          attachmentCount:
            typedMilestoneId === 'midterm'
              ? (submissionFiles?.midterm.length ?? 0)
              : null,
          feedbackCount: null,
          leaderName:
            typedMilestoneId === 'proposal'
              ? index === 0
                ? '김민준'
                : '박지훈'
              : null,
          linkLabel:
            typedMilestoneId === 'presentation-submit'
              ? (submissionFiles?.presentation.videoUrl ?? null)
              : null,
          presentationFileDownloadUrl:
            typedMilestoneId === 'presentation-submit'
              ? (submissionFiles?.presentation.presentationFileDownloadUrl ??
                null)
              : null,
          presentationFileName:
            typedMilestoneId === 'presentation-submit'
              ? (submissionFiles?.presentation.presentationFileName ?? null)
              : null,
          projectTopic:
            typedMilestoneId === 'proposal'
              ? (submissionFiles?.proposal.projectTopic ?? null)
              : null,
          reportFileName:
            typedMilestoneId === 'final-report'
              ? (submissionFiles?.finalReport.reportFileName ?? null)
              : null,
          reportDownloadUrl:
            typedMilestoneId === 'final-report'
              ? (submissionFiles?.finalReport.reportDownloadUrl ?? null)
              : null,
          sourceArchiveFileName:
            typedMilestoneId === 'presentation-submit'
              ? (submissionFiles?.presentation.sourceArchiveFileName ?? null)
              : typedMilestoneId === 'final-report'
                ? (submissionFiles?.finalReport.sourceArchiveFileName ?? null)
                : null,
          sourceArchiveDownloadUrl:
            typedMilestoneId === 'presentation-submit'
              ? (submissionFiles?.presentation.sourceArchiveDownloadUrl ?? null)
              : typedMilestoneId === 'final-report'
                ? (submissionFiles?.finalReport.sourceArchiveDownloadUrl ??
                  null)
                : null,
          submittedMemberCount:
            typedMilestoneId === 'peer-review'
              ? peerEvaluationProgress.submittedMemberCount
              : null,
          memberCount:
            typedMilestoneId === 'peer-review'
              ? peerEvaluationProgress.memberCount
              : null,
        },
        teamId: team.teamId,
        teamName: team.teamName,
      };
    }),
  };
}
