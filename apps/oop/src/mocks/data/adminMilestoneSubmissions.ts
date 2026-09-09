import type { AdminMilestoneSubmissionsResponse } from '@aics/api-client';

const submissionsByMilestoneId: Record<
  string,
  AdminMilestoneSubmissionsResponse
> = {
  '101': {
    contents: [
      {
        canSubmitNow: false,
        currentVersion: 2,
        hasPendingReview: true,
        id: 1001,
        milestoneId: 101,
        projectTitle: 'AI 기반 팀 프로젝트 관리 서비스',
        status: 'REVISION_REQUESTED',
        teamId: 11,
        teamName: 'OOP-01 - 1팀',
      },
      {
        canSubmitNow: true,
        currentVersion: 0,
        hasPendingReview: false,
        id: 1002,
        milestoneId: 101,
        projectTitle: null,
        status: 'NOT_SUBMITTED',
        teamId: 12,
        teamName: 'OOP-01 - 2팀',
      },
    ],
  },
  '102': {
    contents: [
      {
        canSubmitNow: false,
        currentVersion: 2,
        hasPendingReview: false,
        id: 1003,
        milestoneId: 102,
        status: 'FEEDBACK_PROVIDED',
        teamId: 11,
        teamName: 'OOP-01 - 1팀',
      },
      {
        canSubmitNow: false,
        currentVersion: 1,
        hasPendingReview: false,
        id: 1004,
        milestoneId: 102,
        status: 'APPROVED',
        teamId: 12,
        teamName: 'OOP-01 - 2팀',
      },
    ],
  },
  '103': {
    contents: [
      {
        canSubmitNow: false,
        currentVersion: 1,
        hasPendingReview: false,
        id: 1008,
        milestoneId: 103,
        presentationOrder: 1,
        status: 'SUBMITTED',
        teamId: 11,
        teamName: 'OOP-01 - 1팀',
      },
      {
        canSubmitNow: true,
        currentVersion: 0,
        hasPendingReview: false,
        id: 1009,
        milestoneId: 103,
        presentationOrder: 2,
        status: 'NOT_SUBMITTED',
        teamId: 12,
        teamName: 'OOP-01 - 2팀',
      },
    ],
  },
  '104': {
    contents: [
      {
        canSubmitNow: false,
        completedAt: '2026-12-08T12:00:00Z',
        completedBy: '담당 교수',
        currentVersion: 1,
        hasPendingReview: false,
        id: 1005,
        milestoneId: 104,
        status: 'COMPLETED',
        teamId: 11,
        teamName: 'OOP-01 - 1팀',
      },
      {
        canSubmitNow: true,
        currentVersion: 0,
        hasPendingReview: false,
        id: 1010,
        milestoneId: 104,
        status: 'NOT_SUBMITTED',
        teamId: 12,
        teamName: 'OOP-01 - 2팀',
      },
    ],
  },
  '105': {
    contents: [
      {
        canSubmitNow: false,
        currentVersion: 1,
        hasPendingReview: true,
        id: 1006,
        milestoneId: 105,
        status: 'SUBMITTED',
        teamId: 11,
        teamName: 'OOP-01 - 1팀',
      },
      {
        canSubmitNow: true,
        currentVersion: 0,
        hasPendingReview: false,
        id: 1007,
        milestoneId: 105,
        status: 'NOT_SUBMITTED',
        teamId: 12,
        teamName: 'OOP-01 - 2팀',
      },
    ],
  },
};

const initialSubmissionsByMilestoneId = structuredClone(
  submissionsByMilestoneId,
);

export function getAdminMilestoneSubmissionsFixture(
  milestoneId: string,
): AdminMilestoneSubmissionsResponse | undefined {
  return Object.hasOwn(submissionsByMilestoneId, milestoneId)
    ? submissionsByMilestoneId[milestoneId]
    : undefined;
}

export function updatePresentationOrderFixture(
  teamOrders: Array<{ order: number; teamId: number }>,
) {
  const ordersByTeamId = new Map(
    teamOrders.map(({ teamId, order }) => [teamId, order]),
  );
  const presentationSubmissions = submissionsByMilestoneId['103']?.contents;

  if (!presentationSubmissions) return;

  presentationSubmissions.forEach(submission => {
    submission.presentationOrder =
      ordersByTeamId.get(submission.teamId) ?? submission.presentationOrder;
  });
}

export function resetAdminMilestoneSubmissionsFixture() {
  Object.keys(submissionsByMilestoneId).forEach(milestoneId => {
    delete submissionsByMilestoneId[milestoneId];
  });
  Object.assign(
    submissionsByMilestoneId,
    structuredClone(initialSubmissionsByMilestoneId),
  );
}
