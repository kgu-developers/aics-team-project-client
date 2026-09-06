import type { AdminMilestoneType } from '@aics/api-client';

const milestoneTypeLabels: Record<AdminMilestoneType, string> = {
  FINAL_REPORT: '최종 보고서',
  GENERAL: '일반',
  MID_REPORT: '중간 점검',
  PEER_EVALUATION: '상호 평가',
  PRESENTATION: '발표 자료 제출',
  PROPOSAL: '제안서',
};

export function formatAdminMilestoneDate(value: string | null | undefined) {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function getAdminMilestoneTypeLabel(type: AdminMilestoneType) {
  return milestoneTypeLabels[type];
}
