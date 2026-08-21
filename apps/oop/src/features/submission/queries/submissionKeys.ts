export const submissionKeys = {
  all: ['submissions'] as const,
  byMilestone: (sectionId: string, userId: string, milestoneId: string) =>
    [
      ...submissionKeys.all,
      'section',
      sectionId,
      'user',
      userId,
      'milestone',
      milestoneId,
    ] as const,
  detail: (sectionId: string, userId: string, submissionId: string) =>
    [
      ...submissionKeys.all,
      'section',
      sectionId,
      'user',
      userId,
      'detail',
      submissionId,
    ] as const,
};
