import { fetchTeamKickoff } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';

import { isNoTeamAccessibleStudentRoute, ROUTES } from '~/app/constants/routes';

import { hasMeetingApiId } from '~/features/meeting/queries/api/meetingApiKeys';

import { resolveContactVisibility } from './liveTeamAssignment';

function isRoleRoute(path: string | undefined, routeRoot: string) {
  return path === routeRoot || path?.startsWith(`${routeRoot}/`) === true;
}

export async function resolveStudentLoginDestination(
  currentUser: CurrentUser,
  redirect?: string,
  options: {
    fetchKickoff?: typeof fetchTeamKickoff;
    isDemo?: boolean;
    now?: number;
  } = {},
) {
  if (currentUser.globalRole !== 'STUDENT') {
    return isRoleRoute(redirect, ROUTES.ADMIN) ? redirect : ROUTES.ADMIN;
  }

  const hasUnambiguousTeam =
    currentUser.sections.length === 1 &&
    hasMeetingApiId(currentUser.teamId ?? undefined);
  if (!hasUnambiguousTeam) {
    if (redirect && isNoTeamAccessibleStudentRoute(redirect)) return redirect;
    return ROUTES.ONBOARDING.TEAM;
  }

  const isBeforeContactRelease =
    !options.isDemo &&
    resolveContactVisibility(currentUser.sections[0]!, options.now) ===
      'upcoming';
  if (isBeforeContactRelease) {
    return redirect && isNoTeamAccessibleStudentRoute(redirect)
      ? redirect
      : ROUTES.ONBOARDING.TEAM;
  }

  if (!options.isDemo) {
    try {
      const kickoff = await (options.fetchKickoff ?? fetchTeamKickoff)(
        currentUser.teamId!,
      );
      const hasConfirmedLeader = kickoff.members.some(
        member => member.isLeader,
      );
      if (String(kickoff.id) !== currentUser.teamId || !hasConfirmedLeader) {
        return ROUTES.ONBOARDING.TEAM;
      }
    } catch {
      return ROUTES.ONBOARDING.TEAM;
    }
  }

  return isRoleRoute(redirect, ROUTES.STUDENT.HOME)
    ? redirect
    : ROUTES.STUDENT.HOME;
}
