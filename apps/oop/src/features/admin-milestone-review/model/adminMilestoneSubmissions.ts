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
  feedbackCount: number | null;
  feedbackRequested: boolean | null;
  hasPendingReview: boolean;
  leaderName?: string | null;
  midReportId?: string | null;
  totalMeetingRecordCount: number | null;
  presentationOrder: number | null;
  proposalCompletedAt: string | null;
  projectId: string | null;
  projectTitle: string | null;
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

type AdminMilestoneReviewState = {
  feedbackRequested?: boolean | null;
  hasPendingReview?: boolean;
};

/**
 * `hasPendingReview` means the student still needs to revise. It takes
 * precedence over a queued professor review so the two mutually exclusive
 * actions are never shown together in the UI.
 */
export function getAdminMilestoneReviewStatus(
  submission: AdminMilestoneReviewState,
) {
  if (submission.hasPendingReview) return '수정 요청';
  return submission.feedbackRequested === true ? '검토 대기 중' : null;
}

export function formatAdminTotalMeetingRecordCount(
  totalMeetingRecordCount: number | null,
) {
  return totalMeetingRecordCount == null
    ? '팀 전체 회의록 수 확인 불가'
    : `팀 전체 회의록 ${totalMeetingRecordCount}건`;
}

export function hasAdminTotalMeetingRecords(
  totalMeetingRecordCount: number | null,
) {
  return totalMeetingRecordCount != null && totalMeetingRecordCount > 0;
}

function toSubmissionView(
  submission: AdminMilestoneSubmissionItemDto,
): AdminMilestoneSubmissionView {
  const hasPersistedSubmission =
    submission.currentVersion > 0 ||
    (submission.status != null && submission.status !== 'NOT_SUBMITTED') ||
    submission.projectId != null ||
    submission.midReportId != null ||
    (submission.feedbackCount ?? 0) > 0 ||
    submission.feedbackRequested === true ||
    submission.hasPendingReview;

  return {
    canSubmitNow: submission.canSubmitNow,
    completedAt: submission.completedAt ?? null,
    completedBy: submission.completedBy ?? null,
    currentVersion: submission.currentVersion,
    feedbackCount: submission.feedbackCount ?? null,
    feedbackRequested: submission.feedbackRequested ?? null,
    hasPendingReview: submission.hasPendingReview,
    leaderName: submission.leaderName ?? null,
    midReportId:
      submission.midReportId === null || submission.midReportId === undefined
        ? null
        : String(submission.midReportId),
    totalMeetingRecordCount: submission.totalMeetingRecordCount ?? null,
    presentationOrder: submission.presentationOrder ?? null,
    proposalCompletedAt: submission.proposalCompletedAt ?? null,
    projectId:
      submission.projectId === null || submission.projectId === undefined
        ? null
        : String(submission.projectId),
    projectTitle: submission.projectTitle ?? null,
    status: submission.status,
    // A revision request reopens the editable project document. The persisted
    // submission can still carry an older status, so the pending-review flag
    // is the authoritative display state for the administrator.
    statusLabel:
      getAdminMilestoneReviewStatus(submission) ??
      submissionStatusLabels[submission.status],
    // The list row ID is the submission-detail ID. Proposal revision requests
    // can reset the current version to 0 while the prior submitted document
    // remains reviewable, so currentVersion must not gate detail navigation.
    submissionId: hasPersistedSubmission ? String(submission.id) : null,
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
