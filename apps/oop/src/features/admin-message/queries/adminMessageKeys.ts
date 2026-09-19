export const adminMessageKeys = {
  all: ['admin-messages'] as const,
  list: (sectionId?: string, page = 0, teamId?: string) =>
    [...adminMessageKeys.all, sectionId ?? 'all', teamId ?? 'all', page] as const,
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
