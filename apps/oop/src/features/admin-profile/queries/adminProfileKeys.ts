export const adminProfileKeys = {
  all: ['admin-profile'] as const,
  mine: (accountId: string) =>
    [...adminProfileKeys.all, 'mine', accountId] as const,
};
