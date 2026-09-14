export const adminMessageKeys = {
  all: ['admin-messages'] as const,
  list: (sectionId?: string, page = 0) =>
    [...adminMessageKeys.all, sectionId ?? 'all', page] as const,
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
