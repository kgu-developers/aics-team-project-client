import type { CurrentUser } from '@aics/core';

import { demoUserAccounts } from './data/users';

export function resolveDemoCurrentUser(currentUser: CurrentUser): CurrentUser {
  const account = demoUserAccounts.find(
    item => item.user.studentNumber === currentUser.studentNumber,
  );
  if (!account) return currentUser;
  return {
    ...account.user,
    globalRole: currentUser.globalRole,
    teamId: currentUser.teamId,
  };
}
