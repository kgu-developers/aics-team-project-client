export const topicKeys = {
  all: ['project-topic'] as const,
  board: (sectionId: string) => [...topicKeys.all, 'board', sectionId] as const,
};
