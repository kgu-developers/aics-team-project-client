import type { CurrentUser } from '@aics/core';

import { demoUserAccounts, getDemoAdminSections } from './data/users';

export function resolveDemoCurrentUser(currentUser: CurrentUser): CurrentUser {
  const account = demoUserAccounts.find(
    item => item.user.studentNumber === currentUser.studentNumber,
  );
  if (!account) return currentUser;
  return {
    ...account.user,
    globalRole: currentUser.globalRole,
    sections:
      getDemoAdminSections(currentUser.studentNumber) ?? account.user.sections,
    teamId: currentUser.teamId,
  };
}
