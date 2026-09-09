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

/** The server's LocalDateTime uses the course timezone, independent of the browser. */
export function milestoneTime(value?: string | null) {
  if (!value) return NaN;
  return Date.parse(
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}+09:00`,
  );
}

export function milestoneDate(value?: string | null) {
  if (!value) return '일정 미정';
  const date = new Date(milestoneTime(value));
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
  const opensAt = milestoneTime(milestone.schedule.opensAt);
  const dueAt = milestoneTime(milestone.schedule.dueAt);
  const revisionUntil = milestoneTime(milestone.schedule.revisionUntil);
  const lateUntil = milestoneTime(milestone.schedule.lateSubmissionUntil);
  const canSubmit =
    submission?.canSubmitNow && submission.status !== 'COMPLETED';
  const beforePeriod =
    milestone.status === 'PUBLISHED' &&
    now < opensAt &&
    submission?.status === 'NOT_SUBMITTED' &&
    !canSubmit;
  const closed = !canSubmit && (milestone.status === 'CLOSED' || now >= dueAt);
  const status: StudentHomeMilestone['status'] =
    submission?.status === 'COMPLETED'
      ? 'completed'
      : !submission
        ? 'unavailable'
        : canSubmit && submission.status === 'REVISION_REQUESTED'
          ? 'revision-available'
          : closed
            ? 'closed'
            : beforePeriod
              ? 'before-period'
              : 'in-progress';
  let statusLabel = beforePeriod
    ? '기간 전'
    : submission
      ? submissionLabels[submission.status]
      : '상태 확인 필요';
  if (status === 'closed') statusLabel += ' · 마감';

  // canSubmitNow also covers team-specific reopening whose deadline is not exposed.
  // Show official extension dates only in their applicable windows; do not invent one.
  let dueDate = milestone.schedule.dueAt
    ? `~ ${milestoneDate(milestone.schedule.dueAt)}`
    : '마감 일정 미정';
  if (canSubmit && (now >= dueAt || milestone.status === 'CLOSED')) {
    if (
      milestone.status === 'PUBLISHED' &&
      submission?.status === 'REVISION_REQUESTED' &&
      now < revisionUntil
    ) {
      dueDate = `재제출 마감 · ${milestoneDate(milestone.schedule.revisionUntil)}`;
    } else if (
      milestone.status === 'PUBLISHED' &&
      submission?.status === 'NOT_SUBMITTED' &&
      now < lateUntil
    ) {
      dueDate = `지각 제출 마감 · ${milestoneDate(milestone.schedule.lateSubmissionUntil)}`;
    } else {
      dueDate = '제출 가능 · 기한 확인 필요';
    }
  }
  return {
    id: String(milestone.id),
    title: milestone.title,
    period: `기간 : ${milestoneDate(milestone.schedule.opensAt)} ~ ${milestoneDate(milestone.schedule.dueAt)}`,
    dueDate,
    status,
    statusLabel,
    currentStepLabel: milestone.title,
    interaction: 'static',
    isDetailAvailable: false,
    rows: [],
  };
}
