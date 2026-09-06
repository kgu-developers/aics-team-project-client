export const adminSectionMilestoneKeys = {
  all: ['admin-section-milestones'] as const,
  detail: (sectionId: string, milestoneId: string) =>
    [
      ...adminSectionMilestoneKeys.all,
      'detail',
      sectionId,
      milestoneId,
    ] as const,
  list: (sectionId: string) =>
    [...adminSectionMilestoneKeys.all, 'list', sectionId] as const,
};
