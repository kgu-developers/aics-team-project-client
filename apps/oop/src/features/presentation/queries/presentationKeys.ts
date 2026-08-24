export const presentationKeys = {
  all: ['presentations'] as const,
  current: () => [...presentationKeys.all, 'current'] as const,
};
