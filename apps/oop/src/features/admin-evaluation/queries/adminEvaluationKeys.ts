export const adminEvaluationKeys = {
  all: ['admin-evaluation'] as const,
  form: (sectionId: number, milestoneId: number) =>
    [...adminEvaluationKeys.all, 'form', sectionId, milestoneId] as const,
  peerEvaluation: {
    detail: (sectionId: string | number, teamId: number, formId?: number) =>
      [
        ...adminEvaluationKeys.all,
        'peer-evaluation',
        'detail',
        sectionId,
        teamId,
        formId ?? null,
      ] as const,
    list: (sectionId: string | number, formId?: number) =>
      [
        ...adminEvaluationKeys.all,
        'peer-evaluation',
        'list',
        sectionId,
        formId ?? null,
      ] as const,
  },
  presentationEvaluation: {
    detail: (
      sectionId: string | number,
      teamId: number,
      milestoneId?: number,
    ) =>
      [
        ...adminEvaluationKeys.all,
        'presentation-evaluation',
        'detail',
        sectionId,
        teamId,
        milestoneId ?? null,
      ] as const,
    list: (sectionId: string | number, milestoneId?: number) =>
      [
        ...adminEvaluationKeys.all,
        'presentation-evaluation',
        'list',
        sectionId,
        milestoneId ?? null,
      ] as const,
  },
};
