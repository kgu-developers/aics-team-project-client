import type { TeamMessageRelatedType } from '@aics/core';

const relatedTypeLabels: Record<TeamMessageRelatedType, string> = {
  FINAL_SUBMISSION: '최종 제출',
  GENERAL: '일반 메시지',
  MEETING: '회의록',
  MID_REPORT: '중간 보고서 피드백',
  PROPOSAL: '제안서 피드백',
  QUESTION: '질문',
  REVIEW: '평가',
};

export function formatTeamMessageRelatedType(
  relatedType: TeamMessageRelatedType,
) {
  return relatedTypeLabels[relatedType];
}
