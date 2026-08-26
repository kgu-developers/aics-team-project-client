export const evaluationKeys = {
  all: ['evaluation'] as const,
  context: (sectionId: string, userId: string) =>
    [...evaluationKeys.all, 'context', sectionId, userId] as const,
  presentation: (sectionId: string, userId: string, milestoneId: string) =>
    [
      ...evaluationKeys.all,
      'presentation',
      sectionId,
      userId,
      milestoneId,
    ] as const,
  criteria: (sectionId: string) =>
    [...evaluationKeys.all, 'criteria', sectionId] as const,
  peer: (sectionId: string, userId: string, formId: string) =>
    [...evaluationKeys.all, 'peer', sectionId, userId, formId] as const,
};
