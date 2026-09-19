import type {
  AdminMilestoneStatus,
  AdminMilestoneType,
  AdminSectionMilestoneDto,
} from '@aics/api-client';

import { seoulInstant } from '~/shared/lib/seoulInstant';

const milestoneTypeLabels: Record<AdminMilestoneType, string> = {
  FINAL_REPORT: '최종 보고서',
  GENERAL: '일반',
  MID_REPORT: '중간 점검',
  PEER_EVALUATION: '상호 평가',
  // `PRESENTATION` 하나가 자료 제출과 평가 기간을 함께 가진다.
  // 평가만을 뜻하는 유형으로 보이면 안 된다.
  PRESENTATION: '발표',
  PROPOSAL: '제안서',
};

export function formatAdminMilestoneDate(value: string | null | undefined) {
  const instant = seoulInstant(value);
  if (Number.isNaN(instant)) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(new Date(instant));
}

export function getAdminMilestoneTypeLabel(type: AdminMilestoneType) {
  return milestoneTypeLabels[type];
}

/**
 * `PRESENTATION` is shared by material submission and presentation evaluation.
 * The API contract distinguishes evaluation by its configured evaluation window.
 */
export function isPresentationEvaluationMilestone(
  milestone: AdminSectionMilestoneDto,
) {
  return (
    milestone.type === 'PRESENTATION' &&
    Boolean(
      milestone.schedule.evaluationOpensAt &&
      milestone.schedule.evaluationClosesAt,
    )
  );
}

export function isPresentationSubmissionMilestone(
  milestone: AdminSectionMilestoneDto,
) {
  return milestone.type === 'PRESENTATION' && Boolean(milestone.schedule.dueAt);
}

const milestoneStatusLabels: Record<AdminMilestoneStatus, string> = {
  CLOSED: '마감',
  DRAFT: '미공개',
  PUBLISHED: '공개',
};

export function getAdminMilestoneStatusLabel(status: AdminMilestoneStatus) {
  return milestoneStatusLabels[status];
}
