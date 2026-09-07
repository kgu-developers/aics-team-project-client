import type {
  AdminMilestoneSubmissionItemDto,
  AdminMilestoneSubmissionStatusDto,
  AdminMilestoneSubmissionsResponse,
} from '@aics/api-client';

const submissionStatusLabels: Record<
  AdminMilestoneSubmissionStatusDto,
  string
> = {
  APPROVED: '승인됨',
  COMPLETED: '완료',
  FEEDBACK_PROVIDED: '피드백 제공',
  NOT_SUBMITTED: '미제출',
  REVISION_REQUESTED: '수정 요청',
  SUBMITTED: '제출 완료',
};

export type AdminMilestoneSubmissionView = {
  canSubmitNow: boolean;
  completedAt: string | null;
  completedBy: string | null;
  currentVersion: number;
  hasPendingReview: boolean;
  presentationOrder: number | null;
  status: AdminMilestoneSubmissionStatusDto;
  statusLabel: string;
  submissionId: string | null;
  teamId: string;
  teamName: string;
};

export type AdminMilestoneSubmissionsView = {
  milestoneId: string;
  submissions: AdminMilestoneSubmissionView[];
};

function toSubmissionView(
  submission: AdminMilestoneSubmissionItemDto,
): AdminMilestoneSubmissionView {
  return {
    canSubmitNow: submission.canSubmitNow,
    completedAt: submission.completedAt ?? null,
    completedBy: submission.completedBy ?? null,
    currentVersion: submission.currentVersion,
    hasPendingReview: submission.hasPendingReview,
    presentationOrder: submission.presentationOrder ?? null,
    status: submission.status,
    statusLabel: submissionStatusLabels[submission.status],
    submissionId:
      submission.status === 'NOT_SUBMITTED' ? null : String(submission.id),
    teamId: String(submission.teamId),
    teamName: submission.teamName,
  };
}

export function toAdminMilestoneSubmissionsView(
  response: AdminMilestoneSubmissionsResponse,
): AdminMilestoneSubmissionsView {
  return {
    milestoneId: String(response.contents[0]?.milestoneId ?? ''),
    submissions: response.contents.map(toSubmissionView),
  };
}
