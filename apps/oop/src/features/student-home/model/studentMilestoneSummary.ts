import type {
  MyTeamMilestoneSubmissionResponse,
  StudentHomeMilestone,
  StudentMilestoneResponse,
} from '@aics/core';

const submissionLabels: Record<
  MyTeamMilestoneSubmissionResponse['status'],
  string
> = {
  NOT_SUBMITTED: '미제출',
  SUBMITTED: '제출 완료',
  APPROVED: '승인됨',
  FEEDBACK_PROVIDED: '피드백 도착',
  REVISION_REQUESTED: '수정 요청',
  COMPLETED: '단계 완료',
};

export function milestoneDate(value?: string | null) {
  if (!value) return '일정 미정';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '일정 확인 필요';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Submission completion and publication closing are different facts. */
export function studentMilestoneSummary(
  milestone: StudentMilestoneResponse,
  submission: MyTeamMilestoneSubmissionResponse | undefined,
  now: number,
): StudentHomeMilestone {
  const opensAt = milestone.schedule.opensAt
    ? new Date(milestone.schedule.opensAt).getTime()
    : undefined;
  const beforePeriod =
    opensAt !== undefined && now < opensAt && !submission?.canSubmitNow;
  const status: StudentHomeMilestone['status'] =
    submission?.status === 'COMPLETED'
      ? 'completed'
      : submission?.status === 'REVISION_REQUESTED'
        ? 'revision-available'
        : beforePeriod || !submission
          ? 'before-period'
          : 'in-progress';
  return {
    id: String(milestone.id),
    title: milestone.title,
    period: `기간 : ${milestoneDate(milestone.schedule.opensAt)} ~ ${milestoneDate(milestone.schedule.dueAt)}`,
    dueDate: milestone.schedule.dueAt
      ? `~ ${milestoneDate(milestone.schedule.dueAt)}`
      : '마감 일정 미정',
    status,
    statusLabel: submission
      ? submissionLabels[submission.status]
      : '상태 확인 필요',
    currentStepLabel: milestone.title,
    interaction: 'collapsible',
    isDetailAvailable: true,
    rows: [
      {
        id: 'submission-status',
        label: '제출 상태',
        value: submission
          ? submissionLabels[submission.status]
          : '상태 확인 필요',
        tone: 'default',
      },
      {
        id: 'submission-availability',
        label: '제출 가능 여부',
        value: !submission
          ? '상태 확인 필요'
          : submission.canSubmitNow
            ? '제출 가능'
            : '제출 불가',
        tone: submission?.canSubmitNow ? 'primary' : 'muted',
      },
    ],
  };
}
