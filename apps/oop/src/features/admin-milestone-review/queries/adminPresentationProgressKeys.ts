export const adminPresentationProgressKeys = {
  all: ['admin-presentation-progress'] as const,
  roster: (milestoneId: string) =>
    [...adminPresentationProgressKeys.all, 'roster', milestoneId] as const,
};
