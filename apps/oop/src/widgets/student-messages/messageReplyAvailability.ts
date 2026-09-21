import type {
  MyTeamMilestoneSubmissionResponse,
  StudentMilestoneResponse,
  TeamMessageRelatedType,
} from '@aics/core';

import { milestoneTime } from '~/features/student-home/model/studentMilestoneSummary';

const milestoneTypeByRelatedType: Partial<
  Record<TeamMessageRelatedType, StudentMilestoneResponse['type']>
> = {
  FINAL_SUBMISSION: 'FINAL_REPORT',
  MID_REPORT: 'MID_REPORT',
  PROPOSAL: 'PROPOSAL',
};

type SubmissionState = {
  data?: MyTeamMilestoneSubmissionResponse;
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
};

type MessageReplyAvailabilityInput = {
  isFeedbackCycleCompleted?: boolean;
  isFeedbackCycleError?: boolean;
  isFeedbackCyclePending?: boolean;
  isDemo: boolean;
  isMilestoneListError: boolean;
  isMilestoneListPending: boolean;
  milestones: StudentMilestoneResponse[];
  now: number;
  relatedType: TeamMessageRelatedType;
  submissions: SubmissionState[];
};

export type MessageReplyAvailability = {
  canReply: boolean;
  reason?: string;
};

/** Keep document-feedback replies inside the same server-backed milestone window. */
export function messageReplyAvailability({
  isFeedbackCycleCompleted = false,
  isFeedbackCycleError = false,
  isFeedbackCyclePending = false,
  isDemo,
  isMilestoneListError,
  isMilestoneListPending,
  milestones,
  now,
  relatedType,
  submissions,
}: MessageReplyAvailabilityInput): MessageReplyAvailability {
  const milestoneType = milestoneTypeByRelatedType[relatedType];
  if (isDemo || !milestoneType) return { canReply: true };

  if (isFeedbackCyclePending) {
    return {
      canReply: false,
      reason: '피드백 단계 완료 상태를 확인하고 있어요.',
    };
  }

  if (isFeedbackCycleError) {
    return {
      canReply: false,
      reason:
        '피드백 단계 완료 상태를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.',
    };
  }

  if (isFeedbackCycleCompleted) {
    return {
      canReply: false,
      reason: '이미 완료된 단계에는 답장할 수 없습니다.',
    };
  }

  if (isMilestoneListPending) {
    return {
      canReply: false,
      reason: '피드백 답장 가능 기간을 확인하고 있어요.',
    };
  }

  if (isMilestoneListError) {
    return {
      canReply: false,
      reason:
        '피드백 답장 가능 기간을 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.',
    };
  }

  const matchingIndexes = milestones.flatMap((milestone, index) =>
    milestone.type === milestoneType ? [index] : [],
  );
  if (matchingIndexes.length === 0) {
    return {
      canReply: false,
      reason: '현재 피드백 답장 가능 기간이 아닙니다.',
    };
  }

  if (
    matchingIndexes.some(
      index => submissions[index]?.isPending || !submissions[index],
    )
  ) {
    return {
      canReply: false,
      reason: '피드백 답장 가능 기간을 확인하고 있어요.',
    };
  }

  if (matchingIndexes.some(index => submissions[index]?.isError)) {
    return {
      canReply: false,
      reason:
        '피드백 답장 가능 기간을 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.',
    };
  }

  const canReply = matchingIndexes.some(index => {
    const milestone = milestones[index];
    const submission = submissions[index]?.data;
    if (!milestone || !submission || !submissions[index]?.isSuccess)
      return false;

    const opensAt = milestoneTime(milestone.schedule.opensAt);
    const closesAt = milestoneTime(
      milestone.schedule.revisionUntil ?? milestone.schedule.dueAt,
    );
    const isWithinPublishedWindow =
      milestone.status === 'PUBLISHED' &&
      (!Number.isFinite(opensAt) || now >= opensAt) &&
      Number.isFinite(closesAt) &&
      now < closesAt;

    return (
      isWithinPublishedWindow &&
      submission.canSubmitNow &&
      submission.status !== 'COMPLETED'
    );
  });

  return canReply
    ? { canReply: true }
    : {
        canReply: false,
        reason: '현재 피드백 답장 가능 기간이 아닙니다.',
      };
}
