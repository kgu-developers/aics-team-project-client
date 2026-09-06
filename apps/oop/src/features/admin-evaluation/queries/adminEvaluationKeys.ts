export const adminEvaluationKeys = {
  all: ['admin-evaluation'] as const,
  form: (sectionId: number, milestoneId: number) =>
    [...adminEvaluationKeys.all, 'form', sectionId, milestoneId] as const,
};
