export const proposalKeys = {
  all: ['proposals'] as const,
  current: () => [...proposalKeys.all, 'current'] as const,
};
