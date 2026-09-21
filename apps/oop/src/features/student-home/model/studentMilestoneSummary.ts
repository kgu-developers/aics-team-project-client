import type {
  MyTeamMilestoneSubmissionResponse,
  StudentHomeMilestone,
  StudentMilestoneResponse,
} from '@aics/core';

import { ROUTES } from '~/app/constants/routes';

import { formatCourseScheduleDateTime } from '~/shared/lib/formatCourseScheduleDateTime';
import { seoulInstant } from '~/shared/lib/seoulInstant';

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
  return seoulInstant(value);
}

export function milestoneDate(value?: string | null) {
  if (!value) return '일정 미정';
  const formatted = formatCourseScheduleDateTime(value);
  return formatted === value && Number.isNaN(milestoneTime(value))
    ? '일정 확인 필요'
    : formatted;
}

export function presentationEvaluationDate(value?: string | null) {
  return milestoneDate(value);
}

function getPresentationEvaluationWindow(milestone: StudentMilestoneResponse) {
  if (milestone.type !== 'PRESENTATION') return undefined;

  const opensAt = milestoneTime(milestone.schedule.evaluationOpensAt);
  const closesAt = milestoneTime(milestone.schedule.evaluationClosesAt);
  return Number.isFinite(opensAt) &&
    Number.isFinite(closesAt) &&
    opensAt < closesAt
    ? { closesAt, opensAt }
    : undefined;
}

export function isPresentationEvaluation(
  milestone: StudentMilestoneResponse,
  now: number,
) {
  const window = getPresentationEvaluationWindow(milestone);
  return Boolean(window && now >= window.opensAt);
}

/** Submission completion and publication closing are different facts. */
export function studentMilestoneSummary(
  milestone: StudentMilestoneResponse,
  submission: MyTeamMilestoneSubmissionResponse | undefined,
  now: number,
): StudentHomeMilestone {
  const isClosedPresentation =
    milestone.type === 'PRESENTATION' && milestone.status === 'CLOSED';
  const evaluationWindow = getPresentationEvaluationWindow(milestone);
  if (
    evaluationWindow &&
    (isClosedPresentation || isPresentationEvaluation(milestone, now))
  ) {
    const closed =
      milestone.status === 'CLOSED' || now >= evaluationWindow.closesAt;
    // Presentation evaluation is terminal when its schedule closes or the
    // server closes the milestone, without changing the shared submission.
    return {
      id: String(milestone.id),
      title: milestone.title,
      period: `평가 기간 : ${presentationEvaluationDate(milestone.schedule.evaluationOpensAt)} ~ ${presentationEvaluationDate(milestone.schedule.evaluationClosesAt)}`,
      dueDate: `~ ${presentationEvaluationDate(milestone.schedule.evaluationClosesAt)}`,
      status: closed ? 'completed' : 'in-progress',
      statusLabel: closed ? '평가 완료' : '평가 기간 중',
      currentStepLabel: '발표 평가',
      interaction: 'collapsible',
      isDetailAvailable: true,
      rows: [
        {
          id: 'presentation-evaluation',
          label: '발표 평가',
          value: '발표 자료 및 평가 확인',
          actionLabel: closed ? undefined : '평가하기',
          actionTo: closed ? undefined : ROUTES.STUDENT.PRESENTATION_EVALUATION,
          tone: 'primary',
        },
      ],
      body: {
        kind: 'presentation-evaluation',
        project: { title: '프로젝트 정보', description: '' },
        orderGuide: '발표 순서를 확인할 수 없어요.',
        teams: [],
        timeGuide: `평가 기간 : ${presentationEvaluationDate(milestone.schedule.evaluationOpensAt)} ~ ${presentationEvaluationDate(milestone.schedule.evaluationClosesAt)}`,
      },
    };
  }
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
  let status: StudentHomeMilestone['status'];
  if (isClosedPresentation || submission?.status === 'COMPLETED') {
    status = 'completed';
  } else if (!submission) {
    status = 'unavailable';
  } else if (canSubmit && submission.status === 'REVISION_REQUESTED') {
    status = 'revision-available';
  } else if (closed) {
    status = 'closed';
  } else if (beforePeriod) {
    status = 'before-period';
  } else {
    status = 'in-progress';
  }

  let statusLabel: string;
  if (isClosedPresentation) {
    statusLabel = '단계 완료';
  } else if (beforePeriod) {
    statusLabel = '기간 전';
  } else if (submission) {
    statusLabel = submissionLabels[submission.status];
  } else {
    statusLabel = '상태 확인 필요';
  }
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
