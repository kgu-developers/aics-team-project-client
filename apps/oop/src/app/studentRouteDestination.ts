import type { StudentContextStatus } from '~/features/section/resolveStudentContext';
import { resolveContactVisibility } from '~/features/team-assignment/liveTeamAssignment';

import { isNoTeamAccessibleStudentRoute, ROUTES } from './constants/routes';

export function getStudentRouteDestination(
  status: StudentContextStatus,
  isDemo: boolean,
  pathname: string,
  section?: {
    contactVisibleFrom?: string | null;
    contactVisibleUntil?: string | null;
  },
  now = Date.now(),
) {
  if (isDemo) return undefined;
  if (status === 'no-team' && !isNoTeamAccessibleStudentRoute(pathname)) {
    return ROUTES.ONBOARDING.TEAM;
  }
  if (
    status === 'ready' &&
    section &&
    resolveContactVisibility(section, now) === 'upcoming' &&
    !isNoTeamAccessibleStudentRoute(pathname)
  ) {
    return ROUTES.ONBOARDING.TEAM;
  }
  return undefined;
}
