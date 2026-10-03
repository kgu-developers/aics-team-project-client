export const adminSectionArtifactKeys = {
  all: ['admin-section-artifacts'] as const,
  summaries: () => [...adminSectionArtifactKeys.all, 'summary'] as const,
  summary: (sectionId: string, asOf: string) =>
    [...adminSectionArtifactKeys.summaries(), sectionId, asOf] as const,
};
