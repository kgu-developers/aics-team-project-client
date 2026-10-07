export const adminPresentationProgressKeys = {
  all: ['admin-presentation-progress'] as const,
  roster: (milestoneId: string) =>
    [...adminPresentationProgressKeys.all, 'roster', milestoneId] as const,
  teamMembers: (teamId: string) =>
    [...adminPresentationProgressKeys.all, 'team-members', teamId] as const,
  professorEvaluation: (
    sectionId: string,
    milestoneId: string,
    teamId: string,
  ) =>
    [
      ...adminPresentationProgressKeys.all,
      'professor-evaluation',
      sectionId,
      milestoneId,
      teamId,
    ] as const,
};
