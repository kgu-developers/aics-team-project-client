export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (sectionId: string) => [...teamKeys.lists(), sectionId] as const,
};
