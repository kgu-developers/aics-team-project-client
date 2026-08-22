export const adminProfileKeys = {
  all: ['admin-profile'] as const,
  mine: () => [...adminProfileKeys.all, 'mine'] as const,
};
