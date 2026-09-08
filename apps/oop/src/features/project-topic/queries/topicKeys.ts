export const topicKeys = {
  finalization: (teamId?: string, studentNumber?: string, sectionId?: string) =>
    [
      'project-topic',
      'finalization',
      teamId,
      studentNumber,
      sectionId,
    ] as const,
  all: ['project-topic'] as const,
  teamCandidates: (teamId?: string) =>
    [...topicKeys.all, 'candidates', teamId] as const,
  candidates: (teamId?: string, studentNumber?: string, sectionId?: string) =>
    [...topicKeys.teamCandidates(teamId), studentNumber, sectionId] as const,
  board: (sectionId: string) => [...topicKeys.all, 'board', sectionId] as const,
};
