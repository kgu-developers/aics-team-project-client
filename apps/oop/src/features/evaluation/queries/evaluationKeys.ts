export const evaluationKeys = {
  all: ['evaluation'] as const,
  context: (sectionId: string, userId: string) =>
    [...evaluationKeys.all, 'context', sectionId, userId] as const,
  // 발표 자료는 마일스톤 단위로, 내 평가는 계정까지 구분한다.
  presentationRoster: (milestoneId: string) =>
    [...evaluationKeys.all, 'presentation-roster', milestoneId] as const,
  myTeamEvaluations: (userId: string, milestoneId: string) =>
    [...evaluationKeys.all, 'team-evaluations', userId, milestoneId] as const,
  criteria: (sectionId: string) =>
    [...evaluationKeys.all, 'criteria', sectionId] as const,
  peer: (sectionId: string, userId: string, formId: string) =>
    [...evaluationKeys.all, 'peer', sectionId, userId, formId] as const,
};
