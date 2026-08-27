export const adminPresentationEvaluationKeys = {
  all: ['admin-presentation-evaluations'] as const,
  list: (sectionId: string) =>
    [...adminPresentationEvaluationKeys.all, sectionId] as const,
};
