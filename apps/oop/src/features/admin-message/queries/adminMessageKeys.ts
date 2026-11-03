export const adminMessageKeys = {
  all: ['admin-messages'] as const,
  activeSectionSummary: (sectionId: string) =>
    [...adminMessageKeys.all, 'active-section-summary', sectionId] as const,
  list: (
    sectionId?: string,
    page = 0,
    teamId?: string,
    senderKeyword?: string,
    sort: 'ASC' | 'DESC' = 'DESC',
  ) =>
    [
      ...adminMessageKeys.all,
      sectionId ?? 'all',
      teamId ?? 'all',
      page,
      senderKeyword?.trim() || null,
      sort,
    ] as const,
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
