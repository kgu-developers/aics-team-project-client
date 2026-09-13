export const adminTeamEvaluationCriteriaKeys = {
  all: ['admin-team-evaluation-criteria'] as const,
  list: (sectionId: string) =>
    [...adminTeamEvaluationCriteriaKeys.all, sectionId] as const,
};
