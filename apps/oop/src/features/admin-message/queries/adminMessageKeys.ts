export const adminMessageKeys = {
  all: ['admin-messages'] as const,
  list: (sectionId?: string) =>
    [...adminMessageKeys.all, sectionId ?? 'all'] as const,
  relatedSubmission: (
    sectionId: string,
    teamId: string,
    relatedType: 'PROPOSAL' | 'MID_REPORT',
  ) =>
    [
      ...adminMessageKeys.all,
      'related-submission',
      sectionId,
      teamId,
      relatedType,
    ] as const,
};
