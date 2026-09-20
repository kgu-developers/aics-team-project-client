import type { CurrentUser } from '@aics/core';

import { ROUTES } from '~/app/constants/routes';

import { hasMeetingApiId } from '~/features/meeting/queries/api/meetingApiKeys';

import { resolveContactVisibility } from './liveTeamAssignment';

function isRoleRoute(path: string | undefined, routeRoot: string) {
  return path === routeRoot || path?.startsWith(`${routeRoot}/`) === true;
}

export async function resolveStudentLoginDestination(
  currentUser: CurrentUser,
  redirect?: string,
  options: { isDemo?: boolean; now?: number } = {},
) {
  if (currentUser.globalRole !== 'STUDENT') {
    return isRoleRoute(redirect, ROUTES.ADMIN) ? redirect : ROUTES.ADMIN;
  }

  const hasUnambiguousTeam =
    currentUser.sections.length === 1 &&
    hasMeetingApiId(currentUser.teamId ?? undefined);
  if (!hasUnambiguousTeam) return ROUTES.ONBOARDING.TEAM;

  if (
    !options.isDemo &&
    resolveContactVisibility(currentUser.sections[0]!, options.now) ===
      'upcoming'
  ) {
    return ROUTES.ONBOARDING.TEAM;
  }

  return isRoleRoute(redirect, ROUTES.STUDENT.HOME)
    ? redirect
    : ROUTES.STUDENT.HOME;
}
