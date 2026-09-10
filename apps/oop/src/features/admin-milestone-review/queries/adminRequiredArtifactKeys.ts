export const adminRequiredArtifactKeys = {
  all: ['admin-required-artifacts'] as const,
  list: (sectionId: string, milestoneId: string) =>
    [...adminRequiredArtifactKeys.all, 'list', sectionId, milestoneId] as const,
};
