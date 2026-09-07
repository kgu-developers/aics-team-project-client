import type { CurrentUser } from '@aics/core';

import { ROUTES } from '~/app/constants/routes';

export async function resolveStudentLoginDestination(currentUser: CurrentUser) {
  return currentUser.globalRole === 'STUDENT'
    ? ROUTES.ONBOARDING.TEAM
    : ROUTES.ADMIN;
}
